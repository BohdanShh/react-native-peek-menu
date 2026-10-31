import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MENU_WIDTH } from '../constants';
import type { PeekMenuRenderProps } from '../types';

type Props = Pick<PeekMenuRenderProps, 'items' | 'onItemPress'>;

export function PeekMenuList({ items, onItemPress }: Props) {
  return (
    <View style={styles.list}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: MENU_WIDTH,
    maxWidth: '100%',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#FFF',
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
    borderTopColor: 'rgba(60, 60, 67, 0.3)',
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
    color: '#D70015',
  },
});
