import { useId, useRef, type ComponentProps, type ReactNode } from 'react';
import { Pressable, type StyleProp, type View, type ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  type AnimatedRef,
} from 'react-native-reanimated';

import { usePeekMenu } from './PeekMenuProvider';
import { DOUBLE_TAP_DELAY, HOLD_DURATION } from '../constants';
import { useHold } from '../hooks/useHold';
import type {
  PeekMenuActivation,
  PeekMenuItem,
  PeekMenuPlacement,
  PeekMenuRenderProps,
} from '../types';

type PeekMenuContent =
  | {
      /**
       * The rows of the menu, read when it opens. An empty list stops the menu from opening, unless
       * there's a `renderMenu`.
       */
      items: PeekMenuItem[];
      /**
       * Renders the menu instead of the default list. It sizes itself, and the library only
       * positions it, animates it and closes it. A fixed `width` should come with
       * `maxWidth: '100%'` to stay on screen. It runs inside the provider, so a component it
       * renders can't read context below `PeekMenuProvider`.
       *
       * @example
       * renderMenu={({ close }) => <Card onDone={close} />}
       */
      renderMenu?: (props: PeekMenuRenderProps) => ReactNode;
    }
  | {
      items?: PeekMenuItem[];
      renderMenu: (props: PeekMenuRenderProps) => ReactNode;
    };

export type PeekMenuProps = PeekMenuContent & {
  /**
   * The content that opens the menu, held by default. It's rendered again above the screen while
   * the menu is open, so it loses its local state and any context below `PeekMenuProvider`, and
   * hooks that require such a context throw when the menu opens. Use `preview` when that matters.
   */
  children: ReactNode;
  /**
   * Shown instead of `children` above the screen while the menu is open, in the same box. It also
   * renders inside the provider, so hand it what it needs through props, or wrap it in the context
   * providers it reads.
   *
   * @example
   * preview={<Bubble text={text} isExpanded={isExpanded} theme={theme} />}
   */
  preview?: ReactNode;
  /**
   * The side of the content the menu opens on. It stays there even when space runs out: the content
   * moves to make room, and if both still don't fit, dragging brings back the rest.
   *
   * @default 'bottom'
   */
  placement?: PeekMenuPlacement;
  /**
   * How the content opens the menu: held, tapped or tapped twice. With `'tap'` or `'double-tap'`,
   * the content shouldn't handle presses itself.
   *
   * @default 'hold'
   */
  activateOn?: PeekMenuActivation;
  /**
   * How long the content has to be held to open the menu, in milliseconds. Only used with
   * `activateOn` set to `'hold'`.
   *
   * @default 300
   */
  holdDuration?: number;
  /**
   * Stops the content from opening the menu.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Style of the wrapper around the content. Use it for layout, like `margin` or `alignSelf`:
   * things like `padding` and `backgroundColor` won't carry over to the menu's copy of the content.
   */
  style?: StyleProp<ViewStyle>;
  /** Called when the menu starts to open. */
  onOpen?: () => void;
  /** Called once the menu has finished closing. */
  onClose?: () => void;
};

/**
 * Opens a context menu when its children are held, or tapped with `activateOn`. Needs a
 * `PeekMenuProvider` above it.
 *
 * @example
 * <PeekMenu items={[{ title: 'Copy', onPress: copy }]}>
 *   <Message />
 * </PeekMenu>
 */
export function PeekMenu({
  items = [],
  children,
  preview,
  placement = 'bottom',
  activateOn = 'hold',
  holdDuration = HOLD_DURATION,
  disabled = false,
  style,
  renderMenu,
  onOpen,
  onClose,
}: PeekMenuProps) {
  const { open, activeId, hasRenderMenu } = usePeekMenu();
  const id = useId();
  const ref = useAnimatedRef<View>();
  const isEmpty = items.length === 0 && !renderMenu && !hasRenderMenu;
  const isDisabled = disabled || isEmpty;

  const openMenu = () => {
    ref.current?.measureInWindow((x, y, measuredWidth, height) => {
      open({
        id,
        items,
        rect: { x, y, width: measuredWidth, height },
        content: preview ?? children,
        renderMenu,
        placement,
        activateOn,
        onOpen,
        onClose,
      });
    });
  };

  const originalStyle = useAnimatedStyle(() => ({
    opacity: activeId.get() === id ? 0 : 1,
  }));

  const triggerProps = {
    viewRef: ref,
    style: [style, originalStyle],
    disabled: isDisabled,
    onActivate: openMenu,
  };

  return activateOn === 'hold' ? (
    <HoldTrigger {...triggerProps} duration={holdDuration}>
      {children}
    </HoldTrigger>
  ) : (
    <PressTrigger {...triggerProps} isDoubleTap={activateOn === 'double-tap'}>
      {children}
    </PressTrigger>
  );
}

type TriggerProps = {
  viewRef: AnimatedRef<View>;
  style: ComponentProps<typeof Animated.View>['style'];
  disabled: boolean;
  onActivate: () => void;
  children: ReactNode;
};

function HoldTrigger({
  viewRef,
  style,
  duration,
  disabled,
  onActivate,
  children,
}: TriggerProps & { duration: number }) {
  const { gesture, animatedStyle } = useHold({ duration, disabled, onActivate });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View ref={viewRef} collapsable={false} style={style}>
        {/* The scale stays on an inner view so it doesn't skew the measured rect. */}
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function PressTrigger({
  viewRef,
  style,
  isDoubleTap,
  disabled,
  onActivate,
  children,
}: TriggerProps & { isDoubleTap: boolean }) {
  const lastPressTime = useRef(0);

  const handlePress = () => {
    const now = Date.now();

    if (!isDoubleTap || now - lastPressTime.current < DOUBLE_TAP_DELAY) {
      lastPressTime.current = 0;
      onActivate();
    } else {
      lastPressTime.current = now;
    }
  };

  return (
    <Animated.View ref={viewRef} collapsable={false} style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={disabled ? undefined : onActivate}
        disabled={disabled}
        onPress={handlePress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
