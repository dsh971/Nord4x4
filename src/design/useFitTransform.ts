import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

/** A canvas's size, as Skia's `onSize` reports it. */
export type CanvasSize = { readonly width: number; readonly height: number };

/**
 * Scales a fixed drawing frame onto a canvas, centred. `contain` shows the whole frame; `cover` fills
 * the canvas and crops what overflows; `width` fits the frame's width and sits it on the canvas's
 * bottom edge, leaving the top for the drawing to fill (a painting's sky in portrait).
 */
export function useFitTransform(
  size: SharedValue<CanvasSize>,
  frame: CanvasSize,
  mode: 'contain' | 'cover' | 'width',
) {
  return useDerivedValue(() => {
    const { width, height } = size.get();
    const scale =
      mode === 'width'
        ? width / frame.width
        : (mode === 'cover' ? Math.max : Math.min)(width / frame.width, height / frame.height);
    return [
      { translateX: (width - frame.width * scale) / 2 },
      {
        translateY:
          mode === 'width' ? height - frame.height * scale : (height - frame.height * scale) / 2,
      },
      { scale },
    ];
  });
}
