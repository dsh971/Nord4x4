import { fireEvent, render, screen } from '@testing-library/react-native';

import { SLICE_PLAN } from '../../../content/slicePlan';
import { STOP_LINE } from '../copy';
import { describeGauge } from '../gaugeModel';
import { PauseSheet } from '../PauseSheet';
import { machineAt, PUSH_2_AT_1_48_LEFT } from '../../../dev/rowingStates/sliceMoments';

/** The gauge as the pause sheet gets it: from a session paused mid-push, with 1:48 left. */
function pausedGauge() {
  const machine = machineAt(PUSH_2_AT_1_48_LEFT);
  machine.pause('longPress');
  const gauge = describeGauge(SLICE_PLAN, machine.snapshot(), null);
  if (gauge === null) throw new Error('No gauge while paused');
  return gauge;
}

describe('pause sheet (R32, R61)', () => {
  it('resumes on a tap, but ends the session only when End is held', async () => {
    const onResume = jest.fn();
    const onEndSession = jest.fn();
    await render(
      <PauseSheet
        gauge={pausedGauge()}
        reason="longPress"
        onResume={onResume}
        onEndSession={onEndSession}
      />,
    );

    expect(screen.getByText('Paused · Push 2 of 3')).toBeOnTheScreen();
    expect(screen.getByText('1:48')).toBeOnTheScreen();
    expect(screen.getByText('left in this push')).toBeOnTheScreen();
    expect(screen.getByText(STOP_LINE)).toBeOnTheScreen();
    const end = screen.getByRole('button', { name: 'Hold to end session' });
    await fireEvent.press(end);
    expect(onEndSession).not.toHaveBeenCalled();
    await fireEvent(end, 'longPress');
    expect(onEndSession).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Resume' }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('lets a VoiceOver user end the session with a double-tap', async () => {
    const onEndSession = jest.fn();
    await render(
      <PauseSheet
        gauge={pausedGauge()}
        reason="longPress"
        onResume={() => undefined}
        onEndSession={onEndSession}
      />,
    );

    await fireEvent(
      screen.getByRole('button', { name: 'Hold to end session' }),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'activate' },
      },
    );
    expect(onEndSession).toHaveBeenCalledTimes(1);
  });

  it('says why the row paused', async () => {
    await render(
      <PauseSheet
        gauge={pausedGauge()}
        reason="interruption"
        onResume={() => undefined}
        onEndSession={() => undefined}
      />,
    );

    expect(screen.getByText(/phone took the sound/)).toBeOnTheScreen();
    expect(screen.queryByText(/long press/)).toBeNull();
  });
});
