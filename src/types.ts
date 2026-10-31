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
  /** Any element to show beside the title. Its color isn't changed by `destructive`. */
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

/** What `renderBackdrop` receives. */
export type PeekMenuBackdropProps = {
  /** Goes from 0 when closed to 1 when open. The open spring can pass 1 slightly. */
  progress: SharedValue<number>;
};

/** What `renderMenu` receives. */
export type PeekMenuRenderProps = {
  /** The `items` of the open menu, empty if it has none. */
  items: PeekMenuItem[];
  /** Closes the menu and calls the item's `onPress`. Rows should call this, not `onPress`. */
  onItemPress: (item: PeekMenuItem) => void;
  /** Closes the menu. */
  close: () => void;
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
 * Add the height of a tab bar here to keep the menu above it.
 */
export type PeekMenuInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};
