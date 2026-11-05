import { useWindowDimensions } from 'react-native';

/** Whether the window is taller than it is wide; rowing screens lay out from this (R33, KTD14). */
export function useIsPortrait(): boolean {
  const { width, height } = useWindowDimensions();
  return height > width;
}
