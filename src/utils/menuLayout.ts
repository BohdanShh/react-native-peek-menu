import { I18nManager } from 'react-native';

import {
  MENU_GAP,
  MENU_START_OFFSET,
  SCREEN_PADDING_BOTTOM,
  SCREEN_PADDING_HORIZONTAL,
  SCREEN_PADDING_TOP,
} from '../constants';
import type { PeekMenuClipInsets, PeekMenuInsets, PeekMenuPlacement, PeekMenuRect } from '../types';

/**
 * The `left` style for a box at physical `x`. In RTL, React Native measures `left` from the right
 * edge, but measurements stay physical.
 */
export function getStyleLeft(x: number, width: number, rootWidth: number) {
  const { isRTL, doLeftAndRightSwapInRTL } = I18nManager.getConstants();

  return isRTL && doLeftAndRightSwapInRTL ? rootWidth - x - width : x;
}

/** The space the content and the menu keep clear of: the safe area, the keyboard and `clipInsets`. */
export function getMenuInsets(
  safeAreaInsets: PeekMenuInsets,
  keyboardOverlap: number,
  clipInsets: PeekMenuClipInsets = {},
) {
  return {
    ...safeAreaInsets,
    top: Math.max(safeAreaInsets.top, clipInsets.top ?? 0),
    bottom: Math.max(safeAreaInsets.bottom, keyboardOverlap, clipInsets.bottom ?? 0),
  };
}

/** The widest the menu can be and still keep clear of the sides of the screen. */
export function getMenuMaxWidth(rootWidth: number, insets: PeekMenuInsets) {
  return rootWidth - insets.left - insets.right - SCREEN_PADDING_HORIZONTAL * 2;
}

/**
 * Where the menu sits across the screen: lined up with the content's nearer side, kept clear of the
 * sides of the screen, and growing from the corner next to the content.
 */
export function getMenuPosition(
  rect: PeekMenuRect,
  menuWidth: number,
  rootWidth: number,
  insets: PeekMenuInsets,
  placement: PeekMenuPlacement,
) {
  const isOnRightSide = rect.x + rect.width / 2 > rootWidth / 2;
  const left = isOnRightSide ? rect.x + rect.width - menuWidth : rect.x;
  const minLeft = insets.left + SCREEN_PADDING_HORIZONTAL;
  const maxLeft = rootWidth - insets.right - SCREEN_PADDING_HORIZONTAL - menuWidth;

  const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));

  return {
    translateX: clampedLeft - getStyleLeft(0, menuWidth, rootWidth),
    transformOrigin: `${placement === 'top' ? 'bottom' : 'top'} ${isOnRightSide ? 'right' : 'left'}`,
  };
}

/**
 * How far the content has to move for it and the menu to fit. When both can't, the menu's far edge
 * stays on screen, and `minScroll` and `maxScroll` are how far the overlay drags to bring back the
 * rest: down with the menu at the bottom, up with the menu at the top.
 */
export function getMenuPlacement(
  rect: PeekMenuRect,
  menuHeight: number,
  rootHeight: number,
  insets: PeekMenuInsets,
  placement: PeekMenuPlacement,
) {
  const minY = insets.top + SCREEN_PADDING_TOP;
  const maxY = rootHeight - insets.bottom - SCREEN_PADDING_BOTTOM;
  const contentBottom = rect.y + rect.height;

  if (placement === 'top') {
    const menuTop = rect.y - MENU_GAP - menuHeight;
    const shift = Math.max(minY - menuTop, Math.min(maxY - contentBottom, 0));

    return {
      shift,
      minScroll: Math.min(maxY - contentBottom - shift, 0),
      maxScroll: 0,
      startOffset: MENU_START_OFFSET,
    };
  }

  const menuBottom = contentBottom + MENU_GAP + menuHeight;
  const shift = Math.min(maxY - menuBottom, Math.max(minY - rect.y, 0));

  return {
    shift,
    minScroll: 0,
    maxScroll: Math.max(minY - rect.y - shift, 0),
    startOffset: -MENU_START_OFFSET,
  };
}
