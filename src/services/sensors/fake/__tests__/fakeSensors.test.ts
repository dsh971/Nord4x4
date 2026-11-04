import { ManualClock } from '../../../../domain/session/clock';
import type { HeartRateReading } from '../../../../domain/sensors/heartRateSource';
import type { RowerReading } from '../../../../domain/sensors/rowerSource';
import { FakeHeartRateSource } from '../fakeHeartRateSource';
import { FakeRowerSource } from '../fakeRowerSource';

describe('FakeHeartRateSource', () => {
  it('replays a scripted trace against the clock, including a dropout and recovery', () => {
    const clock = new ManualClock(10_000);
    const source = new FakeHeartRateSource(clock, [
      { type: 'sample', bpm: 120, atMs: 0 },
      { type: 'sample', bpm: 150, atMs: 1_000 },
      { type: 'dropout', atMs: 2_000 },
      { type: 'sample', bpm: 160, atMs: 5_000 },
    ]);
    const readings: HeartRateReading[] = [];
    source.start((reading) => readings.push(reading));

    source.pump();
    clock.advanceBy(2_500);
    source.pump();
    expect(readings).toEqual([
      { type: 'sample', bpm: 120, atMs: 10_000 },
      { type: 'sample', bpm: 150, atMs: 11_000 },
      { type: 'dropout', atMs: 12_000 },
    ]);

    clock.advanceBy(10_000);
    source.pump();
    source.pump();
    expect(readings.at(-1)).toEqual({ type: 'sample', bpm: 160, atMs: 15_000 });
    expect(readings).toHaveLength(4);
  });

  it('sends nothing once stopped', () => {
    const clock = new ManualClock();
    const source = new FakeHeartRateSource(clock, [{ type: 'sample', bpm: 120, atMs: 1_000 }]);
    const readings: HeartRateReading[] = [];
    source.start((reading) => readings.push(reading));
    source.stop();
    clock.advanceBy(5_000);
    source.pump();
    expect(readings).toEqual([]);
  });

  it('rejects a trace that goes back in time', () => {
    expect(
      () =>
        new FakeHeartRateSource(new ManualClock(), [
          { type: 'sample', bpm: 120, atMs: 2_000 },
          { type: 'sample', bpm: 125, atMs: 1_000 },
        ]),
    ).toThrow(/order/);
  });
});

describe('FakeRowerSource', () => {
  it('replays its scripted stroke rates', () => {
    const clock = new ManualClock();
    const source = new FakeRowerSource(clock, [
      { strokesPerMinute: 20, atMs: 0 },
      { strokesPerMinute: 27, atMs: 3_000 },
    ]);
    const readings: RowerReading[] = [];
    source.start((reading) => readings.push(reading));
    clock.advanceBy(3_000);
    source.pump();
    expect(readings.map((reading) => reading.strokesPerMinute)).toEqual([20, 27]);
  });
});
