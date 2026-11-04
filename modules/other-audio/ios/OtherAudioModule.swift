import AVFoundation
import ExpoModulesCore

let onHintChange = "onHintChange"

// KTD8: react-native-audio-api has no way to ask whether another app's audio is playing.
public class OtherAudioModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OtherAudio")

    Events(onHintChange)

    // True while another app (music, a podcast) plays audio that a secondary sound should give way to.
    Function("isOtherAudioPlaying") {
      return AVAudioSession.sharedInstance().secondaryAudioShouldBeSilencedHint
    }

    OnStartObserving(onHintChange) {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleSilenceHint),
        name: AVAudioSession.silenceSecondaryAudioHintNotification,
        object: AVAudioSession.sharedInstance()
      )
    }

    OnStopObserving(onHintChange) {
      // swiftlint:disable:next notification_center_detachment
      NotificationCenter.default.removeObserver(self)
    }
  }

  @objc func handleSilenceHint(_ notification: Notification) {
    guard
      let rawType = notification.userInfo?[AVAudioSessionSilenceSecondaryAudioHintTypeKey] as? UInt,
      let hintType = AVAudioSession.SilenceSecondaryAudioHintType(rawValue: rawType)
    else {
      return
    }
    self.sendEvent(onHintChange, ["isOtherAudioPlaying": hintType == .begin])
  }
}
