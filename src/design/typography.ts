import type { TextStyle } from 'react-native';

// iOS finds an embedded font by its PostScript name, so each weight is its own family here
// (files in assets/fonts/, embedded by the expo-font plugin in app.config.ts).
const fonts = {
  serif: 'NotoSerifSC-Regular',
  serifSemiBold: 'NotoSerifSC-SemiBold',
  sans: 'Inter18pt-Regular',
  sansMedium: 'Inter18pt-Medium',
  sansSemiBold: 'Inter18pt-SemiBold',
} as const;

/**
 * The type scale: Noto Serif SC for display and numbers, Inter for everything read at speed.
 * Sizes follow Shuimo's 1.25 scale; the gauge sizes meet R29's minimums (time 75 pt, HR 50 pt).
 * Noto Serif SC has no tabular digits, so the gauge sets each digit in a fixed-width cell (U7).
 */
export const typography = {
  headline: { fontFamily: fonts.serif, fontSize: 38, lineHeight: 43 },
  headlineStrong: { fontFamily: fonts.serifSemiBold, fontSize: 38, lineHeight: 43 },
  title: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  bodyLarge: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 23 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  button: { fontFamily: fonts.sansMedium, fontSize: 17, lineHeight: 22 },
  chip: { fontFamily: fonts.sansSemiBold, fontSize: 22, lineHeight: 28 },
  gaugeTime: {
    fontFamily: fonts.serif,
    fontSize: 84,
    lineHeight: 88,
  },
  gaugeHeartRate: {
    fontFamily: fonts.serif,
    fontSize: 64,
    lineHeight: 68,
  },
} as const satisfies Record<string, TextStyle>;

/** A named text style. */
export type TypographyVariant = keyof typeof typography;
