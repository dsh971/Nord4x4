"""Check design boards against the requirements: no stale sample data, readable gauge numbers, every board registered.

Usage: python3 -I docs/design/tools/check_boards.py docs/design/canvas-source
Exits 1 and lists problems when any board fails.
"""
import json
import re
import sys
from pathlib import Path

REGISTRY = Path(__file__).with_name("boards.json")

# Gauge numbers are tagged in the board HTML, e.g. <div data-gauge="time" style="font-size: 100px">.
GAUGE_TAG = re.compile(r'<[^>]*\bdata-gauge="(?P<kind>[a-z]+)"[^>]*>')
FONT_SIZE = re.compile(r"font-size:\s*(?P<px>\d+(?:\.\d+)?)px")


def load_registry() -> dict:
    """Read the shared board list and thresholds."""
    return json.loads(REGISTRY.read_text())


def find_stale_phrases(html: str, phrases: list[str]) -> list[str]:
    """Return the stale phrases that appear in the board text."""
    return [phrase for phrase in phrases if phrase in html]


def check_gauge(html: str, min_px: dict[str, float]) -> list[str]:
    """Return problems with the tagged gauge numbers: missing, unsized, or below the minimum size."""
    sizes: dict[str, float] = {}
    for match in GAUGE_TAG.finditer(html):
        size = FONT_SIZE.search(match.group(0))
        if size is None:
            return [f'gauge "{match.group("kind")}" has no inline font-size']
        sizes[match.group("kind")] = float(size.group("px"))
    problems = []
    for kind, minimum in min_px.items():
        if kind not in sizes:
            problems.append(f'no data-gauge="{kind}" element')
        elif sizes[kind] < minimum:
            problems.append(f"gauge {kind} is {sizes[kind]:g}px, needs at least {minimum:g}px")
    return problems


def check_boards(source_dir: Path, registry: dict) -> list[str]:
    """Check every board in the registry and flag board files the registry doesn't list."""
    problems = []
    registered = {board["file"] for board in registry["boards"]}
    for path in sorted(source_dir.glob("*.dc.html")):
        if path.name not in registered:
            problems.append(f"{path.name}: not listed in boards.json")
    for board in registry["boards"]:
        path = source_dir / board["file"]
        label = f'{board["number"]} {board["file"]}'
        if not path.exists():
            problems.append(f"{label}: file missing")
            continue
        html = path.read_text()
        problems += [f'{label}: stale "{phrase}"' for phrase in find_stale_phrases(html, registry["stale_phrases"])]
        # "gauge" lists the numbers a board must show large; a no-strap board has time but no heart rate.
        required = {kind: registry["gauge_min_px"][kind] for kind in board.get("gauge", [])}
        if required:
            problems += [f"{label}: {problem}" for problem in check_gauge(html, required)]
    return problems


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: check_boards.py <canvas-source-dir>")
    problems = check_boards(Path(sys.argv[1]), load_registry())
    for problem in problems:
        print(problem)
    if problems:
        raise SystemExit(f"{len(problems)} problem(s)")
    print("All boards pass")


if __name__ == "__main__":
    main()
