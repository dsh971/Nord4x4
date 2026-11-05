import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { Text } from '../../design/components/Text';
import { colors, radius, space } from '../../design/tokens';
import type { Banner } from './banners';

/**
 * A signal's banner, readable at 1 m (R40, board 3.3). VoiceOver speaks it as it appears: iOS has no
 * live regions, so the banner announces itself.
 */
export function SignalBanner({ banner }: { banner: Banner }) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(banner.text);
  }, [banner.text]);

  return (
    <View accessible accessibilityRole="alert" accessibilityLabel={banner.text} style={styles.card}>
      <View style={styles.accent} />
      <Text variant="headlineStrong" style={styles.text}>
        {banner.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  accent: { alignSelf: 'stretch', width: 6, backgroundColor: colors.push },
  text: { fontSize: 56, lineHeight: 64, paddingVertical: space.lg, paddingHorizontal: space.xl },
});
