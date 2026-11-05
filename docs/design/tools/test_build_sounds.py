"""Tests for build_sounds. Run: python3 -m unittest discover -s docs/design/tools"""
import math
import struct
import tempfile
import unittest
import wave
from pathlib import Path

from build_sounds import (
    ASSETS_DIR,
    EXPECTED_FILES,
    RATE,
    SIZE_BUDGET_BYTES,
    check_original,
    check_size_budget,
    fade_edges,
    first_strike,
    seamless_loop,
)


def tone(seconds: float, hz: float = 220.0) -> list[float]:
    """A full-scale sine, `seconds` long."""
    return [math.sin(2 * math.pi * hz * i / RATE) for i in range(int(seconds * RATE))]


class SeamlessLoopTest(unittest.TestCase):
    def test_wraps_without_a_jump(self) -> None:
        source = [i / 1000 for i in range(5 * RATE)]  # a ramp, so any splice point would show as a jump
        loop = seamless_loop(source, 1, 1.0, 2.0, 0.5)
        step = source[1] - source[0]
        self.assertAlmostEqual(loop[0] - loop[-1], step, places=6)

    def test_keeps_stereo_channels_apart(self) -> None:
        left, right = tone(4.0, 220), tone(4.0, 330)
        interleaved = [s for pair in zip(left, right) for s in pair]
        loop = seamless_loop(interleaved, 2, 0.5, 2.0, 0.5)
        self.assertEqual(len(loop), 2 * 2 * RATE)
        frame = RATE  # 1 s into the loop, past the 0.5 s crossfade, so the source is untouched
        source_frame = RATE // 2 + frame
        self.assertEqual(loop[2 * frame : 2 * frame + 2], [left[source_frame], right[source_frame]])

    def test_rejects_a_recording_too_short_for_the_crossfade(self) -> None:
        with self.assertRaisesRegex(ValueError, "too short"):
            seamless_loop(tone(2.0), 1, 0.5, 1.5, 0.5)


class FirstStrikeTest(unittest.TestCase):
    def test_starts_just_before_the_first_loud_onset(self) -> None:
        recording = [0.01] * RATE + [0.8] * (2 * RATE)  # quiet room noise, then a strike with a sharp onset
        strike = first_strike(recording, 1.0)
        lead_in = int(0.01 * RATE)
        self.assertEqual(strike[:lead_in], [0.01] * lead_in)
        self.assertEqual(strike[lead_in], 0.8)
        self.assertLess(abs(strike[-1]), 1e-3)  # faded out, so it ends without a click


class FadeEdgesTest(unittest.TestCase):
    def test_a_sound_cut_off_mid_note_starts_and_ends_silent(self) -> None:
        faded = fade_edges([1.0] * RATE)
        self.assertEqual((faded[0], faded[-1]), (0.0, 0.0))
        self.assertEqual(faded[RATE // 2], 1.0)  # the middle is untouched


class CheckOriginalTest(unittest.TestCase):
    def test_rejects_a_file_that_is_not_the_original(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            preview = Path(folder) / "preview.mp3"
            preview.write_bytes(b"not the original")
            with self.assertRaisesRegex(ValueError, "not the original"):
                check_original("sea", preview)


class SizeBudgetTest(unittest.TestCase):
    def test_passes_at_exactly_the_budget(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / "a.wav").write_bytes(b"x" * 600)
            (Path(folder) / "b.m4a").write_bytes(b"x" * 400)
            self.assertEqual(check_size_budget(Path(folder), budget_bytes=1000), 1000)

    def test_fails_one_byte_over_the_budget(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / "a.wav").write_bytes(b"x" * 1001)
            with self.assertRaisesRegex(ValueError, "over the"):
                check_size_budget(Path(folder), budget_bytes=1000)


class CommittedAssetsTest(unittest.TestCase):
    """The files the app ships, checked on every test run, not only when someone rebuilds them."""

    def test_every_asset_in_the_spec_is_present(self) -> None:
        present = {path.name for path in ASSETS_DIR.iterdir()}
        self.assertLessEqual(EXPECTED_FILES, present)

    def test_the_folder_fits_the_size_budget(self) -> None:
        self.assertLessEqual(check_size_budget(ASSETS_DIR), SIZE_BUDGET_BYTES)

    def test_one_shots_are_48k_16_bit_mono_and_start_and_end_silent(self) -> None:
        for path in sorted(ASSETS_DIR.glob("*.wav")):
            with self.subTest(path.name), wave.open(str(path)) as audio:
                self.assertEqual((audio.getframerate(), audio.getsampwidth(), audio.getnchannels()), (RATE, 2, 1))
                frames = audio.getnframes()
                samples = struct.unpack(f"<{frames}h", audio.readframes(frames))
                # A one-shot that starts or stops mid-wave clicks every time it plays.
                self.assertLessEqual(abs(samples[0]), 0.01 * 32767)
                self.assertLessEqual(abs(samples[-1]), 0.01 * 32767)


if __name__ == "__main__":
    unittest.main()
