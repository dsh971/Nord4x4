// Synthesized stand-ins for the spike, so the audio checks need no licensed files (real assets come with U3).
// The drum and horn are the picks from the listening test of 2026-11-04 (drum-1 "taiko", horn-5 "war horn").

const SEAM_FADE_SECONDS = 0.05;
const ONSET_FADE_SECONDS = 0.001;

const TAIKO_HIT = {
  seconds: 0.5,
  startHz: 180,
  endHz: 95,
  sweepSeconds: 0.04,
  decaySeconds: 0.16,
  overtones: [
    { ratio: 1.6, weight: 0.35 },
    { ratio: 2.3, weight: 0.2 },
  ],
  slap: 0.6,
  slapDecaySeconds: 0.012,
  drive: 2,
  peak: 0.89,
};

const WAR_HORN = {
  fundamentalHz: 73,
  blastSeconds: 3.2,
  tailSeconds: 2,
  harmonics: [0.8, 1, 0.85, 0.7, 0.5, 0.35, 0.25, 0.15],
  attackSeconds: 0.5,
  releaseSeconds: 0.7,
  detune: 0.004,
  pitchRise: 0.06,
  vibrato: 0.006,
  breath: 0.08,
  growlHz: 34,
  growlDepth: 0.25,
  reverbWet: 0.55,
  peak: 0.89,
};

/** Fills a mono buffer with one stroke at the given rate: a taiko-like hit at the catch, then silence for the recovery. */
export function createStrokeDrumLoop(
  sampleRate: number,
  strokesPerMinute: number,
  random: () => number = Math.random,
): Float32Array<ArrayBuffer> {
  if (!Number.isFinite(strokesPerMinute) || strokesPerMinute <= 0) {
    throw new Error(`Drum stroke rate must be a positive number; got ${strokesPerMinute}`);
  }
  const loop = new Float32Array(Math.round((60 / strokesPerMinute) * sampleRate));
  const hit = TAIKO_HIT;
  const hitLength = Math.min(loop.length, Math.round(hit.seconds * sampleRate));
  let phase = 0;
  let slapTone = 0;
  for (let i = 0; i < hitLength; i += 1) {
    const t = i / sampleRate;
    // The pitch falls quickly from 180 Hz to 95 Hz, like a struck skin settling.
    const frequency = hit.endHz + (hit.startHz - hit.endHz) * Math.exp(-t / hit.sweepSeconds);
    phase += (2 * Math.PI * frequency) / sampleRate;
    let body = Math.sin(phase);
    for (const { ratio, weight } of hit.overtones) {
      body += weight * Math.sin(phase * ratio);
    }
    body *= Math.exp(-t / hit.decaySeconds);
    // The hand on the skin: a short burst of filtered noise, which a phone speaker carries well.
    slapTone += 0.35 * (random() * 2 - 1 - slapTone);
    const slap = hit.slap * slapTone * Math.exp(-t / hit.slapDecaySeconds);
    // Soft saturation adds harmonics, so the low body still reads as low on small speakers.
    const onset = Math.min(1, i / (ONSET_FADE_SECONDS * sampleRate));
    loop[i] = (onset * Math.tanh(hit.drive * (body + slap))) / Math.tanh(hit.drive);
  }
  normalize(loop, hit.peak);
  return loop;
}

/** Fills a mono buffer with soft brown noise for a calm-sea loop, faded at both ends so it loops cleanly. */
export function createSeaLoop(
  sampleRate: number,
  seconds: number,
  random: () => number = Math.random,
): Float32Array<ArrayBuffer> {
  const loop = new Float32Array(Math.round(seconds * sampleRate));
  let level = 0;
  for (let i = 0; i < loop.length; i += 1) {
    // Leaky integration of white noise gives brown noise; the leak keeps it from drifting off centre.
    level = level * 0.998 + (random() * 2 - 1) * 0.02;
    loop[i] = Math.max(-1, Math.min(1, level * 1.5));
  }
  applyEdgeFades(loop, Math.round(SEAM_FADE_SECONDS * sampleRate));
  return loop;
}

/** Fills a mono buffer with a low, growling war-horn blast and its echo across a valley; starts and ends silent. */
export function createWarHorn(
  sampleRate: number,
  random: () => number = Math.random,
): Float32Array<ArrayBuffer> {
  const horn = WAR_HORN;
  const blast = new Float32Array(Math.round(horn.blastSeconds * sampleRate));
  let phaseA = 0;
  let phaseB = 0;
  let breath = 0;
  for (let i = 0; i < blast.length; i += 1) {
    const t = i / sampleRate;
    // A blown horn starts a little flat and settles onto pitch; vibrato creeps in as the note holds.
    const bend = 1 - horn.pitchRise * Math.exp(-t / 0.15);
    const wobble = 1 + horn.vibrato * Math.sin(2 * Math.PI * 4.5 * t) * Math.min(1, t / 0.6);
    const frequency = horn.fundamentalHz * bend * wobble;
    phaseA += (2 * Math.PI * frequency) / sampleRate;
    phaseB += (2 * Math.PI * frequency * (1 + horn.detune)) / sampleRate;
    let value = 0;
    horn.harmonics.forEach((weight, index) => {
      const partial = index + 1;
      value += weight * (Math.sin(partial * phaseA) + 0.6 * Math.sin(partial * phaseB));
    });
    breath += 0.05 * (random() * 2 - 1 - breath);
    value += horn.breath * breath * 6;
    const envelope = Math.max(
      0,
      Math.min(1, t / horn.attackSeconds, (horn.blastSeconds - t) / horn.releaseSeconds),
    );
    // Roughness at a few tens of hertz sounds like buzzing lips; tanh gives the blast its bite.
    const rough =
      1 -
      horn.growlDepth *
        (0.5 +
          0.5 * Math.sin(2 * Math.PI * horn.growlHz * t + 0.6 * Math.sin(2 * Math.PI * 3.1 * t)));
    blast[i] = Math.tanh(1.8 * value * envelope * rough);
  }
  const withTail = addValleyReverb(blast, sampleRate, horn.tailSeconds, horn.reverbWet);
  // The reverb tail is cut at a fixed length, so fade its last moments rather than end on a click.
  applyFadeOut(withTail, Math.round(0.3 * sampleRate));
  normalize(withTail, horn.peak);
  return withTail;
}

/** A small Schroeder reverb (parallel combs into allpasses) plus one late echo off a far hillside. */
function addValleyReverb(
  dry: Float32Array,
  sampleRate: number,
  tailSeconds: number,
  wet: number,
): Float32Array<ArrayBuffer> {
  const length = dry.length + Math.round(tailSeconds * sampleRate);
  // Delay lengths are tuned at 48 kHz; scaling keeps the room the same size at other rates.
  const scale = sampleRate / 48_000;
  const combDelays = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round(d * scale));
  const feedback = 0.84;
  let reverb = new Float32Array(length);
  for (const delay of combDelays) {
    const comb = new Float32Array(length);
    let damped = 0;
    for (let i = 0; i < length; i += 1) {
      const delayed = i >= delay ? (comb[i - delay] ?? 0) : 0;
      damped = 0.6 * delayed + 0.4 * damped;
      comb[i] = (dry[i] ?? 0) + feedback * damped;
      reverb[i] = (reverb[i] ?? 0) + delayed;
    }
  }
  for (const baseDelay of [225, 556, 441]) {
    const delay = Math.round(baseDelay * scale);
    const gain = 0.5;
    const allpass = new Float32Array(length);
    for (let i = 0; i < length; i += 1) {
      const delayedIn = i >= delay ? (reverb[i - delay] ?? 0) : 0;
      const delayedOut = i >= delay ? (allpass[i - delay] ?? 0) : 0;
      allpass[i] = -gain * (reverb[i] ?? 0) + delayedIn + gain * delayedOut;
    }
    reverb = allpass;
  }
  const echoDelay = Math.round(0.42 * sampleRate);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const echo = i >= echoDelay ? 0.3 * (dry[i - echoDelay] ?? 0) : 0;
    out[i] = (dry[i] ?? 0) + wet * ((reverb[i] ?? 0) / combDelays.length) + wet * echo;
  }
  return out;
}

function normalize(samples: Float32Array, peak: number): void {
  const loudest = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
  if (loudest === 0) {
    return;
  }
  const gain = peak / loudest;
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = (samples[i] ?? 0) * gain;
  }
}

function applyFadeOut(samples: Float32Array, fadeLength: number): void {
  const length = Math.min(fadeLength, samples.length);
  for (let i = 0; i < length; i += 1) {
    const tail = samples.length - 1 - i;
    samples[tail] = (samples[tail] ?? 0) * (i / length);
  }
}

function applyEdgeFades(samples: Float32Array, fadeLength: number): void {
  const length = Math.min(fadeLength, Math.floor(samples.length / 2));
  for (let i = 0; i < length; i += 1) {
    const gain = i / length;
    samples[i] = (samples[i] ?? 0) * gain;
    const tail = samples.length - 1 - i;
    samples[tail] = (samples[tail] ?? 0) * gain;
  }
}
