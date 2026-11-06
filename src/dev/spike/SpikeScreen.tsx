import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OtherAudio from '../../../modules/other-audio';
import type { FrameStats } from '../useFrameRate';
import { ShaderCheck } from './ShaderCheck';
import { SpikeAudio, type DuckedCue, type DuckRelease } from './spikeAudio';
import { assessSuspension, type SuspensionVerdict } from './suspension';

const DUCK_CUE_COUNT = 20;
const DUCK_INTERVAL_MS = 6_000;
const TICK_INTERVAL_MS = 1_000;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function clockTime(): string {
  return new Date().toLocaleTimeString();
}

/** The U4a spike: five on-device checks of audio mixing, ducking, the other-audio hint, suspension and Skia. */
export function SpikeScreen() {
  const audioRef = useRef<SpikeAudio | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const addLog = useCallback((line: string) => {
    setLog((lines) => [`${clockTime()}  ${line}`, ...lines].slice(0, 200));
  }, []);

  const audio = useCallback((): SpikeAudio => {
    audioRef.current ??= new SpikeAudio();
    return audioRef.current;
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.close().catch((error: unknown) => {
        console.error('Spike audio failed to close', error);
      });
    };
  }, []);

  // Runs a button action so a failure lands in the on-screen log instead of vanishing.
  const run = useCallback(
    (label: string, action: () => Promise<void> | void) => {
      Promise.resolve()
        .then(action)
        .catch((error: unknown) => addLog(`${label} failed: ${describeError(error)}`));
    },
    [addLog],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Native spike (U4a)</Text>
        <MixingCheck audio={audio} run={run} addLog={addLog} />
        <DuckingCheck audio={audio} addLog={addLog} />
        <OtherAudioCheck addLog={addLog} />
        <SilentCheck audio={audio} run={run} addLog={addLog} />
        <ShaderSection addLog={addLog} />
        <Section title="Log">
          {log.map((line, index) => (
            <Text key={`${index}-${line}`} style={styles.logLine}>
              {line}
            </Text>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

type Run = (label: string, action: () => Promise<void> | void) => void;

interface CheckProps {
  audio: () => SpikeAudio;
  run: Run;
  addLog: (line: string) => void;
}

function MixingCheck({ audio, run, addLog }: CheckProps) {
  return (
    <Section
      title="1 · Loops and a one-shot over your music"
      steps="Play something in Spotify first. You should hear the music, the drum and the sea together, and the horn on top."
    >
      <Row>
        <Button
          label="Start loops"
          onPress={() =>
            run('Start loops', async () => {
              await audio().startLoops();
              addLog('Loops started (mix with others)');
            })
          }
        />
        <Button label="Horn" onPress={() => run('Horn', () => audio().playHorn())} />
        <Button
          label="Stop loops"
          onPress={() =>
            run('Stop loops', () => {
              audio().stopLoops();
              addLog('Loops stopped');
            })
          }
        />
      </Row>
    </Section>
  );
}

function DuckingCheck({ audio, addLog }: Omit<CheckProps, 'run'>) {
  const [activeRelease, setActiveRelease] = useState<DuckRelease | null>(null);
  const [cues, setCues] = useState<DuckedCue[]>([]);

  const startTrial = (release: DuckRelease) => {
    setActiveRelease(release);
    setCues([]);
    addLog(`Ducking trial started: release by ${release}`);
    audio()
      .runDuckTrial(release, DUCK_CUE_COUNT, DUCK_INTERVAL_MS, (cue) => {
        setCues((done) => [...done, cue]);
      })
      .then(() => addLog(`Ducking trial finished: ${release}`))
      .catch((error: unknown) => addLog(`Ducking trial failed: ${describeError(error)}`))
      .finally(() => setActiveRelease(null));
  };

  const ownAudioKept = cues.filter((cue) => cue.isOwnAudioRunning).length;
  const errors = cues.filter((cue) => cue.error !== null);
  const meanReleaseMs =
    cues.length === 0
      ? 0
      : Math.round(cues.reduce((sum, cue) => sum + cue.releaseMs, 0) / cues.length);

  return (
    <Section
      title="2 · Ducking, 20 cues with the screen locked"
      steps="Play Spotify, start a trial, then lock the phone. A horn sounds about every 12 s, 20 times (about 4 minutes). For each horn: does the music dip, and how many seconds until it is back to full volume? Run both trials."
    >
      <Row>
        <Button
          label="Trial A · switch options"
          isDisabled={activeRelease !== null}
          onPress={() => startTrial('switchOptions')}
        />
        <Button
          label="Trial B · deactivate"
          isDisabled={activeRelease !== null}
          onPress={() => startTrial('deactivate')}
        />
      </Row>
      <Text style={styles.result}>
        {activeRelease === null ? 'No trial running.' : `Running ${activeRelease}…`} {cues.length}/
        {DUCK_CUE_COUNT} cues · own audio kept playing {ownAudioKept}/{cues.length} · mean release{' '}
        {meanReleaseMs} ms · errors {errors.length}
      </Text>
      {errors.map((cue) => (
        <Text key={cue.index} style={styles.logLine}>
          Cue {cue.index}: {cue.error}
        </Text>
      ))}
      {cues
        .filter((cue) => !cue.isOwnAudioRunning)
        .map((cue) => (
          <Text key={`stall-${cue.index}`} style={styles.logLine}>
            Cue {cue.index}: own audio stalled (context {cue.contextState})
          </Text>
        ))}
    </Section>
  );
}

function OtherAudioCheck({ addLog }: { addLog: (line: string) => void }) {
  const [isOtherAudioPlaying, setIsOtherAudioPlaying] = useState<boolean | null>(null);

  useEffect(() => {
    const read = (source: string) => {
      const value = OtherAudio.isOtherAudioPlaying();
      setIsOtherAudioPlaying(value);
      addLog(`Other-audio hint (${source}): ${value ? 'music playing' : 'no music'}`);
    };
    read('on open');
    const hint = OtherAudio.addListener('onHintChange', ({ isOtherAudioPlaying: value }) => {
      setIsOtherAudioPlaying(value);
      addLog(`Other-audio hint (change event): ${value ? 'music playing' : 'no music'}`);
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        read('back in foreground');
      }
    });
    return () => {
      hint.remove();
      appState.remove();
    };
  }, [addLog]);

  return (
    <Section
      title="3 · Other-audio hint"
      steps="Start and pause Spotify from Control Centre and watch this change. Then switch to Spotify, change play/pause there, and come back."
    >
      <Text style={styles.result}>
        {isOtherAudioPlaying === null
          ? 'Not read yet'
          : isOtherAudioPlaying
            ? 'Music playing'
            : 'No music'}
      </Text>
    </Section>
  );
}

interface SilentStretch {
  monotonicStart: number;
  wallStart: number;
  tickCount: number;
}

function SilentCheck({ audio, run, addLog }: CheckProps) {
  const stretchRef = useRef<SilentStretch | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [verdict, setVerdict] = useState<SuspensionVerdict | null>(null);

  useEffect(() => {
    return () => {
      if (tickTimerRef.current !== null) {
        clearInterval(tickTimerRef.current);
      }
    };
  }, []);

  const start = async () => {
    await audio().goSilent();
    stretchRef.current = { monotonicStart: performance.now(), wallStart: Date.now(), tickCount: 0 };
    tickTimerRef.current = setInterval(() => {
      if (stretchRef.current !== null) {
        stretchRef.current.tickCount += 1;
      }
    }, TICK_INTERVAL_MS);
    setVerdict(null);
    setIsRunning(true);
    addLog('Silent stretch started: no audio session');
  };

  const finish = () => {
    const stretch = stretchRef.current;
    if (stretch === null) {
      throw new Error('No silent stretch is running');
    }
    if (tickTimerRef.current !== null) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    const monotonicElapsedMs = performance.now() - stretch.monotonicStart;
    const wallElapsedMs = Date.now() - stretch.wallStart;
    const result = assessSuspension({
      monotonicElapsedMs,
      wallElapsedMs,
      tickCount: stretch.tickCount,
      tickIntervalMs: TICK_INTERVAL_MS,
    });
    stretchRef.current = null;
    setIsRunning(false);
    setVerdict(result);
    addLog(
      `Silent stretch: wall ${Math.round(wallElapsedMs / 1000)} s, performance.now ${Math.round(
        monotonicElapsedMs / 1000,
      )} s, ticks ${stretch.tickCount}`,
    );
  };

  return (
    <Section
      title="4 · Silent mode: suspend and recover (KTD19)"
      steps="Start, lock the phone and leave it for at least 3 minutes, then unlock and tap Finish."
    >
      <Row>
        <Button
          label="Start silent stretch"
          isDisabled={isRunning}
          onPress={() => run('Silent stretch', start)}
        />
        <Button
          label="Finish"
          isDisabled={!isRunning}
          onPress={() => run('Finish silent stretch', finish)}
        />
      </Row>
      {verdict === null ? null : (
        <Text style={styles.result}>
          {verdict.wasSuspended ? 'App was suspended' : 'App kept running'} · performance.now lag{' '}
          {Math.round(verdict.monotonicLagMs)} ms ·{' '}
          {verdict.isMonotonicReliable ? 'clock reliable' : 'clock stopped while asleep'}
        </Text>
      )}
    </Section>
  );
}

function ShaderSection({ addLog }: { addLog: (line: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastStats, setLastStats] = useState<FrameStats | null>(null);

  const close = (stats: FrameStats | null) => {
    setIsOpen(false);
    setLastStats(stats);
    if (stats !== null) {
      addLog(
        `Shader: ${stats.framesPerSecond} fps at close, lowest ${stats.lowestFramesPerSecond}, slow frames ${stats.slowFrames}`,
      );
    }
  };

  return (
    <Section
      title="5 · Full-screen shader at 60 fps"
      steps="Open it and leave it for 30 seconds, then tap Done."
    >
      <Button label="Open shader" onPress={() => setIsOpen(true)} />
      {lastStats === null ? null : (
        <Text style={styles.result}>
          Lowest {lastStats.lowestFramesPerSecond} fps · slow frames {lastStats.slowFrames}
        </Text>
      )}
      <Modal visible={isOpen} animationType="fade" presentationStyle="fullScreen">
        <ShaderCheck onClose={close} />
      </Modal>
    </Section>
  );
}

function Section({
  title,
  steps,
  children,
}: {
  title: string;
  steps?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {steps === undefined ? null : <Text style={styles.steps}>{steps}</Text>}
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Button({
  label,
  onPress,
  isDisabled = false,
}: {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.button, isDisabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 20 },
  title: { fontSize: 28, color: '#1C1B1A' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1C1B1A' },
  steps: { fontSize: 14, lineHeight: 20, color: '#6E6962' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#1C1B1A',
  },
  buttonDisabled: { opacity: 0.35 },
  buttonLabel: { fontSize: 15, color: '#F9F8F4' },
  result: { fontSize: 14, color: '#1C1B1A', fontVariant: ['tabular-nums'] },
  logLine: { fontSize: 12, color: '#6E6962', fontVariant: ['tabular-nums'] },
});
