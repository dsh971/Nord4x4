"""Build the slice's sound assets in assets/audio/ (see docs/design/sound-spec.md).

The horns, drum, push-start strike and hold signal are synthesized here. The bell, sea and crew are cut from
CC0 recordings that you download from Freesound first (links in the spec). Needs ffmpeg and macOS afconvert.

Run: python3 -I docs/design/tools/sounds/build_sounds.py --bell <370007 wav> --sea <637945 flac> --crew <480808 wav>
"""
import argparse
import math
import random
import re
import struct
import subprocess
import tempfile
import wave
from array import array
from pathlib import Path

RATE = 48_000
PEAK = 0.89  # about -1 dBFS, so the decoder never clips

# --- Synthesis -------------------------------------------------------------------------------------------------


def silence(seconds: float) -> list[float]:
    """Return `seconds` of silence."""
    return [0.0] * int(seconds * RATE)


def normalize(samples: list[float], peak: float = PEAK) -> list[float]:
    """Scale `samples` so the loudest one sits at `peak`."""
    loudest = max(abs(s) for s in samples) or 1.0
    return [s * peak / loudest for s in samples]


def horn(
    fundamental: float,
    seconds: float,
    harmonics: list[float],
    attack: float,
    release: float,
    detune: float = 0.004,
    pitch_rise: float = 0.0,
    vibrato: float = 0.0,
    breath: float = 0.0,
    seed: int = 7,
) -> list[float]:
    """A blown horn: two slightly detuned voices of `harmonics`, with breath noise and a linear envelope."""
    rng = random.Random(seed)
    samples = []
    phase_a = phase_b = lowpassed = 0.0
    for i in range(int(seconds * RATE)):
        t = i / RATE
        # A blown horn often starts a little flat and settles onto pitch.
        bend = 1.0 - pitch_rise * math.exp(-t / 0.15)
        wobble = 1.0 + vibrato * math.sin(2 * math.pi * 4.5 * t) * min(1.0, t / 0.6)
        freq = fundamental * bend * wobble
        phase_a += 2 * math.pi * freq / RATE
        phase_b += 2 * math.pi * freq * (1 + detune) / RATE
        value = sum(w * (math.sin(n * phase_a) + 0.6 * math.sin(n * phase_b)) for n, w in enumerate(harmonics, 1))
        if breath:
            lowpassed += 0.05 * ((rng.random() * 2 - 1) - lowpassed)
            value += breath * lowpassed * 6
        envelope = max(0.0, min(1.0, t / attack, (seconds - t) / release))
        samples.append(value * envelope)
    return samples


def growl(samples: list[float], rate_hz: float, depth: float) -> list[float]:
    """Amplitude roughness at a few tens of hertz, like buzzing lips, then soft saturation for bite."""
    out = []
    for i, value in enumerate(samples):
        t = i / RATE
        rough = 1.0 - depth * (0.5 + 0.5 * math.sin(2 * math.pi * rate_hz * t + 0.6 * math.sin(2 * math.pi * 3.1 * t)))
        out.append(math.tanh(1.8 * value * rough))
    return out


def valley_reverb(samples: list[float], tail_seconds: float, wet: float) -> list[float]:
    """A small Schroeder reverb (parallel combs into allpasses) plus one late echo off a far hillside."""
    length = len(samples) + int(tail_seconds * RATE)
    dry = samples + [0.0] * (length - len(samples))
    comb_delays = [1557, 1617, 1491, 1422, 1277, 1356]
    combined = [0.0] * length
    for delay in comb_delays:
        buffer = [0.0] * length
        damped = 0.0
        for i in range(length):
            delayed = buffer[i - delay] if i >= delay else 0.0
            damped = 0.6 * delayed + 0.4 * damped
            buffer[i] = dry[i] + 0.84 * damped
            combined[i] += delayed
    for delay in (225, 556, 441):
        out = [0.0] * length
        for i in range(length):
            delayed_in = combined[i - delay] if i >= delay else 0.0
            delayed_out = out[i - delay] if i >= delay else 0.0
            out[i] = -0.5 * combined[i] + delayed_in + 0.5 * delayed_out
        combined = out
    echo_delay = int(0.42 * RATE)
    return [
        dry[i] + wet * (combined[i] / len(comb_delays)) + (0.3 * dry[i - echo_delay] * wet if i >= echo_delay else 0.0)
        for i in range(length)
    ]


def sag(samples: list[float], semitones: float, from_seconds: float) -> list[float]:
    """Bend the pitch down by up to `semitones` after `from_seconds`, like a horn player running out of breath."""
    seconds = len(samples) / RATE
    out, position = [], 0.0
    while position < len(samples) - 1:
        share = max(0.0, (position / RATE - from_seconds) / (seconds - from_seconds))
        out.append(samples[int(position)])
        position += 2 ** (-semitones * share / 12)
    return out


def drum_hit(seed: int) -> list[float]:
    """One taiko hit: a skin whose pitch falls from 180 to 95 Hz, plus the slap of the hand (drum-1 "taiko")."""
    rng = random.Random(seed)
    hit, phase, slap_tone = [], 0.0, 0.0
    for i in range(int(0.5 * RATE)):
        t = i / RATE
        phase += 2 * math.pi * (95 + 85 * math.exp(-t / 0.04)) / RATE
        body = (math.sin(phase) + 0.35 * math.sin(phase * 1.6) + 0.2 * math.sin(phase * 2.3)) * math.exp(-t / 0.16)
        slap_tone += 0.35 * ((rng.random() * 2 - 1) - slap_tone)
        slap = 0.6 * slap_tone * math.exp(-t / 0.012)
        # Soft saturation adds harmonics, so the low body still reads as low on small speakers.
        hit.append(math.tanh(2.0 * (body + slap)) / math.tanh(2.0))
    return hit


def struck(partials: list[tuple[float, float, float]], seconds: float, attack_noise: float, seed: int) -> list[float]:
    """A struck body: `partials` are (frequency Hz, amplitude, decay seconds), with a click of noise at contact."""
    rng = random.Random(seed)
    out = []
    for i in range(int(seconds * RATE)):
        t = i / RATE
        value = sum(a * math.exp(-t / d) * math.sin(2 * math.pi * f * t) for f, a, d in partials)
        value += attack_noise * (rng.random() * 2 - 1) * math.exp(-t / 0.004)
        out.append(min(1.0, i / (0.001 * RATE)) * value)
    return out


WAR_HORN = dict(
    fundamental=73, harmonics=[0.8, 1, 0.85, 0.7, 0.5, 0.35, 0.25, 0.15], pitch_rise=0.06, vibrato=0.006, breath=0.08
)
OAR_SHAFTS = [(310, 1, 0.045), (760, 0.7, 0.03), (1450, 0.35, 0.015)]


def war_horn() -> list[float]:
    """horn-5 "war horn": 3.2 s at 73 Hz with a light growl and a valley tail. Warns 10 s before a push."""
    return valley_reverb(growl(horn(seconds=3.2, attack=0.5, release=0.7, **WAR_HORN), 34, 0.25), 2.0, 0.55)


def push_end_horn() -> list[float]:
    """end-2 "falling war horn": the same horn sagging five semitones over its last 1.5 s, so it reads as done."""
    blast = sag(horn(seconds=2.4, attack=0.3, release=0.9, **WAR_HORN), 5, 0.9)
    return valley_reverb(growl(blast, 34, 0.2), 1.8, 0.55)


def push_start_strike() -> list[float]:
    """strike-1 "double taiko": a clipped grace hit 0.17 s before a full one."""
    taiko = drum_hit(seed=99)
    return taiko[: int(0.17 * RATE)] + taiko + silence(0.5)


def hold_signal() -> list[float]:
    """wood-3 "oar shafts clack": two hollow wood knocks 0.09 s apart."""
    def knock(seed: int) -> list[float]:
        return struck(OAR_SHAFTS, 0.15, attack_noise=0.6, seed=seed)

    return knock(1) + silence(0.09) + knock(2) + silence(0.6)


# --- Recordings ------------------------------------------------------------------------------------------------


def decode(path: Path, channels: int) -> list[float]:
    """Decode any audio file to 48 kHz float samples, interleaved when `channels` is 2."""
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-ac", str(channels), "-ar", str(RATE), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    samples = array("f")
    samples.frombytes(raw)
    return samples.tolist()


def first_strike(samples: list[float], seconds: float) -> list[float]:
    """The first strike in a recording: from 10 ms before it passes 30% of the peak, faded out over its last 0.4 s."""
    threshold = 0.3 * max(abs(s) for s in samples)
    onset = next(i for i, s in enumerate(samples) if abs(s) > threshold)
    start = max(0, onset - int(0.01 * RATE))
    cut = samples[start : start + int(seconds * RATE)]
    fade = int(0.4 * RATE)
    return [s * min(1.0, (len(cut) - i) / fade) for i, s in enumerate(cut)]


def seamless_loop(samples: list[float], channels: int, start: float, length: float, fade: float) -> list[float]:
    """`length` s from `start`, with the `fade` s that follow crossfaded (equal power) into its head, so it loops clean."""
    first, count, fade_count = int(start * RATE) * channels, int(length * RATE) * channels, int(fade * RATE) * channels
    if first + count + fade_count > len(samples):
        raise ValueError(f"Recording is too short for a {length} s loop from {start} s with a {fade} s crossfade")
    loop = samples[first : first + count]
    for i in range(fade_count):
        share = (i // channels) / (fade_count // channels)
        loop[i] = loop[i] * math.sin(share * math.pi / 2) + samples[first + count + i] * math.cos(share * math.pi / 2)
    return loop


# --- Files -----------------------------------------------------------------------------------------------------


def write_wav(path: Path, samples: list[float], channels: int = 1) -> None:
    """Write 16-bit 48 kHz PCM; one-shots are normalized to PEAK, loops are written as given."""
    with wave.open(str(path), "wb") as out:
        out.setnchannels(channels)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b"".join(struct.pack("<h", round(max(-1.0, min(1.0, s)) * 32767)) for s in samples))


def loudness(path: Path) -> float:
    """Integrated loudness of a file in LUFS (EBU R128), measured by ffmpeg."""
    report = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
        check=True, capture_output=True, text=True,
    ).stderr
    matches = re.findall(r"I:\s+(-?[\d.]+) LUFS", report)
    if not matches:
        raise RuntimeError(f"ffmpeg reported no loudness for {path}")
    return float(matches[-1])


def write_loop(path: Path, samples: list[float], channels: int, target_lufs: float, scratch: Path) -> None:
    """Gain the loop to `target_lufs` and encode it as 160 kbps AAC in .m4a with Apple's encoder."""
    wav = scratch / f"{path.stem}.wav"
    write_wav(wav, samples, channels)
    gain = 10 ** ((target_lufs - loudness(wav)) / 20)
    if max(abs(s) for s in samples) * gain > PEAK:
        raise ValueError(f"{path.name} would clip at {target_lufs} LUFS")
    write_wav(wav, [s * gain for s in samples], channels)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "160000", str(wav), str(path)], check=True)


def build(bell: Path, sea: Path, crew: Path, out_dir: Path) -> None:
    """Write every slice asset to `out_dir`."""
    out_dir.mkdir(parents=True, exist_ok=True)
    one_shots = {
        "war-horn": war_horn(),
        "push-end-horn": push_end_horn(),
        "push-start-strike": push_start_strike(),
        "hold-signal": hold_signal(),
        "drum-hit": drum_hit(seed=0),
        "ease-off-bell": first_strike(decode(bell, 1), 1.8),
    }
    for name, samples in one_shots.items():
        write_wav(out_dir / f"{name}.wav", normalize(samples))
    with tempfile.TemporaryDirectory() as scratch:
        # The sea's splashes peak far above its average, so -25 LUFS is as loud as it goes without clipping.
        # The crew sits 8 dB under it (listening test, 2026-11-05); the app sets the playback level.
        write_loop(out_dir / "sea-calm.m4a", seamless_loop(decode(sea, 2), 2, 20, 60, 2), 2, -25, Path(scratch))
        write_loop(out_dir / "crew-murmur.m4a", seamless_loop(decode(crew, 1), 1, 0, 15, 1.5), 1, -33, Path(scratch))
    for path in sorted(out_dir.iterdir()):
        print(path.name)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--bell", type=Path, required=True, help="radwoc 370007, chromatic handbells, original WAV")
    parser.add_argument("--sea", type=Path, required=True, help="kyles 637945, lake waves at boats, original FLAC")
    parser.add_argument("--crew", type=Path, required=True, help="craigsmith 480808, men murmuring, original WAV")
    parser.add_argument("--out", type=Path, default=Path("assets/audio"))
    args = parser.parse_args()
    build(args.bell, args.sea, args.crew, args.out)


if __name__ == "__main__":
    main()
