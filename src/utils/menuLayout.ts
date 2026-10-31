import {
  MENU_GAP,
  SCREEN_PADDING_BOTTOM,
  SCREEN_PADDING_HORIZONTAL,
  SCREEN_PADDING_TOP,
} from '../constants';
import type { PeekMenuInsets, PeekMenuRect } from '../types';

export function getMenuMaxWidth(rootWidth: number, insets: PeekMenuInsets) {
  return rootWidth - insets.left - insets.right - SCREEN_PADDING_HORIZONTAL * 2;
}

export function getMenuPosition(
  rect: PeekMenuRect,
  menuWidth: number,
  rootWidth: number,
  insets: PeekMenuInsets,
) {
  const isOnRightSide = rect.x + rect.width / 2 > rootWidth / 2;
  const left = isOnRightSide ? rect.x + rect.width - menuWidth : rect.x;
  const minLeft = insets.left + SCREEN_PADDING_HORIZONTAL;
  const maxLeft = rootWidth - insets.right - SCREEN_PADDING_HORIZONTAL - menuWidth;

  return {
    left: Math.max(minLeft, Math.min(left, maxLeft)),
    transformOrigin: isOnRightSide ? 'top right' : 'top left',
  };
}

/**
 * How far the content has to move for it and the menu to fit. When both can't, the menu's bottom
 * stays on screen, and `scrollRange` is how far the overlay drags down to bring back the rest.
 */
export function getMenuPlacement(
  rect: PeekMenuRect,
  menuHeight: number,
  rootHeight: number,
  insets: PeekMenuInsets,
) {
  const minY = insets.top + SCREEN_PADDING_TOP;
  const maxY = rootHeight - insets.bottom - SCREEN_PADDING_BOTTOM;
  const menuBottom = rect.y + rect.height + MENU_GAP + menuHeight;
  const shift = Math.min(maxY - menuBottom, Math.max(minY - rect.y, 0));

  return { shift, scrollRange: Math.max(minY - rect.y - shift, 0) };
}
