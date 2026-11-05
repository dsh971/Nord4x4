import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { colors, type TextColorRole } from '../tokens';
import { typography, type TypographyVariant } from '../typography';

export type TextProps = NativeTextProps & {
  variant?: TypographyVariant;
  color?: TextColorRole;
};

/** Text in one of the app's type styles and text colours; defaults to body in charcoal ink. */
export function Text({ variant = 'body', color = 'textPrimary', style, ...props }: TextProps) {
  return <NativeText style={[typography[variant], { color: colors[color] }, style]} {...props} />;
}
