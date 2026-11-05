import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { colors } from '../../design/tokens';
import { useReducedMotion } from '../../design/useReducedMotion';

const BREATH_MS = 1_600;

/**
 * A glow around the screen's edge that breathes: charcoal for the ease-off (R36, board 3.2b), or
 * persimmon for the war horn's edge pulse (R40, board 3.3). It holds still under Reduce Motion, and
 * until that setting is known.
 */
export function EdgeGlow({ tone, testID }: { tone: 'easeOff' | 'horn'; testID?: string }) {
  const [breath] = useState(() => new Animated.Value(1));
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isReducedMotion !== false) {
      breath.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 0.45, duration: BREATH_MS, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 1, duration: BREATH_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, isReducedMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      testID={testID}
      style={[
        styles.edge,
        { borderColor: tone === 'easeOff' ? colors.easeOffSurface : colors.push, opacity: breath },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  edge: { ...StyleSheet.absoluteFill, borderWidth: 14 },
});
