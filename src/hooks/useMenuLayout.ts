import { useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import { setNativeProps, useAnimatedRef } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import type { ActivePeekMenu } from '../components/PeekMenuProvider';
import type { PeekMenuInsets } from '../types';
import {
  getCopyMotion,
  getCopyRect,
  getMenuInsets,
  getMenuPlacement,
  getMenuPosition,
  getPreviewScale,
  type Bounds,
  type MenuPlacement,
  type Size,
} from '../utils/menuLayout';

type MenuLayoutConfig = {
  menu: ActivePeekMenu;
  safeAreaInsets: PeekMenuInsets;
  insets: PeekMenuInsets;
  bounds: Bounds;
  hasPreview: boolean;
  isCovered: boolean;
  onPlace: (placement: MenuPlacement) => void;
};

const FULL_WIDTH_PREVIEW = { alignSelf: 'stretch', alignItems: 'center' } as const;

export function useMenuLayout({
  menu,
  safeAreaInsets,
  insets,
  bounds,
  hasPreview,
  isCovered,
  onPlace,
}: MenuLayoutConfig) {
  const { rect, root } = menu;
  const isPlaced = useRef(false);
  const menuSize = useRef<Size | null>(null);
  const previewSize = useRef<Size | null>(null);
  const previewRef = useAnimatedRef<View>();
  const uncoveredPreviewRef = useAnimatedRef<View>();

  const placeWhenMeasured = () => {
    const menuLayout = menuSize.current;
    const size = hasPreview ? previewSize.current : rect;

    if (isPlaced.current || !menuLayout || !size) {
      return;
    }

    isPlaced.current = true;

    const endScale = hasPreview ? getPreviewScale(size, bounds) : 1;
    const target = getCopyRect(
      rect,
      { width: size.width * endScale, height: size.height * endScale },
      bounds,
    );

    onPlace({
      ...getMenuPlacement({
        rect: target,
        menuHeight: menuLayout.height,
        rootHeight: root.height,
        insets,
        clippedInsets: getMenuInsets(safeAreaInsets, menu.keyboardOverlap, menu.clipInsets),
        placement: menu.placement,
      }),
      ...getMenuPosition({
        rect: target,
        menuWidth: menuLayout.width,
        rootWidth: root.width,
        bounds,
        placement: menu.placement,
        alignment: menu.alignment,
      }),
      ...getCopyMotion(rect, target, bounds, menu.placement, endScale),
    });
  };

  const handleMenuLayout = (event: LayoutChangeEvent) => {
    menuSize.current = event.nativeEvent.layout;
    placeWhenMeasured();
  };

  // A preview sized in percentages has no width of its own until its wrapper gets one.
  const handlePreviewLayout = (event: LayoutChangeEvent) => {
    const { layout } = event.nativeEvent;

    if (layout.width > 0) {
      previewSize.current = layout;
      placeWhenMeasured();

      return;
    }

    scheduleOnUI(() => {
      'worklet';

      setNativeProps(previewRef, FULL_WIDTH_PREVIEW);

      if (isCovered) {
        setNativeProps(uncoveredPreviewRef, FULL_WIDTH_PREVIEW);
      }
    });
  };

  return { previewRef, uncoveredPreviewRef, handleMenuLayout, handlePreviewLayout };
}
