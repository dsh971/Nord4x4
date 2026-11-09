import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/** A drawing area's size, in points. */
export type CanvasSize = { readonly width: number; readonly height: number };

/** How a drawing frame is scaled onto a canvas. */
export type FitMode = 'contain' | 'cover' | 'width';

/** A translate-then-scale transform, in the form Skia's Group takes. */
export type FitTransform = [{ translateX: number }, { translateY: number }, { scale: number }];

/**
 * Scales a fixed drawing frame onto a canvas, centred. `contain` shows the whole frame; `cover` fills
 * the canvas and crops what overflows; `width` fits the frame's width and sits it on the canvas's
 * bottom edge, leaving the top for the drawing to fill (a painting's sky in portrait).
 */
export function fitTransform(canvas: CanvasSize, frame: CanvasSize, mode: FitMode): FitTransform {
  const scale =
    mode === 'width'
      ? canvas.width / frame.width
      : (mode === 'cover' ? Math.max : Math.min)(
          canvas.width / frame.width,
          canvas.height / frame.height,
        );
  return [
    { translateX: (canvas.width - frame.width * scale) / 2 },
    {
      translateY:
        mode === 'width'
          ? canvas.height - frame.height * scale
          : (canvas.height - frame.height * scale) / 2,
    },
    { scale },
  ];
}

/**
 * The size of the view it is attached to, from React Native's own layout; null until it has both a
 * width and a height, so a drawing waits rather than draw at a guessed or empty size.
 */
export function useLayoutSize(): [CanvasSize | null, (event: LayoutChangeEvent) => void] {
  const [size, setSize] = useState<CanvasSize | null>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => {
      if (width <= 0 || height <= 0) {
        return null;
      }
      return current?.width === width && current.height === height ? current : { width, height };
    });
  }, []);
  return [size, onLayout];
}
