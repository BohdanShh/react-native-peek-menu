import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PeekMenuList } from './PeekMenuList';
import type { ActivePeekMenu } from './PeekMenuProvider';
import { BACKDROP_TIMING, RELEASE_TIMING } from '../constants/gesture';
import {
  MENU_EDGE_INSET,
  MENU_FADE_IN_TIMING,
  MENU_MIN_SCALE,
  MENU_SPACING,
  MENU_SPRING,
  MENU_WIDTH,
} from '../constants/menu';
import type { PeekMenuItem } from '../types';

type Props = {
  menu: ActivePeekMenu;
  activeId: SharedValue<string | null>;
  onClosed: () => void;
};

export function PeekMenuOverlay({ menu, activeId, onClosed }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const backdropOpacity = useSharedValue(0);
  // Starts where the hold left it, so the copy takes over without a jump.
  const scale = useSharedValue(menu.scale);
  const menuProgress = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const menuHeight = useSharedValue(0);

  // Waits for the copy to be there, so the original never leaves a gap.
  const handleCopyLayout = () => {
    activeId.set(menu.id);
    backdropOpacity.set(withTiming(1, BACKDROP_TIMING));
    scale.set(withTiming(1, RELEASE_TIMING));
    menuProgress.set(withSpring(1, MENU_SPRING));
    menuOpacity.set(withTiming(1, MENU_FADE_IN_TIMING));
  };

  const handleClose = () => {
    menuProgress.set(withTiming(0, BACKDROP_TIMING));
    menuOpacity.set(withTiming(0, BACKDROP_TIMING));
    backdropOpacity.set(
      withTiming(0, BACKDROP_TIMING, (finished) => {
        if (finished) {
          // The original has to be back before the copy on top of it goes.
          activeId.set(null);
          scheduleOnRN(onClosed);
        }
      }),
    );
  };

  const handleItemPress = (item: PeekMenuItem) => {
    item.onPress();
    handleClose();
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.get(),
  }));

  // Grows out of the message: the menu's middle starts at its top edge, by the message.
  const menuStyle = useAnimatedStyle(() => {
    const progress = menuProgress.get();

    return {
      opacity: menuOpacity.get(),
      transform: [
        { translateY: (1 - progress) * -(menuHeight.get() / 2 + MENU_SPACING) },
        { scale: MENU_MIN_SCALE + (1 - MENU_MIN_SCALE) * progress },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const { rect } = menu;
  const isOnRightSide = rect.x + rect.width / 2 > screenWidth / 2;
  const menuLeft = isOnRightSide ? rect.x + rect.width - MENU_WIDTH : rect.x;

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={handleClose}
          style={styles.fill}
        />
      </Animated.View>
      <Animated.View
        onLayout={handleCopyLayout}
        style={[
          styles.copy,
          {
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          },
          copyStyle,
        ]}
      >
        {menu.content}
      </Animated.View>
      <PeekMenuList
        items={menu.items}
        onItemPress={handleItemPress}
        onLayout={(event) => menuHeight.set(event.nativeEvent.layout.height)}
        style={[
          {
            left: Math.max(
              MENU_EDGE_INSET,
              Math.min(menuLeft, screenWidth - MENU_EDGE_INSET - MENU_WIDTH),
            ),
            top: rect.y + rect.height + MENU_SPACING,
            width: MENU_WIDTH,
          },
          menuStyle,
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fill: {
    flex: 1,
  },
  copy: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
