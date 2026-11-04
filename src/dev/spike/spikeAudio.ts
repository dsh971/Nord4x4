import {
  AudioBuffer,
  AudioBufferSourceNode,
  AudioContext,
  AudioManager,
} from 'react-native-audio-api';

import { createSeaLoop, createStrokeDrumLoop, createWarHorn } from './tones';

/** How a cue gives the volume back to the user's music after ducking it (KTD9). */
export type DuckRelease = 'switchOptions' | 'deactivate';

/** One ducked cue in the KTD9 trial. */
export interface DuckedCue {
  index: number;
  release: DuckRelease;
  /** How long the release calls took, not how long the music took to come back (that is heard). */
  releaseMs: number;
  /** Whether our own loops kept playing through the cue: the audio clock kept pace with the wall clock. */
  isOwnAudioRunning: boolean;
  contextState: string;
  error: string | null;
}

// A push rate (26–28 spm): one drum hit per stroke, at the catch.
const STROKES_PER_MINUTE = 27;
// Our audio clock may run slightly behind the wall clock around a session change; less than this means it stalled.
const MIN_AUDIO_CLOCK_RATIO = 0.9;

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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Drives the spike's sounds: two loops and a horn mixed over the user's music, plus the ducking trial. */
export class SpikeAudio {
  private readonly context = new AudioContext();
  private readonly drum: AudioBuffer;
  private readonly sea: AudioBuffer;
  private readonly horn: AudioBuffer;
  private loops: AudioBufferSourceNode[] = [];

  constructor() {
    const rate = this.context.sampleRate;
    this.drum = this.toBuffer(createStrokeDrumLoop(rate, STROKES_PER_MINUTE));
    this.sea = this.toBuffer(createSeaLoop(rate, 4));
    this.horn = this.toBuffer(createWarHorn(rate));
  }

  get areLoopsPlaying(): boolean {
    return this.loops.length > 0;
  }

  /** Starts the drum and sea loops in a session that mixes with other apps' audio. */
  async startLoops(): Promise<void> {
    AudioManager.setSystemOptions(sessionOptions(false));
    await AudioManager.setAudioSessionActivity(true);
    await this.context.resume();
    if (this.areLoopsPlaying) {
      return;
    }
    this.loops = [this.play(this.drum, 0.8, true), this.play(this.sea, 0.5, true)];
  }

  stopLoops(): void {
    this.loops.forEach((loop) => loop.stop());
    this.loops = [];
  }

  /** Plays the horn once over whatever is already playing. */
  async playHorn(): Promise<void> {
    await AudioManager.setAudioSessionActivity(true);
    await this.context.resume();
    this.play(this.horn, 1, false);
  }

  /** Ducks the user's music for each of `count` horn cues, releasing it the given way after each one. */
  async runDuckTrial(
    release: DuckRelease,
    count: number,
    intervalMs: number,
    onCue: (cue: DuckedCue) => void,
  ): Promise<void> {
    await this.startLoops();
    for (let index = 1; index <= count; index += 1) {
      onCue(await this.duckOneCue(index, release));
      await wait(intervalMs);
    }
  }

  /** Stops all sound and gives up the audio session, so iOS may suspend the app (KTD19). */
  async goSilent(): Promise<void> {
    this.stopLoops();
    await this.context.suspend();
    await AudioManager.setAudioSessionActivity(false);
  }

  async close(): Promise<void> {
    this.stopLoops();
    await this.context.close();
  }

  private async duckOneCue(index: number, release: DuckRelease): Promise<DuckedCue> {
    const wallStart = performance.now();
    const audioStart = this.context.currentTime;
    let releaseMs = 0;
    let error: string | null = null;
    try {
      AudioManager.setSystemOptions(sessionOptions(true));
      this.play(this.horn, 1, false);
      await wait(this.horn.duration * 1000);
      const releaseStart = performance.now();
      AudioManager.setSystemOptions(sessionOptions(false));
      if (release === 'deactivate') {
        await AudioManager.setAudioSessionActivity(false);
        await AudioManager.setAudioSessionActivity(true);
        await this.context.resume();
      }
      releaseMs = performance.now() - releaseStart;
      // Give our loops a moment after the release, so a stall it causes shows up in the clock check.
      await wait(1000);
    } catch (caught) {
      error = describeError(caught);
    }
    const wallSeconds = (performance.now() - wallStart) / 1000;
    const audioSeconds = this.context.currentTime - audioStart;
    return {
      index,
      release,
      releaseMs: Math.round(releaseMs),
      isOwnAudioRunning:
        this.context.state === 'running' && audioSeconds >= wallSeconds * MIN_AUDIO_CLOCK_RATIO,
      contextState: this.context.state,
      error,
    };
  }

  private toBuffer(samples: Float32Array<ArrayBuffer>): AudioBuffer {
    const buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
    buffer.copyToChannel(samples, 0);
    return buffer;
  }

  private play(buffer: AudioBuffer, volume: number, isLooping: boolean): AudioBufferSourceNode {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = isLooping;
    const gain = this.context.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();
    return source;
  }
}
