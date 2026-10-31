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
      {items.map((item, index) => (
        <Pressable
          key={index}
          accessibilityRole="menuitem"
          onPress={() => onItemPress(item)}
          style={({ pressed }) => [
            styles.item,
            item.iconPosition === 'left' && styles.iconOnLeft,
            index > 0 && styles.separator,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.title, item.destructive && styles.destructive]}>{item.title}</Text>
          {item.icon}
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
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  iconOnLeft: {
    flexDirection: 'row-reverse',
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.2)',
  },
  pressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  destructive: {
    color: '#FF3B30',
  },
});
