import { parseTestModeFlag } from '../testMode';

describe('parseTestModeFlag', () => {
  it('turns test mode on for "1" and "true"', () => {
    expect(parseTestModeFlag('1')).toBe(true);
    expect(parseTestModeFlag('true')).toBe(true);
  });

  it('leaves test mode off when the flag is unset, empty, "0" or "false"', () => {
    for (const flag of [undefined, '', '0', 'false']) {
      expect(parseTestModeFlag(flag)).toBe(false);
    }
  });

  it('rejects any other value, naming the variable and the value', () => {
    for (const flag of ['yes', 'TRUE', ' 1', 'undefined', 'constructor']) {
      expect(() => parseTestModeFlag(flag)).toThrow(new RegExp(`EXPO_PUBLIC_TEST_MODE.*"${flag}"`));
    }
  });
});

describe('isTestMode (this build)', () => {
  const originalFlag = process.env.EXPO_PUBLIC_TEST_MODE;
  const originalDev = __DEV__;

  function setFlag(flag: string | undefined): void {
    if (flag === undefined) delete process.env.EXPO_PUBLIC_TEST_MODE;
    else process.env.EXPO_PUBLIC_TEST_MODE = flag;
  }

  function loadIsTestMode({ isDevBuild, flag }: { isDevBuild: boolean; flag?: string }): boolean {
    Reflect.set(globalThis, '__DEV__', isDevBuild);
    setFlag(flag);
    let loaded: typeof import('../testMode') | undefined;
    jest.isolateModules(() => {
      loaded = jest.requireActual<typeof import('../testMode')>('../testMode');
    });
    if (!loaded) throw new Error('testMode did not load');
    return loaded.isTestMode;
  }

  afterEach(() => {
    Reflect.set(globalThis, '__DEV__', originalDev);
    setFlag(originalFlag);
  });

  it('reads EXPO_PUBLIC_TEST_MODE in a dev build', () => {
    expect(loadIsTestMode({ isDevBuild: true, flag: '1' })).toBe(true);
    expect(loadIsTestMode({ isDevBuild: true })).toBe(false);
  });

  it('fails loudly at load in a dev build when the flag is unrecognised', () => {
    expect(() => loadIsTestMode({ isDevBuild: true, flag: 'yes' })).toThrow(
      /EXPO_PUBLIC_TEST_MODE/,
    );
  });

  it('is off in a release build, and never reads or rejects the flag there', () => {
    expect(loadIsTestMode({ isDevBuild: false, flag: '1' })).toBe(false);
    expect(loadIsTestMode({ isDevBuild: false, flag: 'yes' })).toBe(false);
  });

  it('restores the flag as unset rather than the text "undefined"', () => {
    expect(process.env.EXPO_PUBLIC_TEST_MODE).toBe(originalFlag);
  });
});
