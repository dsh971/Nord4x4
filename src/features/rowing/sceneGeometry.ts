import type { CanvasSize } from '../../design/fitTransform';

/** A point in the painting's frame. */
export type FramePoint = { readonly x: number; readonly y: number };

/** Board 3.2's frame: the painting is laid out in it, then scaled to the screen. */
export const SCENE_FRAME: CanvasSize = { width: 844, height: 390 };

/** In portrait the scene fills this share of the screen's top, and the gauge band sits below (3.2p). */
export const PORTRAIT_SCENE_SHARE = 0.6;

/** How far above the frame the sky runs, so a portrait screen fits the width and fills up. */
export const SKY_TOP = -3 * SCENE_FRAME.height;

/** The dragon prow's foot, where the deck's edges meet and the mast stands. */
export const PROW = { x: 422, y: 200 } as const;

/** The dragon's head, the neck's last point; the sail must clear it, as on boards 3.2 and 3.2p. */
export const PROW_HEAD: FramePoint = { x: 480, y: 80 };
export const PROW_NECK_WIDTH = 9;
export const PROW_NECK = `M422 205 C 418 150 420 110 446 92 C 462 82 474 86 ${PROW_HEAD.x} ${PROW_HEAD.y}`;

/** A point on the near hill's crest, right of the sail; landscape must keep it in view (board 3.2). */
export const NEAR_HILL_CREST: FramePoint = { x: 700, y: 12 };
export const NEAR_HILLS = `M520 205 L 560 150 C 610 60 650 20 ${NEAR_HILL_CREST.x} ${NEAR_HILL_CREST.y} C 760 4 800 30 844 70 L 844 205 Z`;

/**
 * The square sail overhead, hung from a yard over the mast: a little wider than the old band at its
 * foot, wider still at the yard, its sides bowed out and its foot sagging, as a full sail looks from
 * the deck. Landscape shows only its foot under the top edge; portrait shows it whole.
 */
export const SAIL = {
  centreX: PROW.x,
  yardY: -380,
  footY: 50,
  yardHalfWidth: 275,
  footHalfWidth: 242,
  // How far the sides bow out and the foot sags at their middles.
  bow: 16,
  sag: 14,
} as const;

/** The yard the sail hangs from, overhanging it a little, and the mast standing behind both. */
export const YARD = {
  left: SAIL.centreX - SAIL.yardHalfWidth - 30,
  right: SAIL.centreX + SAIL.yardHalfWidth + 30,
  y: SAIL.yardY,
  width: 9,
} as const;
export const MAST = { x: PROW.x, top: SAIL.yardY - 40, foot: 320, width: 4 } as const;

/** A quadratic curve's three points: where it starts, the point it bends toward, and where it ends. */
export type QuadraticCurve = {
  readonly from: FramePoint;
  readonly control: FramePoint;
  readonly to: FramePoint;
};

/** The point a share `t` (0 to 1) along a quadratic curve. */
export function pointOnCurve({ from, control, to }: QuadraticCurve, t: number): FramePoint {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  };
}

const SAIL_MID_Y = (SAIL.yardY + SAIL.footY) / 2;
const SIDE_HALF_WIDTH = (SAIL.yardHalfWidth + SAIL.footHalfWidth) / 2;

// A quadratic curve reaches half its control point's offset, hence twice the bow and sag.
function sideAt(share: number): QuadraticCurve {
  const across = (halfWidth: number) => SAIL.centreX + (2 * share - 1) * halfWidth;
  return {
    from: { x: across(SAIL.yardHalfWidth), y: SAIL.yardY },
    control: { x: across(SIDE_HALF_WIDTH + 2 * SAIL.bow), y: SAIL_MID_Y },
    to: { x: across(SAIL.footHalfWidth), y: SAIL.footY },
  };
}

/** The sail's outline: its right side, its sagging foot, and its left side back up to the yard. */
export const SAIL_OUTLINE = {
  right: sideAt(1),
  foot: {
    from: sideAt(1).to,
    control: { x: SAIL.centreX, y: SAIL.footY + 2 * SAIL.sag },
    to: sideAt(0).to,
  },
  left: sideAt(0),
} as const satisfies Record<string, QuadraticCurve>;

const quadraticTo = ({ control, to }: QuadraticCurve) =>
  `Q ${control.x} ${control.y} ${to.x} ${to.y}`;

/** The sail as an SVG path, straight along the yard. */
export const SAIL_PATH = [
  `M ${SAIL_OUTLINE.left.from.x} ${SAIL.yardY}`,
  `L ${SAIL_OUTLINE.right.from.x} ${SAIL.yardY}`,
  quadraticTo(SAIL_OUTLINE.right),
  quadraticTo(SAIL_OUTLINE.foot),
  `Q ${SAIL_OUTLINE.left.control.x} ${SAIL_OUTLINE.left.control.y} ${SAIL_OUTLINE.left.from.x} ${SAIL.yardY}`,
  'Z',
].join(' ');

// Nine bands across the sail, red on the odd ones: four red stripes between five of cloth.
const BANDS = 9;

/**
 * The red stripes as SVG paths, their edges bowing with the cloth's sides. They run past the foot;
 * draw them clipped to the sail, which trims them to its sagging foot.
 */
export const SAIL_STRIPE_PATHS = Array.from({ length: (BANDS - 1) / 2 }, (_, index) => {
  const left = sideAt((2 * index + 1) / BANDS);
  const right = sideAt((2 * index + 2) / BANDS);
  const below = SAIL.footY + 2 * SAIL.sag;
  return [
    `M ${left.from.x} ${left.from.y}`,
    `L ${right.from.x} ${right.from.y}`,
    quadraticTo(right),
    `L ${right.to.x} ${below} L ${left.to.x} ${below} L ${left.to.x} ${left.to.y}`,
    `Q ${left.control.x} ${left.control.y} ${left.from.x} ${left.from.y}`,
    'Z',
  ].join(' ');
});
