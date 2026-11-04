import type { RowerReading, RowerSource } from '../../../domain/sensors/rowerSource';
import { ScriptedPlayback } from './scriptedPlayback';

/** A rowing machine that replays scripted stroke rates; the only RowerSource in v1 (KTD12). */
export class FakeRowerSource extends ScriptedPlayback<RowerReading> implements RowerSource {}
