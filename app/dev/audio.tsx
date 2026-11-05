import { Redirect } from 'expo-router';

import { AudioCheckScreen } from '../../src/dev/audioCheck/AudioCheckScreen';

/** Dev-only route for G2's audio check on the phone; a release build sends it home. */
export default function AudioCheckRoute() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <AudioCheckScreen />;
}
