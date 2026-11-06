import { fireEvent, render, screen } from '@testing-library/react-native';

import { useIsPortrait } from '../../../design/useIsPortrait';
import { CATCH_FIGURE_LABEL, STOP_LINE } from '../copy';
import { GetSeated } from '../GetSeated';

jest.mock('../../../design/useIsPortrait', () => ({ useIsPortrait: jest.fn(() => true) }));
// Skia draws natively, so the tests stand in a labelled box for the figure.
jest.mock('../CatchFigure', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const { CATCH_FIGURE_LABEL } = jest.requireActual<typeof import('../copy')>('../copy');
  return {
    CatchFigure: () => (
      <View accessible accessibilityRole="image" accessibilityLabel={CATCH_FIGURE_LABEL} />
    ),
  };
});
const mockedIsPortrait = jest.mocked(useIsPortrait);

async function renderGetSeated(remainingMs: number, isHardSession = true, onStartNow = jest.fn()) {
  await render(
    <GetSeated
      remainingMs={remainingMs}
      summary="Three 3′ pushes · 10′ warm-up first"
      isHardSession={isHardSession}
      onStartNow={onStartNow}
    />,
  );
  return onStartNow;
}

describe('Get seated (R23, R61)', () => {
  it('counts down on the clock, then in big single numbers for the last five seconds', async () => {
    await renderGetSeated(6_000);
    expect(screen.getByTestId('get-seated-time')).toHaveAccessibleName('0:06');
    expect(screen.queryByTestId('count-in')).toBeNull();

    await renderGetSeated(2_400);
    expect(screen.getByTestId('count-in')).toHaveTextContent('3');
    await renderGetSeated(0);
    expect(screen.getByTestId('count-in')).toHaveTextContent('1');
  });

  it('shows the stop line before a hard session only', async () => {
    await renderGetSeated(14_000, true);
    expect(screen.getByText(STOP_LINE)).toBeOnTheScreen();
    await renderGetSeated(14_000, false);
    expect(screen.queryByText(STOP_LINE)).toBeNull();
  });

  it('starts at once on Start now', async () => {
    const onStartNow = await renderGetSeated(14_000);
    await fireEvent.press(screen.getByRole('button', { name: 'Start now' }));
    expect(onStartNow).toHaveBeenCalledTimes(1);
  });

  it('reads the countdown before the stroke phases in portrait, as it is drawn', async () => {
    await renderGetSeated(14_000);
    const texts = screen.getAllByText(/./).map((node) => String(node.props.children));
    const countdown = texts.indexOf('Get seated · starting in');
    expect(countdown).toBeGreaterThanOrEqual(0);
    expect(countdown).toBeLessThan(texts.indexOf('Catch'));
  });

  it('keeps Start now and the stop line on screen in landscape, the stop line beside the countdown', async () => {
    mockedIsPortrait.mockReturnValue(false);
    await renderGetSeated(14_000);

    expect(screen.getByRole('button', { name: 'Start now' })).toBeOnTheScreen();
    const texts = screen.getAllByText(/./).map((node) => String(node.props.children));
    const stopLine = texts.indexOf(STOP_LINE);
    expect(stopLine).toBeGreaterThanOrEqual(0);
    expect(stopLine).toBeLessThan(texts.indexOf('Get seated · starting in'));
    mockedIsPortrait.mockReturnValue(true);
  });

  it('shows the rower at the catch above the stroke phases', async () => {
    await renderGetSeated(14_000);
    expect(screen.getByRole('image', { name: CATCH_FIGURE_LABEL })).toBeOnTheScreen();
  });
});
