import type { ReactNode } from 'react';

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
