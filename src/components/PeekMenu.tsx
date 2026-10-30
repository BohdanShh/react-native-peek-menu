import { useId, type ReactNode } from 'react';
import type { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedRef, useAnimatedStyle } from 'react-native-reanimated';

import { usePeekMenu } from './PeekMenuProvider';
import { useHold } from '../hooks/useHold';
import type { PeekMenuItem } from '../types';

export type PeekMenuProps = {
  items: PeekMenuItem[];
  children: ReactNode;
};

export function PeekMenu({ items, children }: PeekMenuProps) {
  const { open, activeId } = usePeekMenu();
  const id = useId();
  const ref = useAnimatedRef<View>();

  const { gesture, animatedStyle, width } = useHold((scale) => {
    ref.current?.measureInWindow((x, y, measuredWidth, height) => {
      open({
        id,
        items,
        rect: { x, y, width: measuredWidth, height },
        content: children,
        scale,
      });
    });
  });

  const originalStyle = useAnimatedStyle(() => ({
    opacity: activeId.get() === id ? 0 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      {/* The scale stays on an inner view so it doesn't skew the measured rect. */}
      <Animated.View
        ref={ref}
        collapsable={false}
        style={originalStyle}
        onLayout={(event) => width.set(event.nativeEvent.layout.width)}
      >
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
