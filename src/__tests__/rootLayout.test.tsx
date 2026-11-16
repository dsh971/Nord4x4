import * as Notifications from 'expo-notifications';

import '../../app/_layout';

jest.mock('expo-router', () => ({ Stack: () => null }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
}));

describe('root layout', () => {
  it('installs the handler that hides warnings in the app as soon as it loads', async () => {
    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
    const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls[0]?.[0];
    await expect(handler?.handleNotification({} as Notifications.Notification)).resolves.toEqual({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    });
  });
});
