import { useRef } from 'react';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import {
  CLOSE_TIMING,
  HOLD_SCALE,
  MENU_START_OFFSET,
  MENU_START_SCALE,
  OPEN_SPRING,
} from '../constants';

export function useMenuAnimation(onClosed: () => void) {
  const progress = useSharedValue(0);
  // Starts where the hold left it, so the copy takes over without a jump.
  const scale = useSharedValue(HOLD_SCALE);
  const shift = useSharedValue(0);
  const scroll = useSharedValue(0);
  const scrollRange = useSharedValue(0);
  const menuLeft = useSharedValue(0);
  const menuOrigin = useSharedValue('top left');
  const isClosing = useRef(false);

  const scrollGesture = usePanGesture({
    activeOffsetY: [-10, 10],
    onBegin: () => {
      'worklet';

      cancelAnimation(scroll);
    },
    onUpdate: (event) => {
      'worklet';

      scroll.set(clamp(scroll.get() + event.changeY, 0, scrollRange.get()));
    },
    onDeactivate: (event) => {
      'worklet';

      scroll.set(withDecay({ velocity: event.velocityY, clamp: [0, scrollRange.get()] }));
    },
  });

  const open = (placement: {
    shift: number;
    scrollRange: number;
    left: number;
    transformOrigin: string;
  }) => {
    if (isClosing.current) {
      return;
    }

    shift.set(placement.shift);
    scrollRange.set(placement.scrollRange);
    menuLeft.set(placement.left);
    menuOrigin.set(placement.transformOrigin);

    /*
     * Waits for the second UI frame: mounting keeps the main thread busy, so the first one carries
     * the timestamp of the vsync it missed and a spring started on it would skip ahead.
     */
    scheduleOnUI(() => {
      'worklet';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progress.set(withSpring(1, OPEN_SPRING));
          scale.set(withSpring(1, OPEN_SPRING));
        });
      });
    });
  };

  const close = () => {
    if (isClosing.current) {
      return false;
    }

    isClosing.current = true;
    progress.set(
      withTiming(0, CLOSE_TIMING, (finished) => {
        if (finished) {
          onClosed();
        }
      }),
    );

    return true;
  };

  // Touches only count once the menu is on its way, so it can't close before it opens.
  const overlayStyle = useAnimatedStyle(() => ({
    pointerEvents: progress.get() > 0 ? 'auto' : 'none',
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
  }));

  const copyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (shift.get() + scroll.get()) * progress.get() },
      { scale: scale.get() },
    ],
  }));

  const menuStyle = useAnimatedStyle(() => {
    const value = progress.get();

    return {
      opacity: value,
      transformOrigin: menuOrigin.get(),
      transform: [
        { translateX: menuLeft.get() },
        { translateY: (shift.get() + scroll.get()) * value - (1 - value) * MENU_START_OFFSET },
        { scale: MENU_START_SCALE + (1 - MENU_START_SCALE) * value },
      ],
    };
  });

  return {
    progress,
    open,
    close,
    scrollGesture,
    overlayStyle,
    backdropStyle,
    copyStyle,
    menuStyle,
  };
}
