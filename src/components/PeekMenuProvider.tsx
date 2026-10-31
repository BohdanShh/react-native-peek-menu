import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { PeekMenuOverlay } from './PeekMenuOverlay';
import type { PeekMenuInsets, PeekMenuItem, PeekMenuRect } from '../types';

type PeekMenuRequest = {
  id: string;
  items: PeekMenuItem[];
  rect: PeekMenuRect;
  content: ReactNode;
};

export type ActivePeekMenu = PeekMenuRequest & {
  root: { width: number; height: number };
};

type PeekMenuControls = {
  open: (request: PeekMenuRequest) => void;
  activeId: SharedValue<string | null>;
};

export type PeekMenuProviderProps = {
  children: ReactNode;
  safeAreaInsets?: PeekMenuInsets;
};

const PeekMenuControlsContext = createContext<PeekMenuControls | null>(null);

export function PeekMenuProvider({
  children,
  safeAreaInsets = { top: 0, bottom: 0 },
}: PeekMenuProviderProps) {
  const [activeMenu, setActiveMenu] = useState<ActivePeekMenu | null>(null);
  const activeId = useSharedValue<string | null>(null);
  const rootRef = useRef<ComponentRef<typeof View>>(null);

  const open = useCallback((request: PeekMenuRequest) => {
    // Window coordinates can start somewhere else than the root, by the status bar on Android.
    rootRef.current?.measureInWindow((x, y, width, height) => {
      const rect = { ...request.rect, x: request.rect.x - x, y: request.rect.y - y };

      setActiveMenu((current) => current ?? { ...request, rect, root: { width, height } });
    });
  }, []);

  const close = useCallback(() => setActiveMenu(null), []);

  const controls = useMemo(() => ({ open, activeId }), [open, activeId]);

  return (
    <PeekMenuControlsContext.Provider value={controls}>
      <GestureHandlerRootView style={styles.root}>
        <View ref={rootRef} collapsable={false} style={styles.root}>
          {children}
          {activeMenu && (
            <PeekMenuOverlay
              menu={activeMenu}
              activeId={activeId}
              safeAreaInsets={safeAreaInsets}
              onClosed={close}
            />
          )}
        </View>
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
