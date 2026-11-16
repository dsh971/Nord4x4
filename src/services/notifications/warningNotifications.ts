import * as Notifications from 'expo-notifications';

/** One push or pickup warning to deliver while the rower is away from the app, timed from when they left. */
export type WarningNotification = {
  /** Stable per push or pickup, such as `push-2`, so scheduling again replaces rather than duplicates. */
  readonly id: string;
  readonly secondsFromNow: number;
  readonly title: string;
  readonly body: string;
};

// The plugin's `sounds` list in app.config.ts bundles this file; iOS wants the base name only.
const WARNING_SOUND = 'war-horn.wav';

// Schedule and clear are separate native calls; a quick leave and return must not interleave them.
let pending: Promise<void> = Promise.resolve();

function inOrder(operation: () => Promise<void>): Promise<void> {
  const next = pending.then(operation);
  pending = next.catch(() => undefined);
  return next;
}

/** Keeps warnings from showing while the app is open: they stand in for its sound only when it isn't (R43). */
export function hideWarningsInApp(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
}

/** Asks for notification permission; iOS shows its prompt only the first time, and answers silently after. */
export async function askForWarningPermission(): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true },
  });
  return granted;
}

/**
 * Replaces any pending warnings with these, each at an exact time counted from `leftAtWallMs`, the
 * moment the rower left, so slow native calls don't push them late. The war horn is their sound.
 * A rower who refused notifications gets none, and no error: that was their choice.
 */
export function scheduleWarnings(
  warnings: readonly WarningNotification[],
  leftAtWallMs: number,
): Promise<void> {
  return inOrder(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) {
      return;
    }
    await Promise.all(
      warnings.map((warning) =>
        Notifications.scheduleNotificationAsync({
          identifier: warning.id,
          content: { title: warning.title, body: warning.body, sound: WARNING_SOUND },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(leftAtWallMs + warning.secondsFromNow * 1000),
          },
        }),
      ),
    );
  });
}

/** Cancels warnings still to come and clears delivered ones; the app schedules no other notifications. */
export function clearWarnings(): Promise<void> {
  return inOrder(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  });
}
