import { Easing, type WithTimingConfig } from 'react-native-reanimated';

export const HOLD_DELAY = 120;
export const HOLD_DURATION = 200;
export const HOLD_MAX_SHRINK = 15;
export const HOLD_MIN_SCALE = 0.7;

export const HOLD_TIMING: WithTimingConfig = { duration: HOLD_DURATION, easing: Easing.linear };
export const RELEASE_TIMING: WithTimingConfig = { duration: 200, easing: Easing.out(Easing.ease) };
export const BACKDROP_TIMING: WithTimingConfig = {
  duration: 200,
  easing: Easing.bezier(0.42, 0, 0.58, 1),
};
