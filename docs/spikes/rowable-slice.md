# Spike — the rowable slice (U7, M1 gate)

**The question M1 answers:** is rowing in the voyage fun, and can it be read at 1 m? If the slice isn't fun, the scene and sound change before M2 starts (the build plan's milestone table).

**Exit check:** the builder rows the slice 3–5 times and two other rowers row it once each. Each row is rated below, and the verdict at the end is filled in once the rows are in.

**Verdict:** not yet. Rows to come.

## What to row

Open Nor4x4 (a dev build) and tap **Row the slice** on the start screen. It is week 3 of the Beginner voyage: a 10′ warm-up with two 20 s pickups, three 3′ pushes with 3′ rests, then a 5′ cool-down, 30 minutes in all, coached by effort.

**Row the slice · fake heart rate** rows the same session coached by heart rate against a pretend strap. Push 2 runs over 95% of max about a minute in, so the ease-off ("Ease off ▲", the charcoal glow, three bells) can be judged without a strap. Use it for one row; it is not a real row's heart rate.

## Before each row

- Phone in landscape on the rower's holder, about 1 m away, as for a real session.
- Volume where you would have it; note whether your own music was playing.
- Ring/silent switch noted: Silent mode keeps every cue on screen (R40) but plays nothing.
- The app opens? Free signing lapses after 7 days: rebuild with `npx expo run:ios --device`.

## The row log

One entry per row. Ratings are 1 (poor) to 5 (great).

| # | Date | Rower | Mode | Enjoyment 1–5 | Readable at 1 m? | Glow clear? | Crew present? | Any word in the drum? | What felt off |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | | effort / fake HR | | | | | | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |
| 4 | | | | | | | | | |
| 5 | | | | | | | | | |
| 6 | | other rower 1 | | | | | | | |
| 7 | | other rower 2 | | | | | | | |

What each column asks:

- **Enjoyment:** did the voyage make the row better than rowing to a timer?
- **Readable at 1 m:** time left, the effort guide (or bpm), and every banner, read at a glance mid-stroke.
- **Glow clear:** in the fake heart-rate row, does the charcoal border read clearly as "ease off"? If not, the build plan names teal as the fallback (U7, S5).
- **Crew present:** did the crew murmur make you feel you were rowing with a crew? Would grunts on the drive, in pushes only, help? (Left out on 2026-11-05: see `PLAN.md`.)
- **Any word in the drum:** the drum is cut from a recording titled "rowrow". If a word is ever audible, it breaks the no-human-voice decision and the drum changes.
- **What felt off:** anything at all, such as timing, loudness, the oars, a banner arriving late, or the screen dimming.

## Things to listen and look for

- The drum: soft single hits in the warm-up, then "tap · tap · BOOM" in pushes, landing with the oars' catch.
- The war horn 10 s before each push: the drum stops under it, the oars rise, a horn shows at the prow, and "Ready oars" appears.
- The double taiko strike at each push, and the falling horn as it ends.
- "Hold this effort" with its wood clack 90 s into each push (effort mode only).
- Levels: the bell and wood clack against the drum; the sea and crew under everything.
- A long press pauses everything; the pause sheet ends the row only with a hold.
- The frame rate: the scene should never stutter.

## Known limits of the slice

These are planned for later units, not faults to log:

- No phone-call handling: a call doesn't pause the row (U19).
- Nothing is saved: a killed app loses the row (U8).
- No music detection: ambience doesn't mute for your own music (U19).
- The end is a plain card, not landfall (U20).
- Portrait shows the landscape painting fitted to the width (U18 brings its own composition).

## Verdict

To fill in once the rows are logged:

- **Go:** M2 starts with the scene and sound as they are. Note any small tuning to carry into U18 and U19.
- **Change:** name what changes in the scene or sound, and row again before M2.
