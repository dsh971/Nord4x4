// Exact values only: "TRUE" or " 1" is a typo worth surfacing, not something to guess at.
const FLAG_VALUES = new Map<string, boolean>([
  ['', false],
  ['0', false],
  ['false', false],
  ['1', true],
  ['true', true],
]);

/** Reads EXPO_PUBLIC_TEST_MODE: true for "1"/"true", false when unset or "0"/"false"; throws on anything else. */
export function parseTestModeFlag(flag: string | undefined): boolean {
  const isOn = FLAG_VALUES.get(flag ?? '');
  if (isOn === undefined) {
    throw new Error(
      `EXPO_PUBLIC_TEST_MODE must be "1", "true", "0", "false" or unset; got "${flag}"`,
    );
  }
  return isOn;
}

/**
 * Whether this build runs in test mode (fake clock and sensors, KTD18). Always false in release builds.
 *
 * The bundler folds this to `false` only inside this file. Elsewhere, gate test-only code with
 * `if (__DEV__ && isTestMode)` and load fakes inside that branch, so release builds drop them.
 * Expo inlines EXPO_PUBLIC_* only when read by its full name, as below.
 */
export const isTestMode: boolean = __DEV__ && parseTestModeFlag(process.env.EXPO_PUBLIC_TEST_MODE);
