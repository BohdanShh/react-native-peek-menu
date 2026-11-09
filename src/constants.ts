import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

export const BACKDROP_COLOR = 'rgba(10, 14, 20, 0.5)';

export const MENU_WIDTH = 220;
export const MENU_GAP = 7;
export const SCREEN_PADDING_TOP = 8;
export const SCREEN_PADDING_BOTTOM = 10;
export const SCREEN_PADDING_HORIZONTAL = 12;

export const HOLD_DURATION = 300;
export const HOLD_MAX_DISTANCE = 10;
export const HOLD_DELAY_RATIO = 0.4;
export const HOLD_SCALE = 0.97;
export const RELEASE_DURATION = 150;
export const DOUBLE_TAP_DELAY = 300;

export const MENU_START_SCALE = 0.8;
export const MENU_START_OFFSET = 12;

export const OPEN_SPRING: WithSpringConfig = { duration: 300, dampingRatio: 0.82 };
export const CLOSE_TIMING: WithTimingConfig = { duration: 160, easing: Easing.out(Easing.quad) };
