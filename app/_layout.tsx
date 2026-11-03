import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/** Root navigator: one stack, no headers; each screen draws its own. */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9F8F4' } }} />
    </>
  );
}
