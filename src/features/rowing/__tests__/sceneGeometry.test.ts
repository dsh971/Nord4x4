import { fitTransform, type CanvasSize } from '../../../design/fitTransform';
import {
  MAST,
  NEAR_HILL_CREST,
  PORTRAIT_SCENE_SHARE,
  PROW_HEAD,
  PROW_NECK_WIDTH,
  SAIL_OUTLINE,
  SCENE_FRAME,
  YARD,
  pointOnCurve,
  type FramePoint,
  type QuadraticCurve,
} from '../sceneGeometry';

function toScreen(canvas: CanvasSize, mode: 'width' | 'cover', point: FramePoint): FramePoint {
  const [x, y, s] = fitTransform(canvas, SCENE_FRAME, mode);
  return { x: x.translateX + point.x * s.scale, y: y.translateY + point.y * s.scale };
}

function samples(curve: QuadraticCurve): FramePoint[] {
  return Array.from({ length: 101 }, (_, step) => pointOnCurve(curve, step / 100));
}

// The highest and widest things drawn: the mast's tip and the yard's rounded ends.
const mastTip = { x: MAST.x, y: MAST.top };
const yardEnds = [YARD.left - YARD.width / 2, YARD.right + YARD.width / 2].map((x) => ({
  x,
  y: YARD.y - YARD.width / 2,
}));

describe('the sail overhead', () => {
  it.each([
    ['iPhone SE', { width: 375, height: 667 }, 20],
    ['iPhone 13 mini', { width: 375, height: 812 }, 50],
    ['iPhone 16 Pro', { width: 402, height: 874 }, 62],
    ['iPhone 16 Pro Max', { width: 440, height: 956 }, 62],
  ])(
    'shows whole in portrait on an %s, mast tip and yard below the status bar',
    (_, screen, topInset) => {
      const scene = { width: screen.width, height: screen.height * PORTRAIT_SCENE_SHARE };
      expect(toScreen(scene, 'width', mastTip).y).toBeGreaterThan(topInset);
      for (const end of yardEnds) {
        const onScreen = toScreen(scene, 'width', end);
        expect(onScreen.y).toBeGreaterThan(topInset);
        expect(onScreen.x).toBeGreaterThanOrEqual(0);
        expect(onScreen.x).toBeLessThanOrEqual(scene.width);
      }
    },
  );

  it("hangs clear of the dragon's head, as boards 3.2 and 3.2p show it", () => {
    const lowestFoot = Math.max(...samples(SAIL_OUTLINE.foot).map((point) => point.y));
    expect(lowestFoot).toBeLessThan(PROW_HEAD.y - PROW_NECK_WIDTH / 2);
  });

  it("leaves the near hill's crest in view to its right, as board 3.2 does", () => {
    const edgeAtCrest = samples(SAIL_OUTLINE.right).reduce((nearest, point) =>
      Math.abs(point.y - NEAR_HILL_CREST.y) < Math.abs(nearest.y - NEAR_HILL_CREST.y)
        ? point
        : nearest,
    );
    expect(edgeAtCrest.x).toBeLessThan(NEAR_HILL_CREST.x - 20);
  });

  it('shows only its foot under the top edge in landscape', () => {
    const landscape: CanvasSize = { width: 874, height: 402 };
    expect(toScreen(landscape, 'cover', mastTip).y).toBeLessThan(0);
    for (const end of yardEnds) {
      expect(toScreen(landscape, 'cover', end).y).toBeLessThan(0);
    }
    expect(toScreen(landscape, 'cover', SAIL_OUTLINE.foot.to).y).toBeGreaterThan(0);
  });
});
