import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether iOS Reduce Motion is on, kept current as the setting changes; null until it is known, so
 * an animation can wait rather than start and then stop (R25).
 */
export function useReducedMotion(): boolean | null {
  const [isReduced, setIsReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let hasChangeArrived = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
      hasChangeArrived = true;
      setIsReduced(isEnabled);
    });
    AccessibilityInfo.isReduceMotionEnabled()
      .then((isEnabled) => {
        // A change event that beat the first read is newer, so it wins.
        if (!hasChangeArrived) {
          setIsReduced(isEnabled);
        }
      })
      .catch((error: unknown) => {
        console.error('Reading Reduce Motion failed; animating anyway', error);
        setIsReduced(false);
      });
    return () => subscription.remove();
  }, []);
  return isReduced;
}
