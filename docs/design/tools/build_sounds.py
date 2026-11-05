"""Build the slice's sound assets in assets/audio/ (see docs/design/sound-spec.md).

The horns, drum, push-start strike and hold signal are synthesized here. The bell, sea and crew are cut from
CC0 recordings that you download from Freesound first (links in the spec). Needs ffmpeg and macOS afconvert.

Run: python3 -I docs/design/tools/build_sounds.py --bell <370007 wav> --sea <637945 flac> --crew <480808 wav>
"""
import argparse
import hashlib
import math
import os
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
# Xcode copies audio into the app as it is, so this script is the only place sound size is controlled.
SIZE_BUDGET_BYTES = 8_000_000
ASSETS_DIR = Path(__file__).resolve().parents[3] / "assets" / "audio"
EXPECTED_FILES = frozenset({
    "war-horn.wav", "push-end-horn.wav", "push-start-strike.wav", "hold-signal.wav", "drum-hit.wav",
    "ease-off-bell.wav", "sea-calm.m4a", "crew-murmur.m4a",
})
# The Freesound originals the cuts were chosen on; a preview or re-upload would silently cut different sounds.
ORIGINAL_SHA256 = {
    "bell": "4a5124919245feaf3fef307a6c5db0ceb647d1f2c9f4fa9356509ed8a9577fcb",
    "sea": "a0eaa38da6b86de506058d379cd049e58633b2de8f6de6ceef6eb37b61c87278",
    "crew": "ac087628b186bac95908546335e909b3bb090a68965ca5e118dc1e1ba23762a6",
}

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
    return fade_edges(hit)


def fade_edges(samples: list[float], onset: float = 0.001, tail: float = 0.03) -> list[float]:
    """Ramp in over `onset` s and out over `tail` s, so a sound cut short doesn't click at either end."""
    onset_count, tail_count = int(onset * RATE), int(tail * RATE)
    return [
        s * min(1.0, i / onset_count, (len(samples) - 1 - i) / tail_count) for i, s in enumerate(samples)
    ]


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
    return fade_edges(taiko[: int(0.17 * RATE)], tail=0.005) + taiko


def hold_signal() -> list[float]:
    """wood-3 "oar shafts clack": two hollow wood knocks, starting 0.24 s apart."""
    def knock(seed: int) -> list[float]:
        return fade_edges(struck(OAR_SHAFTS, 0.15, attack_noise=0.6, seed=seed))

    return knock(1) + silence(0.09) + knock(2)


# --- Recordings ------------------------------------------------------------------------------------------------


def run(command: list[str]) -> subprocess.CompletedProcess[bytes]:
    """Run a tool; on failure, raise with its own error output rather than just the exit status."""
    result = subprocess.run(command, capture_output=True)
    if result.returncode != 0:
        detail = result.stderr.decode(errors="replace").strip()
        raise RuntimeError(f"{command[0]} failed ({result.returncode}): {detail}")
    return result


def check_original(name: str, path: Path) -> None:
    """Raise unless `path` is the exact Freesound original the cuts were chosen on."""
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != ORIGINAL_SHA256[name]:
        raise ValueError(
            f"--{name} {path} is not the original the sounds were cut from (sha256 {digest}); "
            "download the original file from Freesound, not the preview"
        )


def decode(path: Path, channels: int) -> list[float]:
    """Decode any audio file to 48 kHz float samples, interleaved when `channels` is 2."""
    raw = run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-ac", str(channels), "-ar", str(RATE), "-f", "f32le", "-"]
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
    """`length` s from `start`, with the `fade` s of audio after the cut crossfaded into its head, so it loops clean."""
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
    """Write 16-bit 48 kHz PCM, clamped to ±1."""
    with wave.open(str(path), "wb") as out:
        out.setnchannels(channels)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b"".join(struct.pack("<h", round(max(-1.0, min(1.0, s)) * 32767)) for s in samples))


def loudness(path: Path) -> float:
    """Integrated loudness of a file in LUFS (EBU R128) as heard: a mono file counts as playing on both speakers."""
    # iOS plays a mono file on both channels, which sounds 3 dB louder than R128's plain mono measure.
    # R128 measures in 0.4 s blocks; trailing silence lets a shorter one-shot fill one, and the gate drops it.
    report = run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", "apad=pad_dur=1,ebur128=dualmono=true", "-f", "null", "-"]
    ).stderr.decode(errors="replace")
    matches = re.findall(r"I:\s+(-?[\d.]+) LUFS", report)
    if not matches:
        raise RuntimeError(f"ffmpeg reported no loudness for {path}")
    return float(matches[-1])


def write_loop(
    path: Path, samples: list[float], channels: int, target_lufs: float, bitrate: int, scratch: Path
) -> None:
    """Gain the loop to `target_lufs` and encode it as AAC at `bitrate` bits/s in .m4a with Apple's encoder."""
    wav = scratch / f"{path.stem}.wav"
    write_wav(wav, samples, channels)
    gain = 10 ** ((target_lufs - loudness(wav)) / 20)
    if max(abs(s) for s in samples) * gain > PEAK:
        raise ValueError(f"{path.name} would clip at {target_lufs} LUFS")
    write_wav(wav, [s * gain for s in samples], channels)
    run(["afconvert", "-f", "m4af", "-d", "aac", "-b", str(bitrate), str(wav), str(path)])


def check_size_budget(out_dir: Path, budget_bytes: int = SIZE_BUDGET_BYTES) -> int:
    """Return the total size of `out_dir`'s files; raise if it is over `budget_bytes`."""
    total = sum(path.stat().st_size for path in out_dir.iterdir() if path.is_file())
    if total > budget_bytes:
        raise ValueError(
            f"{out_dir} holds {total / 1e6:.1f} MB of sound, over the {budget_bytes / 1e6:.1f} MB budget: "
            "lower a loop's bitrate or length, or raise the budget on purpose"
        )
    return total


def build(bell: Path, sea: Path, crew: Path, out_dir: Path) -> None:
    """Build every slice asset in a staging folder, check it, then move the files into `out_dir` together."""
    for name, path in (("bell", bell), ("sea", sea), ("crew", crew)):
        check_original(name, path)
    out_dir.mkdir(parents=True, exist_ok=True)
    # Staging sits beside out_dir so the final moves are renames on one disk, and a failed build changes nothing.
    with tempfile.TemporaryDirectory(dir=out_dir.parent) as staging, tempfile.TemporaryDirectory() as scratch:
        staged = Path(staging)
        one_shots = {
            "war-horn": war_horn(),
            "push-end-horn": push_end_horn(),
            "push-start-strike": push_start_strike(),
            "hold-signal": hold_signal(),
            "drum-hit": drum_hit(seed=0),
            "ease-off-bell": first_strike(decode(bell, 1), 1.8),
        }
        for name, samples in one_shots.items():
            write_wav(staged / f"{name}.wav", normalize(samples))
        # The sea's splashes peak far above its average, so -25 LUFS keeps it clear of the clip guard.
        # The crew sits 8 dB under it as heard (listening test, 2026-11-05); the app sets the playback level.
        sea_loop = seamless_loop(decode(sea, 2), 2, 20, 60, 2)
        crew_loop = seamless_loop(decode(crew, 1), 1, 0, 15, 1.5)
        write_loop(staged / "sea-calm.m4a", sea_loop, 2, -25, 128_000, Path(scratch))
        # A mono murmur under the sea needs less than the stereo sea.
        write_loop(staged / "crew-murmur.m4a", crew_loop, 1, -33, 96_000, Path(scratch))
        built = {path.name for path in staged.iterdir()}
        if built != EXPECTED_FILES:
            raise RuntimeError(f"Built {sorted(built)}, expected {sorted(EXPECTED_FILES)}")
        total = check_size_budget(staged)
        for path in sorted(staged.iterdir()):
            print(f"{path.name:24} {loudness(path):6.1f} LUFS")
            os.replace(path, out_dir / path.name)
    print(f"{total / 1e6:.1f} MB of {SIZE_BUDGET_BYTES / 1e6:.1f} MB budget")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--bell", type=Path, required=True, help="radwoc 370007, chromatic handbells, original WAV")
    parser.add_argument("--sea", type=Path, required=True, help="kyles 637945, lake waves at boats, original FLAC")
    parser.add_argument("--crew", type=Path, required=True, help="craigsmith 480808, men murmuring, original WAV")
    parser.add_argument("--out", type=Path, default=ASSETS_DIR)
    args = parser.parse_args()
    build(args.bell, args.sea, args.crew, args.out)


if __name__ == "__main__":
    main()
