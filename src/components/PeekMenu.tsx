import { useId, type ReactNode } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedRef, useAnimatedStyle } from 'react-native-reanimated';

import { usePeekMenu } from './PeekMenuProvider';
import { HOLD_DURATION } from '../constants';
import { useHold } from '../hooks/useHold';
import type { PeekMenuItem } from '../types';

export type PeekMenuProps = {
  /** The rows of the menu, read when it opens. */
  items: PeekMenuItem[];
  /**
   * The content that opens the menu when held. It's rendered again above the screen while the menu
   * is open, so it loses its local state and any context below `PeekMenuProvider`.
   */
  children: ReactNode;
  /**
   * How long the content has to be held to open the menu, in milliseconds.
   *
   * @default 300
   */
  holdDuration?: number;
  /**
   * Stops holding from opening the menu.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Style of the wrapper around the content. Use it for layout, like `margin` or `alignSelf`:
   * things like `padding` and `backgroundColor` won't carry over to the menu's copy of the content.
   */
  style?: StyleProp<ViewStyle>;
  /** Called when the menu starts to open. */
  onOpen?: () => void;
  /** Called once the menu has finished closing. */
  onClose?: () => void;
};

/**
 * Opens a context menu when its children are held. Needs a `PeekMenuProvider` above it.
 *
 * @example
 * <PeekMenu items={[{ title: 'Copy', onPress: copy }]}>
 *   <Message />
 * </PeekMenu>
 */
export function PeekMenu({
  items,
  children,
  holdDuration = HOLD_DURATION,
  disabled = false,
  style,
  onOpen,
  onClose,
}: PeekMenuProps) {
  const { open, activeId } = usePeekMenu();
  const id = useId();
  const ref = useAnimatedRef<View>();

  const { gesture, animatedStyle } = useHold({
    duration: holdDuration,
    disabled,
    onActivate: () => {
      ref.current?.measureInWindow((x, y, measuredWidth, height) => {
        open({
          id,
          items,
          rect: { x, y, width: measuredWidth, height },
          content: children,
          onOpen,
          onClose,
        });
      });
    },
  });

  const originalStyle = useAnimatedStyle(() => ({
    opacity: activeId.get() === id ? 0 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      {/* The scale stays on an inner view so it doesn't skew the measured rect. */}
      <Animated.View ref={ref} collapsable={false} style={[style, originalStyle]}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
