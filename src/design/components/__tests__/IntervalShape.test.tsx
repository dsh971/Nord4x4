import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { IntervalShape } from '../IntervalShape';

// The shape is hidden from VoiceOver (the card's text says the same), so queries must opt in to see it.
const HIDDEN = { includeHiddenElements: true };

function barStyles() {
  return screen
    .getAllByTestId('interval-bar', HIDDEN)
    .map((bar) => StyleSheet.flatten(bar.props.style));
}

describe('IntervalShape', () => {
  it('gives each bar a width in proportion to its length, with pushes tallest', async () => {
    await render(
      <IntervalShape
        segments={[
          { kind: 'easy', durationMs: 600_000 },
          { kind: 'push', durationMs: 180_000 },
          { kind: 'rest', durationMs: 180_000 },
        ]}
      />,
    );
    const [warmUp, push, rest] = barStyles();

    expect([warmUp?.flexGrow, push?.flexGrow, rest?.flexGrow]).toEqual([600_000, 180_000, 180_000]);
    expect(push?.height).toBeGreaterThan(rest?.height ?? Infinity);
    expect(push?.height).toBeGreaterThan(warmUp?.height ?? Infinity);
  });

  it('renders nothing for an empty session', async () => {
    await render(<IntervalShape segments={[]} />);
    expect(screen.queryAllByTestId('interval-bar', HIDDEN)).toEqual([]);
    expect(screen.toJSON()).toBeNull();
  });
});
