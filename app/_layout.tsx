import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import {
  clearWarnings,
  hideWarningsInApp,
} from '../src/services/notifications/warningNotifications';

/** Root navigator: one stack, no headers; each screen draws its own. */
export default function RootLayout() {
  useEffect(() => {
    hideWarningsInApp();
    // A row that iOS or the rower closed in the background leaves its warnings scheduled (R43).
    clearWarnings().catch((error: unknown) =>
      console.error('Clearing stale warnings failed', error),
    );
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9F8F4' } }} />
    </>
  );
}
