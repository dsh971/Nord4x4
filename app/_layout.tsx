import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import {
  clearWarnings,
  hideWarningsInApp,
} from '../src/services/notifications/warningNotifications';

// As soon as the JavaScript loads, before the first render, so a stale warning can't show in-app.
hideWarningsInApp();

/** Root navigator: one stack, no headers; each screen draws its own. */
export default function RootLayout() {
  useEffect(() => {
    // A row that iOS or the rower closed in the background leaves its warnings scheduled (R43).
    void clearWarnings();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9F8F4' } }} />
    </>
  );
}
