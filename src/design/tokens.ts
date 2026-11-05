// Shuimo values (ShuimoDS/Sumi-Design-System/colors_and_type.css) under Nor4x4's semantic roles (KTD15).
// Roles agreed in docs/design/README.md: push is persimmon, steady and "in zone" are teal, red is
// kept for destructive actions (and the sail, which the scene paints).

/** Every colour the app uses, by role. Roles starting with `text` are for type; the rest are fills. */
export const colors = {
  paper: '#F9F8F4', // silk-100, Fresh Silk: the page
  card: '#FFFFFF', // silk-50
  wash: '#F1F0EB', // silk-200: nested and pressed surfaces
  line: '#DAD9D5', // --line-2 (14% ink) flattened onto paper
  ink: '#1C1B1A', // ink-800, Charcoal Ink

  textPrimary: '#1C1B1A',
  textSecondary: '#5C564E', // ink-500, Diluted Ink
  textMuted: '#6E6962', // ink-400: Misty Wash is too light for text
  textOnPrimary: '#FFFFFF',
  textOnInk: '#F9F8F4',
  textLink: '#1C3B57', // azurite-600
  textPush: '#9F5217', // persimmon-700: the text tone of the push fill
  textSteady: '#1F6357', // teal-600
  textDestructive: '#A62B2B', // cinnabar-600

  primary: '#1E4D2B', // malachite-700: Set out, and other primary actions
  primaryPressed: '#163D21', // malachite-800
  push: '#C66B22', // persimmon-600
  pushAhead: '#F1D9C3', // a push not yet rowed, on the progress strip
  steady: '#4A8475', // teal-400
  steadyAhead: '#D2E1DD', // teal-100
  inZoneSurface: '#E3EEEA',
  buildSurface: '#FFE9D1', // persimmon-100
  easeOffSurface: '#1C1B1A', // the charcoal of the ease-off glow (R36)
  destructive: '#A62B2B',
} as const;

/** A colour role. */
export type ColorRole = keyof typeof colors;

/** A text colour role. */
export type TextColorRole = Extract<ColorRole, `text${string}`>;

/** Every place text sits on a surface in the slice; each must reach 4.5:1 (tested). */
export const textOnSurface: readonly { text: TextColorRole; surface: ColorRole }[] = [
  { text: 'textPrimary', surface: 'paper' },
  { text: 'textPrimary', surface: 'card' },
  { text: 'textPrimary', surface: 'wash' },
  { text: 'textSecondary', surface: 'paper' },
  { text: 'textSecondary', surface: 'card' },
  { text: 'textMuted', surface: 'paper' },
  { text: 'textMuted', surface: 'card' },
  { text: 'textOnPrimary', surface: 'primary' },
  { text: 'textOnPrimary', surface: 'primaryPressed' },
  { text: 'textOnPrimary', surface: 'destructive' },
  { text: 'textOnInk', surface: 'easeOffSurface' },
  { text: 'textLink', surface: 'paper' },
  { text: 'textLink', surface: 'card' },
  { text: 'textPush', surface: 'paper' },
  { text: 'textPush', surface: 'card' },
  { text: 'textPush', surface: 'buildSurface' },
  { text: 'textSteady', surface: 'card' },
  { text: 'textSteady', surface: 'inZoneSurface' },
  { text: 'textDestructive', surface: 'paper' },
  { text: 'textDestructive', surface: 'card' },
];

/** Shuimo's spacing, on an 8 pt base. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Shuimo's radii: square-ish corners, "paper folds, not pebbles". */
export const radius = {
  chip: 2,
  control: 2,
  card: 4,
  full: 999,
} as const;
