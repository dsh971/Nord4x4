import { NativeModule, requireNativeModule } from 'expo';

import { OtherAudioModuleEvents } from './OtherAudio.types';

declare class OtherAudioModule extends NativeModule<OtherAudioModuleEvents> {
  /** Reads iOS's hint that another app's audio is playing (`secondaryAudioShouldBeSilencedHint`). */
  isOtherAudioPlaying(): boolean;
}

/** The KTD8 Swift module: whether the user's own music is playing, and when that changes. */
export default requireNativeModule<OtherAudioModule>('OtherAudio');
