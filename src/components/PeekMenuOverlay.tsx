import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react';
import { BackHandler, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { PeekMenuList } from './PeekMenuList';
import type { ActivePeekMenu } from './PeekMenuProvider';
import { MENU_GAP } from '../constants';
import { useMenuAnimation } from '../hooks/useMenuAnimation';
import { useMenuLayout } from '../hooks/useMenuLayout';
import type {
  PeekMenuBackdropProps,
  PeekMenuInsets,
  PeekMenuItem,
  PeekMenuPreviewProps,
  PeekMenuRenderProps,
} from '../types';
import {
  getCopyMotion,
  getHorizontalBounds,
  getMenuInsets,
  getStyleLeft,
} from '../utils/menuLayout';

type Props = {
  menu: ActivePeekMenu;
  safeAreaInsets: PeekMenuInsets;
  isDark: boolean;
  backdropColor: string;
  renderBackdrop?: (props: PeekMenuBackdropProps) => ReactNode;
  renderMenu?: (props: PeekMenuRenderProps) => ReactNode;
  onClosed: () => void;
};

export function PeekMenuOverlay({
  menu,
  safeAreaInsets,
  isDark,
  backdropColor,
  renderBackdrop,
  renderMenu = (props) => <PeekMenuList {...props} isDark={isDark} />,
  onClosed,
}: Props) {
  const { rect, root } = menu;
  const insets = getMenuInsets(safeAreaInsets, menu.keyboardOverlap);
  const { top: clipTop = 0, bottom: clipBottom = 0 } = menu.clipInsets ?? {};
  const { preview } = menu;
  const hasPreview = preview != null && typeof preview !== 'boolean';
  const isCovered = rect.y < clipTop || rect.y + rect.height > root.height - clipBottom;
  const bounds = getHorizontalBounds(root.width, insets);

  const openPreview = useRef<() => void>(null);

  const animation = useMenuAnimation({
    originalRef: menu.originalRef,
    keepsOriginal: isCovered,
    isHeld: menu.activateOn === 'hold',
    initialMotion: { ...getCopyMotion(rect, rect, bounds, menu.placement), fades: hasPreview },
    onOpened: typeof preview === 'function' ? () => openPreview.current?.() : undefined,
    onClosed: () => {
      onClosed();
      menu.onClose?.();
    },
  });

  const layout = useMenuLayout({
    menu,
    safeAreaInsets,
    insets,
    bounds,
    hasPreview,
    isCovered,
    onPlace: animation.open,
  });

  const renderContent = (isOnTop: boolean) => {
    if (typeof preview === 'function') {
      return <PreviewContent ref={isOnTop ? openPreview : undefined} preview={preview} />;
    }

    return hasPreview ? preview : menu.content;
  };

  const renderCopy = (isUncovered = false) => (
    <Animated.View
      style={[
        styles.copyFrame,
        {
          left: getStyleLeft(bounds.minX, bounds.width, root.width),
          top: rect.y,
          width: bounds.width,
        },
        isUncovered && animation.uncoveredCopyStyle,
      ]}
    >
      <Animated.View
        ref={isUncovered ? layout.uncoveredPreviewRef : layout.previewRef}
        onLayout={hasPreview && !isUncovered ? layout.handlePreviewLayout : undefined}
        style={[!hasPreview && { width: rect.width, height: rect.height }, animation.copyStyle]}
      >
        {renderContent(isUncovered || !isCovered)}
      </Animated.View>
    </Animated.View>
  );

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
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- The overlay mounts once per menu.
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
          <Pressable onPress={() => animation.close()} style={StyleSheet.absoluteFill} />
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
          onLayout={layout.handleMenuLayout}
          style={[
            styles.menu,
            {
              ...(menu.placement === 'top'
                ? { bottom: root.height - rect.y + MENU_GAP }
                : { top: rect.y + rect.height + MENU_GAP }),
              maxWidth: bounds.width,
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

function PreviewContent({
  ref,
  preview,
}: {
  ref?: Ref<() => void>;
  preview: (props: PeekMenuPreviewProps) => ReactNode;
}) {
  const [isOpened, setIsOpened] = useState(false);

  useImperativeHandle(ref, () => () => setIsOpened(true), []);

  return preview({ isOpened });
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
  copyFrame: {
    position: 'absolute',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  menu: {
    position: 'absolute',
    left: 0,
  },
});
