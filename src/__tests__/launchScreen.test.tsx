import { render, screen } from '@testing-library/react-native';

import LaunchScreen from '../../app/index';

let mockIsTestMode = false;
// jest.mock is hoisted above this file's declarations, so the value is read through a getter at render time.
jest.mock('../dev/testMode', () => ({
  get isTestMode() {
    return mockIsTestMode;
  },
}));

describe('launch screen', () => {
  it('shows the app name and no test-mode label in a normal build', async () => {
    mockIsTestMode = false;
    await render(<LaunchScreen />);
    expect(screen.getByText('Nor4x4')).toBeOnTheScreen();
    expect(screen.queryByText('Test mode')).not.toBeOnTheScreen();
  });

  it('links to the native spike and components gallery in a development build', async () => {
    await render(<LaunchScreen />);
    expect(screen.getByRole('link', { name: 'Native spike' })).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Components gallery' })).toBeOnTheScreen();
  });

  it('labels the screen when the build runs in test mode', async () => {
    mockIsTestMode = true;
    await render(<LaunchScreen />);
    expect(screen.getByText('Test mode')).toBeOnTheScreen();
  });
});
