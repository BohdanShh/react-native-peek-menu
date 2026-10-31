import { useLongPressGesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HOLD_DELAY_RATIO, HOLD_SCALE, RELEASE_DURATION } from '../constants';

type HoldConfig = {
  duration: number;
  disabled: boolean;
  onActivate: () => void;
};

export function useHold({ duration, disabled, onActivate }: HoldConfig) {
  const scale = useSharedValue(1);

  const gesture = useLongPressGesture({
    enabled: !disabled,
    minDuration: duration,
    onBegin: () => {
      'worklet';

      const delay = duration * HOLD_DELAY_RATIO;

      scale.set(withDelay(delay, withTiming(HOLD_SCALE, { duration: duration - delay })));
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
