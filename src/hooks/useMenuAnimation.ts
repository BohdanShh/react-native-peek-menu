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

import { CLOSE_TIMING, HOLD_SCALE, MENU_START_SCALE, OPEN_SPRING } from '../constants';

type MenuPlacement = {
  shift: number;
  minScroll: number;
  maxScroll: number;
  startOffset: number;
  left: number;
  transformOrigin: string;
};

const INITIAL_PLACEMENT: MenuPlacement = {
  shift: 0,
  minScroll: 0,
  maxScroll: 0,
  startOffset: 0,
  left: 0,
  transformOrigin: 'top left',
};

export function useMenuAnimation(onClosed: () => void) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(HOLD_SCALE);
  const scroll = useSharedValue(0);
  const placement = useSharedValue(INITIAL_PLACEMENT);
  const isClosing = useRef(false);
  const isMenuLocked = useSharedValue(false);

  const scrollGesture = usePanGesture({
    activeOffsetY: [-10, 10],
    onBegin: () => {
      'worklet';

      cancelAnimation(scroll);
    },
    onUpdate: (event) => {
      'worklet';

      const { minScroll, maxScroll } = placement.get();

      scroll.set(clamp(scroll.get() + event.changeY, minScroll, maxScroll));
    },
    onDeactivate: (event) => {
      'worklet';

      const { minScroll, maxScroll } = placement.get();

      scroll.set(withDecay({ velocity: event.velocityY, clamp: [minScroll, maxScroll] }));
    },
  });

  const open = (nextPlacement: MenuPlacement) => {
    placement.set(nextPlacement);

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

  const close = (action?: () => void) => {
    if (isClosing.current) {
      return;
    }

    isClosing.current = true;
    isMenuLocked.set(true);
    progress.set(
      withTiming(0, CLOSE_TIMING, (finished) => {
        if (finished) {
          onClosed();
        }
      }),
    );

    if (typeof action === 'function') {
      action();
    }
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
      { translateY: (placement.get().shift + scroll.get()) * progress.get() },
      { scale: scale.get() },
    ],
  }));

  const menuStyle = useAnimatedStyle(() => {
    const value = progress.get();
    const { shift, startOffset, left, transformOrigin } = placement.get();

    return {
      opacity: value,
      pointerEvents: isMenuLocked.get() ? 'none' : 'auto',
      transformOrigin,
      transform: [
        { translateX: left },
        { translateY: (shift + scroll.get()) * value + (1 - value) * startOffset },
        { scale: MENU_START_SCALE + (1 - MENU_START_SCALE) * value },
      ],
    };
  });

  return {
    progress,
    isClosing,
    open,
    close,
    scrollGesture,
    overlayStyle,
    backdropStyle,
    copyStyle,
    menuStyle,
  };
}
