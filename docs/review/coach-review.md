# Coach review: Nor4x4 Beginner program, zones, benchmark and safety warning

**Status:** packet ready to send. No reviewer yet.
**Reviewer:** _name, qualification (rowing coach or exercise physiologist), date_
**Requirements under review:** R5, R10, R12–R14, R17, R30, R35–R37, R45, R57, R60, R61 in `docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`

Every number below is a draft (R17). Nothing in the program engine is built until this review is back and the requirements match it.

---

## For the reviewer: what Nor4x4 is

- **The app:** a free iPhone app for indoor rowing machines. Each row is a scene in a viking voyage from Bergen to Iceland. Cues are sounds (horn, drum, crew calls) with an on-screen twin, so it works with no monitor and no spoken instructor.
- **Who rows it:** adults rowing at home for general health and stamina, rowing about twice a week and aiming for three. Most are new to interval training. Many have no heart-rate strap.
- **Two paths:**
  - **Train with the 4x4:** an 8-week Beginner program, three rows a week, building to the Norwegian 4×4 (4 × 4 min hard, 3 min easy).
  - **Just row:** no program; the rower picks Easy, Intermediate or Hard and a length each time.
- **Heart rate:** zones are a percentage of max HR. Max HR is estimated as **208 − 0.7 × age** (Tanaka), or the rower types a known max. With no strap, or with heart-rate medication, the app coaches by perceived effort instead.

Please mark each item **Keep**, **Change** (with the new value) or **Discuss**, and answer the questions in section 9.

---

## 1. The Beginner program (R10)

Three rows a week: one hard session and two easy rows. Hard sessions are never on consecutive days (R9).

Every hard session is: **10 min warm-up with 2–3 short pickups → the intervals → 5 min cool-down.** Rests are easy rowing, and there is no rest after the last push.

| Week | Hard session | Push target (% max HR) | Length | Easy rows |
|---|---|---|---|---|
| 1 | 4 × 1′, 2′ rest | 80–85% | 25 min | 2 (one is the benchmark row, section 5) |
| 2 | 4 × 2′, 2′ rest | 80–85% | 29 min | 2 |
| 3 | 3 × 3′, 3′ rest | 85–90% | 30 min | 2 |
| 4 | Lighter: 2 × 4′, 3′ rest | 85–90% | 26 min | 2 |
| 5 | 3 × 4′, 3′ rest | 85–90% | 33 min | 2 |
| 6 | 4 × 4′, 3′ rest | 85–95% | 40 min | 2 |
| 7 | 4 × 4′, plus an optional fifth push | 90–95% | 40 min (47 with the fifth) | 2 |
| 8 | Final 4 × 4′ | 90–95% | 40 min | 1 (the benchmark row) |

**Short on time (R12):** any hard session can be swapped for 1 × 4′ (10 min warm-up, one 4-minute push, 5 min cool-down; 19 min). It counts as that week's hard session.

| Item | Keep / Change / Discuss | Notes |
|---|---|---|
| 1a. The week-by-week progression | | |
| 1b. Push targets per week | | |
| 1c. Warm-up of 10 min with 2–3 pickups (how long, how hard?) | | |
| 1d. The lighter week 4 | | |
| 1e. The optional fifth push in week 7 | | |
| 1f. Short on time counting as the hard session | | |

## 2. Easy rows (R13, R14)

All easy rows stay in the steady zone (60–70% of max HR). The rower picks a length of 20, 30 or 45 min. Three formats rotate:

- **Steady:** continuous rowing.
- **Rate ladder:** 18 → 20 → 22 strokes per minute, still in the steady zone.
- **Technique row:** pause drills and isolation drills (legs only, legs and body, full stroke).

**Long row:** from week 2, one easy row a week is 1.5 × the usual length, rounded to the nearest 5 min (for example, 30 min becomes 45 min).

| Item | Keep / Change / Discuss | Notes |
|---|---|---|
| 2a. One steady band for all easy rows (60–70%) | | |
| 2b. The rate ladder: 18 → 20 → 22 spm, and how long at each step | | |
| 2c. Which drills, and for how long, in a technique row | | |
| 2d. The weekly long row at 1.5 × | | |

## 3. Zones and the effort scale (R57, R30)

Worked example: age 34, so estimated max HR = 184 bpm.

| Zone | % max HR | bpm at max 184 | Perceived effort (no strap or medication) |
|---|---|---|---|
| Steady / Easy | 60–70% | 110–129 | 3–4 of 10 · talk in sentences |
| Intermediate (Just row) | 70–80% | 129–147 | 5–6 of 10 · short sentences |
| Hard (Just row) | 80–85% | 147–156 | 7 of 10 · a few words |
| Push, weeks 1–2 | 80–85% | 147–156 | 7–8 of 10 · single words only |
| Push, weeks 3–5 | 85–90% | 156–166 | 7–8 of 10 · single words only |
| Push, week 6 | 85–95% | 156–175 | 7–8 of 10 · single words only |
| Push, weeks 7–8 | 90–95% | 166–175 | 7–8 of 10 · single words only |

The Just row Hard effort is one continuous row at 80–85% for the whole chosen length (20 to 60 min).

In effort mode, 90 s into each push a crew "Hold!" call and a "Hold this effort" banner tell the rower to settle, since there is no heart rate to show the ramp.

| Item | Keep / Change / Discuss | Notes |
|---|---|---|
| 3a. 208 − 0.7 × age as the estimate | | |
| 3b. The zone bands | | |
| 3c. Just row Hard: 80–85% continuous for up to 60 min | | |
| 3d. The perceived-effort numbers and talk-test words | | |
| 3e. The "Hold this effort" cue at 90 s | | |

## 4. Coaching rules during a push (R35, R36, R37)

- **Scoring time in zone** (so the HR ramp isn't penalized):
  - pushes of 4 min or longer are judged on their final 3 min;
  - pushes of 3 to 4 min are judged on their final half;
  - pushes under 3 min are coached by effort and not scored.
- **"Build ▼"** (push harder) never shows in the first 90 s of a push, in pushes under 3 min, or when max HR is estimated from age.
- **Ease off:** when HR stays above 95% of max for 15 s, three bells sound once per push, the screen edge glows and the chip says "Ease off ▲".
- **Max HR corrects itself**, ignoring spikes under 5 s:
  - a sustained HR above the stored max offers to raise it;
  - three hard sessions in a row that miss the push zone offer to lower it.

| Item | Keep / Change / Discuss | Notes |
|---|---|---|
| 4a. The scoring windows | | |
| 4b. When "Build ▼" is suppressed | | |
| 4c. Ease off at 95% for 15 s | | |
| 4d. Raising max HR: how long must HR stay above it? | | |
| 4e. Lowering max HR after three missed sessions | | |

## 5. The benchmark row (R45)

In week 1 and week 8, one easy row is a **12-minute row at a fixed 20 spm** (drum-paced). Afterwards the rower may type in the distance from their monitor. Week 8 is compared with week 1 by distance, plus average HR when a strap was worn. With neither, it compares completion and enjoyment.

| Item | Keep / Change / Discuss | Notes |
|---|---|---|
| 5a. 12 min at 20 spm as a beginner-safe benchmark | | |
| 5b. Instruction for effort: "steady but strong"? "as far as you can at 20 spm"? | | |
| 5c. Where it sits in the week (instead of an easy row) | | |

## 6. Coming back after a break (R60)

Counted from the last completed row on the 4x4 path. The ship on the route never moves until a row is completed.

| Days away | What the app offers |
|---|---|
| Under 7 | Nothing; carry on with the waiting session |
| 7–13 | "Pick up where I left off" (default) or "Ease back in" (repeat the previous week first) |
| 14–27 | The same choice, with "Ease back in" as the default |
| 28 or more | The plan goes back two weeks, and the safety warning (section 7) shows again |

| Item | Keep / Change / Discuss | Notes |
|---|---|---|
| 6a. The day thresholds | | |
| 6b. What "Ease back in" does | | |
| 6c. Two weeks back after 28 days | | |

## 7. Safety wording (R5, R61)

**Before the first row on either path**, one screen shows this warning, with no quiz and nothing locked:

> Pushes go close to your max heart rate. If you have a heart condition, chest pain, dizziness or fainting, are pregnant, or are over 45 and new to hard exercise, talk to a doctor first. Stop and rest if you feel chest pain, dizziness or unusual breathlessness.

It asks one question, with no answer pre-selected: **"Do you take medicine that affects your heart rate?"** A yes coaches every row by perceived effort instead of bpm, and suggests asking a doctor about heart-rate targets.

**Before every hard session and every Just row Hard row**, and on the pause sheet:

> Stop and rest if you feel chest pain or pressure, dizziness, unusual breathlessness, or palpitations.

**Every cool-down:** "Keep paddling, don't stand straight up."

| Item | Keep / Change / Discuss | Notes |
|---|---|---|
| 7a. The first-row warning: anything missing or wrong? | | |
| 7b. Is "over 45 and new to hard exercise" the right line? | | |
| 7c. The medication question and the switch to effort coaching | | |
| 7d. The stop line before hard rows | | |
| 7e. The cool-down line | | |

## 8. What the evidence says, as we read it

The 4×4 comes from Helgerud 2007 (moderately trained men). Tjønna 2013 compared one 4-minute interval with 4×4 in inactive men aged 35–45. Polarized training follows Seiler. **None of these tested one hard session a week in untrained adults,** which is what weeks 1–8 do.

## 9. Questions

1. Should perceived effort or heart rate lead for beginners whose max HR is only estimated from age?
2. Is one hard session a week enough in weeks 5–8, or should there be two?
3. Is the 95%-for-15-s ease-off right, and should it fire more than once per push?
4. Is 8 weeks the right length for the Beginner voyage?
5. Anything in sections 1–7 you would not let a new rower do without supervision?

---

## Results

_Fill in after the review._

| Item | Decision | New value | Requirement to update |
|---|---|---|---|
| | | | |

**Answers to section 9:**

1.
2.
3.
4.
5.

**Requirements updated:** _commit or date, once the origin requirements match this review._
