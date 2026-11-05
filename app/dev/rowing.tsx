import { Redirect } from 'expo-router';

import { RowingStatesScreen } from '../../src/dev/rowingStates/RowingStatesScreen';

/** Dev-only route for G3's rowing overlay states on the phone; a release build sends it home. */
export default function RowingStatesRoute() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <RowingStatesScreen />;
}
