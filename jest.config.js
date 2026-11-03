// Pure TypeScript tests (*.test.ts) run under Node; component tests (*.test.tsx) under the iOS preset.
// Tests never live in app/: Expo Router treats every file there as a route.
module.exports = {
  projects: [
    {
      displayName: 'node',
      preset: 'jest-expo/node',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      displayName: 'ios',
      preset: 'jest-expo/ios',
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
    },
  ],
};
