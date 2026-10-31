---
date: 2026-10-29
topic: nor4x4-rebuild
---

# Nor4x4 Rebuild — Requirements

## Summary

Rebuild Nor4x4 in React Native (Expo) as a role-play rowing app: every row is a scene in an ink-painted viking voyage. Rowers choose a polarized 4x4 program that runs underneath the voyage, or just row at an effort they pick, and either way the ship sails the same route. It works hands-free on any rower, with or without a monitor or heart-rate strap, and it is free (see `STRATEGY.md`).

---

## Problem Frame

Rowing on a home machine is monotonous, especially on rowers with no monitor, so people stop. Guided workouts make it engaging, but they sit behind subscriptions or connected hardware.

The current SwiftUI app does not solve this. It is a stock-looking interval timer over nine hardcoded plans, with an over-aggressive progression (90–95% max HR by week 5, three 4x4s a week), no easy or recovery work, no max-HR model, and history that is never written or shown.

---

## Actors

- A1. Rower: an adult training at home, rowing about twice a week and aiming for three. The phone sits on the rower's holder about 1 m away, out of reach mid-stroke. The rower may have no monitor, heart-rate strap, or other sensor.
- A2. Heart-rate strap (optional): a chest strap or arm band broadcasting the standard Bluetooth heart-rate service.
- A3. Rowing machine monitor (after v1): a Concept2 PM5 supplying strokes, stroke rate, and pace. Deferred; v1 works without it.

---

## Key Decisions

- **Role play is the main thing.** Scene, sound, caller, and route carry the motivation; the training plan serves the voyage. When the two compete for effort, the voyage wins.
- **Hands-free and sensor-free by default.** Every screen in rowing mode must work at 1 m with no touch and no sensors. Sensors improve the experience but are never required.
- **Value before setup.** Onboarding asks only what the first session needs. Sensor pairing happens at the first "Set out", and the health screen appears just before the first hard session.
- **Shuimo, adapted with color.** Silk ground, ink type hierarchy, Noto Serif SC display and Inter body, square corners, malachite primary actions. Persimmon means push effort and teal means steady effort, and neither is used for anything else. The cinnabar seal is replaced by the ship icon. Red appears only in the sail stripes and destructive actions. This knowingly breaks Shuimo's "seal-only red" and restraint rules.
- **Ink-painted viking longship on a real route.** The voyage runs Bergen → Shetland → Faroe Islands → Iceland, with landmarks that are real places on that route.
- **Scene follows the plan, not live effort.** Every segment looks and sounds the same with or without sensors; sensors feed the gauge and post-session stats.
- **Animated painting, not video.** Scenes are animated in the app so oars and the stroke demo stay in time with the drum.
- **Polarized program around a 4x4 core, three sessions a week.** One hard session a week for beginners and two for intermediate and above; easy rows fill the rest.
- **Progress follows completed sessions, not the calendar.** A voyage is an ordered list of sessions placed onto the rower's days; a missed session waits for the rower and the plan pushes back, so the rower always starts where they left off. The ship moves only when the rower actually rows.
- **Two paths, one voyage.** The first screen offers "Train with the 4x4" or "Just row". Both sail the same route; the casual path has no schedule, target, or missed sessions, so a rower who wants an enjoyable row is never pushed into a program.
- **Self-selected level.** No assessment row; max HR comes from age or a known value and self-corrects.
- **The plan picks the easy-row format; the rower picks its length.**

---

## Requirements

**Onboarding**

- R1. Onboarding opens on the voyage ("Row from Bergen to Iceland") with two paths. "Train with the 4x4" continues in order: method explainer, level, max heart rate, weekly plan. "Just row" continues to max heart rate only, which can be skipped. Each path shows its own progress bar, without a step count.
- R2. The method step frames the 4x4 as what the voyage builds up to, explains its shape and that most rows are easy ones, says where the rower's level starts (Beginners start with 1-minute pushes and build up over eight weeks), and can be skipped.
- R3. Level is self-selected from Beginner, Intermediate, and Expert, each with a one-line self-check; level can be changed later in Settings.
- R4. The max-HR step accepts age (estimated max shown) or a known max, then shows Push and Steady zones in bpm with their color. On the casual path it shows the three effort zones (R57) instead and offers "Row by feel" to skip it.
- R5. Before the first hard session, or the first Hard casual row, a short health screen (PAR-Q style) and disclaimer appear. A "yes" locks hard sessions with the disclaimer shown on their cards, hides Hard on the casual effort picker, keeps easy rows and Easy and Intermediate casual rows available, and can be revisited in Settings.
- R6. At the first "Set out", the app asks whether the rower is wearing a heart-rate strap and offers pairing; pairing is also available in Settings and always skippable ("row by the plan").
- R7. The weekly step collects three rowing days and an easy-row length (20, 30, or 45 min), warns when chosen days would force hard sessions onto consecutive days, then previews the first week.

**Training program**

- R8. Each week is polarized: hard sessions are 4x4-family intervals and every other session is an easy row.
- R9. Hard sessions never fall on consecutive days: when the rower's last row was a hard session the day before, today's hard session swaps with the next easy row.
- R10. The Beginner voyage follows this draft progression (each hard session = 10 min warm-up with 2–3 short pickups + intervals + 5 min cool-down):

| Week | Hard session | Target HR | Length | Easy rows (length per R15) |
|---|---|---|---|---|
| 1 | 4×1′ / 2′ rest | 80–85% | 25 min | 2 |
| 2 | 4×2′ / 2′ | 80–85% | 29 min | 2 |
| 3 | 3×3′ / 3′ | 85–90% | 30 min | 2 |
| 4 | Lighter: 2×4′ / 3′ | 85–90% | 26 min | 2 |
| 5 | 3×4′ / 3′ | 85–90% | 33 min | 2 |
| 6 | 4×4′ / 3′ | 85–95% | 40 min | 2 |
| 7 | 4×4′, plus optional 1×4′ | 90–95% | 40 + 17 min | 2 |
| 8 | Retest: 4×4′ | 90–95% | 40 min | 1 |

- R11. Intermediate and Expert voyages schedule two hard sessions a week, include a lighter week every fourth week, and end with a retest.
- R12. "Short on time" swaps any hard session for a 1×4 session of about 17 minutes.
- R13. Easy rows rotate between formats: steady, rate ladder (18 → 20 → 22 spm), and technique row (pause and isolation drills). Every format stays in the steady zone.
- R14. From week 2, one easy row per week is a long row at about 1.5× the remembered easy-row length, labelled as such on its card.
- R15. Easy-row length defaults to the most recent choice; the card lets the rower change it for any session, and that choice becomes the new default.
- R16. The rower can swap an easy row's format on its card before starting.
- R17. Program numbers are drafts until reviewed by a rowing coach or exercise physiologist; the Beginner table is reviewed before program work is built.

**Home and voyage**

- R18. Home is the voyage route: upcoming sessions, today, and completed sessions in one list, separated by landmark stops, scrolled so today is in view.
- R19. Today's card shows the session name, total length, target in bpm, and its interval shape in push and steady colors.
- R20. "Row freely" starts an open-ended easy row from home at any time; it counts toward sessions this week but does not move the ship, and the screen says so.
- R21. A missed session waits: it becomes the session for the next rowing day and the rest of the plan pushes back. Nothing is skipped, sessions never stack on one day, and the ship does not move.
- R22. Finishing a voyage offers the next level or a repeat of the same voyage; after Expert, repeat is the only option.
- R48. Home shows sessions completed this week against the target of three. On the casual path it shows rows this week with no target.
- R49. Home shows a rest-day state when nothing is scheduled today, with Row freely available.
- R60. After 7 or more days without a row on the 4x4 path, home asks once how to resume: "Pick up where I left off" (default) continues with the waiting session, and "Ease back in" first repeats the previous week's sessions. Repeated sessions are real rows and move the ship when rowed. There is no option to skip ahead. The casual path never asks.

**Just row (casual path)**

- R55. Choosing "Just row" skips the method, level, and weekly steps. The casual path has no rowing days, weekly target, or missed sessions, and Row freely is not offered because every casual row already moves the ship.
- R56. The casual path sails the same route as the 4x4 path. Every completed casual row moves the ship one stop, whatever its effort or length; a Partly rowed casual row does not (R54).
- R57. Before each casual row, home shows an effort picker (Easy, Intermediate, Hard) and a length picker (20, 30, 45, or 60 min); both default to the last choice. Each effort is one steady row in its own zone: Easy 55–65%, Intermediate 65–75%, Hard 75–85% of max HR, shown in bpm when max HR is known and as perceived effort otherwise (R30).
- R58. The rowing scene follows the chosen effort: calm water for Easy, an open swell for Intermediate, and rough water with spray for Hard. Warm-up and cool-down use the calm scene.
- R59. The rower can switch paths in Settings. Switching keeps the ship where it is on the route.

**Session start**

- R23. After "Set out", a "Get seated" phase loops the animated stroke demo (catch, drive, finish, recovery) until the rower starts: after a hold time (default 20 s, set in Settings) or on "Start now". The caller counts the final five seconds aloud.
- R24. The stroke demo can be turned off in Settings; the Get seated phase remains.
- R25. Under reduced-motion settings, the demo shows a still catch position.

**Rowing mode**

- R26. The scene is a first-person view from the stern looking forward to the dragon prow, under the striped longship sail.
- R27. Each segment type has its own scene state: work (oars digging in), rest, horn cue (oars raised, horn at the prow), and easy (calm water, low sun). Pickups use the work state; warm-up and cool-down use the easy state.
- R28. Easy-row scenery changes with each leg of the voyage.
- R29. A corner gauge shows time remaining, heart rate, zone state, and the drum's target stroke rate (no stroke rate is measured in v1). Time and heart rate are readable at 1 m: at least 9 mm cap height for time and 6 mm for heart rate on the device.
- R50. Zone state is shown as a word plus a shape, never color alone: "Ease off ▲", "In zone", "Build ▼", for both push and steady effort.
- R30. Without a heart-rate strap, the gauge and caller give effort guidance (perceived effort and talk test) in place of bpm. When a strap drops mid-session, the gauge shows "Strap lost" and falls back to effort guidance until it reconnects.
- R31. A progress strip at least 12 pt tall shows every segment in push or steady color with a marker for now, legible over the painting.
- R51. Every audio cue has a visual twin: a full-screen pulse and a large banner for the horn, and on-screen text for caller lines.
- R52. All timers in rowing mode show time remaining, except Row freely, which has no end and shows time rowed.
- R32. Pausing never needs a precise tap. A long press anywhere pauses. The pause sheet offers Resume, Restart this push (during a push), sound mode, and End session, which needs a hold to confirm.
- R33. Landscape and portrait are both first-class layouts.
- R34. The screen stays awake for the whole session.

**Heart-rate coaching**

- R35. "In zone" during a push is judged on its final 3 minutes, or its final half when the push is shorter than 4 minutes, so the HR ramp is not penalized.
- R36. When HR exceeds 95% of max, the caller tells the rower to ease off, once per push.
- R37. When a session records an HR above the stored max, the app offers to update max HR and recalculate zones.

**Sound**

- R38. Rowing mode layers four sounds: an ambient sea bed that matches the segment, a drum beating at the target stroke rate, crew voices during work, and event cues.
- R39. Event cues are a war horn before each push, a distinct sound at the end of a push, and a landfall sound at the finish.
- R40. A recorded viking caller replaces text-to-speech for transitions ("Ready oars", "Pull", "Rest your arms") and the start countdown.
- R41. When the rower's own music is playing, ambient sea, crew, and drum mute automatically and a one-line notice says so; cues and caller still play and briefly duck the music. Sound returns to the previous mode when the music stops, and auto-switching never overrides a mode the rower chose.
- R42. Sound modes (Full ship, Cues only, Silent) live in the pause sheet; per-layer volume lives in a Settings mixer.
- R43. Audio keeps playing when the app is backgrounded.

**After the session**

- R44. Session complete moves the ship along the route and shows time in push zone, peak HR, session length, and pushes completed, with one coaching sentence. Without a strap, it shows length and pushes completed.
- R53. Session complete asks for a one-tap 1–5 enjoyment rating, which can be skipped.
- R54. A session ended early is saved as "Partly rowed": it shows its summary, stays on the route as unfinished, and does not move the ship.
- R45. Retest results compare Beginner retests against week 6 and Intermediate and Expert retests against the last hard session before the retest, by heart rate at the same drum rate (which assumes the rower follows the drum). Without any sensor, the retest compares completion and enjoyment.
- R46. Completed and partly rowed sessions are saved to Apple Health as rowing workouts with their actual duration.

**Settings**

- R47. Settings holds the path (R59), level, max HR, rowing days, heart-rate strap pairing, health screen answers, the Get seated hold time, the sound mixer with the music behaviour, the stroke-demo switch, Apple Health export, and voyage restart.

---

## Key Flows

- F1. First launch
  - **Trigger:** Rower opens the app for the first time.
  - **Actors:** A1
  - **Steps:** Voyage choice ("Train with the 4x4") → method → level → max HR → week plan → "Set out for Iceland" → home route with today's session.
  - **Covered by:** R1–R4, R7, R18
- F2. Hard session
  - **Trigger:** Rower taps "Set out" on today's hard session.
  - **Actors:** A1, optionally A2
  - **Steps:** Health screen if not yet answered → strap prompt if never asked → Get seated with stroke demo → warm-up with pickups → for each push: horn, caller, and visual cue 10 s before, work scene, rest scene → cool-down → session complete with rating → route.
  - **Covered by:** R5, R6, R23–R44, R50–R53
- F3. Easy row
  - **Trigger:** Rower starts a scheduled easy row or "Row freely".
  - **Actors:** A1
  - **Steps:** Card shows format and remembered length (editable) → Get seated → easy scene for the leg → session complete.
  - **Covered by:** R13–R16, R20, R23, R28
- F4. Returning after missed sessions
  - **Trigger:** Rower opens the app after one or more scheduled days passed without a session.
  - **Actors:** A1
  - **Steps:** The first missed session waits as the next session, noted "Waiting from Wed" → after 7 or more days away, a one-time choice: pick up where I left off, or ease back in → the voyage continues from the first unfinished session; the ship has not moved.
  - **Covered by:** R21, R18, R48, R60
- F5. First launch, just row
  - **Trigger:** Rower opens the app for the first time and picks "Just row".
  - **Actors:** A1, optionally A2
  - **Steps:** Voyage choice → max HR or "Row by feel" → casual home with effort and length pickers → "Set out" → health screen if Hard and not yet answered → strap prompt if never asked → Get seated → steady row in the effort's scene → session complete with rating → ship moves one stop.
  - **Covered by:** R1, R4, R5, R6, R23, R55–R58

---

## Acceptance Examples

- AE1. **Covers R35.** Given a 4-minute push with HR reaching the push zone at 1:40, "time in push zone" counts only the final 3 minutes and does not flag the ramp as a miss.
- AE2. **Covers R15.** Given a remembered length of 30 min, when the rower changes today's easy row to 20 min, the next easy-row card shows 20 min.
- AE3. **Covers R14, R15.** Given a remembered length of 30 min in week 2 or later, the weekly long row shows "Long row · 45 min" and can be shortened on the card.
- AE4. **Covers R41.** Given music playing at session start, sea, crew, and drum are silent with a notice; the horn and caller still play and duck the music.
- AE5. **Covers R21.** Given a missed Wednesday easy row, Saturday shows that easy row ("Waiting from Wed"), Saturday's own session moves to the next rowing day, nothing is doubled up, and the ship has not moved.
- AE6. **Covers R9, R21.** Given a rower who rowed a hard session Monday and whose next waiting session on Tuesday is also hard, Tuesday shows the next easy row instead and the hard session follows it.
- AE7. **Covers R30.** Given no heart-rate strap, the gauge shows an effort cue such as "7–8 of 10 · single words only" in place of bpm during a push.
- AE8. **Covers R5.** Given a rower who answers "yes" on the health screen, hard-session cards show the disclaimer and cannot start, easy rows start normally, and changing the answer in Settings unlocks hard sessions.
- AE9. **Covers R23.** Given the default hold time, the session starts 20 s after Get seated begins with the caller counting the last five seconds; "Start now" starts it at once.
- AE10. **Covers R32.** Given a long press anywhere mid-push, the session pauses and the pause sheet opens; a short tap does nothing.
- AE11. **Covers R54.** Given a session ended from the pause sheet halfway through, it is saved as Partly rowed, the ship does not move, and the session stays next on the route.
- AE12. **Covers R56, R57.** Given a casual rower who finishes a 20-minute Easy row, the ship moves one stop, the same as after a 60-minute Hard row, and the next row's pickers default to Easy and 20 min.
- AE13. **Covers R5, R57.** Given a casual rower who answers "yes" on the health screen before a first Hard row, the picker hides Hard and Easy and Intermediate rows start normally.
- AE14. **Covers R59.** Given a casual rower three stops along who switches to the 4x4 path in Settings, the ship stays three stops along.
- AE15. **Covers R60, R21.** Given a 4x4 rower back after 8 days away with the ship at Lerwick, home asks how to resume. Either choice leaves the ship at Lerwick until the next row is completed; "Ease back in" puts last week's three sessions before the waiting one.

---

## Scope Boundaries

**Deferred for later**

- Assessment or test rows to measure max HR.
- Rotating 4×8 and 30/15 hard sessions.
- An Apple Watch app, including live HR from the watch and haptic cues.
- A scene that reacts to live effort, and rival or chase mechanics.
- Android.
- Concept2 PM5 support (A3): first-stroke start, auto-pause after 8 s without strokes, measured stroke rate and pace, and retests by pace at the same heart rate.

**Outside this product's identity**

- Paid features or subscriptions.
- Live instructors, filmed footage, or photoreal video scenes.
- Social features, accounts, and leaderboards.
- On-water rowing.

---

## Dependencies / Assumptions

- Max HR from age is an estimate of about ±10 bpm; R37 is the mitigation.
- The draft program in R10–R14 needs expert review (R17).
- The ShuimoDS design system (at `../../ShuimoDS/Sumi-Design-System/`) is the visual source of truth, with the deviations in Key Decisions.
- The design boards in `docs/design/` were regenerated on 2026-10-30 from one consistent example that follows R10; `docs/design/README.md` maps each board to the requirements it covers.
- The current workout catalog in `../Nor4x4/Nor4x4/Catalog.swift` is replaced, not migrated.

---

## Outstanding Questions

**Deferred to Planning**

- The exact pause-drill set and rate-ladder timing for technique and ladder easy rows.
- What the end-of-push cue sounds like (bell, cheer, or drum roll).
- Number of easy-row scenery legs needed to avoid repeats across one voyage.
- Which orientation the builder's own rower holder uses, to decide which layout is designed first.
- How the 4x4 program picks up when a rower switches to it with the ship already partway along the route (R59).

---

## Sources / Research

- Product strategy: `STRATEGY.md`.
- Design snapshot (screenshots, board index, sources): `docs/design/README.md`. Live canvas: https://claude.ai/artifact/F5M3koEizjUmoML6iApBQ5
- Current app behaviour: `../Nor4x4/Nor4x4/Catalog.swift` (plans), `../Nor4x4/Nor4x4/WorkoutManager.swift` (timer and 15 s spoken cue), `../Nor4x4/Nor4x4/TimerView.swift` (3-second countdown, hype text).
- Helgerud et al. 2007 — 4x4 at 90–95% HRmax improved VO₂max in trained young men.
- Tjønna et al. 2013 — a single 4-minute interval three times a week raised VO₂max about 10% in inactive men.
- Seiler and Sylta 2013 — 4×8 min outperformed 4×4 in trained cyclists.
- Rønnestad et al. — 30/15 s short intervals outperformed 4×5 min in trained cyclists.
- Seiler — polarized (about 80/20) intensity distribution.
