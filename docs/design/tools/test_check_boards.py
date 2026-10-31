"""Tests for check_boards. Run: python3 -m unittest discover -s docs/design/tools"""
import tempfile
import unittest
from pathlib import Path

from check_boards import check_boards, check_gauge

MIN_PX = {"time": 100, "hr": 66}


def gauge_html(time_px: int, hr_px: int) -> str:
    return (
        f'<div data-gauge="time" style="font-size: {time_px}px">2:41</div>'
        f'<span style="color: #000; font-size: {hr_px}px" data-gauge="hr">162</span>'
    )


class CheckGaugeTest(unittest.TestCase):
    def test_passes_at_exact_minimum(self) -> None:
        self.assertEqual(check_gauge(gauge_html(100, 66), MIN_PX), [])

    def test_flags_numbers_below_minimum(self) -> None:
        self.assertEqual(
            check_gauge(gauge_html(56, 24), MIN_PX),
            ["gauge time is 56px, needs at least 100px", "gauge hr is 24px, needs at least 66px"],
        )

    def test_flags_untagged_gauge(self) -> None:
        self.assertEqual(
            check_gauge('<div style="font-size: 120px">2:41</div>', MIN_PX),
            ['no data-gauge="time" element', 'no data-gauge="hr" element'],
        )

    def test_flags_tag_without_font_size(self) -> None:
        self.assertEqual(check_gauge('<div data-gauge="time">2:41</div>', MIN_PX), ['gauge "time" has no inline font-size'])


class CheckBoardsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = Path(tempfile.mkdtemp())
        self.registry = {
            "gauge_min_px": MIN_PX,
            "stale_phrases": ["Pine gorge"],
            "boards": [
                {"number": "2.1", "file": "Home.dc.html"},
                {"number": "3.2", "file": "Row.dc.html", "gauge": ["time", "hr"]},
                {"number": "3.6", "file": "NoStrap.dc.html", "gauge": ["time"]},
            ],
        }

    def test_clean_boards_pass(self) -> None:
        (self.dir / "Home.dc.html").write_text("<p>Lerwick</p>")
        (self.dir / "Row.dc.html").write_text(gauge_html(100, 66))
        (self.dir / "NoStrap.dc.html").write_text('<div data-gauge="time" style="font-size: 100px">1:48</div>')
        self.assertEqual(check_boards(self.dir, self.registry), [])

    def test_reports_stale_text_missing_and_unregistered_files(self) -> None:
        (self.dir / "Home.dc.html").write_text("<p>Pine gorge</p>")
        (self.dir / "Crew.dc.html").write_text("<p></p>")
        (self.dir / "NoStrap.dc.html").write_text('<div data-gauge="time" style="font-size: 60px">1:48</div>')
        self.assertEqual(
            check_boards(self.dir, self.registry),
            [
                "Crew.dc.html: not listed in boards.json",
                '2.1 Home.dc.html: stale "Pine gorge"',
                "3.2 Row.dc.html: file missing",
                "3.6 NoStrap.dc.html: gauge time is 60px, needs at least 100px",
            ],
        )


if __name__ == "__main__":
    unittest.main()
