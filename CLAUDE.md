# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`react-native-peek-menu`: a long-press context menu for React Native. Pure JS/TS with no native code of its own, built on the peer dependencies `react-native-reanimated`, `react-native-worklets` and `react-native-gesture-handler`. Keep the peer ranges in `package.json` in sync with the README.

## Commands

The package manager is Bun, in the root and in `example/`.

```sh
bun run build          # clean lib/, then tsc to lib/
bun run format         # prettier --write .
bun run format:check   # prettier --check .
bunx tsc --noEmit      # typecheck the library
cd example && bunx tsc --noEmit         # typecheck the example
cd example && bun run ios               # build and run (also android); needed after native dep changes
cd example && bunx expo install <pkg>   # add a dep to the example
```

There are no tests, no linter and no CI yet.

## After changing the library

The example does not list the library in its `package.json` and has no Metro or tsconfig link to `src`. It reads a plain folder at `example/node_modules/react-native-peek-menu`, so its types and runtime stay stale until that folder is refreshed:

```sh
bun run build
rsync -a --delete lib/ example/node_modules/react-native-peek-menu/lib/
rsync -a --delete src/ example/node_modules/react-native-peek-menu/src/
```

`example/react-native-peek-menu-0.1.0.tgz` is gitignored and can be older than `src`, so don't reinstall from it without repacking.

`tsc` and Prettier passing doesn't prove the gesture or animation code works. Say so when a change hasn't been run on a device.

## How it works

`PeekMenuProvider` wraps the app in a `GestureHandlerRootView` and renders one `PeekMenuOverlay` at most. `PeekMenu` reaches it through the context from `usePeekMenu`.

Opening a menu:

1. `useHold` runs the long press. It shrinks the content while held, and activation crosses to JS with `scheduleOnRN`.
2. `PeekMenu` measures itself in window coordinates and calls `open` with its items, its rect and the content to show (`preview ?? children`). `items`, `renderMenu` and the content are captured at this moment, so they don't update while the menu is open.
3. The provider subtracts the root's window offset from the rect (they differ on Android, by the status bar) and stores the active menu.
4. `PeekMenuOverlay` mounts the backdrop, a copy of the content at the rect, and the menu. The menu starts invisible, and `handleMenuLayout` waits for its measured size.
5. With that size, `getMenuPlacement` and `getMenuPosition` in `src/utils/menuLayout.ts` compute the vertical shift, the drag range and the horizontal position. `animation.open` takes them, and `activeId` hides the original under the copy, so it leaves no gap.

`useMenuAnimation` owns all the motion, driven by one `progress` value from 0 to 1. The opening waits two UI frames, because mounting keeps the main thread busy and a spring started on the first frame would skip ahead. The menu's horizontal position and transform origin are shared values applied in the animated style, so measuring doesn't cost a second render.

Closing runs `progress` back to 0, restores the original on the UI thread, and only then unmounts the overlay and calls `onClose`, so the original is visible before the copy goes. `close` does nothing if the menu is already closing, and it takes an optional action that runs only when this call starts the closing. `handleItemPress` passes `onPress` through it, and `renderMenu` content does the same, so a repeat press skips the action. A closing menu also stops taking touches, but that reaches the UI a frame or more later, so it can't guarantee this alone. The Android back button and any screen dimension change close the menu.

Things that follow from this design:

- The content is rendered a second time inside the provider. It loses local state, and hooks that need a context below the provider throw when the menu opens. `preview` is the way around that, and it renders inside the provider too, in the box of the original. Swapping `children` for `preview` isn't animated.
- With `renderBackdrop`, the library skips its own `opacity` on that layer, because a fading parent can break a native blur. The backdrop animates itself with `progress`.
- The wrapper around the menu has no width. The content sizes itself: `MENU_WIDTH` belongs to the default `PeekMenuList`, and a custom menu needs its own `width`. `maxWidth` on the wrapper can't override a child's fixed `width`, so such a menu needs `maxWidth: '100%'` itself.
- A `PeekMenu` with no `items` and no `renderMenu`, its own or the provider's, is treated as `disabled`.

## Conventions

- Public exports are decided only by `src/index.ts`. Public props are documented with JSDoc, and the README API tables mirror them, so update both together.
- `src/constants.ts` holds tunable values and defaults.
- Keep props in one place until there's a real need for more: `PeekMenuProvider` for what's shared across the app, `PeekMenu` for what differs per menu. `renderMenu` is on both, and `PeekMenu`'s wins.
- Read and write shared values with `.get()` and `.set()`.
- Prettier: single quotes, trailing commas, width 100. It doesn't wrap comments, so keep them under 100 by hand.

## Example

`example/` is a standalone Expo app: a simple chat that uses the default menu.

Android blur hasn't worked out: the example crashed right after it was set up with `expo-blur` and `blurTarget`, and the cause and platform were never confirmed.

## Git

- Work on a branch and merge through a squash-merged PR. Conventional Commits, for example `feat: add a preview prop to PeekMenu`.
