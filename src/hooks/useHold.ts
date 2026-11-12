import { useLayoutEffect, useMemo, useRef } from 'react';
import { usePanGesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HOLD_DELAY_RATIO, HOLD_MAX_DISTANCE, HOLD_SCALE, RELEASE_DURATION } from '../constants';

type HoldConfig = {
  duration: number;
  disabled: boolean;
  onActivate: () => void;
};

export function useHold({ duration, disabled, onActivate }: HoldConfig) {
  const scale = useSharedValue(1);
  const onActivateRef = useRef(onActivate);

  useLayoutEffect(() => {
    onActivateRef.current = onActivate;
  });

  const config = useMemo(() => {
    const activate = () => onActivateRef.current();

    return {
      enabled: !disabled,
      activateAfterLongPress: duration,
      failOffsetX: [-HOLD_MAX_DISTANCE, HOLD_MAX_DISTANCE] as [number, number],
      failOffsetY: [-HOLD_MAX_DISTANCE, HOLD_MAX_DISTANCE] as [number, number],
      onBegin: () => {
        'worklet';

        const delay = duration * HOLD_DELAY_RATIO;

        scale.set(withDelay(delay, withTiming(HOLD_SCALE, { duration: duration - delay })));
      },
      onActivate: () => {
        'worklet';

        scheduleOnRN(activate);
      },
      onFinalize: () => {
        'worklet';

        scale.set(withTiming(1, { duration: RELEASE_DURATION }));
      },
    };
  }, [disabled, duration, scale]);

  const gesture = usePanGesture(config);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return { gesture, animatedStyle };
}
