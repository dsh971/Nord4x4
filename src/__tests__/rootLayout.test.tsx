import * as Notifications from 'expo-notifications';

import '../../app/_layout';

jest.mock('expo-router', () => ({ Stack: () => null }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
}));

describe('root layout', () => {
  it('hides warnings in the app as soon as it loads, before anything renders', () => {
    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  });
});
