Pod::Spec.new do |s|
  s.name           = 'OtherAudio'
  s.version        = '1.0.0'
  s.summary        = 'Reads whether another app is playing audio (KTD8).'
  s.description    = 'Exposes secondaryAudioShouldBeSilencedHint and its change notification to Nor4x4.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
