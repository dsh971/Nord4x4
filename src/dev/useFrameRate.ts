import { useState } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** The UI thread's frame rate, sampled each second, for the on-phone performance checks. */
export interface FrameStats {
  framesPerSecond: number;
  lowestFramesPerSecond: number;
  /** Frames that took longer than a 60 fps frame, counted since the check opened. */
  slowFrames: number;
}

// A frame this long or longer missed the 60 fps deadline (16.7 ms), with 1 ms of timer slack.
const SLOW_FRAME_MS = 17.7;

/** Measures the frame rate the UI thread achieves; null until the first second has passed. */
export function useFrameRate(): FrameStats | null {
  const [stats, setStats] = useState<FrameStats | null>(null);
  const windowFrames = useSharedValue(0);
  const windowMs = useSharedValue(0);
  const slowFrames = useSharedValue(0);
  const lowest = useSharedValue(Number.POSITIVE_INFINITY);

  useFrameCallback(({ timeSincePreviousFrame }) => {
    if (timeSincePreviousFrame === null) {
      return;
    }
    windowFrames.value += 1;
    windowMs.value += timeSincePreviousFrame;
    if (timeSincePreviousFrame >= SLOW_FRAME_MS) {
      slowFrames.value += 1;
    }
    if (windowMs.value >= 1000) {
      const framesPerSecond = Math.round((windowFrames.value * 1000) / windowMs.value);
      lowest.value = Math.min(lowest.value, framesPerSecond);
      scheduleOnRN(setStats, {
        framesPerSecond,
        lowestFramesPerSecond: lowest.value,
        slowFrames: slowFrames.value,
      });
      windowFrames.value = 0;
      windowMs.value = 0;
    }
  });

  return stats;
}

/** One line for the readout: "120 fps · lowest 118 · slow frames 2". */
export function describeFrameRate(stats: FrameStats | null): string {
  return stats === null
    ? 'Measuring…'
    : `${stats.framesPerSecond} fps · lowest ${stats.lowestFramesPerSecond} · slow frames ${stats.slowFrames}`;
}
