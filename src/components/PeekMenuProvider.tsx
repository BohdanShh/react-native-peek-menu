import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Keyboard, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { AnimatedRef } from 'react-native-reanimated';

import { PeekMenuOverlay } from './PeekMenuOverlay';
import { BACKDROP_COLOR } from '../constants';
import type {
  PeekMenuActivation,
  PeekMenuBackdropProps,
  PeekMenuClipInsets,
  PeekMenuInsets,
  PeekMenuItem,
  PeekMenuPlacement,
  PeekMenuRenderProps,
  PeekMenuRect,
} from '../types';

type PeekMenuRequest = {
  items: PeekMenuItem[];
  rect: PeekMenuRect;
  content: ReactNode;
  renderMenu?: (props: PeekMenuRenderProps) => ReactNode;
  placement: PeekMenuPlacement;
  activateOn: PeekMenuActivation;
  clipInsets?: PeekMenuClipInsets;
  originalRef: AnimatedRef<View>;
  onOpen?: () => void;
  onClose?: () => void;
};

export type ActivePeekMenu = PeekMenuRequest & {
  root: { width: number; height: number };
  /** How much of the root's bottom the keyboard covers when the menu opens. */
  keyboardOverlap: number;
};

type PeekMenuControls = {
  open: (request: PeekMenuRequest) => void;
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
   * The theme of the default menu. `'system'` follows the device's light or dark mode.
   *
   * @default 'system'
   */
  colorScheme?: 'system' | 'light' | 'dark';
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
  /**
   * Shows the open menu inside this component, for things like `FullWindowOverlay` from
   * `react-native-screens`, which keeps the menu above modals and native sheets on iOS. It stays
   * mounted and has to let touches through to the app while no menu is open.
   *
   * @example
   * overlayContainer={FullWindowOverlay}
   */
  overlayContainer?: ComponentType<{ children: ReactNode }>;
};

const PeekMenuControlsContext = createContext<PeekMenuControls | null>(null);

/**
 * Hosts the open menu, which every `PeekMenu` inside it renders into. Place it high enough for the
 * menu to cover what it should, and below any context the menus' content reads.
 */
export function PeekMenuProvider({
  children,
  safeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 },
  colorScheme = 'system',
  backdropColor = BACKDROP_COLOR,
  renderBackdrop,
  renderMenu,
  overlayContainer: OverlayContainer,
}: PeekMenuProviderProps) {
  const [activeMenu, setActiveMenu] = useState<ActivePeekMenu | null>(null);
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const hostRef = useRef<ComponentRef<typeof View>>(null);
  const systemColorScheme = useColorScheme();
  const isDark = (colorScheme === 'system' ? systemColorScheme : colorScheme) === 'dark';

  const open = useCallback(
    (request: PeekMenuRequest) => {
      // Window coordinates can start somewhere else than the root, by the status bar on Android.
      const host = OverlayContainer ? hostRef.current : rootRef.current;

      host?.measureInWindow((x, y, width, height) => {
        const rect = { ...request.rect, x: request.rect.x - x, y: request.rect.y - y };
        // The keyboard's top edge is in window coordinates too, so this works whether the root
        // ends behind the keyboard or above it.
        const keyboard = Keyboard.metrics();
        const keyboardOverlap = keyboard ? Math.max(y + height - keyboard.screenY, 0) : 0;

        setActiveMenu(
          (current) => current ?? { ...request, rect, root: { width, height }, keyboardOverlap },
        );
      });
    },
    [OverlayContainer],
  );

  const close = useCallback(() => setActiveMenu(null), []);

  const hasRenderMenu = renderMenu !== undefined;
  const controls = useMemo(() => ({ open, hasRenderMenu }), [open, hasRenderMenu]);

  const overlay = activeMenu && (
    <PeekMenuOverlay
      menu={activeMenu}
      safeAreaInsets={safeAreaInsets}
      isDark={isDark}
      backdropColor={backdropColor}
      renderBackdrop={renderBackdrop}
      renderMenu={renderMenu}
      onClosed={close}
    />
  );

  return (
    <PeekMenuControlsContext.Provider value={controls}>
      <GestureHandlerRootView style={styles.root}>
        <View ref={rootRef} collapsable={false} style={styles.root}>
          {children}
          {OverlayContainer ? (
            <OverlayContainer>
              <GestureHandlerRootView style={styles.host}>
                <View ref={hostRef} collapsable={false} style={styles.host}>
                  {overlay}
                </View>
              </GestureHandlerRootView>
            </OverlayContainer>
          ) : (
            overlay
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
  host: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'box-none',
  },
});

export function usePeekMenu() {
  const controls = useContext(PeekMenuControlsContext);

  if (!controls) {
    throw new Error('usePeekMenu must be used within a PeekMenuProvider');
  }

  return controls;
}
