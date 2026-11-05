import type { SegmentType } from '../../domain/session/sessionPlan';

/** Perceived-effort coaching for when bpm can't be used (R30): a 1–10 effort and a talk test. */
export type EffortGuide = {
  readonly effort: string;
  /** How much breath the rower has for talking, e.g. "Single words only". */
  readonly speech: string;
  readonly talkTest: string;
};

const HARD: EffortGuide = {
  effort: '7–8',
  speech: 'Single words only',
  talkTest: "Talk test: you can't finish a sentence.",
};
const STEADY: EffortGuide = {
  effort: '5–6',
  speech: 'Short sentences',
  talkTest: 'Talk test: you can talk, but not sing.',
};
// Draft copy: the boards only show the hard and steady guides. The coach reviews all three (R17).
const EASY: EffortGuide = {
  effort: '3–4',
  speech: 'Full sentences',
  talkTest: 'Talk test: you could chat the whole way.',
};

/** The effort guide the gauge shows for each kind of segment. */
export const EFFORT_GUIDES: Record<SegmentType, EffortGuide> = {
  push: HARD,
  pickup: HARD,
  steady: STEADY,
  warmUp: EASY,
  rest: EASY,
  easy: EASY,
  coolDown: EASY,
  benchmark: EASY,
  open: EASY,
};
