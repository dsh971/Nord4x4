/**
 * A rowing session's state as saved every 10 s (KTD4), so a killed app can pick the row up again.
 * Times are on the session's timeline, except `savedAtWallMs`, which is wall-clock time: the
 * monotonic clock restarts from a new zero in a new process, so only the wall clock can say how
 * long the app was gone.
 */
export type SessionCheckpoint = {
  readonly version: 1;
  readonly phase: 'rowing' | 'paused';
  readonly sessionMs: number;
  /** The latest event time already emitted, so a restore doesn't emit it again. */
  readonly emittedThroughMs: number;
  readonly savedAtWallMs: number;
};

/** Reads a checkpoint back from storage; throws if the value isn't a version-1 checkpoint. */
export function parseCheckpoint(value: unknown): SessionCheckpoint {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`A session checkpoint must be an object; got ${JSON.stringify(value)}`);
  }
  const fields = value as Record<string, unknown>;
  if (fields.version !== 1) {
    throw new Error(`Unsupported checkpoint version: ${JSON.stringify(fields.version)}`);
  }
  const phase = fields.phase;
  if (phase !== 'rowing' && phase !== 'paused') {
    throw new Error(
      `A checkpoint phase must be "rowing" or "paused"; got ${JSON.stringify(phase)}`,
    );
  }
  return {
    version: 1,
    phase,
    sessionMs: readFiniteNumber(fields, 'sessionMs'),
    emittedThroughMs: readFiniteNumber(fields, 'emittedThroughMs'),
    savedAtWallMs: readFiniteNumber(fields, 'savedAtWallMs'),
  };
}

function readFiniteNumber(fields: Record<string, unknown>, name: string): number {
  const value = fields[name];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Checkpoint ${name} must be a finite number; got ${JSON.stringify(value)}`);
  }
  return value;
}
