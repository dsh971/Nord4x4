import * as Notifications from 'expo-notifications';

import {
  askForWarningPermission,
  clearWarnings,
  hideWarningsInApp,
  scheduleWarnings,
  type WarningNotification,
} from '../warningNotifications';

const mockCalls: string[] = [];
let mockFinishScheduling: () => void = () => {};

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  cancelAllScheduledNotificationsAsync: jest.fn(() => {
    mockCalls.push('cancel');
    return Promise.resolve();
  }),
  dismissAllNotificationsAsync: jest.fn(() => {
    mockCalls.push('dismiss');
    return Promise.resolve();
  }),
  scheduleNotificationAsync: jest.fn(
    (request: { identifier: string }) =>
      new Promise<string>((resolve) => {
        mockCalls.push(`schedule ${request.identifier}`);
        mockFinishScheduling = () => resolve(request.identifier);
      }),
  ),
}));

const BROKEN = new Error('native call failed');

const WARNINGS: WarningNotification[] = [
  {
    id: 'pickup-1',
    secondsFromNow: 10,
    title: 'Pickup coming',
    body: 'Pickup starts in 10 s',
    sound: 'warHorn',
  },
];

beforeEach(() => {
  mockCalls.length = 0;
  jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('warning notifications (R43)', () => {
  it('replaces pending warnings with each one by its id, the war horn, at an exact time from leaving', async () => {
    const scheduled = scheduleWarnings(WARNINGS, 1_000_000);
    await new Promise((resolve) => setTimeout(resolve, 0));
    mockFinishScheduling();
    await scheduled;
    expect(mockCalls).toEqual(['cancel', 'schedule pickup-1']);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'pickup-1',
      content: { title: 'Pickup coming', body: 'Pickup starts in 10 s', sound: 'war-horn.wav' },
      trigger: { type: 'date', date: new Date(1_010_000) },
    });
  });

  it('schedules a silent warning with no sound, and keeps the war horn on the others', async () => {
    jest
      .mocked(Notifications.scheduleNotificationAsync)
      .mockImplementationOnce(() => Promise.resolve('still-rowing'));
    const scheduled = scheduleWarnings(
      [
        {
          id: 'still-rowing',
          secondsFromNow: 1,
          title: 'Row still going',
          body: 'Open for sound',
          sound: 'none',
        },
        ...WARNINGS,
      ],
      0,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    mockFinishScheduling();
    await scheduled;
    const sounds = jest
      .mocked(Notifications.scheduleNotificationAsync)
      .mock.calls.map(([request]) => [request.identifier, request.content.sound]);
    expect(sounds).toEqual([
      ['still-rowing', false],
      ['pickup-1', 'war-horn.wav'],
    ]);
  });

  it('rounds each time up to the whole second iOS keeps, so none comes early or lands in the past', async () => {
    const scheduled = scheduleWarnings(WARNINGS, 1_000_950);
    await new Promise((resolve) => setTimeout(resolve, 0));
    mockFinishScheduling();
    await scheduled;
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { type: 'date', date: new Date(1_011_000) } }),
    );
  });

  it('cancels old warnings but schedules none, and raises no error, without permission', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
      granted: false,
    } as Notifications.NotificationPermissionsStatus);
    const scheduled = scheduleWarnings(WARNINGS, 0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockCalls).toEqual(['cancel']);
    mockFinishScheduling();
    await expect(scheduled).resolves.toBeUndefined();
  });

  it.each([
    {
      what: 'Scheduling warnings',
      breakIt: () =>
        jest.mocked(Notifications.scheduleNotificationAsync).mockRejectedValueOnce(BROKEN),
      run: () => scheduleWarnings(WARNINGS, 0),
    },
    {
      what: 'Clearing warnings',
      breakIt: () =>
        jest.mocked(Notifications.dismissAllNotificationsAsync).mockRejectedValueOnce(BROKEN),
      run: clearWarnings,
    },
    {
      what: 'Asking for notifications',
      breakIt: () =>
        jest.mocked(Notifications.requestPermissionsAsync).mockRejectedValueOnce(BROKEN),
      run: askForWarningPermission,
    },
  ])(
    'logs a failure in $what and never rejects, so no caller can show it as a sound error',
    async ({ what, breakIt, run }) => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      breakIt();
      await expect(run()).resolves.toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(`${what} failed`, BROKEN);
    },
  );

  it('clears only after scheduling still in flight has finished, so a quick return leaves nothing pending', async () => {
    const scheduled = scheduleWarnings(WARNINGS, 0);
    const cleared = clearWarnings();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockCalls).toEqual(['cancel', 'schedule pickup-1']);
    mockFinishScheduling();
    await Promise.all([scheduled, cleared]);
    expect(mockCalls).toEqual(['cancel', 'schedule pickup-1', 'cancel', 'dismiss']);
  });

  it('never shows or sounds a warning while the app is open', async () => {
    hideWarningsInApp();
    const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls[0]?.[0];
    await expect(handler?.handleNotification({} as Notifications.Notification)).resolves.toEqual({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    });
  });

  it('logs a warning the app failed to hide, rather than dropping it', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    hideWarningsInApp();
    const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls.at(-1)?.[0];
    handler?.handleError?.('pickup-1', BROKEN);
    expect(consoleError).toHaveBeenCalledWith(
      'Hiding a warning in the app failed',
      'pickup-1',
      BROKEN,
    );
  });
});
