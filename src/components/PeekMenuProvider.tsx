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
import { BACKDROP_COLOR } from '../constants';
import type {
  PeekMenuBackdropProps,
  PeekMenuInsets,
  PeekMenuItem,
  PeekMenuRenderProps,
  PeekMenuRect,
} from '../types';

type PeekMenuRequest = {
  id: string;
  items: PeekMenuItem[];
  rect: PeekMenuRect;
  content: ReactNode;
  renderMenu?: (props: PeekMenuRenderProps) => ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export type ActivePeekMenu = PeekMenuRequest & {
  root: { width: number; height: number };
};

type PeekMenuControls = {
  open: (request: PeekMenuRequest) => void;
  activeId: SharedValue<string | null>;
  hasRenderMenu: boolean;
};

export type PeekMenuProviderProps = {
  /** The part of the app that can open menus. The open menu covers this whole area. */
  children: ReactNode;
  /**
   * Keeps the menu clear of the notch and other screen edges.
   *
   * @default { top: 0, bottom: 0, left: 0, right: 0 }
   */
  safeAreaInsets?: PeekMenuInsets;
  /**
   * Color of the layer that dims the screen behind the menu. Use a translucent color to keep the
   * screen visible.
   *
   * @default 'rgba(10, 14, 20, 0.5)'
   */
  backdropColor?: string;
  /**
   * Replaces the colored layer behind the menu, for things like a blur. The element has to fill the
   * screen itself and animate itself with `progress`, since a fading parent can break a native
   * blur. Pressing it closes the menu.
   *
   * @example
   * renderBackdrop={({ progress }) => <AnimatedBlur progress={progress} />}
   */
  renderBackdrop?: (props: PeekMenuBackdropProps) => ReactNode;
  /**
   * Renders every menu instead of the default list, for things like a dark theme. It sizes itself,
   * and the library only positions it, animates it and closes it. A fixed `width` should come with
   * `maxWidth: '100%'` to stay on screen. A `PeekMenu` can override it with its own `renderMenu`.
   *
   * @example
   * renderMenu={({ items, onItemPress }) => <MyMenu items={items} onSelect={onItemPress} />}
   */
  renderMenu?: (props: PeekMenuRenderProps) => ReactNode;
};

const PeekMenuControlsContext = createContext<PeekMenuControls | null>(null);

/**
 * Hosts the open menu, which every `PeekMenu` inside it renders into. Place it high enough for the
 * menu to cover what it should, and below any context the menus' content reads.
 */
export function PeekMenuProvider({
  children,
  safeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 },
  backdropColor = BACKDROP_COLOR,
  renderBackdrop,
  renderMenu,
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

  const hasRenderMenu = renderMenu !== undefined;
  const controls = useMemo(
    () => ({ open, activeId, hasRenderMenu }),
    [open, activeId, hasRenderMenu],
  );

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
              backdropColor={backdropColor}
              renderBackdrop={renderBackdrop}
              renderMenu={renderMenu}
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
