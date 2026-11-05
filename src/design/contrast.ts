const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function linearChannel(hex: string, start: number): number {
  const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  if (!HEX_COLOR.test(hex)) {
    throw new Error(`Contrast needs an opaque six-digit hex colour like #1C1B1A; got "${hex}"`);
  }
  return (
    0.2126 * linearChannel(hex, 1) + 0.7152 * linearChannel(hex, 3) + 0.0722 * linearChannel(hex, 5)
  );
}

/** The WCAG 2 contrast ratio between two opaque hex colours, from 1 (none) to 21 (black on white). */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
