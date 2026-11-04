# Spike — native modules (U4a, M1 Phase C)

**Run:** 2026-11-04, by David, on an iPhone 16 Pro Max (iOS 26.6.1). Dev build from Xcode 27.2 with Spotify as the other app's music. The checks are on the dev-only screen `app/dev/spike.tsx` (`src/dev/spike/`).

**Verdict:** all five checks pass; check 3's foreground re-read is still to confirm. KTD9 ducking uses the switch-options release (Trial A).

| # | Check | Plan item | Result |
|---|---|---|---|
| 1 | Two loops plus a one-shot over Spotify | KTD7 | Pass |
| 2 | 20 ducked cues with the screen locked | KTD9 (P1 risk) | Pass with Trial A; Trial B rejected |
| 3 | Other-audio hint | KTD8 | Pass on open; foreground re-read not yet confirmed |
| 4 | Silent mode suspends, and time recovers | KTD5, KTD19 | Pass |
| 5 | Full-screen shader | KTD6 | Pass: 120 fps |

## 1 · Mixing (KTD7)

The drum loop (one taiko hit per stroke at 27 spm), the calm-sea loop and the war-horn one-shot play on one `AudioContext` with the session in `playback` + `mixWithOthers`. Spotify keeps playing underneath at full volume.

## 2 · Ducking (KTD9)

Each cue switches the session to `duckOthers`, plays the horn (5.2 s with its tail), releases the duck, and checks that our audio clock still runs. Both trials ran with the screen locked.

- **Trial A, switch options:** release by switching back to `mixWithOthers` while the session stays active. Spotify dips to a quieter but audible level during the horn and returns to full volume after it.
- **Trial B, deactivate:** release by deactivating the session (`notifyOthersOnDeactivation`) and reactivating it. Spotify drops nearly to silence during the horn.

**Decision:** use Trial A. Signals switch the session to `duckOthers`, play, and switch back to `mixWithOthers`; the session is never deactivated mid-row. The no-ducking fallback is not needed.

Not measured: the exact time back to full volume (reported as "comes back afterwards", not timed).

## 3 · Other-audio hint (KTD8)

The `modules/other-audio` Swift module reads `secondaryAudioShouldBeSilencedHint`. With Spotify playing, it reads "playing". The change event and the re-read on return to the foreground were wired up, but their results were not reported separately.

## 4 · Silent stretch (KTD5, KTD19)

Our audio was stopped and the session deactivated, then the phone stayed locked.

| Measure | Value |
|---|---|
| Wall time | 981 s |
| `performance.now()` elapsed | 981 s (lag −61 ms) |
| 1 s ticks that ran | 15 |

iOS suspended the app about 15 s after the lock (15 ticks out of ~981), and `performance.now()` kept counting through the suspension. **KTD5 stands as written:** session time from `performance.now()` survives Silent mode, and no native continuous clock is needed.

## 5 · Shader (KTD6)

The Skia ink-wash `RuntimeEffect` (four sine layers plus grain) runs full-screen at 120 fps on the ProMotion display, with a lowest second of 119 fps and 1 frame slower than 17.7 ms in the run.

Not measured: a 60 Hz phone. Older devices are tested with the full scene in U7.

## Toolchain notes

- Xcode 27.2 (Swift 6.4.2) is required: Xcode 26.2 cannot compile `expo-modules-jsi` 58.0.22.
- Free signing with a Personal Team; the profile expires after 7 days, and the phone must trust the developer certificate.
- A stale bundle on the phone showed a worklets version mismatch (0.13.0 vs 0.13.1); `npx expo start --dev-client --clear` and a reload fixed it.
- Maestro 2.12.1 needs `JAVA_HOME=/opt/homebrew/opt/openjdk@21`.
