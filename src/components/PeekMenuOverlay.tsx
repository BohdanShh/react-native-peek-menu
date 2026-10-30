import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { ActivePeekMenu } from './PeekMenuProvider';
import { BACKDROP_TIMING, RELEASE_TIMING } from '../constants/gesture';

type Props = {
  menu: ActivePeekMenu;
  activeId: SharedValue<string | null>;
  onClosed: () => void;
};

export function PeekMenuOverlay({ menu, activeId, onClosed }: Props) {
  const backdropOpacity = useSharedValue(0);
  // Starts where the hold left it, so the copy takes over without a jump.
  const scale = useSharedValue(menu.scale);

  // Waits for the copy to be there, so the original never leaves a gap.
  const handleCopyLayout = () => {
    activeId.set(menu.id);
    backdropOpacity.set(withTiming(1, BACKDROP_TIMING));
    scale.set(withTiming(1, RELEASE_TIMING));
  };

  const handleClose = () => {
    backdropOpacity.set(
      withTiming(0, BACKDROP_TIMING, (finished) => {
        if (finished) {
          // The original has to be back before the copy on top of it goes.
          activeId.set(null);
          scheduleOnRN(onClosed);
        }
      }),
    );
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.get(),
  }));

  const copyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={handleClose}
          style={styles.fill}
        />
      </Animated.View>
      <Animated.View
        onLayout={handleCopyLayout}
        style={[
          styles.copy,
          {
            left: menu.rect.x,
            top: menu.rect.y,
            width: menu.rect.width,
            height: menu.rect.height,
          },
          copyStyle,
        ]}
      >
        {menu.content}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fill: {
    flex: 1,
  },
  copy: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
