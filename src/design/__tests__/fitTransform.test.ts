import { fitTransform, type CanvasSize } from '../fitTransform';

const FRAME: CanvasSize = { width: 844, height: 390 };

describe('fitTransform', () => {
  it('fits the width and sits the frame on the bottom edge, leaving the top to fill', () => {
    const canvas: CanvasSize = { width: 402, height: 524 };
    const [x, y, s] = fitTransform(canvas, FRAME, 'width');
    expect(FRAME.width * s.scale).toBeCloseTo(canvas.width);
    expect(x.translateX).toBeCloseTo(0);
    expect(y.translateY + FRAME.height * s.scale).toBeCloseTo(canvas.height);
  });

  it('fills a landscape phone, cropping only the overflow, centred', () => {
    const canvas: CanvasSize = { width: 874, height: 402 };
    const [x, y, s] = fitTransform(canvas, FRAME, 'cover');
    expect(FRAME.width * s.scale).toBeGreaterThanOrEqual(canvas.width - 1e-9);
    expect(FRAME.height * s.scale).toBeGreaterThanOrEqual(canvas.height - 1e-9);
    expect(x.translateX * 2 + FRAME.width * s.scale).toBeCloseTo(canvas.width);
    expect(y.translateY * 2 + FRAME.height * s.scale).toBeCloseTo(canvas.height);
  });

  it('shows the whole frame when containing it', () => {
    const [x, , s] = fitTransform(
      { width: 600, height: 180 },
      { width: 300, height: 180 },
      'contain',
    );
    expect(s.scale).toBe(1);
    expect(x.translateX).toBe(150);
  });
});
