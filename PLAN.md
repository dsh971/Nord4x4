# PLAN — M1 · Rowable slice (U1–U7)

**Status (2026-11-05):** Phase A done (packet ready; you still need to find and send it to a coach). Phase B done, with the review fixes applied. Phase C done: all five device checks pass, and ducking uses the switch-options release (`docs/spikes/native-modules.md`). Phase D done: the session engine and fake sensors, with tests. Phase E done: tokens, fonts and the slice's components, reviewed and checked on the phone. Cues without voices done. Phase F done (2026-11-05): `docs/design/sound-spec.md` and the slice sounds in `assets/audio/`, built by `docs/design/tools/build_sounds.py`. Phase G under way: G1 to G4 done (slice plan and ease-off, audio engine, overlays, painted scene); G5 done (the drum's lead-in; the session screen at `app/session/slice.tsx`). Now G6: row the slice and log each row in `docs/spikes/rowable-slice.md`, then the M1 go/change verdict.

Goal: reach the M1 gate in `docs/plans/2026-10-29-001-feat-nor4x4-expo-rebuild-plan.md`. One hardcoded session (week 3 Beginner, 3×3′, 30 min) with the scene, drum, horn and crew is rowed on a real erg by you 3–5 times and by two other rowers once each. The go/change verdict goes in `docs/spikes/rowable-slice.md`.

## Done · cues without voices (Phases A–B, completed 2026-11-04)

**Decision (from you, 2026-11-04):** no human voice at all. The crew calls "Heave!" and "Hold!" become sounds, and every cue gets a clear on-screen notice. This replaces S6 ("Crew calls in English") from 2026-10-31.

| Moment | Sound | On screen (banner, plus the existing visual) |
|---|---|---|
| Get seated, last 5 s | Five drum beats | Big 5-4-3-2-1 |
| Push in 10 s | War horn | "Ready oars" + edge pulse |
| Push starts | **Double drum strike**, then the drum lifts to push tempo (was "Heave!") | "Pull" |
| 90 s into a push, effort mode | **A short distinct signal**, chosen in the Phase F listening test (candidates: wooden clapper, single gong stroke) (was "Hold!") | "Hold this effort" |
| Push ends | One low horn note + drum slows | "Rest" |
| Above 95% max for 15 s | Three bell strikes | "Ease off ▲" + charcoal border glow |
| Session ends | Landfall sound | Session complete |

On-screen notices: each banner shows for about 3 s, large enough to read at 1 m from the erg, and appears at the moment its sound plays (built in U7 as SignalBanner). Nothing here depends on sound being on, so Silent mode keeps every cue.

### Phase A — Docs
- `docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`: R30, R40 table, AE7, the "no spoken voice" line and R41's list of signals; S6 marked superseded.
- `docs/plans/2026-10-29-001-feat-nor4x4-expo-rebuild-plan.md`: KTD9's signal list, the push cue timeline, U3, U7 and U19 cue lists.
- `docs/review/coach-review.md`: the "Hold!" wording.
- `PLAN.md`: Phase F drops "record the crew calls" and adds the two new sounds to the shortlist.

### Phase B — Code
- `src/domain/session/sessionMachine.ts` and its test: rename the cue kinds `heave` → `pushStart` and `hold` → `holdEffort`, so the names describe the moment, not a voice. No behaviour change.

### Crew murmur (decided 2026-11-04)
- R38's "crew murmur during work" stays as **wordless ambience**: low effort grunts and exhales on the stroke over a quiet murmur, with no intelligible words. It mutes with the rest of the ambience when the rower's music plays (R41) and carries no cue. Phase F's listening test offers 2–3 versions mixed under the drum and sea; each pick's licence is checked before it ships.
- Phase A also updates R38 to say "wordless".

### Verification
```
grep -rn -i -E 'heave|hold!' docs/brainstorms docs/plans docs/review src   # only the superseded S6 note remains
npx tsc --noEmit && npm run lint && npx jest
```

## What I can do here, and what needs you

| Unit | I can do | Needs you |
|---|---|---|
| U1 coach review | Write the review packet | Find the coach, send it, bring back the answers |
| U3 sound | Write the sound spec, shortlist CC0 or royalty-free files with licences | Pick the files by listening test |
| U4a scaffold and spike | Expo project, strict TS, Jest, lint, test mode, the spike screen and the Swift module | Xcode selected, Apple signing, run the 5 checks on your iPhone with Spotify |
| U2 design spec | Nothing in M1: it doesn't block the slice (U5 needs only the slice's tokens) | Held until M2 |
| U4b strap and Health | Spike code | An H10 strap and the phone. **Not needed for the M1 gate**; I'd hold it until before M3 |
| U5 tokens | Tokens, fonts and the slice's components, with tests | Compare the gallery screen with the boards |
| U6 session engine | All of it: pure TypeScript, test-first | Nothing |
| U7 slice | Scene, audio engine, rowing UI | The device build, and the rows on the erg |

## Toolchain found on this Mac (2026-11-02)

- Node 25.9, npm 11.12. Expo SDK 58 (58.0.23 after `expo install --fix` on 2026-11-03), matching KTD1.
- Xcode 27.2 (Swift 6.4.2), selected with `xcode-select`. Xcode 26.2 could not compile `expo-modules-jsi` 58.0.22.
- CocoaPods 1.17.0 and Maestro 2.12.1 from Homebrew. Maestro needs `JAVA_HOME=/opt/homebrew/opt/openjdk@21`. The EAS CLI waits for M3 (run as `npx eas-cli@latest`).
- Signing: free Personal Team; the profile expires after 7 days.

## Proposed defaults (change any before I start)

1. **Project location:** the Expo app lives at the root of `nor4x4-app`, beside `docs/` (as the build plan's Output Structure says).
2. **Package manager:** npm.
3. **Bundle ID:** `com.dsh971.nor4x4`. Display name "Nor4x4".
4. **Builds:** local `npx expo run:ios --device` dev builds for M1; EAS only for TestFlight in M3.
5. **Lint:** ESLint with `eslint-config-expo`, plus Prettier. No `any` (`@typescript-eslint/no-explicit-any` as an error).
6. **Order:** U6 before U5, because the engine is pure TypeScript and fully testable here, and U7 needs both.
7. **U4b waits** until before M3, as its own dependency line allows.

## Phase A — U1 review packet

- Create `docs/review/coach-review.md`: the Beginner table (R10), easy-row formats (R13, R14), zones (R57), the benchmark (R45), the warning wording and medication question (R5), the long-break tiers (R60), and the three questions. Results section left for the answers.
- Verify: every number in the packet matches the requirements (a script compares the zone, week and benchmark values).

## Phase B — U4a scaffold and test plumbing

- `create-expo-app` (SDK 58, TypeScript), Expo Router, strict `tsconfig.json`, Jest (`jest-expo` for components, Node for domain), ESLint and Prettier, `app.config.ts`, `eas.json`.
- `src/dev/testMode.ts` (KTD18) with its test: off in release, on when `EXPO_PUBLIC_TEST_MODE` is set in dev (`npm run start:test`).
- `app/index.tsx` is a launch screen so the router can boot; U14 deletes it when `app/(main)/index.tsx` takes the `/` route.
- Verify:
  ```
  npx tsc --noEmit
  npx jest
  npm run lint        # eslint .
  npx expo-doctor
  ```

## Phase C — U4a native spike (needs your iPhone)

- C1: install Maestro; Skia and react-native-audio-api config plugins, background audio, the `modules/other-audio` Swift module, and a dev-only spike screen that runs the five checks (two loops plus a one-shot over Spotify; 20 ducked cues with the screen locked; the other-audio hint; Silent mode suspend and recover; a full-screen shader at 60 fps).
- C2: you run them; I write the results and the ducking decision (KTD9) into `docs/spikes/native-modules.md`.
- Verify: `npx expo run:ios --device` builds; the spike doc records all five results.

## Phase D — U6 session engine (test-first)

- `src/domain/session/` (plan, machine, clock, summary, checkpoint) and `src/domain/sensors/` with fakes, exactly as U6 lists.
- Every test scenario in U6 written first, including AE9, AE10, AE11 and the 40-minute simulated session.
- Verify: `npx jest src/domain` passes, `npx tsc --noEmit` clean.

## Phase E — U5 slice tokens and components

- `src/design/tokens.ts` and `typography.ts` from Shuimo, Noto Serif SC and Inter in `assets/fonts/`, and the components the slice needs: Text, Button, IntervalShape, ZoneChip, ProgressStrip, ShipIcon. The rest of U5 waits for M2.
- Tests: the IntervalShape ratio and empty list, ZoneChip word-plus-shape at 22 pt, contrast of every text-on-surface pair.
- A dev-only gallery screen to compare with the boards.

## Phase F — U3 sound spec and slice assets

- `docs/design/sound-spec.md`: every ambience and signal with its visual twin, loudness targets, loop lengths, format, source and licence.
- A shortlist of CC0 or royalty-free candidates for the slice set (horns, bells, drum hit and loop, push-start strike, hold signal, calm sea, wordless crew murmur), for you to pick by listening test. No voices to record.
- Brief from the 2026-11-04 listening test: the horn is horn-5 "war horn" (deep, with a growl and a valley echo), and the drum is drum-1 "taiko", one hit per stroke at the catch. The stand-ins are synthesized in `src/dev/spike/tones.ts`. Bells are still to choose.
- Picks so far (listening tests, 2026-11-04):
  - Horn: horn-5 "war horn" (synthesized, `war_horn` in `build_sounds.py`; the stand-in in `src/dev/spike/tones.ts` was deleted in G2).
  - Drum: drum-1 "taiko", one hit per stroke at the catch (synthesized).
  - Hold signal: wood-3 "oar shafts clack", two hollow wood knocks, solo with no drum (synthesized, `hold_signal` in `docs/design/tools/build_sounds.py`).
  - Ease-off bells: H1, "chromatic handbells 12 tones g1" by radwoc (https://freesound.org/people/radwoc/sounds/370007/, CC0, 48 kHz/24-bit studio WAV), its single-tone strike played three times 0.6 s apart. Synthesized bells were rejected; the original WAV needs a free Freesound account to download. The original is downloaded and cut (2026-11-05).
  - Push-start strike: strike-1 "double taiko", two quick taiko hits, solo (synthesized, `push_start_strike` in `build_sounds.py`).
  - Drum during signals: the drum pauses while a signal plays and picks up on the next stroke (audition B).
  - Push-end horn: end-2 "falling war horn", the war horn whose pitch sags five semitones over its last 1.5 s, so it can't be mistaken for the push warning (synthesized, `push_end_horn` in `build_sounds.py`, 2026-11-05).
  - Rejected: a crowd send-off before the row (Jorvik parade, 2026-11-05). It would blunt the war horn, mask the count-in and wear thin with repetition.
  - Calm sea: S2, "lake waves lapping at boats" by kyles (https://freesound.org/people/kyles/sounds/637945/, CC0).
  - Wordless crew: C2, "men murmuring" by craigsmith (https://freesound.org/people/craigsmith/sounds/480808/, CC0), 8 dB under the sea as heard, with both loudness-matched first (audition `S2+C2-crew-minus-8dB`, 2026-11-05).
- Verify: every cue the U6 engine emits has a named asset and licence in the spec.

## Phase G — U7 rowable slice

- `app/session/slice.tsx`, the first-pass InkScene and AudioEngine on their final interfaces, CornerGauge, ProgressStrip, SignalBanner, EaseOffGlow, GetSeated with the stop line, and long-press pause.
- Gauge digits sit in fixed-width cells: Noto Serif SC has no tabular figures, so a bare countdown would shift sideways each second (Phase E review, 2026-11-04).
- Tests: U7's three gauge scenarios.
- You row it; `docs/spikes/rowable-slice.md` records each row and the go/change verdict. **M1 gate.**

### Detailed plan (approved 2026-11-05)

Decided 2026-11-05: the phone sits **landscape** on your holder, so the slice polishes landscape (board 3.2) first. The scene is **drawn in code** with Skia from the boards; real art can replace it after M1.

Decided in the G3 review (2026-11-05):
- **The stop line uses R61's wording**, not the boards' shorter question: "Stop and rest if you feel chest pain or pressure, dizziness, unusual breathlessness, or palpitations." The boards are out of date on this line.
- **Ease-off only where bpm leads.** In an effort-mode session bpm can't be trusted (KTD21), so a strap reading above 95% shows no glow or chip, and G5 must keep the bells silent too. The slice's fake heart-rate trace rows as a heart-rate plan.
- **No crew grunts in the slice (2026-11-05).** Grunts on every stroke (ShangusBurger 764048, CC0) were auditioned and left out: they repeat about 80 times a push, a faint mix likely vanishes under the erg's flywheel, and the murmur already says "crew". The slice keeps clip A: drum, sea and murmur. The G6 row log asks whether the crew felt present and whether push-only grunts would help.
- **The drum leads into each catch in work (2026-11-05, clip 3 of the drum audition).** The drum becomes the hits of "rowrow" by theredshore (https://freesound.org/people/theredshore/sounds/83977/, CC0): its deep, long-ringing low hit on every catch, and in pushes and pickups two lighter taps of its higher hit at 70% and 85% of each stroke ("tap · tap · BOOM"), placed as shares of the stroke so they follow the rate. Easy rowing keeps one soft low hit. The catch stays on the stroke grid, so the oars don't change, and the taiko push-start strike stays distinct. Picked by ear; the page calls the clip a "row row" call, so the G5 phone check confirms no word is audible. Built in G5 from the original file.
- **The safe area holds the overlays.** The rowing overlay and Get seated sit inside the safe area with a 24 pt margin, clear of the camera cut-out (on the side in landscape) and the home indicator; the edge glows still reach the screen's edge.
- **The zone chip shows nothing rather than an untrue "In zone".** Above the target band, short of the 95% ease-off, and below it while "Build ▼" isn't allowed yet (R50), the bpm and target line speak for themselves.

Goal: one real session you can row on the phone. It is week 3 of the Beginner voyage: a 10′ warm-up with two 20 s pickups, then 3×3′ pushes with 3′ rests, then a 5′ cool-down, 30 min in all. It has a painted scene, the Phase F sounds, the gauge, signals with their banners, and long-press pause. There is no onboarding, database or scheduler. Each sub-step ends in a check, and each gets its own "OK to commit".

**Data shapes first.**
- **The session machine stays the single clock.** A slice controller calls `advance()` about 10 times a second, and its events drive audio, banners and scene. Nothing else keeps time (KTD5).
- **Two signal tables over one `SignalKind`** (every cue kind, plus `easeOff`), split by owner so dependencies still point down. `SIGNAL_SOUNDS` in `src/services/audio/` holds each signal's sound and strike pattern, and `drumGapMs` turns that and the decoded file length into the drum gap. `SIGNAL_BANNERS` in `src/features/rowing/` holds the banner text. Both are `Record`s, so a missing cue is a compile error. The count-in numbers and the ease-off glow and chip follow state, not a banner.
- **Ease-off is a small pure state machine** (`src/domain/heart/easeOff.ts`). Heart rate above 95% of max for 15 s of readings no more than 5 s apart turns it on. The bells ring once per push, and outside a push only as the glow comes on, so HR still high after a push doesn't ring again. The glow clears when HR drops back or the strap drops (R36).
- **The drum is a pure scheduler** (`src/services/audio/drumSchedule.ts`). From the segment stroke rates and the signal drum gaps, it returns each hit's time, sound and level on the session clock. The audio engine plays what it returns, scheduled ahead on the audio clock.

**G1 · Domain and the slice plan.** The pure parts, test-first.
- Files:
  - `src/content/slicePlan.ts`: the week-3 plan above, in effort mode (program content is data, KTD16).
  - `src/domain/session/sessionBuilders.ts`: the R10 warm-up and hard-session builders, shared with the test fixtures.
  - `src/domain/heart/easeOff.ts`.
  - `src/services/audio/signalSounds.ts` and `soundNames.ts`: each signal's sound, and `drumGapMs`.
  - `src/features/rowing/banners.ts`: each signal's banner.
  - `src/features/rowing/effortGuide.ts`: the text per segment type, e.g. "7–8 of 10 · Single words only" in a push. The easy text is draft copy for the coach review (R17).
- Tests:
  - ease-off: on at 15 s above 95% and not at 14 s or at exactly 95%; bells once per push, not again when a push ends with HR high, again in the next push; a gap in readings or a dropout starts the wait again; a bad max HR is refused;
  - the drum gap runs to the end of the third bell (3.0 s);
  - the plan is 30 min, with a 10′ warm-up holding two pickups and three 3′ pushes.
  - The tables have no tests of their own: `Record` already forces every signal and segment type to have an entry.

**G2 · Audio engine (first pass of U19).**
- Files:
  - `src/services/audio/`: `audioEngine.ts`, `drumSchedule.ts`, `assets.ts`.
  - The engine:
    - loads the slice's sound files;
    - loops the sea in the background, and the crew during work segments;
    - schedules drum hits ahead, skipping strokes inside a signal's drum gap;
    - plays signals, ducking the music with the KTD9 switch-options release;
    - pauses and resumes with the session.
  - The spike moves to the real files, and the stand-in synthesis in `src/dev/spike/tones.ts` is deleted with its test.
- Tests (drum scheduler):
  - 27 spm gives a hit every 2.222 s;
  - a rate change takes effect on the next stroke;
  - strokes inside a horn's 5.2 s gap are skipped, and the drum comes back on the first stroke after it;
  - pausing shifts nothing.
- On the phone:
  - the loops repeat without a hitch (the Phase F seam check);
  - signals land on the beat;
  - per-signal gains are tuned by ear, starting with the bell and wood about 10 dB up.

**G3 · Rowing overlays.**
- Files: `src/features/rowing/`:
  - `CornerGauge` (fixed-width digit cells, U7);
  - `SignalBanner` (about 3 s, readable at 1 m);
  - `EaseOffGlow` (charcoal border, breathing);
  - `GetSeated` (big 5-4-3-2-1, the R61 stop line, Start now);
  - `PauseOverlay` (long press anywhere pauses, Resume, and End session with a hold to confirm).
  - It reuses Phase E's `ProgressStrip`, `ZoneChip` and `Text`.
- Tests: `src/features/rowing/__tests__/gauge.test.tsx`, with U7's three scenarios:
  - effort guide and time sizes during a push;
  - fake HR above 95% for 15 s shows "Ease off ▲" and the glow, and plays the bells once;
  - the strip shows both pickups with the marker inside the current segment.

  Plus a banner test and a long-press test.

**G4 · Ink scene (first pass of U18).**
- Files: `src/services/scene/InkScene.tsx`, a Skia canvas drawn in code from boards 3.2–3.4:
  - paper sky, mountain washes and water;
  - the striped sail, the prow, the deck, the rowers;
  - oars that follow the drum's beat phase on the UI thread.
- Four states:
  - **work:** oars dig;
  - **rest:** oars trail;
  - **horn:** oars raised, horn rings at the prow;
  - **easy:** calm water, low sun.
- Reduced motion freezes it.
- Tests: the segment-to-state mapping, and the oar phase at 27 spm.
- On the phone: 60 fps through a full push, against the spike's 120 fps baseline.

**G5 · The slice route**, in two parts: G5a builds the drum's lead-in (the decision above) from the original recording, and G5b is the session screen below.
- `app/session/slice.tsx` (dev only, linked from the start screen) wires the machine, audio, scene and overlays together.
- The screen stays awake (`expo-keep-awake`, added with `npx expo install`).
- A dev switch replays a fake heart-rate trace, so the ease-off can be tried without a strap.
- On the phone: row the full 30 min once yourself.

**G6 · Rowing it (M1 gate).**
- `docs/spikes/rowable-slice.md`: a row log covering:
  - whether the crew felt present, and whether push-only grunts on the drive would help;
  - enjoyment 1–5;
  - readability at 1 m;
  - whether the charcoal glow reads clearly;
  - what felt off;
  - the go or change verdict.
- You row it 3–5 times and two other rowers once each.

**Verification for every sub-step:** `npx tsc --noEmit && npx jest && npm run lint && python3 -m unittest discover -s docs/design/tools`, plus the phone checks named above.

**Before writing Expo or library code:** fetch the versioned docs for SDK 58, react-native-audio-api 1.0 (decoding bundled assets, scheduling) and Skia (AGENTS.md).

**Out of scope here (later units):**
- heart-rate mode with a real strap (U21);
- the full pause sheet with sound modes (U17);
- music detection (U19);
- landfall (U20);
- portrait polish (it must still work, but board 3.2p is matched in U17);
- the stroke demo animation in Get seated, which is a still catch pose here (U17).

## Verification (whole milestone)

```
npx tsc --noEmit && npx jest && npx eslint .
python3 -I docs/design/tools/check_boards.py docs/design/canvas-source
```
Plus the device results in `docs/spikes/native-modules.md` and `docs/spikes/rowable-slice.md`.

## Done · health check becomes a warning plus one question (Phases A–C, completed 2026-11-02)

Goal: replace the seven-question health quiz with one warning screen before the first row, keeping only the medication question. Docs and design only; no app code.

### Decision (from you, 2026-10-31)

Middle ground: before the rower's first row on either path, one screen shows:
- a warning;
- one question: "Do you take medicine that affects your heart rate?";
- an "I understand" button.

No quiz, no locks, no blocks.

### Proposed defaults (change any before I start)

1. **Warning wording** (coach to review in U1): "Pushes go close to your max heart rate. If you have a heart condition, chest pain, dizziness or fainting, are pregnant, or are over 45 and new to hard exercise, talk to a doctor first. Stop and rest if you feel chest pain, dizziness or unusual breathlessness."
2. **The medication question is asked in one place, on the warning screen.**
   - The "affected by medication" option comes off the max-HR step (1.3 and 1.3c). Casual rowers can skip that step with Row by feel, so the warning screen is the only place every rower sees it.
   - It stays editable in Settings.
   - "Yes" means effort-only coaching on every row, as before (R30, KTD21).
3. **The stop line stays** on Get seated and the pause sheet (R61).
4. **After a 28-day break,** the plan still goes back two weeks and the warning screen shows again. There is no quiz.
5. **Dropped:**
   - the seven questions;
   - "blocks every row" and "A doctor has cleared me";
   - hard-session locks and the hidden Hard effort;
   - locked hard sessions replaced by easy rows.

   The PAR-Q+ quiz is noted under "Deferred for later" for a possible App Store release (M4).
6. **Board 2.6 (pushes locked)** moves to `docs/design/deferred/`. Board 2.5 becomes the warning screen.

### Phase A — Requirements

`docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`:
- **Rewrites:**
  - R5 becomes the warning, the one question and "I understand".
  - R4 loses the medication option.
  - R47 swaps health answers and clearance for "Heart-rate medication" and the warning.
  - R57's "medication" wording follows.
  - R60's 28-day tier shows the warning again.
  - The Key Decision "Safety before targets" is updated.
- **Examples:** AE8 becomes the warning acknowledgement, AE13 the medication yes (effort mode), and AE16 becomes "no row is blocked; the warning shows once".
- **F2 and F5:** "health check" becomes "warning".
- **Deferred:** the PAR-Q+ quiz, for M4.

### Phase B — Boards and flow chart

- **2.5:** rebuilt as the warning screen, with the warning, the medication yes/no (nothing pre-selected, 44 pt) and "I understand".
- **2.6:** moved to `docs/design/deferred/` with a README line.
- **1.3 and 1.3c:** the medication checkbox comes off.
- **2.2 Settings:** "Health check" becomes "Heart-rate medication · No".
- **Flow chart:** the quiz branch (any yes, paused, locked, hidden) collapses to "First row? → 2.5 warning → strap".
- **README:** board table and the "Not yet designed" list (the clearance and locked states are gone).
- **Regenerate:** `screens/`.

### Phase C — Build plan

`docs/plans/2026-10-29-001-feat-nor4x4-expo-rebuild-plan.md`:
- U15 shrinks to "First-row warning and medication question".
- U11 drops the locked-hard-session swap.
- U8 drops the health answers and clearance date, and keeps the medication flag and the date the warning was acknowledged.
- U13 loses the medication option.
- U1 reviews the warning wording, not the PAR-Q+.
- The risk row "health check not legally reviewed" now refers to the warning.
- Deferred gains the PAR-Q+ quiz for M4.

### Verification

```
python3 -I docs/design/tools/check_boards.py docs/design/canvas-source      # All boards pass
python3 -m unittest discover -s docs/design/tools                           # OK
grep -rn "PAR-Q\|cleared me\|Pushes locked" docs/brainstorms docs/plans docs/design/canvas-source   # only deferred mentions
```
Plus: a script checks every R and AE ID is still referenced; 2.5, 2.2, 1.3, 1.3c and the flow chart rendered and viewed.

## Done · skeptic review fixes, with no spoken caller (Phases A–C, completed 2026-10-31)

Goal: resolve the 5-reviewer skeptic review (2026-10-31, all verdicts ISSUES, 20 P1s) and apply the pending "no spoken caller" change in one pass. It covers the requirements, strategy, boards, flow chart and build plan. Docs and design only; no app code.

Each decision below has a **proposed default**. Approve all, or name the ones to change.

### Decisions

#### Sound and cues (replaces the pending no-caller plan)

- **S1. No spoken caller.** The horn and the drum carry every cue, the crew chants on the stroke, and the screen carries the details. A spoken caller goes to "Deferred for later".
- **S2. Signal vocabulary.** Each sound has an on-screen twin (R51):

  | Moment | Sound | On screen |
  |---|---|---|
  | Get seated, last 5 s | Five drum beats | Big 5-4-3-2-1 |
  | Push in 10 s | War horn | Edge pulse + "Ready oars" |
  | Push starts | Crew "Heave!" + drum lifts | "Pull" |
  | 90 s into a push, no strap | Crew "Hold!" | "Hold this effort" |
  | Push ends | One low horn note + drum slows | "Rest" |
  | Above 95% max HR held for 15 s | Three bell strikes | Charcoal border glow + "Ease off ▲" chip |
  | Session ends | Landfall sound | Session complete |

- **S3. Signals never mute.**
  - The horn, drum count, tempo accents, "Heave!", "Hold!" and bells are all cues.
  - In Cues only, and when the rower's music plays, only the sea bed, the drum loop and the crew ambience mute.
  - Every cue ducks the music.
  - This fixes a push starting in silence when music is on (raised by 4 of 5 reviewers).
- **S4. Silent mode really is silent, and the app may suspend.** Timestamps recover the timing when it comes back, and `bluetooth-central` keeps the heart-rate stream. This avoids App Review rejection under guideline 2.5.4.
- **S5. The charcoal glow is provisional.** Board 3.2b shows it, but the M1 slice tests it against the painting. If it reads as dimming, switch to teal.
- **S6. Crew calls in English ("Heave!", "Hold!").** *(Superseded 2026-11-04: the calls became sounds; see "cues without voices".)* The mixer's "Caller" slider becomes "Signals".

#### Safety (training reviewer, P1s)

- **H1. "Stop if" warning.** Chest pain or pressure, dizziness, unusual breathlessness or palpitations mean stop and rest. It appears on Get seated before every hard session or Hard casual row, and on the pause sheet.
- **H2. With an estimated max, effort leads.**
  - HR is shown, but "Build ▼" never appears when max HR comes from age.
  - In any push, "Build ▼" never appears in the first 90 s.
  - Pushes under 3 minutes are coached by effort and are not scored on time in zone.
  - If the zone is missed in 3 hard sessions in a row, the app offers to lower max HR. R37 now goes both ways.
- **H3. Heart-rate medication switches to effort-only coaching.** A "yes" to the medication question gives effort-only coaching on every row, plus a note to ask a doctor about HR targets.
- **H4. Health check aligned with the PAR-Q+.**
  - It keeps the official qualifiers and adds the over-45 and temporary-illness or pregnancy notes.
  - Nothing is pre-selected, and Continue is disabled until all seven are answered.
  - "Yes" to heart condition, chest pain or fainting blocks **every** row until "A doctor has cleared me". Other "yes" answers lock hard sessions only.
  - It also runs before the first casual row of any effort.
  - The wording goes to the coach review (U1).
- **H5. A locked hard session is replaced by an easy row that moves the ship**, so the voyage continues. Board 2.6 shows this. On the casual path, Hard is hidden.
- **H6. Long-break tiers (R60):**
  - 7–13 days: the choice, defaulting to "Pick up where I left off".
  - 14–27 days: the default becomes "Ease back in".
  - 28+ days: the plan goes back two weeks and the health check is asked again.
- **H7. One easy band, coach to confirm.**
  - Steady (4x4) and Easy (casual) become the same band, proposed at 60–70% (110–129 bpm at max 184).
  - Casual Intermediate becomes 70–80% and Hard 80–85%.
  - The casual path is described as "steady efforts", not polarized.
  - The push target follows R10 week by week.

#### Definitions (requirements and boards reviewers)

- **D1. A day is the device's local calendar day.** A session belongs to the day it started.
- **D2. The waiting session can be rowed on any day, rest days included.** The rest-day board gets "Row it now" as well as Row freely. Two consequences:
  - A rower who onboards on a non-rowing day can start the voyage at once.
  - At most one plan session per day (no stacking). R9 spacing still applies.
- **D3. Missed** means a rowing day ended with no completed plan session.
- **D4. A stop is one completed row. A landmark is a named place every few stops.**
  - The Beginner voyage is 23 stops.
  - The casual voyage uses the same 23 stops and reaches landfall in Reykjavík, then offers a new voyage.
  - Copy that says "one stop closer" is reworded wherever it is wrong (1.0, 2.3, 2.11).
- **D5. Two kinds of week.**
  - Plan weeks drive the program.
  - The weekly tally (R48) counts calendar weeks starting Monday.
  - Row freely counts toward the tally, but not toward the R60 gap or R9 spacing.
  - Partly rowed counts toward the tally only.
- **D6. Switching to the 4x4 path starts the plan at week 1** with the ship where it is. The route stretches so landfall comes at the end of the plan. Switching to Just row keeps the position.
- **D7. Short on time** counts as completing that hard session, but isn't allowed on the retest. The 1×4 session is 19 min (10 + 4 + 5).
- **D8. R9 fallback:** when the waiting session is hard and no easy row remains, today suggests rest or Row freely.

#### Scope and strategy (strategy and plan reviewers)

- **V1. v1 is for the builder plus about 5 TestFlight testers.** App Store release is a later milestone (M4), which adds legal review of the health check and the store listing. STRATEGY.md says so.
- **V2. Beginner only in v1.** Intermediate and Expert have no program (R11) and move to "Deferred". When the Beginner voyage ends, it offers a repeat or Just row.
- **V3. Retest by entered distance.**
  - A 12-minute steady benchmark row at a fixed drum rate in weeks 1 and 8.
  - The rower types the metres from their monitor. With a strap, HR is compared too.
  - With no monitor reading, the comparison is completion, enjoyment and effort.
  - The protocol goes to the coach review.
- **V4. Metrics export.** Settings gains "Export my rows (CSV)", so testers can send back their data. The strategy metrics are named "measured on testers' exports".
- **V5. Extra gates.**
  - Two rowers other than the builder try the M1 slice.
  - An M2 gate at weeks 4–6: is the builder still rowing about three times a week?
- **V6. Costs line in STRATEGY.md.** It lists the Apple Developer fee, the coach review, audio, art and legal review, with a fallback for each.
- **V8. Storage stays on the iPhone.**
  - It survives iPhone backups (iCloud Backup or Finder).
  - Deleting the app wipes the voyage; only the Apple Health workouts survive.
  - iCloud sync (CloudKit or an iCloud Drive file) is the first item after v1.
  - New requirement R64.
- **V7. Kept as you decided:** music detection, easy-row format rotation, and both orientations. The cuts the plan reviewer suggested are noted but not applied.

#### Build plan (plan reviewer)

- **B1. Ducking spike with the screen locked.** 20 cues, measuring how long the music takes to return to full volume. The fallback is written down now: no ducking, cues mixed over the music.
- **B2. Move the HR and rower interfaces and their fakes to U6.** M2 needs them.
- **B3. Narrow U5 to the slice's tokens.** Split U4 into U4a (scaffold, audio and Skia spikes, for M1) and U4b (BLE and HealthKit spikes, before M3). Test the maintained ble-plx fork first.
- **B4. Timing gaps:**
  - A monotonic clock within a session.
  - Re-mapping the audio clock after every interruption.
  - Cancelling scheduled cues on pause.
  - Checkpointing the session in progress, so a killed app doesn't lose the row.
- **B5. Missing work:**
  - App icon and splash.
  - Info.plist usage strings and the HealthKit entitlement.
  - Privacy policy and privacy label.
  - Crash logs.
  - One on-device migration smoke test.
  - Spiking HealthKit metadata and HR samples.
  - Naming who makes the art for M1 and for M3.
- **B6. Missing dependencies:** U17 needs U18, U8 and U11; U16 needs U13 and U15.
- **B7. Effort estimate in the plan:** M1 5–7 weeks, M2 9–12, M3 5–7 plus art.

#### Boards (design reviewer)

- **G1. Settings and health check:**
  - A Path row in Settings (2.2), with a confirm sheet saying "the ship stays where it is".
  - The health check (2.5) rebuilt per H4: nothing pre-selected, 44 pt toggles, `aria-pressed`.
- **G2. New boards:**
  - 2.1e, the easy-row card, with length edit, format swap and Short on time.
  - 2.11f and 3.11, the casual Row by feel picker and gauge.
  - 3.2b, ease-off per S2.
- **G3. Gauge:**
  - The zone chip is at least 22 pt, and adds session time remaining.
  - Push strip segments are taller than steady ones, and the warm-up pickups are shown.
  - "Recovering" loses its ↓ arrow.
- **G4. Scenes and color:**
  - Intermediate (3.10) gets visibly bigger swell and a different sky from Easy (3.4).
  - Today's dot is ink, not persimmon.
  - The two path cards on 1.0 carry equal weight.
- **G5. Fun outside rowing mode:**
  - A map strip with the ship on home (2.1, 2.11).
  - A landfall moment on 2.3: the landmark vignette and the ship arriving.
- **G6. The name field stays on 1.2.** It is used in greetings. The design reviewer suggested dropping it.
- **G7. Copy updates:**
  - Every caller mention: 1.3c, 2.7, 2.8, 3.1, 3.1p, 3.5, 3.5p and 2.2.
  - The 1.4 clash text is replaced by the R9 rule.
  - The flow chart node "caller counts last 5".

#### Small fixes (no decision needed)

- AE1 gets consistent numbers: HR in zone by 0:50.
- R14 rounds long rows to 5 minutes.
- R37 ignores spikes that last under 5 s.
- Citations corrected: Seiler, Jøranson, Olesen & Hetlelid 2013; Rønnestad 2015 (well-trained cyclists); a note that no cited study tested one hard session a week.
- Cool-down copy: "keep paddling, don't stand straight up".
- The plan title becomes "Rebuild Nor4x4 as an Expo rowing voyage".

### Phase A — Requirements and strategy

- **`docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`:**
  - S1–S6, H1–H7, D1–D8, V2, V3, and the small fixes.
  - Updated: R2, R4, R5, R9, R11, R12, R14, R21, R23, R30, R35–R38, R40, R41, R44–R51, R55–R60, F2, F4, F5, AE1, AE4, AE9.
  - New requirements: R61 (stop warning), R62 (definitions of day and stop), R63 (metrics export), R64 (storage).
  - New examples: AE16–AE19 for the health-check blocks, a first row on a rest day, the long-break tiers and lowering max HR.
- **`STRATEGY.md`:** V1, V4, V5, V6; a retest metric that matches V3; "The voyage" track loses "caller".

### Phase B — Boards and flow chart

- **Boards:** G1–G7, S2/S5 (3.2b), H1 (stop warning on 3.1 and 3.5), H5 (2.6), D2 ("Row it now" on 2.4), and the D4 copy.
- **Retest:** 2.10 shows the distance-based result from V3.
- **Flow chart:** a first row on any day, the long-break tiers, the health-check blocks, and no caller.
- **Regenerate:** `screens/`, then update the README board table.

### Phase C — Build plan

**`docs/plans/2026-10-29-001-feat-nor4x4-expo-rebuild-plan.md`:**
- B1–B7 and V2 (Beginner-only content in U9).
- V5 gates in the milestones table, and M4 (App Store) as a follow-up.
- Unit test scenarios for H2, H3, H6, D1–D8 and S3.
- Title fix.

### Verification

```
python3 -I docs/design/tools/check_boards.py docs/design/canvas-source      # All boards pass
python3 -m unittest discover -s docs/design/tools                           # OK
grep -rni "caller" docs STRATEGY.md                                         # only the deferred mention
grep -n "R6[1-3]\|AE1[6-9]" docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md
```
Plus: a script checks every R and AE ID appears in the plan; every changed or new board rendered and viewed; flow chart rendered.

## Done · scope decisions: PM5 after v1, missed sessions wait (Phases A–C, completed 2026-10-31)

Goal: apply the scope decisions from 2026-10-31 to the requirements, boards, flow chart and build plan. Docs and design only; no app code.

### Decisions (from you, 2026-10-31)

- **PM5 support moves after v1.** A3, first-stroke start, stroke-based auto-pause, pace retests and measured stroke rate all go to "Deferred for later". The sensor interface stays, so PM5 can be added without changing the design.
- **Missed sessions push the plan back.** Nothing moves to another day; the rower starts where they left off. The next unfinished session is the one shown on the next rowing day, and the voyage simply takes longer.
- **The ship moves only when the rower actually rows.**
  - A skipped day never moves the ship, whichever long-break choice is made.
  - "Ease back in" inserts last week's sessions into the route again. Each one moves the ship when it is rowed, so the voyage gains that many stops.
- **Easy-row format rotation stays** (R13, R16).
- **Music detection stays** (R41).

### Consequences to confirm (change any before I start)

1. **Hard-day spacing (R9) needs one rule** now that sessions follow the rower, not the calendar: if the rower's last row was a hard session yesterday, today's hard session swaps with the next easy row. Without it, rowing Mon then Tue can put two hard sessions back to back.
2. **Runna-style choice after a long break.**
   - **Trigger:** 7 or more days without a row on the 4x4 path. At three rows a week that's about three missed sessions, the same point where Runna prompts.
   - **"Pick up where I left off"** is the default, and follows the guiding principle.
   - **"Ease back in"** repeats the previous week first, because returning straight to the same intensity is what Runna flags as an injury risk.
   - **Left out: "skip ahead".** The ship moves only on rows actually completed, so skipping would sail it past sessions never rowed.
   - **Shorter gaps** don't prompt. **The casual path** never prompts.
   - **Where it shows:** a sheet on home; the 2.4 rest-day board gets a variant (2.4b) showing it.
   - **In the requirements:** a new R60 and AE15.
3. **Stroke rate without a PM5 is the drum's target, not a measurement.** With PM5 deferred, nothing measures strokes. So:
   - The gauge shows the target ("Drum 26–28 spm"), not a measured "27 spm".
   - Session complete drops "average stroke rate".
   - Retests compare heart rate at the same drum rate, which assumes the rower follows the drum.
4. **Board 3.1e (Get seated, PM5)** moves to `docs/design/deferred/` with a README line, so it isn't lost and isn't built in v1.

### Phase A — Requirements

`docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`:
- **Rewrites:**
  - R21 becomes "a missed session waits; the plan pushes back".
  - R9 adds the swap rule.
  - R23 drops "first stroke with a PM5"; it uses the hold timer or "Start now".
  - R29 and R44 change the stroke rate to the drum's target.
  - R32 drops PM5 auto-pause; a long press pauses.
  - R45 drops pace, and heart rate is compared at the same drum rate.
  - R6 and R47 change the pairing to a heart-rate strap only.
- **Actors:** A3 moves to Deferred.
- **Flows:** F2 updated; F4 rewritten.
- **Examples:** AE5, AE6, AE9 and AE10 rewritten; AE10 becomes the long-press pause.
- **New:** R60, the choice after a long break, with AE15.
- **Key Decisions:** "Progress follows completed sessions" gains "missed sessions wait".

### Phase B — Boards and flow chart

- **Stroke rate shown as the drum's target:** 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10 and the portrait boards.
- **2.3 Session complete and 2.9 Partly rowed:** "average stroke rate" is replaced by another stat, either pushes completed or time in steady.
- **2.10 Voyage complete:** the retest compares heart rate at the same drum rate.
- **2.4 Rest day:** "Moved from Wed" becomes "Waiting from Wed · the voyage picks up here".
- **New 2.4b Welcome back:** home after 8 days away, with the long-break sheet ("Pick up where I left off" / "Ease back in").
- **PM5 removed from:** 2.7 (the PM5 row), 2.2 Settings (Rowing monitor), and 3.5 / 3.5p Pause if they mention it.
- **3.1e:** moved to `docs/design/deferred/` and removed from `boards.json`.
- **Flow chart:** `docs/design/flow-start.html` drops the PM5 decision, and the missed-session box reads "the next session waits".
- **Regenerate:** `screens/` and the README board table.

### Phase C — Build plan

`docs/plans/2026-10-29-001-feat-nor4x4-expo-rebuild-plan.md`:
- **U11 scheduler shrinks** to the waiting session, the spacing swap, the long-break choice and the route position.
- **U21** covers the heart-rate strap only. PM5 moves to Deferred, and the spike checks only the H10.
- **KTD12** (PM5 parser) moves to Deferred.
- **U6** drops stroke-based start and pause, and its test scenarios change to match.
- **Scope trims:** the "not decided" list is replaced by the decisions above.

### Verification

```
python3 -I docs/design/tools/check_boards.py docs/design/canvas-source      # All boards pass
python3 -m unittest discover -s docs/design/tools                           # OK
grep -rn "PM5" docs/design/canvas-source docs/brainstorms docs/plans        # only deferred mentions
grep -rn "Moved from" docs/design/canvas-source                             # no output
```
Plus: every changed board rendered and viewed; flow chart rendered.

## Done · casual voyage path (Phases A–C, completed 2026-10-31)

Goal: let a rower skip the 4x4 program and just row, while still sailing the voyage, and open onboarding with the voyage instead of a training explainer. Requirements and design only; no app code.

### Decisions (from your answers, 2026-10-30)

- **Two paths, one choice on the first screen:** "Train with the 4x4" or "Just row".
- **Casual path has its own voyage:** same Bergen → Iceland route; every completed casual row moves the ship one stop, whatever the effort.
- **Effort is picked before each casual row:** Easy, Intermediate, Hard, plus length (20 / 30 / 45 / 60 min). The last choice is remembered.
- **No schedule on the casual path:** no rowing days, no weekly target, no missed sessions. Home counts rows this week without a target.
- **Max HR is optional on the casual path** ("Row by feel" skips it; the gauge then gives effort guidance, as on board 3.6).
- **Dynamic visuals:** the scene follows the chosen effort: calm water (Easy), open swell (Intermediate), rough water and spray (Hard).

### Proposed defaults (change any before I start)

1. **Effort zones** (% of max HR; bpm for max 184): Easy 55–65% (101–120), Intermediate 65–75% (120–138), Hard 75–85% (138–156). Each is one steady row, not intervals.
2. **Health check before the first Hard casual row**, the same as before the first 4x4 hard session (Hard reaches 85%). A "yes" hides Hard; Easy and Intermediate stay open.
3. **Switching paths** happens in Settings and keeps the ship where it is. How the 4x4 program maps onto a ship already partway along goes to Outstanding Questions for planning.
4. **4x4 onboarding becomes 5 screens:** voyage choice, method, level, max HR, week. Casual onboarding is 2: voyage choice, then optional max HR.

### Phase A — Requirements

`docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`:
- R1 rewritten for the two paths; R2 gains "your voyage builds up to this"; R5 adds the Hard casual row; R48 notes the casual tally has no target.
- New R55–R59: casual path choice, casual voyage movement, per-row effort and length, effort-following scene, path switching in Settings.
- New flow F5 (casual first launch to first row) and acceptance examples AE12–AE14.
- Key Decisions: "Two paths, one voyage."

### Phase B — Boards

- New 1.0 `ShuimoVoyage`: "Row from Bergen to Iceland", the route sketch, two path cards.
- 1.1 `ShuimoMethod` reworked: voyage framing, "Beginners start with 1-minute pushes and build up over eight weeks."
- 1.3 `ShuimoHeart`: casual variant 1.3c with "Row by feel" skip.
- New 2.11 `ShuimoHomeCasual`: rows this week (no target), effort picker (Easy / Intermediate / Hard with bpm), length chips, Set out, route.
- New 3.9 `ShuimoRowHard` and 3.10 `ShuimoRowSwell`: casual Hard (rough water) and Intermediate (swell) rowing boards. Easy reuses 3.4's calm scene.
- Step labels: drop "Step N of 4" counts, since the two paths have different lengths; the progress bar stays per path.
- `boards.json` entries; checker and snapshot unchanged.

### Phase C — Index and flow

- Regenerate `docs/design/screens/`, update `docs/design/README.md` (board table, sample data for the casual rower).
- Update the start flow chart with the path split, and save it to `docs/design/flow-start.html` so it lives with the boards.

### Verification

```
python3 -I docs/design/tools/check_boards.py docs/design/canvas-source     # All boards pass
python3 -m unittest discover -s docs/design/tools                          # OK
grep -n "R5[5-9]\|F5\|AE1[2-4]" docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md
```
Plus: every new board viewed, and the flow chart rendered and checked against R1 and F5.

## Done · design redesign pass (Phases 1–5, completed 2026-10-30)

Goal: bring `docs/design/` in line with the updated requirements (`docs/brainstorms/2026-10-29-nor4x4-rebuild-requirements.md`) so the build plan can point at boards that are correct. Design only; no app code.

### Decisions needed before Phase 2

1. **Gauge size (R29) — decided: 9 mm time / 6 mm HR (75 / 50 pt), corner panel about 224 pt wide.** 12 mm / 8 mm (100 / 66 pt) was tried on 3.2 and made the panel a third of the screen.
2. **R10 vs R15 conflict — decided and applied.** The R10 table's Easy rows column is a count; length comes from the remembered choice.

### Canonical example (all boards use this)

- Rower: Beginner, age 34 → max 184 bpm. Push zone 156–175, Steady 105–120.
- Days Mon · Wed · Sat, remembered easy-row length 30 min.
- Today: **week 3, Wednesday**, hard session **3×3′ / 3′ at 85–90% (156–166 bpm), 30 min**. Mon was an easy row (done), Sat is the long row, 45 min.
- Route: Bergen → Shetland → Faroe Islands → Iceland with real stops (e.g. Fedje, Lerwick, Fair Isle, Tórshavn, Mykines, Vestmannaeyjar, Reykjavík). Week 3 sits between Lerwick and Fair Isle.

### Phase 1 — Tooling and data

- `docs/design/tools/snapshot.py`: board list becomes data-driven (number, slug, file, width, height); supports portrait rowing boards (390 × 844) and the new boards.
- `docs/design/tools/check_boards.py` (new): fails if any board contains stale data (flags `The 4-min intro`, `Foundations`, `Stone bridge`, `Pine gorge`, `Instruments` in onboarding, `Tap anywhere to pause`) or a rowing board whose time/HR font size is below the Decision 1 value.
- Verify: `python3 -I docs/design/tools/check_boards.py docs/design/canvas-source` lists every current board as failing (proves the check works).

### Phase 2 — Rowing mode (landscape), gated

Edit in `docs/design/canvas-source/`:
- `ShuimoRow` (3.2): gauge to Decision 1 size, time remaining, zone word + shape (R50), progress strip ≥ 12 pt (R31), "Hold anywhere to pause" (R32).
- **Gate:** export 3.2 at 3×, you view it on your phone on the holder at 1 m. Continue only on your OK.
- `ShuimoHorn` (3.3): full-screen pulse + large banner as the horn's visual twin (R51); caller line as on-screen text.
- `ShuimoEasy` (3.4): steady zone with word + shape, time remaining, leg scenery label (R28).
- `ShuimoPause` (3.5): Resume, Restart this push, sound mode, End session with hold-to-confirm (R32); music notice (R41).
- `ShuimoCountdown` → `ShuimoGetSeated` (3.1a–d, hold timer) and `ShuimoGetSeatedPM5` (3.1e, waits for first stroke); caller's final 5 (R23).
- New `ShuimoNoStrap` (3.6): effort guidance "7–8 of 10 · single words only" (R30, AE7); new `ShuimoStrapLost` (3.7).
- New `ShuimoRowFreely` (3.8): open-ended easy row showing time rowed, "doesn't move the ship" note (R20). R52 now states this exception.

### Phase 3 — Rowing mode (portrait)

New portrait boards 3.1p, 3.2p, 3.3p, 3.5p (`Shuimo*Portrait`, R33): same content, bottom-band panel, time 96 pt and HR 56 pt.

### Phase 4 — Home, onboarding, session end

- Onboarding is 4 steps: `ShuimoCrew` removed; `ShuimoWeek` is 1.4 (three-day pick, clash variant, first week from R10 week 1). Method, Level (self-check lines), Heart show "of 4".
- 2.1 `ShuimoHome`: canonical week 3, today's card (R19), tally (R48), real landmarks.
- 2.2 `ShuimoSettings`: full R47 list, Sensors section.
- 2.3 `ShuimoLandfall`: R44 stats, coaching line, 1–5 rating (R53), ship moved on the route.
- 2.4 `ShuimoRestDay`: rest day with Row freely (R49), and the F4 "Moved from Wed" shift.
- 2.5 `ShuimoHealth` and 2.6 `ShuimoHealthLocked` (R5, AE8).
- 2.7 `ShuimoStrapPrompt` and 2.8 `ShuimoStrapBluetooth` (R6).
- 2.9 `ShuimoPartly` (R54, AE11) and 2.10 `ShuimoVoyageEnd` (R22, R45).

### Phase 5 — Snapshot and index

- Regenerate `docs/design/screens/` (old 1.4 instruments PNG removed, replaced by new numbering).
- Rewrite the board table in `docs/design/README.md` with the R-IDs each board covers and an empty "Not yet designed" list.
- Republishing the live canvas artifact is optional and needs your say-so; the repo copy is the source of truth.

### Verification (exact commands)

```
python3 -I docs/design/tools/check_boards.py docs/design/canvas-source          # passes after Phase 4
python3 -I docs/design/tools/snapshot.py docs/design/canvas-source docs/design/screens /private/tmp/claude-501/-Users-davidhe-Dev-nord4x4/cd5bbc82-bc68-4117-81db-389aef3e0f46/scratchpad/snap
grep -rnE "4-min intro|Foundations|Stone bridge|Pine gorge" docs/design/canvas-source   # no output
```

Plus: I view every regenerated PNG and report per board which R-IDs it shows; you do the 1 m phone check at the Phase 2 gate.

### Out of scope

Plan doc update (next task), app code, audio, final illustration assets.
