import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, space } from '../tokens';
import { Text } from './Text';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /** Primary is the one malachite action on a screen ("Set out"); secondary is outlined. */
  variant?: 'primary' | 'secondary';
  isDisabled?: boolean;
};

/** A full-width button at least 48 pt tall, so it can be hit with a sweaty hand. */
export function Button({ label, onPress, variant = 'primary', isDisabled = false }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
      ]}
    >
      <Text variant="button" color={isPrimary ? 'textOnPrimary' : 'textPrimary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control,
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  secondaryPressed: { backgroundColor: colors.wash },
  disabled: { opacity: 0.4 },
});
