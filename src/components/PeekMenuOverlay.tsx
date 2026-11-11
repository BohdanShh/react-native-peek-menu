import { useEffect, type ReactNode } from 'react';
import {
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
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
  getMenuInsets,
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
  const insets = getMenuInsets(safeAreaInsets, menu.keyboardOverlap);
  const clippedInsets = getMenuInsets(safeAreaInsets, menu.keyboardOverlap, menu.clipInsets);
  const { top: clipTop = 0, bottom: clipBottom = 0 } = menu.clipInsets ?? {};
  const isCovered = rect.y < clipTop || rect.y + rect.height > root.height - clipBottom;

  const animation = useMenuAnimation({
    id: menu.id,
    activeId,
    isHeld: menu.activateOn === 'hold',
    onClosed: () => {
      onClosed();
      menu.onClose?.();
    },
  });

  const renderCopy = (isUncovered = false) => (
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
        isUncovered && animation.uncoveredCopyStyle,
      ]}
    >
      {menu.content}
    </Animated.View>
  );

  const handleMenuLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    const clippedPlacement = getMenuPlacement(
      rect,
      height,
      root.height,
      clippedInsets,
      menu.placement,
    );
    const fits = clippedPlacement.minScroll === 0 && clippedPlacement.maxScroll === 0;

    animation.open({
      ...(fits
        ? clippedPlacement
        : getMenuPlacement(rect, height, root.height, insets, menu.placement)),
      isOverflowing: !fits,
      ...getMenuPosition(rect, width, root.width, insets, menu.placement),
    });
  };

  const handleItemPress = (item: PeekMenuItem) => {
    if (item.disabled) {
      return;
    }

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
        {isCovered ? (
          <>
            <View style={[styles.clip, { top: clipTop, bottom: clipBottom }]}>
              <View style={[styles.clipContent, { top: -clipTop, height: root.height }]}>
                {renderCopy()}
              </View>
            </View>
            {renderCopy(true)}
          </>
        ) : (
          renderCopy()
        )}
        <Animated.View
          onLayout={handleMenuLayout}
          style={[
            styles.menu,
            {
              ...(menu.placement === 'top'
                ? { bottom: root.height - rect.y + MENU_GAP }
                : { top: rect.y + rect.height + MENU_GAP }),
              maxWidth: getMenuMaxWidth(root.width, insets),
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
  clip: {
    position: 'absolute',
    right: 0,
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  clipContent: {
    position: 'absolute',
    right: 0,
    left: 0,
  },
  copy: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  menu: {
    position: 'absolute',
    left: 0,
  },
});
