/** A stroke rate reported by a rowing machine. */
export type RowerReading = { readonly strokesPerMinute: number; readonly atMs: number };

/**
 * Live readings from a rowing machine (KTD10). v1 measures no strokes (KTD12), so only a fake
 * implements this until PM5 support is built.
 */
export interface RowerSource {
  start(onReading: (reading: RowerReading) => void): void;
  stop(): void;
}
