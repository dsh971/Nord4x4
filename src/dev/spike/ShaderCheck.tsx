import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// Layered ink washes drifting over paper: about as costly per pixel as the U18 scene's bleed and grain.
const INK_WASH = Skia.RuntimeEffect.Make(`
uniform float2 resolution;
uniform float time;

float wave(float2 p, float t) {
  return sin(p.x * 9.0 + t) + sin(p.y * 11.0 - t * 1.3) + sin((p.x + p.y) * 7.0 + t * 0.7);
}

half4 main(float2 xy) {
  float2 uv = xy / resolution;
  float ink = 0.0;
  for (int layer = 0; layer < 4; layer++) {
    float scale = 1.0 + float(layer) * 0.6;
    ink += 0.5 + 0.5 * sin(wave(uv * scale, time * (0.4 + float(layer) * 0.15)));
  }
  ink /= 4.0;
  float grain = fract(sin(dot(xy, float2(12.9898, 78.233))) * 43758.5453) * 0.04;
  half3 paper = half3(0.976, 0.973, 0.957);
  half3 sumi = half3(0.11, 0.106, 0.102);
  return half4(mix(paper, sumi, half(ink * 0.55 + grain)), 1.0);
}
`);

if (INK_WASH === null) {
  throw new Error('The spike ink-wash shader failed to compile');
}
const inkWash = INK_WASH;

export interface FrameStats {
  framesPerSecond: number;
  lowestFramesPerSecond: number;
  /** Frames that took longer than a 60 fps frame, counted since the check opened. */
  slowFrames: number;
}

// A frame this long or longer missed the 60 fps deadline (16.7 ms), with 1 ms of timer slack.
const SLOW_FRAME_MS = 17.7;

/** Spike check 5: draws one SkSL shader full-screen and reports the frame rate the UI thread achieves. */
export function ShaderCheck({ onClose }: { onClose: (stats: FrameStats | null) => void }) {
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  const uniforms = useDerivedValue(() => ({
    resolution: [width, height],
    time: clock.value / 1000,
  }));
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

  return (
    <View style={styles.screen}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={inkWash} uniforms={uniforms} />
        </Fill>
      </Canvas>
      <View style={styles.readout}>
        <Text style={styles.readoutText}>
          {stats === null
            ? 'Measuring…'
            : `${stats.framesPerSecond} fps · lowest ${stats.lowestFramesPerSecond} · slow frames ${stats.slowFrames}`}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => onClose(stats)} style={styles.close}>
          <Text style={styles.readoutText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  readout: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(249, 248, 244, 0.9)',
  },
  readoutText: { fontSize: 15, color: '#1C1B1A', fontVariant: ['tabular-nums'] },
  close: { paddingHorizontal: 16, paddingVertical: 10 },
});
