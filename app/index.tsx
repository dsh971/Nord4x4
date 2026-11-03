import { StyleSheet, Text, View } from 'react-native';

import { isTestMode } from '../src/dev/testMode';

/** Launch screen until the home route (U14) exists; shows whether this build runs in test mode. */
export default function Index() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Nor4x4</Text>
      {__DEV__ && isTestMode ? <Text style={styles.note}>Test mode</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 34, color: '#1C1B1A' },
  note: { fontSize: 13, color: '#6E6962' },
});
