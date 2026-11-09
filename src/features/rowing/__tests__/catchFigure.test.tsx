import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { CatchFigure } from '../CatchFigure';

// Skia draws natively; these stand-ins keep the Canvas and the Group's transform visible to the test.
jest.mock('@shopify/react-native-skia', () => {
  const { View: HostView } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Canvas: ({ children }: { children: ReactNode }) => (
      <HostView testID="skia-canvas">{children}</HostView>
    ),
    Group: ({ children, transform }: { children: ReactNode; transform?: unknown }) => (
      <HostView testID="skia-group" accessibilityValue={{ text: JSON.stringify(transform) }}>
        {children}
      </HostView>
    ),
    Line: () => null,
    Rect: () => null,
    Circle: () => null,
    vec: (x: number, y: number) => ({ x, y }),
  };
});

async function layOut(width: number, height: number) {
  await fireEvent(screen.getByTestId('catch-figure'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
  });
}

describe('CatchFigure sizing (bug 2026-11-06: the drawing cropped at a guessed size)', () => {
  it('draws nothing until laid out, then fits the drawing to the measured size', async () => {
    await render(<CatchFigure />);
    expect(screen.queryByTestId('skia-canvas')).toBeNull();

    await layOut(600, 180);

    expect(screen.getByTestId('skia-canvas')).toBeOnTheScreen();
    expect(
      JSON.parse(screen.getAllByTestId('skia-group')[0]?.props.accessibilityValue.text),
    ).toEqual([{ translateX: 150 }, { translateY: 0 }, { scale: 1 }]);
  });

  it('waits for a real size rather than draw into an empty box', async () => {
    await render(<CatchFigure />);

    await layOut(600, 0);

    expect(screen.queryByTestId('skia-canvas')).toBeNull();
  });
});
