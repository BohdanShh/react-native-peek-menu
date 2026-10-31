import {
  MENU_GAP,
  MENU_WIDTH,
  SCREEN_PADDING_BOTTOM,
  SCREEN_PADDING_HORIZONTAL,
  SCREEN_PADDING_TOP,
} from '../constants';
import type { PeekMenuInsets, PeekMenuRect } from '../types';

/** Lines the menu up with the side of the root the content is on. */
export function getMenuPosition(rect: PeekMenuRect, rootWidth: number) {
  const isOnRightSide = rect.x + rect.width / 2 > rootWidth / 2;
  const left = isOnRightSide ? rect.x + rect.width - MENU_WIDTH : rect.x;
  const maxLeft = rootWidth - SCREEN_PADDING_HORIZONTAL - MENU_WIDTH;

  return {
    left: Math.max(SCREEN_PADDING_HORIZONTAL, Math.min(left, maxLeft)),
    transformOrigin: isOnRightSide ? 'top right' : 'top left',
  };
}

/** How far the content has to move for it and the menu to fit. */
export function getMenuShift(
  rect: PeekMenuRect,
  menuHeight: number,
  rootHeight: number,
  insets: PeekMenuInsets,
) {
  const minY = insets.top + SCREEN_PADDING_TOP;
  const maxY = rootHeight - insets.bottom - SCREEN_PADDING_BOTTOM;
  const menuBottom = rect.y + rect.height + MENU_GAP + menuHeight;

  return Math.max(minY - rect.y, Math.min(0, maxY - menuBottom));
}
