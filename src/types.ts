import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** A row in the menu. */
export type PeekMenuItem = {
  /** Text shown in the row. */
  title: string;
  /** Called when the row is pressed, as the menu starts to close. */
  onPress: () => void;
  /** Shows the title in red, for actions like Delete. */
  destructive?: boolean;
  /**
   * Shows the row dimmed and stops it from being pressed, for actions that aren't available right
   * now.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Any element to show beside the title. Its color isn't changed by `destructive` or the dark
   * theme.
   */
  icon?: ReactNode;
  /**
   * The side of the row the icon sits on.
   *
   * @default 'right'
   */
  iconPosition?: 'left' | 'right';
};

/** The side of the content the menu opens on. */
export type PeekMenuPlacement = 'top' | 'bottom';

/**
 * How much of the top and bottom of the provider's area is covered by something, opaque or
 * translucent, like a header or an input bar.
 */
export type PeekMenuClipInsets = {
  top?: number;
  bottom?: number;
};

/** How the content opens the menu. */
export type PeekMenuActivation = 'hold' | 'tap' | 'double-tap';

/** What `renderBackdrop` receives. */
export type PeekMenuBackdropProps = {
  /** Goes from 0 when closed to 1 when open. The open spring can pass 1 slightly. */
  progress: SharedValue<number>;
};

/** What `renderMenu` receives. */
export type PeekMenuRenderProps = {
  /** The `items` of the open menu, empty if it has none. */
  items: PeekMenuItem[];
  /**
   * Closes the menu and calls the item's `onPress`. Rows should call this, not `onPress`. It does
   * nothing for a disabled item.
   */
  onItemPress: (item: PeekMenuItem) => void;
  /**
   * Closes the menu. `action` runs as it starts to close, and only once: a repeat press skips it.
   *
   * @example
   * onPress={() => close(() => save(message))}
   */
  close: (action?: () => void) => void;
  /** Goes from 0 when closed to 1 when open. The open spring can pass 1 slightly. */
  progress: SharedValue<number>;
};

export type PeekMenuRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Space the menu and its content keep clear of on each side, on top of a small built-in padding.
 */
export type PeekMenuInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};
