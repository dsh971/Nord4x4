"""Tests for build_sounds. Run: python3 -m unittest discover -s docs/design/tools/sounds"""
import math
import tempfile
import unittest
from pathlib import Path

from build_sounds import RATE, check_size_budget, first_strike, seamless_loop


def tone(seconds: float, hz: float = 220.0) -> list[float]:
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
        middle = 2 * RATE  # past the crossfade, the loop is the source untouched
        self.assertEqual(loop[middle : middle + 2], [left[RATE // 2 + RATE], right[RATE // 2 + RATE]])

    def test_rejects_a_recording_too_short_for_the_crossfade(self) -> None:
        with self.assertRaisesRegex(ValueError, "too short"):
            seamless_loop(tone(2.0), 1, 0.5, 1.5, 0.5)


class FirstStrikeTest(unittest.TestCase):
    def test_starts_just_before_the_first_loud_onset(self) -> None:
        recording = [0.01] * RATE + [0.8] * (2 * RATE)  # quiet room noise, then a strike with a sharp onset
        strike = first_strike(recording, 1.0)
        lead_in = int(0.01 * RATE)
        self.assertEqual(strike[: lead_in], [0.01] * lead_in)
        self.assertEqual(strike[lead_in], 0.8)
        self.assertLess(abs(strike[-1]), 1e-3)  # faded out, so it ends without a click



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


if __name__ == "__main__":
    unittest.main()
