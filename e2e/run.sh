#!/usr/bin/env bash
# Runs one Maestro flow from e2e/ on the booted simulator against Metro: e2e/run.sh away-from-app.
# However the run ends (pass, fail or Ctrl-C), the app is brought back to the front first, so it
# cancels the war-horn warnings it scheduled with iOS, then closed, so nothing sounds on the Mac.
set -uo pipefail
cd "$(dirname "$0")/.."

APP_ID=com.dsh971.nor4x4 # app.config.ts ios.bundleIdentifier
flow="e2e/${1:?usage: e2e/run.sh <flow name>}.yaml"

export JAVA_HOME=/opt/homebrew/opt/openjdk@21
[[ -x "$JAVA_HOME/bin/java" ]] || { echo "Maestro needs Java at $JAVA_HOME (brew install openjdk@21)" >&2; exit 1; }
[[ -f "$flow" ]] || { echo "No flow at $flow" >&2; exit 1; }
booted=$(xcrun simctl list devices booted | grep -c Booted)
[[ "$booted" == 1 ]] || { echo "Boot exactly one simulator first ($booted booted)" >&2; exit 1; }
curl -sf localhost:8081/status >/dev/null || { echo "Metro isn't running: npx expo start --dev-client" >&2; exit 1; }

close_app() {
  if xcrun simctl launch booted "$APP_ID" >/dev/null; then
    sleep 3
  else
    echo "Couldn't bring the app back to cancel its warnings; some may still sound" >&2
  fi
  xcrun simctl terminate booted "$APP_ID" >/dev/null || echo "Couldn't close $APP_ID" >&2
}
trap close_app EXIT
trap 'exit 130' INT TERM

maestro test --test-output-dir e2e/output "$flow"
