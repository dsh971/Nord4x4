import { Redirect } from 'expo-router';

import { SpikeScreen } from '../../src/dev/spike/SpikeScreen';

/** Dev-only route for the U4a native spike; a release build sends it home. */
export default function SpikeRoute() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <SpikeScreen />;
}
