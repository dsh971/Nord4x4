import {
  AudioBuffer,
  AudioBufferSourceNode,
  AudioContext,
  AudioManager,
} from 'react-native-audio-api';

import { SOUND_FILES } from '../../services/audio/assets';

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

type SpikeSounds = {
  readonly drum: AudioBuffer;
  readonly sea: AudioBuffer;
  readonly horn: AudioBuffer;
};

/** Drives the spike's sounds: two loops and a horn mixed over the user's music, plus the ducking trial. */
export class SpikeAudio {
  private readonly context = new AudioContext();
  private soundsLoading: Promise<SpikeSounds> | null = null;
  private loops: AudioBufferSourceNode[] = [];

  get areLoopsPlaying(): boolean {
    return this.loops.length > 0;
  }

  /** Starts the drum and sea loops in a session that mixes with other apps' audio. */
  async startLoops(): Promise<void> {
    AudioManager.setSystemOptions(sessionOptions(false));
    await AudioManager.setAudioSessionActivity(true);
    await this.context.resume();
    const { drum, sea } = await this.sounds();
    if (this.areLoopsPlaying) {
      return;
    }
    this.loops = [this.play(drum, 0.8, true), this.play(sea, 0.5, true)];
  }

  stopLoops(): void {
    this.loops.forEach((loop) => loop.stop());
    this.loops = [];
  }

  /** Plays the horn once over whatever is already playing. */
  async playHorn(): Promise<void> {
    await AudioManager.setAudioSessionActivity(true);
    await this.context.resume();
    this.play((await this.sounds()).horn, 1, false);
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
      const { horn } = await this.sounds();
      AudioManager.setSystemOptions(sessionOptions(true));
      this.play(horn, 1, false);
      await wait(horn.duration * 1000);
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

  /** Decodes the real slice sounds once; the drum loop is one taiko hit per stroke at a push rate. */
  private sounds(): Promise<SpikeSounds> {
    this.soundsLoading ??= (async () => {
      const [hit, sea, horn] = await Promise.all([
        this.context.decodeAudioData(SOUND_FILES['drum-hit']),
        this.context.decodeAudioData(SOUND_FILES['sea-calm']),
        this.context.decodeAudioData(SOUND_FILES['war-horn']),
      ]);
      const strokeLength = Math.round((60 / STROKES_PER_MINUTE) * hit.sampleRate);
      const drum = this.context.createBuffer(1, strokeLength, hit.sampleRate);
      drum.copyToChannel(hit.getChannelData(0).slice(0, strokeLength), 0);
      return { drum, sea, horn };
    })();
    return this.soundsLoading;
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
