import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MENU_WIDTH } from '../constants';
import type { PeekMenuRenderProps } from '../types';

type Props = Pick<PeekMenuRenderProps, 'items' | 'onItemPress'> & {
  isDark: boolean;
};

export function PeekMenuList({ items, onItemPress, isDark }: Props) {
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.list, colors.list]}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <View style={[styles.separator, colors.separator]} />}
          <Pressable
            disabled={item.disabled}
            onPress={() => onItemPress(item)}
            style={({ pressed }) => [
              styles.item,
              item.iconPosition === 'left' && styles.iconOnLeft,
              pressed && colors.pressed,
            ]}
          >
            <Text
              style={[
                styles.title,
                colors.title,
                item.destructive && colors.destructive,
                item.disabled && styles.disabled,
              ]}
            >
              {item.title}
            </Text>
            {item.icon && <View style={item.disabled && styles.disabled}>{item.icon}</View>}
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: MENU_WIDTH,
    maxWidth: '100%',
    overflow: 'hidden',
    paddingVertical: 6,
    borderRadius: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 42,
    marginHorizontal: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  iconOnLeft: {
    flexDirection: 'row-reverse',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.4,
  },
});

const lightColors = StyleSheet.create({
  list: {
    backgroundColor: '#FFF',
  },
  separator: {
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
  },
  pressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  title: {
    color: '#1C1C1E',
  },
  destructive: {
    color: '#D70015',
  },
});

const darkColors = StyleSheet.create({
  list: {
    backgroundColor: '#2C2C2E',
  },
  separator: {
    backgroundColor: 'rgba(84, 84, 88, 0.6)',
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#FFF',
  },
  destructive: {
    color: '#FF453A',
  },
});
