import { useLongPressGesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HOLD_DELAY, HOLD_DURATION, HOLD_SCALE, RELEASE_DURATION } from '../constants';

export function useHold(onActivate: () => void) {
  const scale = useSharedValue(1);

  const gesture = useLongPressGesture({
    minDuration: HOLD_DELAY + HOLD_DURATION,
    onBegin: () => {
      'worklet';

      scale.set(withDelay(HOLD_DELAY, withTiming(HOLD_SCALE, { duration: HOLD_DURATION })));
    },
    onActivate: () => {
      'worklet';

      scheduleOnRN(onActivate);
    },
    onFinalize: () => {
      'worklet';

      scale.set(withTiming(1, { duration: RELEASE_DURATION }));
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return { gesture, animatedStyle };
}
