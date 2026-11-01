---
date: 2026-10-29
updated: 2026-10-31
topic: nor4x4-rebuild
---

# Nor4x4 Rebuild — Requirements

## Summary

Rebuild Nor4x4 in React Native (Expo) as a role-play rowing app: every row is a scene in an ink-painted viking voyage. Rowers choose either of two paths, and either way the ship sails the same route:
- **Train with the 4x4:** a polarized program that runs underneath the voyage.
- **Just row:** a steady row at an effort they pick.

It works hands-free on any rower, with or without a monitor or heart-rate strap, and it is free (see `STRATEGY.md`). v1 is for the builder and a handful of testers; an App Store release comes later.

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

- **Role play is the main thing.** Scene, sound, and route carry the motivation, and the training plan serves the voyage. When the two compete for effort, the voyage wins.
- **Hands-free and sensor-free by default.** Every screen in rowing mode must work at 1 m with no touch and no sensors. Sensors improve the experience but are never required.
- **No spoken voice.** Horn calls, drum signals and crew chants carry every cue, and the screen carries the details. Every cue has both a sound and a visual twin.
- **Value before setup.** Onboarding asks only what the first session needs. Health questions and sensor pairing come at the first "Set out".
- **Safety before targets.**
  - When max HR is estimated, or heart-rate medication makes bpm unreliable, perceived effort leads and heart rate is only information.
  - Warning symptoms always mean stop.
- **Shuimo, adapted with color.**
  - Silk ground, ink type hierarchy, Noto Serif SC display and Inter body, square corners, malachite primary actions.
  - Persimmon means push effort and teal means steady effort; neither is used for anything else.
  - The cinnabar seal is replaced by the ship icon. Red appears only in the sail stripes and destructive actions.
  - This knowingly breaks Shuimo's "seal-only red" and restraint rules.
- **Ink-painted viking longship on a real route.** The voyage runs Bergen → Shetland → Faroe Islands → Iceland, with landmarks that are real places on that route.
- **Scene follows the plan, not live effort.** Every segment looks and sounds the same with or without sensors; sensors feed the gauge and post-session stats.
- **Animated painting, not video.** Scenes are animated in the app so oars and the stroke demo stay in time with the drum.
- **Polarized program around a 4x4 core, three sessions a week.** v1 ships the Beginner voyage: one hard session a week, with easy rows filling the rest. Intermediate and Expert voyages come after v1.
- **Progress follows completed sessions, not the calendar.**
  - A voyage is an ordered list of sessions placed onto the rower's days.
  - A missed session waits for the rower and the plan pushes back, so the rower always starts where they left off.
  - The ship moves only when the rower actually rows.
- **Two paths, one voyage.**
  - The first screen offers "Train with the 4x4" or "Just row", and both sail the same route.
  - The casual path is steady efforts with no schedule, target or missed sessions, so a rower who wants an enjoyable row is never pushed into a program. It is not a polarized program.
- **Self-selected level.** No assessment row. Max HR comes from age or a known value and self-corrects in both directions.
- **The plan picks the easy-row format; the rower picks its length.**
- **Data stays on the iPhone.** There are no accounts and no server. The rower can export their rows, and iCloud sync comes after v1.

---

## Requirements

**Onboarding**

- R1. Onboarding opens on the voyage ("Row from Bergen to Iceland") with two paths, presented with equal weight. Each path shows its own progress bar, without a step count.
  - "Train with the 4x4" continues in order: method explainer, name and level, max heart rate, weekly plan.
  - "Just row" continues to max heart rate only, which can be skipped.
- R2. The method step frames the 4x4 as what the voyage builds up to. It explains the 4x4's shape and that most rows are easy ones, says that Beginners start with 1-minute pushes and build up over eight weeks, and can be skipped.
- R3. The name-and-level step collects the rower's name (used in greetings) and their level. In v1 only Beginner is selectable; Intermediate and Expert are shown as coming later. Level can be changed in Settings once more levels exist.
- R4. The max-HR step accepts age (with the estimated max shown) or a known max, plus a "My heart rate is affected by medication" option.
  - It then shows the Steady and Push zones in bpm with their color.
  - On the casual path it shows the three effort zones (R57) instead, and offers "Row by feel" to skip it.
- R5. Before the rower's first row on either path, a health check and disclaimer appear. They follow the PAR-Q+ questions, with the official qualifiers and with notes for anyone over 45 who isn't used to vigorous exercise and anyone who is pregnant or temporarily ill.
  - **Answering:** no answer is pre-selected, and Continue stays disabled until all seven are answered.
  - **"Yes" to a heart condition, chest pain, or fainting or dizziness:** blocks every row until the rower confirms "A doctor has cleared me" in Settings.
  - **Any other "yes":** locks hard sessions and hides Hard on the casual effort picker. Easy rows and Easy and Intermediate casual rows stay open. On the 4x4 path, a locked hard session is replaced by an easy row that moves the ship, so the voyage continues.
  - **"Yes" to the medication question, or the R4 medication option:** switches every row to effort-only coaching (R30) and suggests asking a doctor about heart-rate targets.
  - **Changing answers:** they can be revisited in Settings; answering "no" or confirming clearance lifts the matching lock.
- R6. At the first "Set out", the app asks whether the rower is wearing a heart-rate strap and offers pairing. Pairing is also in Settings and can always be skipped ("Row by the plan").
- R7. The weekly step collects three rowing days and an easy-row length (20, 30, or 45 min), then previews the first week. Hard sessions are spaced by R9, so no choice of days needs a warning.

**Training program**

- R8. Each week is polarized: hard sessions are 4x4-family intervals and every other session is an easy row.
- R9. Hard sessions never fall on consecutive days. When the rower's last row was a hard session the day before and today's waiting session is also hard:
  - today's hard session swaps with the next easy row;
  - if no easy row remains in the plan, today suggests rest or Row freely instead.
- R10. The Beginner voyage follows this draft progression. Each hard session is a 10 min warm-up with 2–3 short pickups, then the intervals, then a 5 min cool-down.

| Week | Hard session | Push target | Length | Easy rows (length per R15) |
|---|---|---|---|---|
| 1 | 4×1′ / 2′ rest | 80–85% | 25 min | 2 (one is the benchmark row, R45) |
| 2 | 4×2′ / 2′ | 80–85% | 29 min | 2 |
| 3 | 3×3′ / 3′ | 85–90% | 30 min | 2 |
| 4 | Lighter: 2×4′ / 3′ | 85–90% | 26 min | 2 |
| 5 | 3×4′ / 3′ | 85–90% | 33 min | 2 |
| 6 | 4×4′ / 3′ | 85–95% | 40 min | 2 |
| 7 | 4×4′, plus an optional fifth push | 90–95% | 40 min, or 47 with the fifth push | 2 |
| 8 | Final 4×4′ | 90–95% | 40 min | 1 (the benchmark row, R45) |

- R11. Intermediate and Expert voyages are deferred until after v1 (see Scope Boundaries).
- R12. "Short on time" swaps any hard session for a 1×4 session of 19 minutes (10 min warm-up, one 4-minute push, 5 min cool-down). The swap counts as completing that hard session.
- R13. Easy rows rotate between three formats, and every format stays in the steady zone:
  - steady;
  - rate ladder (18 → 20 → 22 spm);
  - technique row (pause and isolation drills).
- R14. From week 2, one easy row per week is a long row at 1.5× the remembered easy-row length, rounded to the nearest 5 minutes and labelled as a long row on its card.
- R15. Easy-row length defaults to the most recent choice; the card lets the rower change it for any session, and that choice becomes the new default.
- R16. The rower can swap an easy row's format on its card before starting.
- R17. Program numbers, zone bands, the benchmark protocol and the health-check wording are drafts until reviewed by a rowing coach or exercise physiologist, before program work is built.

**Home and voyage**

- R18. Home is the voyage route: upcoming sessions, today, and completed sessions in one list, with landmarks between them, scrolled so today is in view. A map strip at the top shows the ship between landmarks.
- R19. Today's card shows the session name, total length, target in bpm or effort, and its interval shape in push and steady colors.
- R20. "Row freely" starts an open-ended easy row from home at any time. It counts toward this week's tally but does not move the ship, and the screen says so. It does not count as a row for R9 spacing or the R60 gap.
- R21. A missed session waits. It becomes the session for the next day the rower rows, and the rest of the plan pushes back. Nothing is skipped, at most one plan session is rowed per day, and the ship does not move.
- R22. Finishing the Beginner voyage offers a repeat of the voyage or switching to Just row.
- R48. Home shows sessions completed this calendar week (Monday to Sunday) against the target of three. On the casual path it shows rows this week with no target.
- R49. When today is not a rowing day, home shows a rest-day state. It offers "Row it now" for the waiting session (which moves the ship when rowed) and Row freely. A rower who onboards on a non-rowing day can start the voyage at once.
- R60. After 7 or more days without a completed row on the 4x4 path, home asks once how to resume. The ship never moves until the next row is completed, there is no option to skip ahead, and the casual path never asks.
  - **7–13 days:** "Pick up where I left off" (the default) continues with the waiting session. "Ease back in" first repeats the previous week's sessions; repeated sessions are real rows and move the ship when rowed.
  - **14–27 days:** the same choice, with "Ease back in" as the default.
  - **28 days or more:** the plan goes back two weeks and the health check (R5) is asked again.
- R62. Definitions used across the app:
  - **Day:** the device's local calendar day. A session belongs to the day it started.
  - **Missed:** a rowing day ended with no completed plan session.
  - **Stop:** one completed row. Landmarks are named places every few stops.
  - **Voyage length:** the Beginner voyage is 23 stops. The casual voyage uses the same 23 stops, reaches landfall in Reykjavík, and offers a new voyage.
  - **Weeks:** plan weeks drive the program; calendar weeks drive the tally (R48).
  - **Partly rowed:** counts toward the tally only.

**Just row (casual path)**

- R55. Choosing "Just row" skips the method, level and weekly steps. The casual path has no rowing days, weekly target or missed sessions. Row freely is not offered, because every casual row already moves the ship.
- R56. The casual path sails the same route as the 4x4 path. Every completed casual row moves the ship one stop, whatever its effort or length; a Partly rowed casual row does not (R54).
- R57. Before each casual row, home shows an effort picker (Easy, Intermediate, Hard) and a length picker (20, 30, 45, or 60 min). Both default to the last choice.
  - Each effort is one steady row in its own zone: Easy 60–70% (the same band as Steady), Intermediate 70–80%, Hard 80–85% of max HR.
  - Zones show in bpm when max HR is known and medication isn't affecting it; otherwise they show as perceived effort (R30).
- R58. The rowing scene follows the chosen effort: calm water for Easy, an open swell for Intermediate, and rough water with spray for Hard. Each must be visibly different at 1 m. Warm-up and cool-down use the calm scene.
- R59. The rower can switch paths in Settings, with a confirmation, and the ship keeps its place on the route either way.
  - **Switching to the 4x4 path** asks for level and days, then starts the plan at week 1. The route stretches so landfall comes at the end of the plan.
  - **Switching to Just row** has no further effect.

**Session start**

- R23. After "Set out", a "Get seated" phase loops the animated stroke demo (catch, drive, finish, recovery) until the rower starts: after a hold time (default 20 s, set in Settings) or on "Start now". Five drum beats count the final five seconds, with big 5-4-3-2-1 numbers on screen.
- R24. The stroke demo can be turned off in Settings; the Get seated phase remains.
- R25. Under reduced-motion settings, the demo shows a still catch position.
- R61. Before every hard session and every Hard casual row, Get seated shows one line: "Stop and rest if you feel chest pain or pressure, dizziness, unusual breathlessness, or palpitations." The pause sheet shows the same line, and every cool-down says "Keep paddling, don't stand straight up."

**Rowing mode**

- R26. The scene is a first-person view from the stern looking forward to the dragon prow, under the striped longship sail.
- R27. Each segment type has its own scene state:
  - work (oars digging in);
  - rest;
  - horn cue (oars raised, horn at the prow);
  - easy (calm water, low sun).

  Pickups use the work state; warm-up and cool-down use the easy state.
- R28. Easy-row scenery changes with each leg of the voyage.
- R29. A corner gauge shows time remaining in the segment and in the session, heart rate, zone state, and the drum's target stroke rate (no stroke rate is measured in v1).
  - Time and heart rate are readable at 1 m: at least 9 mm cap height for time and 6 mm for heart rate on the device.
  - The zone chip is at least 22 pt.
- R50. Zone state is shown as a word plus a shape, never color alone: "Ease off ▲", "In zone", "Build ▼", and "Recovering" during rests (no arrow).
  - "Build ▼" never appears in the first 90 s of a push, in pushes shorter than 3 minutes, or when max HR is estimated from age.
- R30. Without a heart-rate strap, with heart-rate medication (R5), or when a strap drops ("Strap lost"), the gauge shows effort guidance instead of bpm. The guidance is perceived effort on a 1–10 scale plus a talk test. 90 s into each push, a crew "Hold!" call and a "Hold this effort" banner tell the rower to settle.
- R31. A progress strip at least 12 pt tall shows every segment, including warm-up pickups, with a marker for now, legible over the painting. Push segments are taller than steady ones, so the strip doesn't rely on color alone.
- R51. Every audio cue has a visual twin (R40).
- R52. All timers in rowing mode show time remaining, except Row freely, which has no end and shows time rowed.
- R32. Pausing never needs a precise tap: a long press anywhere pauses. The pause sheet offers Resume, Restart this push (during a push), sound mode, and End session, which needs a hold to confirm.
- R33. Landscape and portrait are both first-class layouts.
- R34. The screen stays awake for the whole session.

**Heart-rate coaching**

- R35. Time in zone during a push is judged so the HR ramp is not penalized:
  - pushes of 4 minutes or longer are judged on their final 3 minutes;
  - pushes of 3 to 4 minutes are judged on their final half;
  - pushes shorter than 3 minutes are coached by effort and are not scored.
- R36. When HR stays above 95% of max for 15 s, three bell strikes sound once per push, a charcoal border glow breathes around the screen, and the zone chip shows "Ease off ▲". The glow fades when HR drops back below 95%.
- R37. Max HR self-corrects in both directions, ignoring HR spikes that last under 5 s:
  - when a session records a sustained HR above the stored max, the app offers to raise it;
  - when three hard sessions in a row miss the push zone, the app offers to lower it.

  Either way, the zones are recalculated.

**Sound**

- R38. Rowing mode layers sound in two groups:
  - **Ambience:** a sea bed that matches the scene, a drum loop at the target stroke rate, and crew murmur during work.
  - **Signals:** the cues in R40.
- R39. Signals include a war horn before each push, a low horn note at the end of a push, and a landfall sound at the finish.
- R40. Signals replace any spoken voice. Each has an on-screen twin:

| Moment | Sound | On screen |
|---|---|---|
| Get seated, last 5 s | Five drum beats | Big 5-4-3-2-1 |
| Push in 10 s | War horn | Edge pulse + "Ready oars" |
| Push starts | Crew "Heave!" + drum lifts to push tempo | "Pull" |
| 90 s into a push (effort guidance, R30) | Crew "Hold!" | "Hold this effort" |
| Push ends | One low horn note + drum slows | "Rest" |
| Above 95% max for 15 s | Three bell strikes | Charcoal border glow + "Ease off ▲" |
| Session ends | Landfall sound | Session complete |

- R41. When the rower's own music is playing, ambience mutes automatically and a one-line notice says so.
  - Signals never mute: they still play and briefly duck the music.
  - Sound returns to the previous mode when the music stops, and auto-switching never overrides a mode the rower chose.
- R42. Sound modes live in the pause sheet:
  - **Full ship:** ambience and signals.
  - **Cues only:** signals only.
  - **Silent:** nothing plays.

  A per-layer mixer (Sea, Drum, Crew, Signals) lives in Settings.
- R43. Audio keeps playing when the app is backgrounded, except in Silent mode, where the app may suspend and the session's timing recovers on return.

**After the session**

- R44. Session complete is a landfall moment, showing the ship arriving with the landmark's vignette when one is reached. It also shows:
  - with a strap: time in push zone, peak HR, session length and pushes completed;
  - without a strap: length and pushes completed.

  It ends with one coaching sentence.
- R53. Session complete asks for a one-tap 1–5 enjoyment rating, which can be skipped.
- R54. A session ended early is saved as "Partly rowed": it shows its summary, stays on the route as unfinished, and does not move the ship.
- R45. In weeks 1 and 8, one easy row is a 12-minute benchmark row at a fixed drum rate (20 spm).
  - Afterwards the rower may type in the distance shown on their monitor.
  - The retest compares week 8 with week 1: the distance, plus average HR when a strap was worn.
  - With neither a distance nor a strap, it compares completion and enjoyment.
- R46. Completed and partly rowed sessions are saved to Apple Health as rowing workouts with their actual duration.

**Settings and data**

- R47. Settings holds:
  - the path (R59), name, level, max HR and the medication option;
  - rowing days;
  - heart-rate strap pairing;
  - health check answers and "A doctor has cleared me";
  - the Get seated hold time, the sound mixer with the music behaviour, and the stroke-demo switch;
  - Apple Health export, "Export my rows" (R63), and voyage restart.
- R63. "Export my rows" writes a CSV of every session to the iOS share sheet, so testers can send their data back. Each row has the date, path, session, length, completion, enjoyment, entered distance, and average and peak HR.
- R64. All data is stored on the iPhone, with no accounts or server.
  - It is included in standard iPhone backups (iCloud Backup or Finder).
  - Deleting the app deletes the voyage; Apple Health workouts remain.
  - iCloud sync is the first item after v1.

---

## Key Flows

- F1. First launch
  - **Trigger:** Rower opens the app for the first time.
  - **Actors:** A1
  - **Steps:** Voyage choice ("Train with the 4x4") → method → name and level → max HR → week plan → "Set out for Iceland" → home route with today's session, or "Row it now" on a rest day.
  - **Covered by:** R1–R4, R7, R18, R49
- F2. Hard session
  - **Trigger:** Rower taps "Set out" on today's hard session.
  - **Actors:** A1, optionally A2
  - **Steps:**
    1. Health check if not yet answered, then the strap prompt if never asked.
    2. Get seated with the stroke demo and the stop line.
    3. Warm-up with pickups.
    4. For each push: the horn and edge pulse 10 s before, "Heave!" at the start, the work scene, the end-of-push horn, and the rest scene.
    5. Cool-down.
    6. Session complete with the rating, then back to the route.
  - **Covered by:** R5, R6, R23–R44, R50–R53, R61
- F3. Easy row
  - **Trigger:** Rower starts a scheduled easy row or "Row freely".
  - **Actors:** A1
  - **Steps:** Card shows format and remembered length (editable) → Get seated → easy scene for the leg → session complete.
  - **Covered by:** R13–R16, R20, R23, R28
- F4. Returning after missed sessions
  - **Trigger:** Rower opens the app after one or more scheduled days passed without a session.
  - **Actors:** A1
  - **Steps:**
    1. The first missed session waits as the next session, noted "Waiting from Wed".
    2. After 7 or more days away, a one-time choice by tier: pick up where I left off, or ease back in. After 28 days or more, the plan goes back two weeks and the health check runs again.
    3. The voyage continues from the first unfinished session; the ship has not moved.
  - **Covered by:** R21, R18, R48, R60
- F5. First launch, just row
  - **Trigger:** Rower opens the app for the first time and picks "Just row".
  - **Actors:** A1, optionally A2
  - **Steps:** Voyage choice → max HR or "Row by feel" → casual home with effort and length pickers → "Set out" → health check (first row only) → strap prompt if never asked → Get seated → steady row in the effort's scene → session complete with rating → ship moves one stop.
  - **Covered by:** R1, R4, R5, R6, R23, R55–R58

---

## Acceptance Examples

- AE1. **Covers R35.** Given a 4-minute push with HR reaching the push zone at 0:50, time in push zone is judged on the final 3 minutes (from 1:00), all of which is in zone, and the ramp before 1:00 is not flagged as a miss.
- AE2. **Covers R15.** Given a remembered length of 30 min, when the rower changes today's easy row to 20 min, the next easy-row card shows 20 min.
- AE3. **Covers R14, R15.** Given a remembered length of 30 min in week 2 or later, the weekly long row shows "Long row · 45 min" and can be shortened on the card.
- AE4. **Covers R41.** Given music playing at session start:
  - the sea, drum loop and crew murmur are silent, with a notice;
  - the horn, drum count, "Heave!" and bells still play and duck the music.
- AE5. **Covers R21.** Given a missed Wednesday easy row, Saturday shows that easy row ("Waiting from Wed"), Saturday's own session moves to the next rowing day, nothing is doubled up, and the ship has not moved.
- AE6. **Covers R9, R21.** Given a rower who rowed a hard session Monday and whose next waiting session on Tuesday is also hard, Tuesday shows the next easy row instead and the hard session follows it.
- AE7. **Covers R30.** Given no heart-rate strap, during a push the gauge shows an effort cue such as "7–8 of 10 · single words only" in place of bpm, and at 90 s the crew calls "Hold!".
- AE8. **Covers R5.** Given a rower who answers "yes" only to the joint-problem question, hard-session cards show the disclaimer and cannot start, and easy rows start normally. Changing the answer in Settings unlocks hard sessions.
- AE9. **Covers R23.** Given the default hold time, the session starts 20 s after Get seated begins, with five drum beats and big numbers counting the last five seconds; "Start now" starts it at once.
- AE10. **Covers R32.** Given a long press anywhere mid-push, the session pauses and the pause sheet opens; a short tap does nothing.
- AE11. **Covers R54.** Given a session ended from the pause sheet halfway through, it is saved as Partly rowed, the ship does not move, and the session stays next on the route.
- AE12. **Covers R56, R57.** Given a casual rower who finishes a 20-minute Easy row, the ship moves one stop, the same as after a 60-minute Hard row, and the next row's pickers default to Easy and 20 min.
- AE13. **Covers R5, R57.** Given a casual rower who answers "yes" to the medicine-for-a-long-term-condition question, the picker hides Hard, Easy and Intermediate start normally, and every row coaches by effort.
- AE14. **Covers R59.** Given a casual rower three stops along who switches to the 4x4 path in Settings, the ship stays three stops along and the plan starts at week 1.
- AE15. **Covers R60, R21.** Given a 4x4 rower back after 8 days away with the ship at Lerwick, home asks how to resume. Either choice leaves the ship at Lerwick until the next row is completed. "Ease back in" puts the previous week's sessions before the waiting one.
- AE16. **Covers R5.** Given a rower who answers "yes" to chest pain, no row can start on either path until they confirm "A doctor has cleared me" in Settings.
- AE17. **Covers R49, R62.** Given a rower with days Mon/Wed/Sat who finishes onboarding on a Tuesday, the rest-day state offers "Row it now". Rowing it moves the ship, and Wednesday shows the next session.
- AE18. **Covers R60.** Given a 4x4 rower in week 5 back after 30 days away, the plan resumes at week 3 and the health check is asked again before the first row.
- AE19. **Covers R37.** Given a rower with an age-estimated max of 184 whose last three hard sessions all missed the push zone, session complete offers to lower max HR.

---

## Scope Boundaries

**Deferred for later**

- iCloud sync of the voyage (the first item after v1).
- Intermediate and Expert voyages (two hard sessions a week, a lighter fourth week, and a retest).
- App Store release, including legal review of the health check and the store listing.
- A spoken caller voice.
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

- **Max HR from age is an estimate of about ±10 bpm.** The mitigations are effort-led coaching (R50, R30) and R37 self-correction in both directions.
- **The draft program needs expert review (R17).** That covers the R10 table, the zone bands, the R45 benchmark and the R5 wording.
- **The ShuimoDS design system** (at `../../ShuimoDS/Sumi-Design-System/`) is the visual source of truth, with the deviations in Key Decisions.
- **The design boards** in `docs/design/` follow these requirements as of 2026-10-31 (the scope decisions). The skeptic-review changes on 2026-10-31 are applied to the boards in the next design pass. `docs/design/README.md` maps each board to the requirements it covers.
- **The legacy workout catalog** in `../Nor4x4/Nor4x4/Catalog.swift` is replaced, not migrated.

---

## Outstanding Questions

**Deferred to Planning**

- The exact pause-drill set and rate-ladder timing for technique and ladder easy rows.
- Number of easy-row scenery legs needed to avoid repeats across one voyage.
- Which orientation the builder's own rower holder uses, to decide which layout is designed first.
- Whether the charcoal ease-off glow reads clearly over the painting; teal is the fallback (tested in the rowable slice).

---

## Sources / Research

- Product strategy: `STRATEGY.md`.
- Design snapshot (screenshots, board index, sources): `docs/design/README.md`. Live canvas: https://claude.ai/artifact/F5M3koEizjUmoML6iApBQ5
- Current app behaviour: `../Nor4x4/Nor4x4/Catalog.swift` (plans), `../Nor4x4/Nor4x4/WorkoutManager.swift` (timer and 15 s spoken cue), `../Nor4x4/Nor4x4/TimerView.swift` (3-second countdown, hype text).
- Helgerud et al. 2007: 4×4 at 90–95% HRmax, three times a week, improved VO₂max in moderately trained young men.
- Tjønna et al. 2013: in inactive, overweight men aged 35–45, a single 4-minute interval three times a week raised VO₂max about 10%, and 4×4 about 13%.
- Seiler, Jøranson, Olesen and Hetlelid 2013: 4×8 min outperformed 4×4 in trained cyclists.
- Rønnestad et al. 2015: 30/15 s short intervals outperformed 4×5 min in well-trained cyclists.
- Seiler: polarized (about 80/20) intensity distribution.
- **None of these studies tested one hard session a week in untrained adults**, which is the Beginner dose. The app must not imply study-sized gains.
- PAR-Q+ (the current version) for the R5 health check.
