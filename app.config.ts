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
    // The free Apple ID's personal team; set here so every prebuild keeps signing for the phone.
    appleTeamId: '9H86AVQA6B',
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
    // The app is silent while it isn't open (R43, revised 2026-11-15); whether to drop this mode is
    // decided at TestFlight in M3.
    ['react-native-audio-api', { iosBackgroundMode: true }],
    // Local warnings stand in for the sound while the rower is away (R43). No remote notifications,
    // so no push entitlement, which a free Apple ID can't sign.
    [
      'expo-notifications',
      { sounds: ['./assets/audio/war-horn.wav'], enableRemoteNotifications: false },
    ],
    // Embedded at build time; iOS names each font by its PostScript name (src/design/typography.ts).
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Inter18pt-Regular.ttf',
          './assets/fonts/Inter18pt-Medium.ttf',
          './assets/fonts/Inter18pt-SemiBold.ttf',
          './assets/fonts/NotoSerifSC-Regular.ttf',
          './assets/fonts/NotoSerifSC-SemiBold.ttf',
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
