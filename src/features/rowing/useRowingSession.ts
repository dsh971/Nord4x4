import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { MonotonicClock } from '../../domain/session/clock';
import type { SessionPhase } from '../../domain/session/sessionMachine';
import { segmentTimings, type SessionPlan } from '../../domain/session/sessionPlan';
import { AudioEngine } from '../../services/audio/audioEngine';
import {
  askForWarningPermission,
  clearWarnings,
  scheduleWarnings,
} from '../../services/notifications/warningNotifications';
import { RowingSession, type HeartFeed, type RowingView } from './rowingSession';
import { stillRowingNotice, workWarningsFrom } from './workWarnings';

/** About ten ticks a second: banners and the gauge move on whole seconds, and sounds are scheduled ahead. */
export const TICK_MS = 100;

/**
 * The clock a row keeps time by, and whether it plays sound: they travel together, since the audio
 * engine keeps its own clock and can't follow a sped-up one (G7a). Fixed for the life of the row.
 */
export type RowingPace = { readonly clock: MonotonicClock; readonly isSoundOn: boolean };

type SoundState = 'off' | 'loading' | 'playing' | 'paused';

/** The sound a row should have: none while the rower is away (R43) or once the row is over. */
function wantedSound(phase: SessionPhase, isAway: boolean): 'off' | 'playing' | 'paused' {
  if (isAway) {
    return 'off';
  }
  if (isRowGoingOn(phase)) {
    return 'playing';
  }
  return phase === 'paused' ? 'paused' : 'off';
}

/** Whether a row in this phase goes on without the rower: Get seated starts the row by itself. */
function isRowGoingOn(phase: SessionPhase): boolean {
  return phase === 'getSeated' || phase === 'rowing';
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs one row on the phone: the session ticked ten times a second, and its sound brought in line with
 * the row and the app on every change. If the sound fails to load the row carries on silent and says
 * why (R40: every cue still shows). While the rower is away from the app nothing plays; notifications
 * warn of each push and pickup instead, and a fresh engine starts on return (R43). A pace with sound
 * off loads no engine at all. The pace, like the plan, is read once: a new one needs a new row.
 */
export function useRowingSession(plan: SessionPlan, heartFeed: HeartFeed | null, pace: RowingPace) {
  const [session] = useState(() => new RowingSession(plan, pace.clock, heartFeed));
  const [isSoundOn] = useState(pace.isSoundOn);
  const [view, setView] = useState<RowingView>(() => session.tick());
  const [soundError, setSoundError] = useState<string | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const soundStateRef = useRef<SoundState>('off');
  // Bumped whenever the sound is stopped, so a load or start still in flight knows it is no longer wanted.
  const soundGenerationRef = useRef(0);
  const isAwayRef = useRef(false);
  const isClosedRef = useRef(false);

  const report = useCallback(
    (what: string) => (error: unknown) => setSoundError(`${what} failed: ${describeError(error)}`),
    [],
  );

  const reconcileSound = useCallback((): void => {
    const now = session.tick();
    const wanted =
      isClosedRef.current || !isSoundOn ? 'off' : wantedSound(now.phase, isAwayRef.current);
    const state = soundStateRef.current;
    // An engine still loading is dropped rather than paused: resuming loads a fresh one.
    if (wanted === 'off' || (wanted === 'paused' && state === 'loading')) {
      if (state === 'off') {
        return;
      }
      soundGenerationRef.current += 1;
      soundStateRef.current = 'off';
      session.setSound(null);
      const engine = engineRef.current;
      engineRef.current = null;
      engine?.stop().catch(report('Stopping sound'));
      return;
    }
    if (wanted === 'paused') {
      if (state === 'playing') {
        soundStateRef.current = 'paused';
        engineRef.current?.pause().catch(report('Pausing sound'));
      }
      return;
    }
    if (state === 'paused') {
      soundStateRef.current = 'playing';
      engineRef.current?.resume(now.sessionMs).catch(report('Resuming sound'));
      return;
    }
    if (state !== 'off') {
      return;
    }
    soundStateRef.current = 'loading';
    const generation = soundGenerationRef.current;
    const isStillWanted = () => generation === soundGenerationRef.current;
    AudioEngine.load()
      .then(async (engine) => {
        if (!isStillWanted()) {
          await engine.stop();
          return;
        }
        await engine.start(session.tick().sessionMs, segmentTimings(plan));
        if (!isStillWanted()) {
          await engine.stop();
          return;
        }
        engineRef.current = engine;
        soundStateRef.current = 'playing';
        session.setSound(engine);
      })
      .catch((error: unknown) => {
        if (isStillWanted()) {
          soundStateRef.current = 'off';
        }
        setSoundError(`Sound failed to load: ${describeError(error)}`);
      });
  }, [isSoundOn, plan, report, session]);

  useEffect(() => {
    isClosedRef.current = false;
    reconcileSound();
    void askForWarningPermission();
    return () => {
      isClosedRef.current = true;
      reconcileSound();
    };
  }, [reconcileSound]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'background' && !isAwayRef.current) {
        isAwayRef.current = true;
        const leftAtWallMs = Date.now();
        reconcileSound();
        const left = session.tick();
        if (isRowGoingOn(left.phase)) {
          void scheduleWarnings(
            [
              stillRowingNotice(left.sessionRemainingMs),
              ...workWarningsFrom(segmentTimings(plan), left.sessionMs),
            ],
            leftAtWallMs,
          );
        }
      } else if (appState === 'active' && isAwayRef.current) {
        isAwayRef.current = false;
        void clearWarnings();
        setView(session.tick());
        reconcileSound();
      }
    });
    return () => subscription.remove();
  }, [plan, reconcileSound, session]);

  useEffect(() => {
    const timer = setInterval(() => setView(session.tick()), TICK_MS);
    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    reconcileSound();
  }, [reconcileSound, view.phase]);

  const startNow = useCallback(() => {
    session.startNow();
    setView(session.tick());
  }, [session]);

  const pause = useCallback(() => {
    session.pause('longPress');
    setView(session.tick());
    reconcileSound();
  }, [reconcileSound, session]);

  const resume = useCallback(() => {
    session.resume();
    setView(session.tick());
    reconcileSound();
  }, [reconcileSound, session]);

  const endSession = useCallback(() => {
    session.endSession();
    setView(session.tick());
  }, [session]);

  return { view, soundError, startNow, pause, resume, endSession };
}
