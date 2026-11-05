import { render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { contrastRatio } from '../../contrast';
import { ZoneChip, type ZoneState } from '../ZoneChip';

describe('ZoneChip', () => {
  it.each<[ZoneState, string, string]>([
    ['inZone', 'In zone', '●'],
    ['easeOff', 'Ease off', '▲'],
    ['build', 'Build', '▼'],
    ['recovering', 'Recovering', '○'],
  ])('shows %s as a word plus a shape, at 22 pt or larger', async (zone, word, shape) => {
    await render(<ZoneChip zone={zone} />);

    const chip = screen.getByLabelText(word);
    expect(chip).toHaveTextContent(new RegExp(`${word}`));
    expect(chip).toHaveTextContent(new RegExp(shape));
    const fontSizes = screen
      .getAllByText(new RegExp(`${word}|${shape}`))
      .map((text) => StyleSheet.flatten(text.props.style).fontSize ?? 0);
    expect(Math.min(...fontSizes)).toBeGreaterThanOrEqual(22);
  });

  it('puts arrows after the word and dots before it, as the boards do', async () => {
    await render(<ZoneChip zone="easeOff" />);
    expect(screen.getByLabelText('Ease off')).toHaveTextContent('Ease off ▲');
    await render(<ZoneChip zone="inZone" />);
    expect(screen.getByLabelText('In zone')).toHaveTextContent('● In zone');
  });

  it.each<[ZoneState, string]>([
    ['inZone', 'In zone'],
    ['easeOff', 'Ease off'],
    ['build', 'Build'],
    ['recovering', 'Recovering'],
  ])('draws %s text at 4.5:1 or more against its own chip', async (zone, word) => {
    await render(<ZoneChip zone={zone} />);
    const chip = screen.getByLabelText(word);
    const text = within(chip).getByText(new RegExp(word));

    const surface = StyleSheet.flatten(chip.props.style).backgroundColor;
    const ink = StyleSheet.flatten(text.props.style).color;
    expect(contrastRatio(String(ink), String(surface))).toBeGreaterThanOrEqual(4.5);
  });
});
