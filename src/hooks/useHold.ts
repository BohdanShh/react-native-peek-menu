import { useLongPressGesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  HOLD_DELAY,
  HOLD_DURATION,
  HOLD_MAX_SHRINK,
  HOLD_MIN_SCALE,
  HOLD_TIMING,
  RELEASE_TIMING,
} from '../constants/gesture';

export function useHold(onActivate: (scale: number) => void) {
  const scale = useSharedValue(1);
  const width = useSharedValue(0);

  const gesture = useLongPressGesture({
    minDuration: HOLD_DELAY + HOLD_DURATION,
    onBegin: () => {
      'worklet';

      const currentWidth = width.get();

      if (currentWidth > 0) {
        const minScale = Math.max(HOLD_MIN_SCALE, (currentWidth - HOLD_MAX_SHRINK) / currentWidth);

        scale.set(withDelay(HOLD_DELAY, withTiming(minScale, HOLD_TIMING)));
      }
    },
    onActivate: () => {
      'worklet';

      scheduleOnRN(onActivate, scale.get());
      scale.set(withTiming(1, RELEASE_TIMING));
    },
    onFinalize: () => {
      'worklet';

      scale.set(withTiming(1, RELEASE_TIMING));
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return { gesture, animatedStyle, width };
}
