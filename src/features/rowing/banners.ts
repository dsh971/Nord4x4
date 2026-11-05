import type { SignalKind } from '../../services/audio/signalSounds';

/** A signal's banner: about 3 s of text, readable at 1 m, shown as its sound plays (R40). */
export type Banner = { readonly text: string; readonly hasEdgePulse: boolean };

/**
 * Each signal's banner, as in the R40 table. Null where the visual twin follows state instead: the
 * count-in shows Get seated's big numbers, and the ease-off shows the glow and the "Ease off ▲" chip
 * for as long as HR stays high (EaseOffState).
 */
export const SIGNAL_BANNERS: Record<SignalKind, Banner | null> = {
  countIn: null,
  horn: { text: 'Ready oars', hasEdgePulse: true },
  pushStart: { text: 'Pull', hasEdgePulse: false },
  holdEffort: { text: 'Hold this effort', hasEdgePulse: false },
  pushEnd: { text: 'Rest', hasEdgePulse: false },
  easeOff: null,
};
