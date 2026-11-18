import { useMemo } from 'react';
import type { View } from 'react-native';
import { usePanGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  clamp,
  interpolate,
  setNativeProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type AnimatedRef,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import {
  CLOSE_TIMING,
  DRAG_START_DISTANCE,
  HOLD_SCALE,
  MENU_FADE_IN,
  MENU_START_SCALE,
  OPEN_SPRING,
  PREVIEW_FADE_IN,
  UNCOVERED_FADE,
} from '../constants';
import type { CopyMotion, MenuPlacement } from '../utils/menuLayout';

type MenuAnimationConfig = {
  originalRef: AnimatedRef<View>;
  keepsOriginal: boolean;
  isHeld: boolean;
  initialMotion: CopyMotion;
  onOpened?: () => void;
  onClosed: () => void;
};

function fadeIn(value: number, isClosing: boolean, until: number) {
  'worklet';

  return isClosing ? value : Math.min(value / until, 1);
}

export function useMenuAnimation({
  originalRef,
  keepsOriginal,
  isHeld,
  initialMotion,
  onOpened,
  onClosed,
}: MenuAnimationConfig) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(isHeld ? HOLD_SCALE : 1);
  const scroll = useSharedValue(0);
  const placement = useSharedValue<MenuPlacement>({
    ...initialMotion,
    shift: 0,
    minScroll: 0,
    maxScroll: 0,
    translateX: 0,
    transformOrigin: 'top left',
  });
  const isClosing = useSharedValue(false);
  const offset = useDerivedValue(() => placement.get().shift + scroll.get());

  const scrollConfig = useMemo(
    (): Parameters<typeof usePanGesture>[0] => ({
      activeOffsetY: [-DRAG_START_DISTANCE, DRAG_START_DISTANCE],
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
    }),
    [placement, scroll],
  );

  const scrollGesture = usePanGesture(scrollConfig);

  const open = (nextPlacement: MenuPlacement) => {
    // A menu closed before it was measured must not hide the original: nothing would bring it back.
    if (isClosing.get()) {
      return;
    }

    placement.set(nextPlacement);

    /*
     * Waits for the second UI frame: mounting keeps the main thread busy, so the first one carries
     * the timestamp of the vsync it missed and a spring started on it would skip ahead.
     */
    scheduleOnUI(() => {
      'worklet';

      if (!keepsOriginal && !nextPlacement.fades) {
        setNativeProps(originalRef, { opacity: 0 });
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progress.set(
            withSpring(1, OPEN_SPRING, (finished) => {
              if (finished && onOpened) {
                scheduleOnRN(onOpened);
              }
            }),
          );
          scale.set(withSpring(1, OPEN_SPRING));
        });
      });
    });
  };

  const close = (action?: () => void) => {
    if (isClosing.get()) {
      return;
    }

    isClosing.set(true);
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
    () => (keepsOriginal && !placement.get().fades ? offset.get() * progress.get() : null),
    (translateY) => {
      if (translateY !== null) {
        setNativeProps(originalRef, { transform: [{ translateY }] });
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

  const copyStyle = useAnimatedStyle(() => {
    const value = progress.get();
    const { startX, endX, dy, startScale, endScale, fades } = placement.get();

    return {
      opacity: fades ? fadeIn(value, isClosing.get(), PREVIEW_FADE_IN) : 1,
      transform: [
        { translateX: startX + (endX - startX) * value },
        { translateY: dy + offset.get() * value },
        { scale: (startScale + (endScale - startScale) * value) * scale.get() },
      ],
    };
  });

  const uncoveredCopyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), UNCOVERED_FADE, [0, 1], 'clamp'),
  }));

  const menuStyle = useAnimatedStyle(() => {
    const value = progress.get();
    const closing = isClosing.get();
    const { translateX, transformOrigin, menuOffset } = placement.get();

    return {
      opacity: fadeIn(value, closing, MENU_FADE_IN),
      pointerEvents: closing ? 'none' : 'auto',
      transformOrigin,
      transform: [
        { translateX },
        { translateY: (menuOffset + offset.get()) * value },
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
