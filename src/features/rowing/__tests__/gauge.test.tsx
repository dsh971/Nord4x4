import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';

import { SLICE_PLAN } from '../../../content/slicePlan';
import type { SessionPlan } from '../../../domain/session/sessionPlan';
import type { Banner } from '../banners';
import { describeGauge, progressBarsOf, type HeartInput } from '../gaugeModel';
import { RowingOverlay } from '../RowingOverlay';
import { colors } from '../../../design/tokens';
import { typography } from '../../../design/typography';
import { useIsPortrait } from '../../../design/useIsPortrait';
import { gaugeDigitsWidth } from '../GaugeDigits';
import {
  COOL_DOWN,
  heart,
  machineAt,
  MINUTE,
  PUSH_2_AT_1_48_LEFT,
  REST_10_S_BEFORE_PUSH_2,
  ROW_FREELY,
} from '../../../dev/rowingStates/sliceMoments';

// Segment 7 of the slice: warm-up (0–4), push 1 (5), rest (6), push 2 (7).
const PUSH_2_SEGMENT = 7;

async function renderOverlay(
  sessionMs: number,
  options: {
    plan?: SessionPlan;
    heart?: HeartInput;
    banner?: Banner;
    onPause?: () => void;
  } = {},
) {
  const plan = options.plan ?? SLICE_PLAN;
  const gauge = describeGauge(plan, machineAt(sessionMs, plan).snapshot(), options.heart ?? null);
  if (gauge === null) throw new Error(`No gauge ${sessionMs} ms into the row`);
  await render(
    <RowingOverlay
      gauge={gauge}
      bars={progressBarsOf(plan)}
      banner={options.banner ?? null}
      onPause={options.onPause ?? (() => undefined)}
    />,
  );
}

jest.mock('../../../design/useIsPortrait', () => ({ useIsPortrait: jest.fn(() => true) }));
const mockedIsPortrait = jest.mocked(useIsPortrait);

describe('rowing gauge (U7)', () => {
  it('shows the effort guide in a push, time left at 75 pt or more, and session time left', async () => {
    await renderOverlay(PUSH_2_AT_1_48_LEFT);

    const effort = within(screen.getByTestId('gauge-effort'));
    expect(effort.getByText('7–8')).toBeOnTheScreen();
    expect(effort.getByText('of 10 effort')).toBeOnTheScreen();
    expect(effort.getByText('Single words only')).toBeOnTheScreen();
    const time = screen.getByTestId('gauge-time');
    expect(time).toHaveAccessibleName('1:48');
    for (const digit of within(time).getAllByText(/./, { includeHiddenElements: true })) {
      expect(StyleSheet.flatten(digit.props.style).fontSize).toBeGreaterThanOrEqual(75);
    }
    expect(screen.getByTestId('session-left')).toHaveTextContent('Session · 12:48 left');
    const rate = screen.getByTestId('gauge-rate');
    expect(rate).toHaveAccessibleName('Stroke rate 26 to 28 per minute');
    expect(within(rate).getByText('26–28', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByText(/row with/)).toBeNull();
    expect(screen.queryByText('Next')).toBeNull();
    for (const text of within(rate).getAllByText(/./, { includeHiddenElements: true })) {
      expect(text.props.maxFontSizeMultiplier).toBeLessThanOrEqual(1.3);
    }
  });

  it('shows "Ease off ▲" and the charcoal glow while HR is held above 95%', async () => {
    await renderOverlay(PUSH_2_AT_1_48_LEFT, {
      plan: { ...SLICE_PLAN, coachingMode: 'hr' },
      heart: heart(178, { isGlowing: true }),
    });

    expect(screen.getByText('Ease off ▲')).toBeOnTheScreen();
    expect(screen.getByTestId('ease-off-glow')).toBeOnTheScreen();
  });

  it('shows every segment on the strip, both pickups included, with the marker in the current one', async () => {
    await renderOverlay(PUSH_2_AT_1_48_LEFT);

    const segments = screen.getAllByTestId('strip-segment');
    expect(segments).toHaveLength(SLICE_PLAN.segments.length);
    const push2 = segments[PUSH_2_SEGMENT];
    if (push2 === undefined) throw new Error('The strip has no segment for push 2');
    expect(within(push2).getByTestId('strip-now')).toBeOnTheScreen();
  });

  it("shows a signal's banner with the horn's edge pulse, and speaks it to VoiceOver", async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await renderOverlay(REST_10_S_BEFORE_PUSH_2, {
      banner: { text: 'Ready oars', hasEdgePulse: true },
    });

    expect(screen.getByRole('alert', { name: 'Ready oars' })).toBeOnTheScreen();
    expect(screen.getByTestId('horn-edge-pulse')).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith('Ready oars');
    announce.mockRestore();
  });
});

describe('rowing gauge, boards 3.3 and R61', () => {
  it('shows the next push in a rest, with the clock in persimmon as the horn calls it', async () => {
    await renderOverlay(REST_10_S_BEFORE_PUSH_2);

    const next = screen.getByText('Next');
    expect(StyleSheet.flatten(next.props.style).fontFamily).toBe(typography.headline.fontFamily);
    expect(screen.getByText('push 2 · 3:00')).toBeOnTheScreen();
    // A small rate line, so the next push fits the landscape panel's height.
    const rate = screen.getByTestId('gauge-rate');
    expect(rate).toHaveAccessibleName('Stroke rate 18 to 22 per minute');
    expect(rate).toHaveTextContent('Rate 18–22 spm');
    expect(StyleSheet.flatten(rate.props.style).fontSize).toBe(typography.caption.fontSize);
    const digit = within(screen.getByTestId('gauge-time')).getAllByText(/\d/, {
      includeHiddenElements: true,
    })[0];
    expect(StyleSheet.flatten(digit?.props.style).color).toBe(colors.textPush);
  });

  it('tells the rower to keep paddling in the cool-down: in the band in portrait, beside the panel in landscape', async () => {
    await renderOverlay(COOL_DOWN);
    expect(
      within(screen.getByTestId('corner-gauge')).getByText(
        "Keep paddling, don't stand straight up.",
      ),
    ).toBeOnTheScreen();

    mockedIsPortrait.mockReturnValue(false);
    await renderOverlay(COOL_DOWN);
    expect(screen.getByTestId('side-note')).toHaveTextContent(
      "Keep paddling, don't stand straight up.",
    );
    expect(within(screen.getByTestId('corner-gauge')).queryByText(/Keep paddling/)).toBeNull();
    mockedIsPortrait.mockReturnValue(true);
  });
});

describe('rowing overlay in landscape (board 3.2)', () => {
  beforeEach(() => mockedIsPortrait.mockReturnValue(false));
  afterEach(() => mockedIsPortrait.mockReturnValue(true));

  it('keeps the slice gauge at its 224 pt corner width, with the labels and strip beside and below it', async () => {
    await renderOverlay(PUSH_2_AT_1_48_LEFT);

    expect(StyleSheet.flatten(screen.getByTestId('corner-gauge').props.style).width).toBe(224);
    expect(screen.getByRole('button', { name: 'Hold anywhere to pause' })).toBeOnTheScreen();
    expect(screen.getByTestId('session-left')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('sizes the panel for a 10:00+ clock from the start, so Row freely never widens mid-row', async () => {
    await renderOverlay(30 * 1000, { plan: ROW_FREELY });
    const atStart = StyleSheet.flatten(screen.getByTestId('corner-gauge').props.style).width;
    await renderOverlay(12 * MINUTE, { plan: ROW_FREELY });
    const at12 = StyleSheet.flatten(screen.getByTestId('corner-gauge').props.style).width;

    expect(atStart).toBe(at12);
    expect(at12).toBeGreaterThanOrEqual(gaugeDigitsWidth('12:00', 'gaugeTime'));
    expect(screen.getByTestId('gauge-time')).toHaveAccessibleName('12:00');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('pausing (R32)', () => {
  it('pauses on a long press anywhere on the rowing screen, but not on a tap', async () => {
    const onPause = jest.fn();
    await renderOverlay(PUSH_2_AT_1_48_LEFT, { onPause });
    const overlay = screen.getByTestId('rowing-overlay');

    await fireEvent.press(overlay);
    expect(onPause).not.toHaveBeenCalled();
    await fireEvent(overlay, 'longPress');
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('lets a VoiceOver user pause from the pause label', async () => {
    const onPause = jest.fn();
    await renderOverlay(PUSH_2_AT_1_48_LEFT, { onPause });

    await fireEvent(
      screen.getByRole('button', { name: 'Hold anywhere to pause' }),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'activate' },
      },
    );
    expect(onPause).toHaveBeenCalledTimes(1);
  });
});
