# Nor4x4 Design Snapshot

Snapshot of the Shuimo design direction, regenerated on 2026-10-30, extended on 2026-10-31 with the casual "Just row" path, and updated the same day for the skeptic review (signals instead of a caller, safety lines, one easy band, gauge legibility). It follows the requirements in `docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`. It is the visual reference for the plan in `docs/plans/2026-10-29-001-feat-nor4x4-expo-rebuild-plan.md`. When the plan says a screen "matches board 2.1", it means the screenshot below.

- Source of truth: the boards in `canvas-source/`. The live canvas (https://claude.ai/artifact/F5M3koEizjUmoML6iApBQ5) was republished from them on 2026-10-31 after the skeptic-review pass; its top three rows keep the first concept pass for reference.
- Design system: ShuimoDS at `../../ShuimoDS/Sumi-Design-System/` (tokens in `colors_and_type.css`, rules in `README.md` and `UI_GUIDE.md`).

## Sample data

Every board shows the same rower so screens agree with each other and with R10:

- Beginner, age 34, max 184 bpm (estimated from age). Push target per week (R10); Steady 110–129 (60–70%).
- Rows Mon · Wed · Sat, remembered easy-row length 30 min.
- Today is week 3, Wednesday: three 3′ pushes with 3′ rests at 156–166 bpm, 30 min. Monday's easy row is done; Saturday is the 45 min long row.
- The route runs Bergen → Fedje → Lerwick → Fair Isle → Tórshavn → Reykjavík. Week 3 sails Lerwick → Fair Isle.

The casual boards (1.3c, 2.11, 2.11f, 3.9, 3.10, 3.11) show a second rower on the "Just row" path:

- Age 34, max 184 bpm. Effort zones Easy 110–129, Intermediate 129–147, Hard 147–156 (R57). Boards 2.11f and 3.11 show the same rower with "Row by feel".
- Monday was a Hard row (30 min) and Tuesday an Easy row (20 min); the last choice was Intermediate, 30 min.
- The ship is between Lerwick and Fair Isle, on row 8 of the voyage.

## Boards

### 1 · Onboarding (390 × 844)

| Board | Screen | Screenshot | Covers |
|---|---|---|---|
| 1.0 | Voyage choice: Train with the 4x4 or Just row, equal weight | `screens/1.0-onboarding-voyage.png` | R1, R55, R62 |
| 1.1 | The method, framed as what the voyage builds to | `screens/1.1-onboarding-method.png` | R1, R2 |
| 1.2 | Name and level | `screens/1.2-onboarding-level.png` | R1, R3 |
| 1.3 | Max heart rate, with the medication option | `screens/1.3-onboarding-heart.png` | R1, R4 |
| 1.3c | Max heart rate, casual path, with Row by feel and the medication option | `screens/1.3c-onboarding-heart-casual.png` | R1, R4, R57 |
| 1.4 | Your week, with the hard-day spacing rule | `screens/1.4-onboarding-week.png` | R1, R7, R9 |

### 2 · Home, setup and session end (390 × 844)

| Board | Screen | Screenshot | Covers |
|---|---|---|---|
| 2.1 | Home route with the map strip and Short on time | `screens/2.1-home-route.png` | R12, R18, R19, R20, R48, F1 |
| 2.1e | Easy-row card: format swap and length | `screens/2.1e-home-easy-row-card.png` | R13–R16, F3, AE3 |
| 2.2 | Settings: path, signals mixer, export | `screens/2.2-settings.png` | R24, R42, R46, R47, R59, R63 |
| 2.3 | Session complete with the landfall vignette | `screens/2.3-session-complete.png` | R35, R44, R46, R53 |
| 2.4 | Rest day: the waiting session with Row it now | `screens/2.4-home-rest-day.png` | R21, R49, R62, F4, AE5, AE17 |
| 2.4b | Welcome back after 8 days: pick up or ease back in | `screens/2.4b-home-welcome-back.png` | R60, F4, AE15 |
| 2.5 | Health check before the first row (PAR-Q+), nothing pre-selected | `screens/2.5-health-check.png` | R5, AE16 |
| 2.6 | Home with pushes locked; the easy row still moves the ship | `screens/2.6-home-pushes-locked.png` | R5, AE8 |
| 2.7 | Strap prompt at the first Set out | `screens/2.7-strap-prompt.png` | R6 |
| 2.8 | Strap prompt, Bluetooth unavailable | `screens/2.8-strap-bluetooth-unavailable.png` | R6 |
| 2.9 | Partly rowed | `screens/2.9-partly-rowed.png` | R46, R53, R54, AE11 |
| 2.10 | Voyage complete with the benchmark comparison | `screens/2.10-voyage-complete.png` | R22, R45 |
| 2.11 | Casual home: effort and length pickers | `screens/2.11-home-casual.png` | R48, R55, R56, R57, F5 |
| 2.11f | Casual home, Row by feel (efforts as perceived effort) | `screens/2.11f-home-casual-row-by-feel.png` | R30, R57 |

### 3 · Rowing mode (landscape 844 × 390, portrait 390 × 844)

| Board | Screen | Screenshot | Covers |
|---|---|---|---|
| 3.1a–d | Get seated: drum count-in and the stop line (one frame per stroke phase) | `screens/3.1a-catch-get-seated.png` … `3.1d-recovery-get-seated.png` | R23, R24, R25, R52, R61 |
| 3.2 | Push | `screens/3.2-rowing-work.png` | R26, R27, R29, R31, R32, R50, R52 |
| 3.2b | Push above 95%: three bells, border glow, Ease off chip | `screens/3.2b-rowing-ease-off.png` | R36, R40, R50 |
| 3.3 | Horn cue, 10 s to the push | `screens/3.3-rowing-horn-cue.png` | R27, R39, R40, R51 |
| 3.4 | Easy row | `screens/3.4-rowing-easy.png` | R13, R27, R28, R50 |
| 3.5 | Pause sheet with the stop line and music notice | `screens/3.5-rowing-pause.png` | R32, R41, R42, R54, R61, AE4 |
| 3.6 | No strap: effort guidance | `screens/3.6-rowing-no-strap.png` | R30, AE7 |
| 3.7 | Strap lost mid-session | `screens/3.7-rowing-strap-lost.png` | R30 |
| 3.8 | Row freely | `screens/3.8-rowing-row-freely.png` | R20, R52 |
| 3.9 | Casual Hard row, rough water | `screens/3.9-rowing-casual-hard.png` | R57, R58 |
| 3.10 | Casual Intermediate row, open swell | `screens/3.10-rowing-casual-swell.png` | R57, R58 |
| 3.11 | Casual row by feel: effort gauge, no heart rate | `screens/3.11-rowing-casual-row-by-feel.png` | R30, R57 |
| 3.1p | Get seated, portrait | `screens/3.1p-get-seated-portrait.png` | R23, R33 |
| 3.2p | Push, portrait | `screens/3.2p-rowing-work-portrait.png` | R29, R31, R33 |
| 3.3p | Horn cue, portrait | `screens/3.3p-rowing-horn-cue-portrait.png` | R33, R51 |
| 3.5p | Pause sheet, portrait | `screens/3.5p-rowing-pause-portrait.png` | R32, R33, R41 |

Screenshots are rendered at 2×. A casual Easy row uses the 3.4 scene. `flow-start.html` charts both paths from opening the app to the first stroke.

## Not yet designed

- A portrait composition of the painting. The portrait boards crop the landscape painting to its centre.
- Easy-row scenery for each leg of the voyage (R28); 3.4 shows one leg.
- The final illustration and animation assets. Every painting here is a placeholder.
- The health-check result states: everything blocked until "A doctor has cleared me" (R5, AE16) and effort-only coaching after a medication yes.
- The path-switch confirmation sheet (R59), the 28-day return (R60, AE18) and the offer to lower max HR (R37, AE19).
- The "Pull", "Rest" and "Hold this effort" banners (R40); 3.3 shows the horn banner they follow.

## Visual rules in force

- Shuimo base: silk ground `#F9F8F4`, charcoal ink type, Noto Serif SC display and Inter body, square corners, malachite `#1E4D2B` primary actions.
- Push effort is persimmon (`#C66B22`, text `#9F5217`); steady effort and "in zone" are teal (`#4A8475`, text `#1F6357`). All three casual efforts are steady rows, so they use teal; the scene, not the color, tells them apart. Today's dot on the route is ink.
- Red appears only in the longship sail stripes and destructive actions such as ending a session or restarting the voyage. The Shuimo seal is replaced by the ship icon.
- One heavier-ink word per headline (for example "Today, three **pushes**.").
- Stroke rate on the gauge is the drum's target ("26–28 drum spm"); v1 measures no strokes. PM5 boards live in `deferred/`.
- Rowing gauge: time at least 75 pt and heart rate at least 50 pt (9 mm and 6 mm cap height, R29). The zone chip is 22 pt, a word plus a shape (R50); "Recovering" has no arrow. Session time left sits above the strip on the right.
- Progress strip: an 18 pt bar in a 28 pt frame (R31). Push segments are full height and steady segments shorter, so the strip doesn't rely on color; warm-up pickups are shown.
- Ease off (R36) is a charcoal border glow plus the chip, and three bells in sound. The glow is provisional until tested in the rowable slice.

## Files and tools

- `screens/`: PNG screenshots, the reference for reviews and verification.
- `deferred/`: boards for features moved after v1 (3.1e, PM5), with a README saying why.
- `flow-start.html`: flow chart from opening the app to the first row, for both paths (open in a browser; it loads mermaid from a CDN).
- `canvas-source/`: the `.dc.html` source of each board. They need the canvas runtime to render as-is; the snapshot tool strips it.
- `tools/boards.json`: the board list (number, file, size), the stale phrases to reject, and the gauge minimums.
- `tools/check_boards.py`: fails on stale sample data, undersized gauge numbers, or board files missing from `boards.json`.
- `tools/snapshot.py`: regenerates `screens/` from `canvas-source/` with headless Chrome.

```
python3 -I docs/design/tools/check_boards.py docs/design/canvas-source
python3 -I docs/design/tools/snapshot.py docs/design/canvas-source docs/design/screens <scratch-dir>
python3 -m unittest discover -s docs/design/tools
```
