import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SLICE_PLAN } from '../../content/slicePlan';
import { systemClock } from '../../domain/session/clock';
import {
  createSessionMachine,
  restoreSessionMachine,
  type SessionMachine,
} from '../../domain/session/sessionMachine';
import { segmentTimings } from '../../domain/session/sessionPlan';
import { Button } from '../../design/components/Button';
import { Text } from '../../design/components/Text';
import { colors, space } from '../../design/tokens';
import { AudioEngine, LOOKAHEAD_MS } from '../../services/audio/audioEngine';

const TICK_MS = 100;
const MINUTE = 60_000;
const TIMINGS = segmentTimings(SLICE_PLAN);
const FIRST_PUSH = TIMINGS.find((timing) => timing.segment.type === 'push');

type Readout = { sessionMs: number; segment: string; isPaused: boolean };

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatSessionTime(ms: number): string {
  const sign = ms < 0 ? '−' : '';
  const seconds = Math.floor(Math.abs(ms) / 1000);
  return `${sign}${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Session time now, negative during Get seated, as the audio engine reads it. */
function sessionTimeOf(machine: SessionMachine): number {
  const snapshot = machine.snapshot();
  return snapshot.phase === 'getSeated'
    ? -snapshot.getSeatedRemainingMs
    : snapshot.sessionElapsedMs;
}

/** A machine already `sessionMs` into the slice, so a check can jump straight to a push. */
function machineAt(sessionMs: number): SessionMachine {
  const wallNowMs = Date.now();
  return restoreSessionMachine({
    plan: SLICE_PLAN,
    clock: systemClock,
    checkpoint: {
      version: 1,
      phase: 'rowing',
      sessionMs,
      emittedThroughMs: sessionMs - 1,
      savedAtWallMs: wallNowMs,
    },
    wallNowMs,
  });
}

/**
 * G2's phone check: plays the slice's sound from the start or just before a push, so the loop seams,
 * the drum against each signal, the ducking and the per-signal gains can be heard and tuned.
 */
export function AudioCheckScreen() {
  const engineRef = useRef<AudioEngine | null>(null);
  const machineRef = useRef<SessionMachine | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [durations, setDurations] = useState<string>('Loading sounds…');
  const [readout, setReadout] = useState<Readout | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    AudioEngine.load()
      .then((engine) => {
        if (isCancelled) {
          return engine.stop();
        }
        engineRef.current = engine;
        setDurations(
          Object.entries(engine.durations)
            .map(([name, seconds]) => `${name} ${seconds.toFixed(4)} s`)
            .join('\n'),
        );
      })
      .catch((caught: unknown) => setError(`Loading failed: ${describeError(caught)}`));
    return () => {
      isCancelled = true;
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
      }
      engineRef.current?.stop().catch((caught: unknown) => console.error(caught));
    };
  }, []);

  const tick = useCallback(() => {
    const machine = machineRef.current;
    const engine = engineRef.current;
    if (machine === null || engine === null) {
      return;
    }
    machine.advance();
    const sessionMs = sessionTimeOf(machine);
    engine.update({
      sessionMs,
      timings: TIMINGS,
      upcomingCues: machine.upcomingCues(LOOKAHEAD_MS),
    });
    const snapshot = machine.snapshot();
    const segment =
      snapshot.segmentIndex === null
        ? 'Get seated'
        : (TIMINGS[snapshot.segmentIndex]?.segment.type ?? '');
    setReadout({ sessionMs, segment, isPaused: snapshot.phase === 'paused' });
  }, []);

  const startFrom = useCallback(
    (machine: SessionMachine) => {
      const engine = engineRef.current;
      if (engine === null) {
        return;
      }
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
      }
      machineRef.current = machine;
      engine
        .start(sessionTimeOf(machine), TIMINGS)
        .then(() => {
          tickRef.current = setInterval(tick, TICK_MS);
        })
        .catch((caught: unknown) => setError(`Start failed: ${describeError(caught)}`));
    },
    [tick],
  );

  const togglePause = useCallback(() => {
    const machine = machineRef.current;
    const engine = engineRef.current;
    if (machine === null || engine === null) {
      return;
    }
    const isPaused = machine.snapshot().phase === 'paused';
    if (isPaused) {
      machine.resume();
      engine
        .resume(sessionTimeOf(machine))
        .catch((caught: unknown) => setError(describeError(caught)));
    } else {
      machine.pause('longPress');
      engine.pause().catch((caught: unknown) => setError(describeError(caught)));
    }
  }, []);

  const pushStartMs = FIRST_PUSH?.startMs ?? 10 * MINUTE;
  const pushEndMs = FIRST_PUSH?.endMs ?? 13 * MINUTE;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Audio check (G2)</Text>
        {error ? <Text color="textPush">{error}</Text> : null}
        <Text variant="caption">{durations}</Text>
        <Text variant="bodyStrong">
          {readout
            ? `${formatSessionTime(readout.sessionMs)} · ${readout.segment}${readout.isPaused ? ' · paused' : ''}`
            : 'Not started'}
        </Text>
        <View style={styles.buttons}>
          <Button
            label="Start at Get seated"
            onPress={() => startFrom(createSessionMachine(SLICE_PLAN, systemClock))}
          />
          <Button
            label="Start 20 s before push 1"
            variant="secondary"
            onPress={() => startFrom(machineAt(pushStartMs - 20_000))}
          />
          <Button
            label="Start 20 s before push 1 ends"
            variant="secondary"
            onPress={() => startFrom(machineAt(pushEndMs - 20_000))}
          />
          <Button
            label="Ring the ease-off bells"
            variant="secondary"
            onPress={() => {
              const machine = machineRef.current;
              if (machine !== null) {
                engineRef.current?.playEaseOff(sessionTimeOf(machine));
              }
            }}
          />
          <Button
            label={readout?.isPaused ? 'Resume' : 'Pause'}
            variant="secondary"
            onPress={togglePause}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: space.lg, gap: space.md },
  buttons: { gap: space.sm },
});
