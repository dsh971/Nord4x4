---
name: Nor4x4
last_updated: 2026-10-31
---

# Nor4x4 Strategy

## Target problem

Rowing on a home machine is monotonous, especially on rowers with no monitor, so people stop. Guided workouts make it engaging, but they sit behind subscriptions or connected hardware.

## Our approach

Make every row a scene in a viking voyage, not a class. Story, sound, and progress along the route carry the motivation, so it works on any rower, free, with no instructor, subscription, or connected hardware; the training plan runs underneath so the voyage actually builds fitness.

## Who it's for

**Primary:** Home rowers training for general health, cardio, and stamina — rowing about twice a week today and aiming for three. They're hiring Nor4x4 to make each row engaging enough to keep showing up, and to turn casual rowing into a guided path toward the 4x4 and a better VO₂max. (The first of them is the builder.)

**Secondary:** Casual rowers who just want an enjoyable row with no program (the "Just row" path: steady efforts, no schedule).

**v1 audience:** the builder plus about 5 TestFlight testers. An App Store release is a later milestone, and it needs legal review of the health check and a store listing.

## Key metrics

- **Sessions per week** - completed sessions per week, 4-week average; target 3. In-app session records, read from testers' "Export my rows" CSVs.
- **Session enjoyment** - 1–5 rating after each row, weekly average; tests the role-play bet. In-app, post-session, read from the same exports.
- **Retest improvement** - distance in the 12-minute benchmark row, week 8 vs week 1, typed in from the rower's monitor (plus average HR when a strap is worn); tests that the training works. Rowers with neither give no fitness signal, and the metric says so.

Each metric is reported per path (4x4 and Just row), so it's clear which path is working.

**Gates on the bet:** the rowable slice is tried by the builder and two other rowers before the rest is built, and at weeks 4–6 of daily use the builder should still be rowing about three times a week.

## Tracks

### The voyage

The role-play experience itself: scene, sound (horn, drum, crew), route, and landfalls.

_Why it serves the approach:_ Role play is the main thing, so this gets the most investment.

### Hands-free rowing

Works on any rower with no monitor: legible from the seat, audio-first cues, start and pause without touching the phone, full no-sensor support.

_Why it serves the approach:_ "Any rower, no connected hardware" only holds if the app works at 1 m with sweaty hands and no sensors.

### Training underneath

The polarized 4x4 program, scheduling, and heart-rate coaching, kept simple and serving the voyage.

_Why it serves the approach:_ The voyage has to build real fitness, or the motivation runs out when results don't show.

## Not working on

- Paid features or subscriptions — the app stays free.
- Live instructors or filmed video — the voyage replaces the coach.
- Social features, accounts, and leaderboards.
- Android and an Apple Watch app — iOS phone first.
- Accounts or a server — data stays on the iPhone; iCloud sync comes after v1.

## Costs

Free to users, so every cost is the builder's:

| Cost | Plan | Fallback |
|---|---|---|
| Apple Developer Program (needed for TestFlight) | Pay the annual fee | None; required |
| Coach review of the program and health check | One paid review before program work | A qualified friend, with the numbers kept conservative |
| Sound (horn, drum, crew, bells) | Royalty-free or CC0 libraries, plus recordings of friends for the crew | Library sounds only |
| Final illustration and animation art | Commissioned or self-made, after the slice proves the bet | Placeholder paintings, polished by the builder |
| Legal review of the health check | Only before an App Store release | No store release |
