import { contrastRatio } from '../contrast';
import { colors, textOnSurface } from '../tokens';

describe('contrastRatio', () => {
  it('matches the WCAG extremes and is symmetric', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#1C1B1A', '#F9F8F4')).toBeCloseTo(
      contrastRatio('#F9F8F4', '#1C1B1A'),
      10,
    );
  });

  it('rejects a colour that is not six-digit hex', () => {
    expect(() => contrastRatio('rgba(0,0,0,0.5)', '#FFFFFF')).toThrow(/hex/);
    expect(() => contrastRatio('#FFF', '#FFFFFF')).toThrow(/hex/);
  });
});

describe('text on surface', () => {
  it.each(textOnSurface.map(({ text, surface }) => [text, surface]))(
    '%s on %s meets 4.5:1',
    (text, surface) => {
      expect(contrastRatio(colors[text], colors[surface])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('covers every text colour at least once', () => {
    const textRoles = new Set(textOnSurface.map((pairing) => pairing.text));
    const allTextRoles = Object.keys(colors).filter((role) => role.startsWith('text'));
    expect([...textRoles].sort()).toEqual(allTextRoles.sort());
  });
});
