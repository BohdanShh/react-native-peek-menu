import { I18nManager } from 'react-native';

import {
  MENU_GAP,
  SCREEN_PADDING_BOTTOM,
  SCREEN_PADDING_HORIZONTAL,
  SCREEN_PADDING_TOP,
} from '../constants';
import type {
  PeekMenuAlignment,
  PeekMenuClipInsets,
  PeekMenuInsets,
  PeekMenuPlacement,
  PeekMenuRect,
} from '../types';

export type Size = { width: number; height: number };
export type Bounds = { minX: number; width: number };

/** How the copy moves from the content to where it opens. */
export type CopyMotion = {
  startX: number;
  endX: number;
  dy: number;
  startScale: number;
  endScale: number;
  fades: boolean;
  menuOffset: number;
};

/** Everything the animation needs once the menu and the copy are measured. */
export type MenuPlacement = CopyMotion & {
  shift: number;
  minScroll: number;
  maxScroll: number;
  translateX: number;
  transformOrigin: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

/**
 * The `left` style for a box at physical `x`. In RTL, React Native measures `left` from the right
 * edge, but measurements stay physical.
 */
export function getStyleLeft(x: number, width: number, rootWidth: number) {
  const { isRTL, doLeftAndRightSwapInRTL } = I18nManager.getConstants();

  return isRTL && doLeftAndRightSwapInRTL ? rootWidth - x - width : x;
}

/**
 * The space the content and the menu keep clear of: the safe area, the keyboard and `clipInsets`.
 */
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

/** The span across the screen that the content and the menu keep within. */
export function getHorizontalBounds(rootWidth: number, insets: PeekMenuInsets): Bounds {
  const minX = insets.left + SCREEN_PADDING_HORIZONTAL;

  return { minX, width: rootWidth - insets.right - SCREEN_PADDING_HORIZONTAL - minX };
}

/**
 * Where the copy of the content opens: centered on the content, and kept within `bounds` unless the
 * content isn't. A copy the size of the content stays where it is.
 */
export function getCopyRect(rect: PeekMenuRect, size: Size, bounds: Bounds): PeekMenuRect {
  const minX = Math.min(bounds.minX, rect.x);
  const maxX = Math.max(bounds.minX + bounds.width - size.width, rect.x + rect.width - size.width);

  return {
    x: clamp(rect.x + (rect.width - size.width) / 2, minX, maxX),
    y: rect.y + (rect.height - size.height) / 2,
    width: size.width,
    height: size.height,
  };
}

/** How much a preview of `size` shrinks to fit within `bounds`: only when it's wider than them. */
export function getPreviewScale(size: Size, bounds: Bounds) {
  return Math.min(1, bounds.width / size.width);
}

/**
 * How the copy moves from the content to `target`. It's laid out at the content's top, centered
 * across `bounds`, at `target`'s size divided by `endScale`, so it moves across by the offsets of
 * its center from theirs and down by `dy`. A copy of another size grows from the content's size and
 * fades in.
 */
export function getCopyMotion(
  rect: PeekMenuRect,
  target: PeekMenuRect,
  bounds: Bounds,
  placement: PeekMenuPlacement,
  endScale = 1,
): CopyMotion {
  const center = bounds.minX + bounds.width / 2;
  const isSameSize =
    Math.abs(target.width - rect.width) < 1 && Math.abs(target.height - rect.height) < 1;

  return {
    startX: rect.x + rect.width / 2 - center,
    endX: target.x + target.width / 2 - center,
    dy: target.y + target.height / 2 - rect.y - target.height / endScale / 2,
    startScale: isSameSize
      ? endScale
      : Math.min(rect.width / target.width, rect.height / target.height) * endScale,
    endScale,
    fades: !isSameSize,
    menuOffset:
      placement === 'top' ? target.y - rect.y : target.y + target.height - rect.y - rect.height,
  };
}

/**
 * Where the menu sits across the screen: lined up with the content as `alignment` says, kept clear
 * of the sides of the screen, and growing from the point of the content it's lined up with.
 */
export function getMenuPosition({
  rect,
  menuWidth,
  rootWidth,
  bounds,
  placement,
  alignment,
}: {
  rect: PeekMenuRect;
  menuWidth: number;
  rootWidth: number;
  bounds: Bounds;
  placement: PeekMenuPlacement;
  alignment: PeekMenuAlignment;
}) {
  const { isRTL } = I18nManager.getConstants();
  const center = rect.x + rect.width / 2;

  const sides = {
    auto: center > rootWidth / 2 ? 'right' : 'left',
    start: isRTL ? 'right' : 'left',
    center: 'center',
    end: isRTL ? 'left' : 'right',
  } as const;
  const side = sides[alignment];

  const anchors = { left: rect.x, center, right: rect.x + rect.width };
  const offsets = { left: 0, center: menuWidth / 2, right: menuWidth };
  const anchor = anchors[side];
  const left = clamp(anchor - offsets[side], bounds.minX, bounds.minX + bounds.width - menuWidth);

  const originX = clamp(anchor - left, 0, menuWidth);
  const originY = placement === 'top' ? '100%' : '0%';

  return {
    translateX: left - getStyleLeft(0, menuWidth, rootWidth),
    transformOrigin: `${originX}px ${originY}`,
  };
}

function getShift(
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
    };
  }

  const menuBottom = contentBottom + MENU_GAP + menuHeight;
  const shift = Math.min(maxY - menuBottom, Math.max(minY - rect.y, 0));

  return {
    shift,
    minScroll: 0,
    maxScroll: Math.max(minY - rect.y - shift, 0),
  };
}

/**
 * How far the content has to move for it and the menu to fit, within `clippedInsets` when they
 * fit there, or else within `insets`. When both can't, the menu's far edge stays on screen, and
 * `minScroll` and `maxScroll` are how far the overlay drags to bring back the rest: down with the
 * menu at the bottom, up with the menu at the top.
 */
export function getMenuPlacement({
  rect,
  menuHeight,
  rootHeight,
  insets,
  clippedInsets,
  placement,
}: {
  rect: PeekMenuRect;
  menuHeight: number;
  rootHeight: number;
  insets: PeekMenuInsets;
  clippedInsets: PeekMenuInsets;
  placement: PeekMenuPlacement;
}) {
  const clipped = getShift(rect, menuHeight, rootHeight, clippedInsets, placement);

  return clipped.minScroll === 0 && clipped.maxScroll === 0
    ? clipped
    : getShift(rect, menuHeight, rootHeight, insets, placement);
}
