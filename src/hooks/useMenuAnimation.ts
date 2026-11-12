import { useRef } from 'react';
import type { View } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  clamp,
  interpolate,
  setNativeProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type AnimatedRef,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import {
  CLOSE_TIMING,
  HOLD_SCALE,
  MENU_START_SCALE,
  OPEN_SPRING,
  UNCOVERED_FADE,
} from '../constants';

type MenuAnimationConfig = {
  originalRef: AnimatedRef<View>;
  keepsOriginal: boolean;
  isHeld: boolean;
  onClosed: () => void;
};

type MenuPlacement = {
  shift: number;
  minScroll: number;
  maxScroll: number;
  startOffset: number;
  translateX: number;
  transformOrigin: string;
};

const INITIAL_PLACEMENT: MenuPlacement = {
  shift: 0,
  minScroll: 0,
  maxScroll: 0,
  startOffset: 0,
  translateX: 0,
  transformOrigin: 'top left',
};

export function useMenuAnimation({
  originalRef,
  keepsOriginal,
  isHeld,
  onClosed,
}: MenuAnimationConfig) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(isHeld ? HOLD_SCALE : 1);
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
    // A resize while closing must not hide the original again: nothing would bring it back.
    if (isClosing.current) {
      return;
    }

    placement.set(nextPlacement);

    /*
     * Waits for the second UI frame: mounting keeps the main thread busy, so the first one carries
     * the timestamp of the vsync it missed and a spring started on it would skip ahead.
     */
    scheduleOnUI(() => {
      'worklet';

      if (!keepsOriginal) {
        setNativeProps(originalRef, { opacity: 0 });
      }

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
          // The original has to be back before the copy on top of it goes.
          setNativeProps(originalRef, { opacity: 1, transform: [{ translateY: 0 }] });
          scheduleOnRN(onClosed);
        }
      }),
    );

    if (typeof action === 'function') {
      action();
    }
  };

  useAnimatedReaction(
    () => (placement.get().shift + scroll.get()) * progress.get(),
    (offset) => {
      if (keepsOriginal) {
        setNativeProps(originalRef, { transform: [{ translateY: offset }] });
      }
    },
  );

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

  const uncoveredCopyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), UNCOVERED_FADE, [0, 1], 'clamp'),
  }));

  const menuStyle = useAnimatedStyle(() => {
    const value = progress.get();
    const { shift, startOffset, translateX, transformOrigin } = placement.get();

    return {
      opacity: Math.min(value * 2, 1),
      pointerEvents: isMenuLocked.get() ? 'none' : 'auto',
      transformOrigin,
      transform: [
        { translateX },
        { translateY: (shift + scroll.get()) * value + (1 - value) * startOffset },
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
    uncoveredCopyStyle,
    menuStyle,
  };
}
