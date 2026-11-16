import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { AppState, type AppStateStatus } from 'react-native';

import { SLICE_PLAN } from '../../../content/slicePlan';
import { MINUTE, SECOND } from '../../../dev/rowingStates/sliceMoments';
import { AudioEngine } from '../../../services/audio/audioEngine';
import { useRowingSession } from '../useRowingSession';

jest.mock('../../../services/audio/audioEngine', () => ({ AudioEngine: { load: jest.fn() } }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  dismissAllNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
}));

const WALL_MS = 1_000_000;

function fakeEngine() {
  return {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    resume: jest.fn(() => Promise.resolve()),
    update: jest.fn(),
    playEaseOff: jest.fn(),
  };
}

type FakeEngine = ReturnType<typeof fakeEngine>;

let nowMs = 0;
let engines: FakeEngine[] = [];
let unfinishedLoads: (() => void)[] = [];
let changeApp: (state: AppStateStatus) => void = () => {};

beforeEach(() => {
  nowMs = 0;
  engines = [];
  unfinishedLoads = [];
  jest.spyOn(performance, 'now').mockImplementation(() => nowMs);
  jest.spyOn(Date, 'now').mockReturnValue(WALL_MS);
  jest.mocked(AudioEngine.load).mockImplementation(
    () =>
      new Promise((resolve) => {
        const engine = fakeEngine();
        engines.push(engine);
        unfinishedLoads.push(() => resolve(engine as unknown as AudioEngine));
      }),
  );
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    changeApp = listener;
    return { remove: jest.fn() };
  });
  jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
  jest.mocked(Notifications.cancelAllScheduledNotificationsAsync).mockClear();
  jest.mocked(Notifications.dismissAllNotificationsAsync).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** Lets loads, starts and the notification queue settle. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function finishLoading() {
  await act(async () => {
    unfinishedLoads.splice(0).forEach((finish) => finish());
  });
  await settle();
}

/** A row opened at Get seated, with its first engine loaded; `isStarted` taps Start now. */
async function openRow({ isStarted = true } = {}) {
  const hook = await renderHook(() => useRowingSession(SLICE_PLAN, null));
  await finishLoading();
  if (isStarted) {
    await act(async () => {
      hook.result.current.startNow();
    });
  }
  return hook;
}

async function switchApp(state: AppStateStatus) {
  await act(async () => {
    changeApp(state);
  });
  await settle();
}

function scheduledWarnings() {
  return jest.mocked(Notifications.scheduleNotificationAsync).mock.calls.map(([request]) => ({
    id: request.identifier,
    atWallMs: (request.trigger as { date: Date }).date.getTime(),
  }));
}

describe('useRowingSession away from the app (R43)', () => {
  it('stops the sound on leaving and schedules each warning at its time from that moment', async () => {
    await openRow();
    nowMs = 4 * MINUTE + 40 * SECOND;
    await switchApp('background');
    expect(engines[0]?.stop).toHaveBeenCalled();
    expect(scheduledWarnings()[0]).toEqual({ id: 'pickup-1', atWallMs: WALL_MS + 10 * SECOND });
  });

  it('schedules the warnings when leaving during Get seated, since the row starts by itself', async () => {
    await openRow({ isStarted: false });
    nowMs = 5 * SECOND;
    await switchApp('background');
    expect(scheduledWarnings()[0]).toEqual({ id: 'pickup-1', atWallMs: WALL_MS + 305 * SECOND });
  });

  it('never shows a failed warning as a sound error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest
      .mocked(Notifications.scheduleNotificationAsync)
      .mockRejectedValueOnce(new Error('no scheduler'));
    const { result } = await openRow();
    nowMs = 4 * MINUTE;
    await switchApp('background');
    expect(result.current.soundError).toBeNull();
  });

  it('leaves the sound playing when Control Centre is pulled down', async () => {
    await openRow();
    nowMs = 4 * MINUTE;
    await switchApp('inactive');
    expect(engines[0]?.stop).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('clears the warnings on return and starts a fresh engine at the current moment', async () => {
    await openRow();
    nowMs = 4 * MINUTE + 40 * SECOND;
    await switchApp('background');
    nowMs = 5 * MINUTE + 5 * SECOND;
    await switchApp('active');
    await finishLoading();
    expect(Notifications.dismissAllNotificationsAsync).toHaveBeenCalled();
    expect(engines).toHaveLength(2);
    expect(engines[1]?.start).toHaveBeenCalledWith(5 * MINUTE + 5 * SECOND, expect.anything());
  });

  it('stops, unused, an engine that finishes loading after the rower has left', async () => {
    await openRow();
    nowMs = 4 * MINUTE;
    await switchApp('background');
    await switchApp('active');
    await switchApp('background');
    await finishLoading();
    expect(engines[1]?.start).not.toHaveBeenCalled();
    expect(engines[1]?.stop).toHaveBeenCalled();
  });

  it('keeps the sound off when the row is paused while its engine loads, and starts it on resume', async () => {
    const { result } = await openRow();
    nowMs = 4 * MINUTE;
    await switchApp('background');
    await switchApp('active');
    await act(async () => {
      result.current.pause();
    });
    await finishLoading();
    expect(engines[1]?.start).not.toHaveBeenCalled();
    await act(async () => {
      result.current.resume();
    });
    await finishLoading();
    expect(engines.at(-1)?.start).toHaveBeenCalledWith(4 * MINUTE, expect.anything());
  });

  it('schedules nothing when leaving a paused row, and brings the sound back on resume', async () => {
    const { result } = await openRow();
    nowMs = 4 * MINUTE;
    await act(async () => {
      result.current.pause();
    });
    await switchApp('background');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    await switchApp('active');
    expect(engines).toHaveLength(1);
    await act(async () => {
      result.current.resume();
    });
    await finishLoading();
    expect(engines[1]?.start).toHaveBeenCalled();
  });
});
