---
title: Storm Survival Mode - Plan
type: feat
date: 2026-11-10
topic: storm-survival-mode
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Storm Survival Mode - Plan

## Goal Capsule

- **Objective:** a "Storm" row on the Just row path. It mixes Intermediate and Hard rowing in unpredictable surges inside a hidden storm arc, and has a look and sound unlike any standard row.
- **Product authority:** this Product Contract, under `docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md` and `STRATEGY.md`. Where this plan doesn't restate a requirement, the existing one holds (for example R36, R39, R40, R56 and R61).
- **Open blockers:**
  - This is future work, after v1. It doesn't start before the M1 verdict and the v1 milestones.
  - The hard-time cap and the surge and lull bounds need the coach review (see Outstanding Questions).

---

## Product Contract

### Summary

Just row gains "Storm": a casual row the rower picks and rows, in 30 or 45 minute lengths. It mixes Intermediate and Hard rowing by design.
A storm row opens with a calm 10-minute warm-up. A storm then builds, peaks and breaks across the row, throwing surges whose length and spacing the rower can't predict. It ends in a calm cool-down.
The storm has its own scene and its own sound, with wind and thunder. Rowing to the end is surviving it.

### Problem Frame

Just row is the casual path. Its Easy, Intermediate and Hard rows each hold one steady effort from warm-up to cool-down, in a scene whose mood never changes within the row.
A casual rower who wants something more demanding and exciting has nowhere to go: no mix of efforts, no surprise, and no row that rises and breaks.
The 4x4 program does vary its effort, but on a fixed schedule the rower soon learns, and it belongs to the training path. 4x4 rowers reach Just row only by switching paths (R59).

### Key Decisions

- **Storm is a casual pick-up mode, apart from every planned mode.** It never joins the 4x4 program or any schedule. Its mix of Intermediate and Hard is on purpose, for a more exciting and immersive row. Governs R1, R3. (session-settled: user-directed — chosen over swapping a 4x4 hard day, storm days on the route, and an unlock)
- **Storm is its own choice, with the mix of efforts built in.** The rower doesn't pick an effort for it. Lulls are rowed at Intermediate and surges at Hard. Governs R1, R11. (session-settled: user-directed — chosen over a Storm toggle on Intermediate or Hard, and over separate Storm Moderate and Storm Hard choices)
- **Surges are unpredictable in length and spacing; the storm's overall shape is fixed but hidden.** Each row draws its surges at random inside a storm arc that builds, peaks and eases. Governs R5, R6. (session-settled: user-directed — chosen over a fixed learnable arc alone, a storm that reacts to effort, and rotating fixed formats: unpredictability is the point of the mode)
- **Random waves within an arc, not a free draw or a deck of sets.** The arc gives the visuals and wind a story to follow, and bounds intensity. Governs R4, R5, R15. (session-settled: user-approved — chosen over a free draw within a budget and shuffled hand-made sets: a free draw has no storm shape, and fixed sets lose their surprise)
- **Surviving means finishing.** There is no fail state and no score, and no strap is needed. Governs R3, R21. (session-settled: user-directed — chosen over counting surges met and a hull that can break: those need a strap, and a fail state rewards chasing heart rate)
- **Coaching is led by effort; heart rate is secondary.** A strap's reading is shown but never set as a target. Governs R11. (session-settled: user-directed — chosen over push-zone coaching in surges: heart rate matters less here than in the 4x4)
- **Surges are warned, but their length is hidden.** The warning and horn stay, in storm wording. Nothing counts down in the lulls, and surges count up. Governs R7, R8, R9, R10. (session-settled: user-approved — chosen over showing surge length and over unwarned surges: unwarned surges break R40 and catch rowers mid-drink)
- **Storm wording for the signals.** "Rough water ahead" warns of a surge, and "Calm water ahead" marks its end. Governs R7. (session-settled: user-directed — chosen over a heads-up 10 s before a surge ends, which would give its length away)
- **A calm 10-minute warm-up, and lengths of 30 and 45 min only.** A 20-minute row leaves too little storm after the warm-up. Governs R1, R2. (session-settled: user-directed — chosen over a 60-minute storm and over a shorter warm-up for 20 min)
- **Wind and thunder are part of the storm's sound.** Governs R17, R18. (session-settled: user-directed)
- **The storm is a new scene, not a stronger "rough" sea.** The mode's appeal is a completely different look and feel, so it needs its own design pass. Governs R14.

### Requirements

**Choosing a storm row**

- R1. The Just row effort picker (R57) offers Storm beside Easy, Intermediate and Hard. Choosing it shows the note "A mix of Intermediate and Hard rowing." The length picker then offers 30 and 45 min only.
- R2. A storm row runs a 10-minute warm-up in the calm scene, then the storm, then a 5-minute cool-down. Dark cloud gathers on the horizon in the warm-up's last minute.
- R3. A completed storm row moves the ship one stop, like any casual row (R56). A Partly rowed storm row does not move it (R54).

**The storm and its surges**

- R4. The storm follows a hidden arc. It builds after the warm-up, peaks in the middle third of the storm, and eases before the cool-down.
- R5. Surge lengths and the lulls between them are drawn at random inside the arc, so no two storm rows run the same. Toward the peak, lulls shorten and surges lengthen.
- R6. Each length has a cap on total surge time, and each surge has a minimum and maximum length. Each lull has a minimum too, never shorter than the end horn and the next surge's horn together (about 10.4 s), so the two never overlap. The random draw stays inside all three.
- R7. Each surge is signalled like a push (R39, R40), in storm wording: the 10 s warning reads "Rough water ahead", the horn sounds at 6 s, the start strike opens the surge, and the end horn closes it with "Calm water ahead".
- R8. The storm breaks as its own moment when the cool-down begins: the scene clears, a distinct sound plays, and a banner says the storm has passed. No surge follows it.

**The screen during a storm**

- R9. The progress strip shows three blocks, warm-up, storm and cool-down, with a marker for now. It never shows individual surges.
- R10. During a lull, the gauge shows "Lull" and the time rowed, with no countdown or footer for the next surge. During a surge, it shows "Surge n" with no total, and counts the surge's time up. The rower learns a surge's length only when the end horn sounds. Get seated's plan line gives no surge count.
- R11. Coaching follows effort throughout: Intermediate in lulls and Hard in surges, as perceived effort and the talk test (R30). With a strap, bpm shows as a reading only, with no zone to reach.
- R12. A storm row carries every safety rule of a Hard casual row: the R61 safety line, the ease-off bells and glow (R36), and pause (R32).
- R13. The gauge, surge clock and coaching text keep the contrast and position they have in standard scenes, including through rain and lightning. The storm scene is designed around them.

**Look and sound**

- R14. The storm scene is visibly different from every standard scene at 1 m: a dark sky, driving rain, heavy seas and lightning. Only the warm-up and cool-down use the calm scene.
- R15. The scene and the storm's sound follow the arc's intensity, from gathering through peak to breaking.
- R16. Under Reduce Motion, the storm keeps its dark sky but has slower rain and a gentler swell. Lightning never flashes more than three times in any one second, and under Reduce Motion it shows as a soft brightening rather than a flash.
- R17. The storm has its own sound bed of wind and thunder. Wind rises and falls with intensity, and each thunder clap follows a lightning flash on screen.
- R18. Thunder never sounds inside a surge's 10 s warning, or while a signal is playing, so it can't mask or be mistaken for a signal. Wind sits under signals as the existing sea bed does.

**Ending and records**

- R19. Session complete says the rower came through the storm, and shows how many surges they rowed and their total surge time, as a record of the row rather than a score.
- R20. A storm row is saved and exported with the effort "Storm", so it can be told apart from other Just rows.
- R21. Rowing to the end of the cool-down is surviving the storm. Nothing in the row can fail it.

### Acceptance Examples

- AE1. **Covers R1.** Given a casual rower whose last row was Easy at 20 min, when they choose Storm, the note "A mix of Intermediate and Hard rowing" shows, the length picker moves to 30 min, and only 30 and 45 min are offered.
- AE2. **Covers R5, R6.** Given two 45-minute storm rows, their surge lengths and spacing differ, and each row's total surge time is within the hard-time cap for a 45-minute row (R6).
- AE3. **Covers R9, R10.** Given a rower in a lull, the gauge shows "Lull" and the time rowed, and no time to the next surge. When the surge starts, it shows "Surge 3" and a clock counting up from 0:00, which stops when the end horn sounds.
- AE4. **Covers R7, R18.** Given a surge whose "Rough water ahead" warning is up, no thunder sounds until the start strike has finished.
- AE5. **Covers R11.** Given a strap, a surge shows Hard effort guidance with the bpm as a plain reading, and no zone target.
- AE6. **Covers R8.** Given the last surge has ended, the storm breaks at the cool-down with the scene clearing and its banner, and no further surge comes.
- AE7. **Covers R12.** Given a pause during a surge, the surge's hidden length stays hidden on the pause sheet, and the surge carries on after resume.

### Success Criteria

- Storm is judged with the existing metrics, from testers' "Export my rows" files (R20). Its post-row enjoyment rating is compared with Hard rows, and the effect on Just row sessions per week is checked.

### Scope Boundaries

**Deferred for later**

- A storm that reacts to live effort or heart rate (still deferred in the rebuild requirements).
- A score, surges met, or any fail state.
- Storm days on the 4x4 route, or swapping a hard day for a storm.
- 20 and 60 minute storms.
- Other weather modes (fog, night, ice).

**Outside this product's identity**

- Leaderboards or shared storm results.
- Photoreal storm footage. The storm stays in the ink-painted style.

### Dependencies / Assumptions

- The hard-time caps, the surge and lull bounds and the peak's intensity need the coach review (R17 in the rebuild requirements).
- The storm needs commissioned or self-made art and sound, which are budgeted after the slice proves the bet (`STRATEGY.md`, Costs).
- The rough scene (R58) and its performance work are the closest base for the storm scene's water. The storm's rain and lightning add load, so the rough scene's frame-rate targets apply.

### Outstanding Questions

**Resolve Before Planning**

- The total surge-time cap for 30 and 45 min, the minimum and maximum surge length, and the minimum lull above the 10.4 s signal floor. These come from the coach review.

**Deferred to Planning**

- Whether the hold signal and "Hold this effort" (R30) sound in surges longer than 90 s.
- Whether the drum keeps a rest tempo in lulls, or the wind replaces it.
- How thunder is placed in time: random within the arc, kept clear of the signal windows (R18).
- Whether a storm row's draw is stored with the row, so a partly rowed storm can be described in the summary.

### Sources / Research

- `docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`:
  - R57: the Just row pickers.
  - R58: scene by effort.
  - R36: ease-off.
  - R39 and R40: signals and their timings.
  - R61: the safety line.
  - Its deferred list, which defers the effort-reactive scene.
- `docs/design/sound-spec.md`: the signals, the drum gaps and music ducking that the storm's sound must leave room for.
- `PLAN.md` G6b: the 10 s warning and 6 s horn that surges reuse.
