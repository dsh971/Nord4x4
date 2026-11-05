import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { isTestMode } from '../src/dev/testMode';

/** Launch screen until the home route (U14) exists; shows test mode, and the dev links (spike, gallery, audio check) in dev builds. */
export default function Index() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Nor4x4</Text>
      {__DEV__ && isTestMode ? <Text style={styles.note}>Test mode</Text> : null}
      {__DEV__ ? (
        <>
          <Link href="/dev/spike" style={styles.link}>
            Native spike
          </Link>
          <Link href="/dev/gallery" style={styles.link}>
            Components gallery
          </Link>
          <Link href="/dev/audio" style={styles.link}>
            Audio check
          </Link>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 34, color: '#1C1B1A' },
  note: { fontSize: 13, color: '#6E6962' },
  link: {
    marginTop: 24,
    padding: 12,
    fontSize: 15,
    color: '#1C1B1A',
    textDecorationLine: 'underline',
  },
});
