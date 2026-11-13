import { SLICE_PLAN } from '../../../content/slicePlan';
import { PUSH_2_STARTS, SECOND } from '../../../dev/rowingStates/sliceMoments';
import { ManualClock } from '../../../domain/session/clock';
import { hornCueAtMs } from '../../../domain/session/sessionMachine';
import { segmentTimings } from '../../../domain/session/sessionPlan';
import { wavFileMs } from '../../../services/audio/__tests__/wavFileMs';
import { AudioEngine } from '../../../services/audio/audioEngine';
import { LOOKAHEAD_MS } from '../../../services/audio/drumSchedule';
import { RowingSession } from '../rowingSession';

// Jest resolves every bundled file to one stub, so each file is mocked as its own name instead.
jest.mock('../../../services/audio/assets', () => {
  const actual = jest.requireActual('../../../services/audio/assets');
  const names = Object.keys(actual.SOUND_FILES);
  return { ...actual, SOUND_FILES: Object.fromEntries(names.map((name) => [name, name])) };
});

const mockFileSeconds: Record<string, number> = {
  'war-horn': wavFileMs('war-horn.wav') / 1000,
  'push-end-horn': wavFileMs('push-end-horn.wav') / 1000,
  'push-start-strike': wavFileMs('push-start-strike.wav') / 1000,
};
const mockSetSystemOptions = jest.fn();

jest.mock('react-native-audio-api', () => {
  const node = () => ({ connect: jest.fn(), gain: { value: 1, setTargetAtTime: jest.fn() } });
  return {
    AudioContext: jest.fn(() => ({
      currentTime: 0,
      destination: {},
      createGain: node,
      createBufferSource: () => ({ ...node(), start: jest.fn(), stop: jest.fn() }),
      decodeAudioData: (name: string) => Promise.resolve({ duration: mockFileSeconds[name] ?? 1 }),
      resume: () => Promise.resolve(),
      suspend: () => Promise.resolve(),
      close: () => Promise.resolve(),
    })),
    AudioManager: {
      setSystemOptions: (options: unknown) => mockSetSystemOptions(options),
      setAudioSessionActivity: () => Promise.resolve(true),
    },
  };
});

const HORN_MS = hornCueAtMs(PUSH_2_STARTS);

type MusicChange = { readonly isDucked: boolean; readonly atMs: number };

/**
 * The slice rowed silently to `soundFromMs`, then with the engine on. Each music change is stamped
 * with the session time it fired at, read off the fake timers rather than the last tick.
 */
async function rowWithSoundFrom(soundFromMs: number) {
  const clock = new ManualClock();
  const session = new RowingSession(SLICE_PLAN, clock, null);
  session.startNow();
  let sessionMs = 0;
  let isPaused = false;
  const tickTo = (toMs: number) => {
    while (sessionMs < toMs) {
      clock.advanceBy(100);
      jest.advanceTimersByTime(100);
      sessionMs = session.tick().sessionMs;
    }
  };
  tickTo(soundFromMs);
  const engine = await AudioEngine.load();
  expect(engine.durations['war-horn']).toBe(mockFileSeconds['war-horn']);
  await engine.start(sessionMs, segmentTimings(SLICE_PLAN));
  session.setSound(engine);
  let anchor = { sessionMs, fakeMs: Date.now() };
  const musicChanges: MusicChange[] = [];
  mockSetSystemOptions.mockImplementation((options: { ios: { options: string[] } }) => {
    musicChanges.push({
      isDucked: options.ios.options[0] === 'duckOthers',
      atMs: isPaused ? sessionMs : anchor.sessionMs + Date.now() - anchor.fakeMs,
    });
  });
  const pause = async () => {
    isPaused = true;
    session.pause('longPress');
    await engine.pause();
  };
  const resume = async () => {
    session.resume();
    isPaused = false;
    anchor = { sessionMs, fakeMs: Date.now() };
    await engine.resume(sessionMs);
  };
  return { musicChanges, tickTo, pause, resume };
}

/** Asserts the music went down at the horn, nothing before it, and came up once after the strike. */
function expectOneDuckFromHornThroughStrike(musicChanges: readonly MusicChange[]) {
  expect(musicChanges[0]?.isDucked).toBe(true);
  expect(musicChanges[0]?.atMs).toBeGreaterThanOrEqual(HORN_MS - 100);
  expect(musicChanges[0]?.atMs).toBeLessThanOrEqual(HORN_MS);
  const releases = musicChanges.filter((change) => !change.isDucked);
  expect(releases).toHaveLength(1);
  expect(releases[0]?.atMs).toBeGreaterThan(PUSH_2_STARTS);
  expect(musicChanges.at(-1)).toBe(releases[0]);
}

beforeEach(() => {
  jest.useFakeTimers();
  mockSetSystemOptions.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the rowing session ducking the music', () => {
  it('leaves the music up through the silent warning, ducks at the horn, and brings it up once after the strike', async () => {
    const { musicChanges, tickTo } = await rowWithSoundFrom(PUSH_2_STARTS - 12 * SECOND);
    tickTo(PUSH_2_STARTS + 3 * SECOND);
    expectOneDuckFromHornThroughStrike(musicChanges);
  });

  it('brings the music back on a pause just before the horn, and keeps it up while paused', async () => {
    const { musicChanges, tickTo, pause } = await rowWithSoundFrom(PUSH_2_STARTS - 12 * SECOND);
    tickTo(HORN_MS - LOOKAHEAD_MS / 2);
    await pause();
    jest.advanceTimersByTime(10 * SECOND);
    expect(musicChanges.at(-1)?.isDucked).toBe(false);
  });

  it('ducks again on resume for a horn scheduled before the pause', async () => {
    const { musicChanges, tickTo, pause, resume } = await rowWithSoundFrom(
      PUSH_2_STARTS - 12 * SECOND,
    );
    tickTo(HORN_MS - LOOKAHEAD_MS / 2);
    await pause();
    jest.advanceTimersByTime(10 * SECOND);
    await resume();
    const changesBeforeResume = musicChanges.length;
    tickTo(PUSH_2_STARTS + 3 * SECOND);
    expectOneDuckFromHornThroughStrike(musicChanges.slice(changesBeforeResume));
  });
});
