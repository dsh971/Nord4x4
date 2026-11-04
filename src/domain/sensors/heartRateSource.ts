/** What a heart-rate strap reports: a beat rate, or that the strap has stopped sending ("Strap lost", R30). */
export type HeartRateReading =
  | { readonly type: 'sample'; readonly bpm: number; readonly atMs: number }
  | { readonly type: 'dropout'; readonly atMs: number };

/**
 * Live heart rate from a strap (KTD10). `atMs` is on the session's monotonic clock. A sample after
 * a dropout means the strap is back. The BLE implementation comes in U21; until then, fakes.
 */
export interface HeartRateSource {
  start(onReading: (reading: HeartRateReading) => void): void;
  stop(): void;
}
