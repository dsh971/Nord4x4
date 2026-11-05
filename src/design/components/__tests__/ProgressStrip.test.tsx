import { render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ProgressStrip } from '../ProgressStrip';
import type { BarSegment } from '../SegmentBars';

const WEEK_3: BarSegment[] = [
  { kind: 'easy', durationMs: 300_000 },
  { kind: 'pickup', durationMs: 20_000 },
  { kind: 'easy', durationMs: 100_000 },
  { kind: 'pickup', durationMs: 20_000 },
  { kind: 'easy', durationMs: 160_000 },
  { kind: 'push', durationMs: 180_000 },
  { kind: 'rest', durationMs: 180_000 },
];

function segments() {
  return screen.getAllByTestId('strip-segment');
}

function styleOf(element: ReturnType<typeof screen.getByTestId>) {
  return StyleSheet.flatten(element.props.style);
}

describe('ProgressStrip', () => {
  it('shows every segment, pickups included, with work taller than easy rowing', async () => {
    await render(<ProgressStrip segments={WEEK_3} elapsedMs={0} />);
    const heights = segments().map((segment) => styleOf(segment).height);

    expect(heights).toHaveLength(7);
    expect(heights[1]).toBeGreaterThan(heights[0] ?? Infinity);
    expect(heights[5]).toBe(heights[1]);
  });

  it('puts the now-marker inside the segment being rowed, at the edge of its fill', async () => {
    // 640 s into the session is 40 s into the 3′ push (which starts at 600 s).
    await render(<ProgressStrip segments={WEEK_3} elapsedMs={640_000} />);

    const push = segments()[5];
    if (!push) {
      throw new Error('The strip should show the push');
    }
    expect(styleOf(within(push).getByTestId('strip-now')).left).toBe(`${(40 / 180) * 100}%`);
    expect(screen.getAllByTestId('strip-now')).toHaveLength(1);
    expect(screen.getByLabelText('Session progress: push 1 of 1 in progress')).toBeOnTheScreen();
  });

  it('tells VoiceOver how far through the session the rower is', async () => {
    await render(<ProgressStrip segments={WEEK_3} elapsedMs={480_000} />);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 100, now: 50 });
    expect(screen.getByLabelText('Session progress: easy rowing in progress')).toBeOnTheScreen();
  });

  it('holds the marker at the end of the last segment once the session is over', async () => {
    await render(<ProgressStrip segments={WEEK_3} elapsedMs={5_000_000} />);

    const last = segments()[6];
    if (!last) {
      throw new Error('The strip should show the last rest');
    }
    expect(styleOf(within(last).getByTestId('strip-now')).left).toBe('100%');
    expect(screen.getByLabelText('Session progress: complete')).toBeOnTheScreen();
  });
});
