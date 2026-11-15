import * as Notifications from 'expo-notifications';

import {
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

const WARNINGS: WarningNotification[] = [
  { id: 'pickup-1', secondsFromNow: 10, title: 'Pickup coming', body: 'Pickup starts in 10 s' },
];

beforeEach(() => {
  mockCalls.length = 0;
  jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
});

describe('warning notifications (R43)', () => {
  it('replaces pending warnings with each one by its id, the war horn, at an exact time from leaving', async () => {
    const scheduled = scheduleWarnings(WARNINGS, 1_000_000);
    await Promise.resolve();
    await Promise.resolve();
    mockFinishScheduling();
    await scheduled;
    expect(mockCalls).toEqual(['cancel', 'schedule pickup-1']);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'pickup-1',
      content: { title: 'Pickup coming', body: 'Pickup starts in 10 s', sound: 'war-horn.wav' },
      trigger: { type: 'date', date: new Date(1_010_000) },
    });
  });

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
});
