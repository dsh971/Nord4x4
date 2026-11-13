import type { SignalKind } from '../../services/audio/signalSounds';

/** A signal's banner: about 3 s of text, readable at 1 m, shown as its sound plays (R40). */
export type Banner = { readonly text: string; readonly hasEdgePulse: boolean };

/**
 * Each signal's banner, as in the R40 table. Null where the visual twin follows state instead: the
 * count-in shows Get seated's big numbers, and the ease-off shows the glow and the "Ease off ▲" chip
 * for as long as HR stays high (EaseOffState). The horn has none: the warning (WARNING_BANNERS),
 * up since 10 s before the push or pickup, is its twin.
 */
export const SIGNAL_BANNERS: Record<SignalKind, Banner | null> = {
  countIn: null,
  horn: null,
  pushStart: { text: 'Pull', hasEdgePulse: false },
  pickupStart: { text: 'Pickup', hasEdgePulse: false },
  holdEffort: { text: 'Hold this effort', hasEdgePulse: false },
  pushEnd: { text: 'Rest', hasEdgePulse: false },
  pickupEnd: { text: 'Back to easy', hasEdgePulse: false },
  easeOff: null,
};

/**
 * The silent warning before a push or pickup, with the edge pulse: up from 10 s before it until it
 * starts, so it covers the horn at 6 s (R40, R51). It follows session time rather than a cue.
 */
export const WARNING_BANNERS: Record<'push' | 'pickup', Banner> = {
  push: { text: 'Ready oars', hasEdgePulse: true },
  pickup: { text: 'Pickup coming', hasEdgePulse: true },
};
