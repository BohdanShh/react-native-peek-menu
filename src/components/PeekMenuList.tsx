import {
  Pressable,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import type { PeekMenuItem } from '../types';

type Props = {
  items: PeekMenuItem[];
  style: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  onItemPress: (item: PeekMenuItem) => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

export function PeekMenuList({ items, style, onItemPress, onLayout }: Props) {
  return (
    <Animated.View onLayout={onLayout} style={[styles.list, style]}>
      {items.map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="menuitem"
          onPress={() => onItemPress(item)}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <Text style={[styles.title, item.destructive && styles.destructive]}>{item.title}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#FFF',
  },
  item: {
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  pressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 17,
    color: '#000',
  },
  destructive: {
    color: '#FF3B30',
  },
});
