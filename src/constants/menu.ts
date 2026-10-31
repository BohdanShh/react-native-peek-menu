import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

export const MENU_WIDTH = 250;
export const MENU_SPACING = 7;
export const MENU_EDGE_INSET = 12;
export const MENU_MIN_SCALE = 0.01;

// Reanimated's duration is perceptual: the spring really runs for 1.5 times this, so 420ms.
export const MENU_SPRING: WithSpringConfig = { duration: 280, dampingRatio: 0.775 };
export const MENU_FADE_IN_TIMING: WithTimingConfig = {
  duration: 50,
  easing: Easing.bezier(0.42, 0, 0.58, 1),
};
