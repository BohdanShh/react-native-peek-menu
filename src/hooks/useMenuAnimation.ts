import { useRef } from 'react';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  clamp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type SharedValue,
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
  id: string;
  activeId: SharedValue<string | null>;
  isHeld: boolean;
  onClosed: () => void;
};

type MenuPlacement = {
  shift: number;
  isOverflowing: boolean;
  minScroll: number;
  maxScroll: number;
  startOffset: number;
  translateX: number;
  transformOrigin: string;
};

const INITIAL_PLACEMENT: MenuPlacement = {
  shift: 0,
  isOverflowing: false,
  minScroll: 0,
  maxScroll: 0,
  startOffset: 0,
  translateX: 0,
  transformOrigin: 'top left',
};

export function useMenuAnimation({ id, activeId, isHeld, onClosed }: MenuAnimationConfig) {
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

    activeId.set(id);
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
          // The original has to be back before the copy on top of it goes.
          activeId.set(null);
          scheduleOnRN(onClosed);
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

  const uncoveredCopyStyle = useAnimatedStyle(() => ({
    opacity: placement.get().isOverflowing
      ? interpolate(progress.get(), UNCOVERED_FADE, [0, 1], 'clamp')
      : 0,
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
