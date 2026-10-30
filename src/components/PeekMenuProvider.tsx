import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { PeekMenuOverlay } from './PeekMenuOverlay';
import type { PeekMenuItem, PeekMenuRect } from '../types';

export type ActivePeekMenu = {
  id: string;
  items: PeekMenuItem[];
  rect: PeekMenuRect;
  content: ReactNode;
  scale: number;
};

export type PeekMenuControls = {
  open: (menu: ActivePeekMenu) => void;
  activeId: SharedValue<string | null>;
};

export type PeekMenuProviderProps = {
  children: ReactNode;
};

const PeekMenuControlsContext = createContext<PeekMenuControls | null>(null);

export function PeekMenuProvider({ children }: PeekMenuProviderProps) {
  const [activeMenu, setActiveMenu] = useState<ActivePeekMenu | null>(null);
  const activeId = useSharedValue<string | null>(null);

  const open = useCallback((menu: ActivePeekMenu) => {
    // Ignore duplicate open requests: the current menu has to close first.
    setActiveMenu((current) => current ?? menu);
  }, []);

  const close = useCallback(() => {
    setActiveMenu(null);
  }, []);

  const controls = useMemo(() => ({ open, activeId }), [open, activeId]);

  return (
    <PeekMenuControlsContext.Provider value={controls}>
      <GestureHandlerRootView style={styles.root}>
        {children}
        {activeMenu && <PeekMenuOverlay menu={activeMenu} activeId={activeId} onClosed={close} />}
      </GestureHandlerRootView>
    </PeekMenuControlsContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export function usePeekMenu() {
  const controls = useContext(PeekMenuControlsContext);

  if (!controls) {
    throw new Error('usePeekMenu must be used within a PeekMenuProvider');
  }

  return controls;
}
