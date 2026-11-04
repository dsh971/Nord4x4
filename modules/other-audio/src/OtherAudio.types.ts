export type OtherAudioModuleEvents = {
  onHintChange: (params: OtherAudioHintChange) => void;
};

export type OtherAudioHintChange = {
  isOtherAudioPlaying: boolean;
};
