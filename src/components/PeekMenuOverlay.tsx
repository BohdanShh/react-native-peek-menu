import { useEffect, type ReactNode } from 'react';
import {
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { type SharedValue } from 'react-native-reanimated';

import { PeekMenuList } from './PeekMenuList';
import type { ActivePeekMenu } from './PeekMenuProvider';
import { MENU_GAP } from '../constants';
import { useMenuAnimation } from '../hooks/useMenuAnimation';
import type {
  PeekMenuBackdropProps,
  PeekMenuInsets,
  PeekMenuItem,
  PeekMenuRenderProps,
} from '../types';
import {
  getMenuMaxWidth,
  getMenuPlacement,
  getMenuPosition,
  getStyleLeft,
} from '../utils/menuLayout';

type Props = {
  menu: ActivePeekMenu;
  activeId: SharedValue<string | null>;
  safeAreaInsets: PeekMenuInsets;
  isDark: boolean;
  backdropColor: string;
  renderBackdrop?: (props: PeekMenuBackdropProps) => ReactNode;
  renderMenu?: (props: PeekMenuRenderProps) => ReactNode;
  onClosed: () => void;
};

export function PeekMenuOverlay({
  menu,
  activeId,
  safeAreaInsets,
  isDark,
  backdropColor,
  renderBackdrop,
  renderMenu = (props) => <PeekMenuList {...props} isDark={isDark} />,
  onClosed,
}: Props) {
  const { rect, root } = menu;

  const animation = useMenuAnimation({
    id: menu.id,
    activeId,
    onClosed: () => {
      onClosed();
      menu.onClose?.();
    },
  });

  const handleMenuLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    animation.open({
      ...getMenuPlacement(rect, height, root.height, safeAreaInsets, menu.placement),
      ...getMenuPosition(rect, width, root.width, safeAreaInsets, menu.placement),
    });
  };

  const handleItemPress = (item: PeekMenuItem) => {
    animation.close(item.onPress);
  };

  useEffect(() => {
    menu.onOpen?.();

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      animation.close();

      return true;
    });

    const dimensionsSubscription = Dimensions.addEventListener('change', () => animation.close());

    return () => {
      backSubscription.remove();
      dimensionsSubscription.remove();
    };
  }, []);

  return (
    <GestureDetector gesture={animation.scrollGesture}>
      <Animated.View style={[StyleSheet.absoluteFill, animation.overlayStyle]}>
        <Animated.View
          style={
            renderBackdrop
              ? StyleSheet.absoluteFill
              : [
                  StyleSheet.absoluteFill,
                  { backgroundColor: backdropColor },
                  animation.backdropStyle,
                ]
          }
        >
          {renderBackdrop?.({ progress: animation.progress })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={() => animation.close()}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.copy,
            {
              left: getStyleLeft(rect.x, rect.width, root.width),
              top: rect.y,
              width: rect.width,
              height: rect.height,
            },
            animation.copyStyle,
          ]}
        >
          {menu.content}
        </Animated.View>
        <Animated.View
          onLayout={handleMenuLayout}
          style={[
            styles.menu,
            {
              ...(menu.placement === 'top'
                ? { bottom: root.height - rect.y + MENU_GAP }
                : { top: rect.y + rect.height + MENU_GAP }),
              maxWidth: getMenuMaxWidth(root.width, safeAreaInsets),
            },
            animation.menuStyle,
          ]}
        >
          {(menu.renderMenu ?? renderMenu)({
            items: menu.items,
            onItemPress: handleItemPress,
            close: animation.close,
            progress: animation.progress,
          })}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  copy: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  menu: {
    position: 'absolute',
    left: 0,
  },
});
