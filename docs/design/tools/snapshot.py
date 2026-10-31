"""Convert Shuimo .dc.html canvas boards to standalone HTML and screenshot them with headless Chrome."""
import json
import re
import subprocess
import sys
from pathlib import Path

SOURCE_DIR = Path(sys.argv[1])
OUT_DIR = Path(sys.argv[2])
WORK_DIR = Path(sys.argv[3])
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Shared board list: number, slug, source file, size, and which boards need special handling.
REGISTRY = json.loads(Path(__file__).with_name("boards.json").read_text())


# Get seated animates one stroke; a still can't show that, so it is frozen into one frame per phase.
# A board's "stroke_phases" lists which phases to render; a single phase gets no suffix.
PHASE_SUFFIX = {1: "a-catch", 2: "b-drive", 3: "c-finish", 4: "d-recovery"}


def freeze_phase_css(phase: int) -> str:
    """CSS that stops the stroke-demo animation and shows only the given phase."""
    pose = ".nf-p.nf-p1" if phase == 1 else f".nf-p.nf-d{phase}"
    label = ".nf-l:not(.nf-d2):not(.nf-d3):not(.nf-d4)" if phase == 1 else f".nf-l.nf-d{phase}"
    return (
        "<style>.nf-p,.nf-l{animation:none!important}.nf-p{opacity:0!important}"
        f"{pose}{{opacity:1!important}}"
        f"{label}{{color:#9F5217!important;border-color:#C66B22!important}}</style>"
    )


def to_standalone(source: str, extra_css: str = "") -> str:
    """Strip the canvas runtime wrapper so the board renders as a plain page."""
    html = source.replace('<script src="./support.js"></script>', extra_css)
    html = re.sub(r"<script type=\"text/x-dc\".*?</script>", "", html, flags=re.S)
    html = re.sub(r"</?(x-dc|helmet)>", "", html)
    return html


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    jobs = []
    for board in REGISTRY["boards"]:
        source = (SOURCE_DIR / board["file"]).read_text()
        number, width, height = board["number"], board["width"], board["height"]
        phases = board.get("stroke_phases", [])
        if len(phases) == 1:
            jobs.append((number, f"{number}-{board['slug']}", to_standalone(source, freeze_phase_css(phases[0])), width, height))
        elif phases:
            jobs += [
                (f"{number}{PHASE_SUFFIX[phase][0]}", f"{number}{PHASE_SUFFIX[phase]}-{board['slug']}", to_standalone(source, freeze_phase_css(phase)), width, height)
                for phase in phases
            ]
        else:
            jobs.append((number, f"{number}-{board['slug']}", to_standalone(source), width, height))
    for number, name, html, width, height in jobs:
        page = WORK_DIR / f"{name}.html"
        page.write_text(html)
        png = OUT_DIR / f"{name}.png"
        result = subprocess.run(
            [
                CHROME, "--headless=new", "--hide-scrollbars", "--disable-gpu",
                "--force-device-scale-factor=2", f"--window-size={width},{height}",
                "--virtual-time-budget=6000", f"--screenshot={png}", page.as_uri(),
            ],
            capture_output=True, text=True, timeout=90,
        )
        if result.returncode != 0 or not png.exists():
            raise SystemExit(f"Screenshot failed for {number}: {result.stderr}")
        print(f"{number} {png.name} {png.stat().st_size} bytes")


if __name__ == "__main__":
    main()
