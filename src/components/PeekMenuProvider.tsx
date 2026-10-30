import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import type { PeekMenuItem, PeekMenuRect } from '../types';

export type ActivePeekMenu = {
  items: PeekMenuItem[];
  rect: PeekMenuRect;
};

export type PeekMenuControls = {
  open: (menu: ActivePeekMenu) => void;
  close: () => void;
};

export type PeekMenuProviderProps = {
  children: ReactNode;
};

const PeekMenuControlsContext = createContext<PeekMenuControls | null>(null);

export function PeekMenuProvider({ children }: PeekMenuProviderProps) {
  const [activeMenu, setActiveMenu] = useState<ActivePeekMenu | null>(null);

  const open = useCallback((menu: ActivePeekMenu) => {
    // Ignore duplicate open requests: the current menu has to close first.
    setActiveMenu((current) => current ?? menu);
  }, []);

  const close = useCallback(() => {
    setActiveMenu(null);
  }, []);

  const controls = useMemo(() => ({ open, close }), [open, close]);

  return (
    <PeekMenuControlsContext.Provider value={controls}>
      <GestureHandlerRootView style={styles.root}>
        {children}
        {activeMenu && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={close}
            style={styles.backdrop}
          />
        )}
      </GestureHandlerRootView>
    </PeekMenuControlsContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});

export function usePeekMenu() {
  const controls = useContext(PeekMenuControlsContext);

  if (!controls) {
    throw new Error('usePeekMenu must be used within a PeekMenuProvider');
  }

  return controls;
}
