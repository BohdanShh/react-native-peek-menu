import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

export const BACKDROP_COLOR = 'rgba(10, 14, 20, 0.5)';

export const MENU_WIDTH = 250;
export const MENU_GAP = 7;
export const SCREEN_PADDING_TOP = 8;
export const SCREEN_PADDING_BOTTOM = 10;
export const SCREEN_PADDING_HORIZONTAL = 12;

export const HOLD_DURATION = 300;
export const HOLD_DELAY_RATIO = 0.4;
export const HOLD_SCALE = 0.97;
export const RELEASE_DURATION = 120;

export const MENU_START_SCALE = 0.92;
export const MENU_START_OFFSET = 8;

export const OPEN_SPRING: WithSpringConfig = { duration: 250, dampingRatio: 0.9 };
export const CLOSE_TIMING: WithTimingConfig = { duration: 180 };
