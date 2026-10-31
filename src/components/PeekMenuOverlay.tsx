import { Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { PeekMenuList } from './PeekMenuList';
import type { ActivePeekMenu } from './PeekMenuProvider';
import { MENU_GAP, MENU_WIDTH } from '../constants';
import { useMenuAnimation } from '../hooks/useMenuAnimation';
import type { PeekMenuInsets, PeekMenuItem } from '../types';
import { getMenuPosition, getMenuShift } from '../utils/menuLayout';

type Props = {
  menu: ActivePeekMenu;
  activeId: SharedValue<string | null>;
  safeAreaInsets: PeekMenuInsets;
  onClosed: () => void;
};

export function PeekMenuOverlay({ menu, activeId, safeAreaInsets, onClosed }: Props) {
  const { rect, root } = menu;

  const animation = useMenuAnimation(() => {
    'worklet';

    // The original has to be back before the copy on top of it goes.
    activeId.set(null);
    scheduleOnRN(onClosed);
  });

  // Waits for the menu's real height. The copy is there by then, so the original leaves no gap.
  const handleMenuLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;

    activeId.set(menu.id);
    animation.open(getMenuShift(rect, height, root.height, safeAreaInsets));
  };

  const handleItemPress = (item: PeekMenuItem) => {
    if (animation.close()) {
      item.onPress();
    }
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animation.overlayStyle]}>
      <Animated.View style={[styles.backdrop, animation.backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={animation.close}
          style={styles.fill}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.copy,
          { left: rect.x, top: rect.y, width: rect.width, height: rect.height },
          animation.copyStyle,
        ]}
      >
        {menu.content}
      </Animated.View>
      <PeekMenuList
        items={menu.items}
        onItemPress={handleItemPress}
        onLayout={handleMenuLayout}
        style={[
          {
            ...getMenuPosition(rect, root.width),
            top: rect.y + rect.height + MENU_GAP,
            width: MENU_WIDTH,
          },
          animation.menuStyle,
        ]}
      />
    </Animated.View>
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
