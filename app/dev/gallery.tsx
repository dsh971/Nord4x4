import { Redirect } from 'expo-router';

import { GalleryScreen } from '../../src/dev/gallery/GalleryScreen';

/** Dev-only route for the U5 components gallery; a release build sends it home. */
export default function GalleryRoute() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <GalleryScreen />;
}
