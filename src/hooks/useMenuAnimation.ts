import { useRef } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
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
  const isClosing = useRef(false);

  const open = (nextShift: number) => {
    if (isClosing.current) {
      return;
    }

    shift.set(nextShift);

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
    transform: [{ translateY: shift.get() * progress.get() }, { scale: scale.get() }],
  }));

  const menuStyle = useAnimatedStyle(() => {
    const value = progress.get();

    return {
      opacity: value,
      transform: [
        { translateY: shift.get() * value - (1 - value) * MENU_START_OFFSET },
        { scale: MENU_START_SCALE + (1 - MENU_START_SCALE) * value },
      ],
    };
  });

  return { open, close, overlayStyle, backdropStyle, copyStyle, menuStyle };
}
