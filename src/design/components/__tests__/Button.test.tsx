import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { contrastRatio } from '../../contrast';
import { Button } from '../Button';

describe('Button', () => {
  it.each(['primary', 'secondary'] as const)(
    'draws a %s label at 4.5:1 or more against its own fill',
    async (variant) => {
      await render(<Button label="Set out" variant={variant} onPress={() => undefined} />);
      const button = screen.getByRole('button', { name: 'Set out' });

      const fill = StyleSheet.flatten(button.props.style).backgroundColor;
      const ink = StyleSheet.flatten(screen.getByText('Set out').props.style).color;
      expect(contrastRatio(String(ink), String(fill))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('does nothing when disabled, and says so to VoiceOver', async () => {
    const onPress = jest.fn();
    await render(<Button label="Set out" onPress={onPress} isDisabled />);
    const button = screen.getByRole('button', { name: 'Set out' });

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
