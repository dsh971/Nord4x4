import type { HeartRateReading, HeartRateSource } from '../../../domain/sensors/heartRateSource';
import { ScriptedPlayback } from './scriptedPlayback';

/** A heart-rate strap that replays a scripted trace, dropouts included, for tests and test mode. */
export class FakeHeartRateSource
  extends ScriptedPlayback<HeartRateReading>
  implements HeartRateSource {}
