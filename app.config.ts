import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Nor4x4',
  slug: 'nor4x4',
  scheme: 'nor4x4',
  version: '0.1.0',
  platforms: ['ios'],
  // Both orientations are first-class (R33, KTD14), so no orientation lock.
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'com.dsh971.nor4x4',
    supportsTablet: false,
    infoPlist: {
      // Usage strings ready for the U4b strap and Apple Health spike.
      NSBluetoothAlwaysUsageDescription:
        'Nor4x4 connects to your heart-rate strap to coach each push by heart rate.',
      NSHealthUpdateUsageDescription:
        'Nor4x4 saves each row to Apple Health as a rowing workout with its heart rate.',
    },
  },
  plugins: [
    'expo-router',
    // Background audio keeps a session's sound running with the screen locked (KTD7).
    ['react-native-audio-api', { iosBackgroundMode: true }],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
