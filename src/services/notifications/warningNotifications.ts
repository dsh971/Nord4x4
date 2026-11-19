import * as Notifications from 'expo-notifications';

/**
 * One notification to deliver while the rower is away from the app, timed from when they left: a push
 * or pickup warning, or the notice that the row goes on.
 */
export type WarningNotification = {
  /** Stable per notification, such as `push-2` or `still-rowing`, so scheduling again replaces rather than duplicates. */
  readonly id: string;
  readonly secondsFromNow: number;
  readonly title: string;
  readonly body: string;
  /** The war horn marks work coming; anything else is silent, so it can't be taken for a warning. */
  readonly sound: 'warHorn' | 'none';
};

// The plugin's `sounds` list in app.config.ts bundles this file; iOS wants the base name only.
const WARNING_SOUND = 'war-horn.wav';

// Warnings only stand in for the sound while the rower is away, so a failure is logged here and never
// reaches a caller, where it could be shown as a sound error on the rowing screen.
function loggingFailure(what: string, operation: Promise<void>): Promise<void> {
  return operation.catch((error: unknown) => console.error(`${what} failed`, error));
}

// Schedule and clear are separate native calls; a quick leave and return must not interleave them.
let pending: Promise<void> = Promise.resolve();

function inOrder(what: string, operation: () => Promise<void>): Promise<void> {
  pending = loggingFailure(what, pending.then(operation));
  return pending;
}

// expo-notifications drops a date trigger's milliseconds on iOS, which would bring a warning up to 1 s
// early and could put a 1 s notice in the past, where iOS refuses it. Rounding up keeps both on time.
function dueOnWholeSecondMs(wallMs: number): number {
  return Math.ceil(wallMs / 1000) * 1000;
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
    // Also reached when iOS waits 3 s for an answer, after which it shows the warning anyway.
    handleError: (id, error) => console.error('Hiding a warning in the app failed', id, error),
  });
}

/**
 * Asks for notification permission; iOS shows its prompt only the first time. The answer is read
 * again each time warnings are scheduled, since the rower can change it in Settings mid-row.
 */
export function askForWarningPermission(): Promise<void> {
  return loggingFailure(
    'Asking for notifications',
    Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } }).then(
      () => undefined,
    ),
  );
}

/**
 * Replaces any pending warnings with these, each at an exact time counted from `leftAtWallMs`, the
 * moment the rower left, so slow native calls don't push them late, and rounded up to the whole
 * second iOS keeps.
 * Without permission (refused, or not answered yet) none are scheduled, and that is no error:
 * iOS couldn't show them anyway.
 */
export function scheduleWarnings(
  warnings: readonly WarningNotification[],
  leftAtWallMs: number,
): Promise<void> {
  return inOrder('Scheduling warnings', async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) {
      return;
    }
    await Promise.all(
      warnings.map((warning) =>
        Notifications.scheduleNotificationAsync({
          identifier: warning.id,
          content: {
            title: warning.title,
            body: warning.body,
            sound: warning.sound === 'warHorn' ? WARNING_SOUND : false,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(dueOnWholeSecondMs(leftAtWallMs + warning.secondsFromNow * 1000)),
          },
        }),
      ),
    );
  });
}

/** Cancels warnings still to come and clears delivered ones; the app schedules no other notifications. */
export function clearWarnings(): Promise<void> {
  return inOrder('Clearing warnings', async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  });
}
