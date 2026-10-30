import { useRef, type ComponentRef, type ReactNode } from 'react';
import { Pressable, type View } from 'react-native';

import { usePeekMenu } from './PeekMenuProvider';
import type { PeekMenuItem } from '../types';

export type PeekMenuProps = {
  items: PeekMenuItem[];
  children: ReactNode;
};

export function PeekMenu({ items, children }: PeekMenuProps) {
  const { open } = usePeekMenu();
  const ref = useRef<ComponentRef<typeof View>>(null);

  const handleLongPress = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      open({ items, rect: { x, y, width, height } });
    });
  };

  return (
    <Pressable ref={ref} onLongPress={handleLongPress}>
      {children}
    </Pressable>
  );
}
