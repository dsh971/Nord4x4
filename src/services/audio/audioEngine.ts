import {
  AudioContext,
  AudioManager,
  type AudioBuffer,
  type AudioBufferSourceNode,
  type GainNode,
} from 'react-native-audio-api';

import type { SessionEvent } from '../../domain/session/sessionMachine';
import type { SegmentTiming } from '../../domain/session/sessionPlan';
import { PLAYBACK_GAIN, SOUND_FILES, type SoundName } from './assets';
import { drumHitsBetween, type DrumGap } from './drumSchedule';
import { drumGapMs, SIGNAL_SOUNDS, type SignalKind } from './signalSounds';

/** How far ahead of session time sounds are scheduled on the audio clock (KTD5). */
export const LOOKAHEAD_MS = 600;
// Crew murmur fades in and out over about this long at a work segment's edge.
const CREW_FADE_SECONDS = 0.4;

/** What the engine needs from the session each tick; it keeps no time of its own (KTD5). */
export type SessionView = {
  /** Session time now: negative during Get seated. */
  readonly sessionMs: number;
  readonly timings: readonly SegmentTiming[];
  /** The machine's `upcomingCues(LOOKAHEAD_MS)`: cues due soon, scheduled before they fall due. */
  readonly upcomingCues: readonly SessionEvent[];
};

// The library doesn't export its options type, so it is read off the method that takes it.
type SessionOptions = Parameters<typeof AudioManager.setSystemOptions>[0];

function sessionOptions(isDucking: boolean): SessionOptions {
  return {
    ios: {
      category: 'playback',
      options: [isDucking ? 'duckOthers' : 'mixWithOthers'],
      notifyOthersOnDeactivation: true,
    },
  };
}

function isWork(timing: SegmentTiming): boolean {
  return timing.segment.type === 'push' || timing.segment.type === 'pickup';
}

/**
 * The rowing session's sound (first pass of U19): the sea bed throughout, the crew murmur in work
 * segments, the drum stroke by stroke, and every signal, each scheduled ahead on the audio clock.
 * Signals duck the rower's music by switching session options (KTD9, trial A).
 */
export class AudioEngine {
  private readonly gains: Record<SoundName, GainNode>;
  private readonly crewFade: GainNode;
  private loops: AudioBufferSourceNode[] = [];
  /** Session time that maps to `anchorAudioTime` on the audio clock; null until started. */
  private anchor: { readonly sessionMs: number; readonly audioTime: number } | null = null;
  private scheduledThroughMs = -Infinity;
  private readonly scheduledCues = new Set<string>();
  private readonly gaps: DrumGap[] = [];
  private drumHits: { readonly atMs: number; readonly source: AudioBufferSourceNode }[] = [];
  private duckUntilMs = -Infinity;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor(
    private readonly context: AudioContext,
    private readonly buffers: Record<SoundName, AudioBuffer>,
  ) {
    const gainFor = (name: SoundName): GainNode => {
      const gain = context.createGain();
      gain.gain.value = PLAYBACK_GAIN[name];
      gain.connect(context.destination);
      return gain;
    };
    this.gains = {
      'war-horn': gainFor('war-horn'),
      'push-end-horn': gainFor('push-end-horn'),
      'push-start-strike': gainFor('push-start-strike'),
      'hold-signal': gainFor('hold-signal'),
      'drum-hit': gainFor('drum-hit'),
      'ease-off-bell': gainFor('ease-off-bell'),
      'sea-calm': gainFor('sea-calm'),
      'crew-murmur': gainFor('crew-murmur'),
    };
    this.crewFade = context.createGain();
    this.crewFade.gain.value = 0;
    this.crewFade.connect(this.gains['crew-murmur']);
  }

  /** Decodes every sound; rejects if any file fails to decode. */
  static async load(): Promise<AudioEngine> {
    const context = new AudioContext();
    const names = Object.keys(SOUND_FILES) as SoundName[];
    const decoded = await Promise.all(
      names.map((name) => context.decodeAudioData(SOUND_FILES[name])),
    );
    const buffers = Object.fromEntries(names.map((name, index) => [name, decoded[index]]));
    return new AudioEngine(context, buffers as Record<SoundName, AudioBuffer>);
  }

  /** Each decoded sound's length in seconds, to check on the phone that the loops decode exactly. */
  get durations(): Record<SoundName, number> {
    const entries = Object.entries(this.buffers).map(([name, buffer]) => [name, buffer.duration]);
    return Object.fromEntries(entries) as Record<SoundName, number>;
  }

  /** Starts the sea and crew loops and maps session time `sessionMs` to now on the audio clock. */
  async start(sessionMs: number, timings: readonly SegmentTiming[]): Promise<void> {
    AudioManager.setSystemOptions(sessionOptions(false));
    await AudioManager.setAudioSessionActivity(true);
    await this.context.resume();
    this.anchor = { sessionMs, audioTime: this.context.currentTime };
    this.scheduledThroughMs = sessionMs;
    if (this.loops.length === 0) {
      this.loops = [
        this.loop('sea-calm', this.gains['sea-calm']),
        this.loop('crew-murmur', this.crewFade),
      ];
    }
    const current = timings.find(
      (timing) => sessionMs >= timing.startMs && sessionMs < (timing.endMs ?? Infinity),
    );
    this.crewFade.gain.value = current && isWork(current) ? 1 : 0;
  }

  /** Schedules everything due before `sessionMs + LOOKAHEAD_MS`: signals first, so the drum knows its gaps. */
  update(view: SessionView): void {
    if (this.anchor === null) {
      return;
    }
    for (const event of view.upcomingCues) {
      if (event.type !== 'cueDue') {
        continue;
      }
      const key = `${event.cue.kind}@${event.atMs}`;
      if (!this.scheduledCues.has(key)) {
        this.scheduledCues.add(key);
        this.playSignal(event.cue.kind, Math.max(event.atMs, view.sessionMs), view.sessionMs);
      }
    }
    const throughMs = view.sessionMs + LOOKAHEAD_MS;
    if (throughMs <= this.scheduledThroughMs) {
      return;
    }
    for (const atMs of drumHitsBetween(
      view.timings,
      this.gaps,
      this.scheduledThroughMs,
      throughMs,
    )) {
      const source = this.playAt('drum-hit', this.gains['drum-hit'], atMs);
      this.drumHits.push({ atMs, source });
    }
    for (const timing of view.timings) {
      if (timing.startMs >= this.scheduledThroughMs && timing.startMs < throughMs) {
        const level = isWork(timing) ? 1 : 0;
        this.crewFade.gain.setTargetAtTime(
          level,
          this.audioTimeAt(timing.startMs),
          CREW_FADE_SECONDS / 3,
        );
      }
    }
    this.scheduledThroughMs = throughMs;
    this.drumHits = this.drumHits.filter((hit) => hit.atMs >= view.sessionMs - 1000);
  }

  /** Rings the ease-off bells now (R36): they follow heart rate, so they can't be scheduled ahead. */
  playEaseOff(sessionMs: number): void {
    this.playSignal('easeOff', sessionMs, sessionMs);
  }

  /** Freezes every sound with the session; scheduled sounds keep their place on the audio clock. */
  async pause(): Promise<void> {
    this.releaseDuck();
    await this.context.suspend();
  }

  /** Picks the sound up again where the session resumes. */
  async resume(sessionMs: number): Promise<void> {
    await AudioManager.setAudioSessionActivity(true);
    await this.context.resume();
    this.anchor = { sessionMs, audioTime: this.context.currentTime };
  }

  /** Stops every sound and gives the audio session back. */
  async stop(): Promise<void> {
    this.releaseDuck();
    this.loops.forEach((loop) => loop.stop());
    this.loops = [];
    await this.context.close();
    await AudioManager.setAudioSessionActivity(false);
  }

  private playSignal(kind: SignalKind, atMs: number, nowMs: number): void {
    const signal = SIGNAL_SOUNDS[kind];
    const buffer = this.buffers[signal.sound];
    const strikes = signal.repeat?.times ?? 1;
    for (let strike = 0; strike < strikes; strike += 1) {
      const strikeAtMs = atMs + strike * (signal.repeat?.spacingMs ?? 0);
      this.playAt(signal.sound, this.gains[signal.sound], strikeAtMs);
    }
    const gap: DrumGap = { fromMs: atMs, toMs: atMs + drumGapMs(signal, buffer.duration * 1000) };
    this.gaps.push(gap);
    // Strokes already scheduled inside a gap that opened after them, such as the ease-off bells.
    for (const hit of this.drumHits) {
      if (hit.atMs >= gap.fromMs && hit.atMs < gap.toMs) {
        hit.source.stop();
      }
    }
    this.duck(atMs, gap.toMs, nowMs);
  }

  private duck(fromMs: number, untilMs: number, nowMs: number): void {
    this.duckUntilMs = Math.max(this.duckUntilMs, untilMs);
    setTimeout(
      () => AudioManager.setSystemOptions(sessionOptions(true)),
      Math.max(0, fromMs - nowMs),
    );
    if (this.duckTimer !== null) {
      clearTimeout(this.duckTimer);
    }
    this.duckTimer = setTimeout(() => this.releaseDuck(), this.duckUntilMs - nowMs);
  }

  private releaseDuck(): void {
    if (this.duckTimer !== null) {
      clearTimeout(this.duckTimer);
      this.duckTimer = null;
    }
    this.duckUntilMs = -Infinity;
    AudioManager.setSystemOptions(sessionOptions(false));
  }

  private audioTimeAt(sessionMs: number): number {
    if (this.anchor === null) {
      throw new Error('The audio engine has not started');
    }
    return this.anchor.audioTime + (sessionMs - this.anchor.sessionMs) / 1000;
  }

  private playAt(name: SoundName, output: GainNode, sessionMs: number): AudioBufferSourceNode {
    const source = this.context.createBufferSource();
    source.buffer = this.buffers[name];
    source.connect(output);
    source.start(this.audioTimeAt(sessionMs));
    return source;
  }

  private loop(name: SoundName, output: GainNode): AudioBufferSourceNode {
    const source = this.context.createBufferSource();
    source.buffer = this.buffers[name];
    source.loop = true;
    source.connect(output);
    source.start();
    return source;
  }
}
