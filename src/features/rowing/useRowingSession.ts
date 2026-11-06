import { useCallback, useEffect, useRef, useState } from 'react';

import { systemClock } from '../../domain/session/clock';
import { segmentTimings, type SessionPlan } from '../../domain/session/sessionPlan';
import { AudioEngine } from '../../services/audio/audioEngine';
import { RowingSession, type HeartFeed, type RowingView } from './rowingSession';

// About ten ticks a second: banners and the gauge move on whole seconds, and sounds are scheduled ahead.
const TICK_MS = 100;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Runs one row on the phone: the session ticked ten times a second, and its sound, loaded once and
 * stopped once. If the sound fails to load the row carries on silent and says why (R40: every cue
 * still shows).
 */
export function useRowingSession(plan: SessionPlan, heartFeed: HeartFeed | null) {
  const [session] = useState(() => new RowingSession(plan, systemClock, heartFeed));
  const [view, setView] = useState<RowingView>(() => session.tick());
  const [soundError, setSoundError] = useState<string | null>(null);
  const engineRef = useRef<AudioEngine | null>(null);

  const stopSound = useCallback(() => {
    const engine = engineRef.current;
    engineRef.current = null;
    engine
      ?.stop()
      .catch((error: unknown) => setSoundError(`Stopping sound failed: ${describeError(error)}`));
  }, []);

  useEffect(() => {
    let isMounted = true;
    AudioEngine.load()
      .then(async (engine) => {
        if (!isMounted) {
          await engine.stop();
          return;
        }
        engineRef.current = engine;
        await engine.start(session.tick().sessionMs, segmentTimings(plan));
        session.setSound(engine);
      })
      .catch((error: unknown) => setSoundError(`Sound failed to load: ${describeError(error)}`));
    return () => {
      isMounted = false;
      stopSound();
    };
  }, [plan, session, stopSound]);

  useEffect(() => {
    const timer = setInterval(() => setView(session.tick()), TICK_MS);
    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (view.phase === 'complete' || view.phase === 'partlyRowed') {
      stopSound();
    }
  }, [stopSound, view.phase]);

  const startNow = useCallback(() => {
    session.startNow();
    setView(session.tick());
  }, [session]);

  const pause = useCallback(() => {
    session.pause('longPress');
    setView(session.tick());
    engineRef.current
      ?.pause()
      .catch((error: unknown) => setSoundError(`Pausing sound failed: ${describeError(error)}`));
  }, [session]);

  const resume = useCallback(() => {
    session.resume();
    const resumed = session.tick();
    setView(resumed);
    engineRef.current
      ?.resume(resumed.sessionMs)
      .catch((error: unknown) => setSoundError(`Resuming sound failed: ${describeError(error)}`));
  }, [session]);

  const endSession = useCallback(() => {
    session.endSession();
    setView(session.tick());
  }, [session]);

  return { view, soundError, startNow, pause, resume, endSession };
}
