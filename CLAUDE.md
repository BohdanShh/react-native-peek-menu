# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`react-native-peek-menu`: a long-press context menu for React Native. It's pure TS with no native
code, built on the peer dependencies `react-native-reanimated`, `react-native-worklets` and
`react-native-gesture-handler`. The peer ranges in `package.json` and in the README's Installation
section must stay in sync.

## Commands

Bun is the package manager, both in the root and in `example/`.

```sh
bun run build          # rm -rf lib, then tsc from src/ to lib/
bun run format         # prettier --write .
bun run format:check   # prettier --check .
bun run lint           # oxlint over src/ and example/ (.oxlintrc.json)
bunx tsc --noEmit      # typecheck the library
bun run types          # typecheck the library, the hook scripts and the example
cd example && bunx tsc --noEmit         # typecheck the example
cd example && bun run ios               # expo run:ios (also android); needed after native dep changes
cd example && bunx expo install <pkg>   # add a dependency to the example
```

A Husky pre-commit hook (`.husky/utils/pre-commit.ts`, run with Bun) runs `bun run types`, then
lint-staged (`.lintstagedrc`): Prettier and `oxlint --fix` on staged files. `bun install` sets it
up through the `prepare` script, which calls `bunx husky`: `bun pm pack` runs `prepare` without
`node_modules/.bin` on the `PATH`, so a bare `husky` isn't found there.

There are no tests. CI (`.github/workflows/ci.yml`) runs on PRs and pushes to `main`: Prettier,
oxlint, the build, packing the library into the example, the example's typecheck, and iOS and
Android bundles (which run the Worklets Babel plugin that `tsc` skips). None of that proves that
gesture or animation code works, so say so when a change hasn't been run on a device.

## Running library changes in the example

`example/` is a standalone Expo app (a chat that uses the default menu) that runs the library from
`src`, like the `create-react-native-library` template: `example/metro.config.js` uses
`react-native-monorepo-config` to watch the root, resolve `react-native-peek-menu` through the
`react-native-peek-menu-source` export condition in the root `package.json`, and block the root's
copies of the peer dependencies so only the example's load. `example/tsconfig.json` maps the import
to `../src/index`. Changes in `src` reach the app with Fast Refresh; there's no build or copy step.

The example doesn't list the library in its `package.json`. Don't put a copy at
`example/node_modules/react-native-peek-menu`: Metro would resolve it before `src`. CI still packs
the library and installs the tarball there, which only changes the CI checkout.

## Architecture

`PeekMenuProvider` wraps its children in a `GestureHandlerRootView` and renders at most one
`PeekMenuOverlay`, on top of them. With `overlayContainer` (like `FullWindowOverlay` on iOS), the
overlay goes into a host view inside that component instead, with its own `GestureHandlerRootView`,
since the container can be another window. The container stays mounted, and the host lets touches
through. Each `PeekMenu` reaches the provider through the context from `usePeekMenu`. A row in a
long list pays for its `PeekMenu` on every mount and render, so the original has no animated style
of its own: the open menu hides or moves it with `setNativeProps` on its animated ref.

Opening:

1. `activateOn` picks the trigger. With `'hold'`, `useHold` runs a pan gesture that activates after
   the hold (`activateAfterLongPress`) and fails past `HOLD_MAX_DISTANCE`, shrinks the content to
   `HOLD_SCALE` while it's held, and crosses to JS with `scheduleOnRN`. It's a pan and not a long
   press because Gesture Handler's buttons (`Pressable`, `RectButton`) only yield to continuous
   gestures: with a long press, a button inside the content takes the touch and the menu never
   opens. With `'tap'` or `'double-tap'`, a `Pressable` wraps the content instead (two presses
   within `DOUBLE_TAP_DELAY` for a double tap), so a scrolling list cancels it like any other
   button. The pan's config is memoized on `duration` and `disabled`, with `onActivate` read through
   a ref, since Gesture Handler sends a config with a new identity to the native handler again.
2. `PeekMenu` measures itself in window coordinates and calls `open` with its items, its rect, its
   `renderMenu`, the content to show (`preview ?? children`) and its animated ref. These are
   captured at that moment and don't update while the menu is open. The scale sits on an inner view
   so it doesn't distort the measurement.
3. The provider measures where the overlay draws (its root, or the host inside `overlayContainer`),
   subtracts that view's window offset from the rect (they differ on Android by the status bar),
   records how much of the root's bottom the keyboard covers (from `Keyboard.metrics().screenY`,
   used as the bottom inset when larger than `safeAreaInsets.bottom`) and stores the active menu.
   While a menu is active, another `open` is ignored.
4. `PeekMenuOverlay` mounts the backdrop, a copy of the content at the rect, and the menu. The menu
   starts invisible, and its `onLayout` (`handleMenuLayout`) reports its size.
5. With that size, `getMenuPlacement` and `getMenuPosition` in `src/utils/menuLayout.ts` compute the
   vertical shift, the drag range (`minScroll`/`maxScroll`, for when the content and the menu can't
   both fit), the horizontal `translateX` and the transform origin. `animation.open` stores them in
   a shared value and hides the original under the copy with `setNativeProps` on the UI thread
   (unless it's partly under `clipInsets`, see below).

`useMenuAnimation` owns all the motion, driven by one `progress` value from 0 to 1:

- Opening waits two UI frames (`scheduleOnUI` plus two `requestAnimationFrame`s), because mounting
  keeps the main thread busy and a spring started on the first frame would skip ahead.
- After a hold, the copy starts at `HOLD_SCALE` and springs to 1, continuing from the held
  original. After a tap it starts at 1 and doesn't scale.
- The placement is applied in the animated styles, so measuring doesn't cost a second render.
- The overlay ignores touches until `progress > 0`, so a tap can't close a menu before it opens.
- A vertical pan on the overlay drags the content and the menu within the drag range, with decay.

Closing runs `progress` back to 0, restores the original's opacity and transform on the UI thread so
it is visible again, and only then unmounts the overlay and calls `onClose`. `close(action?)` does
nothing if the menu is already closing, and runs `action` only when that call starts the closing:
`handleItemPress` passes `item.onPress` through it, and `renderMenu` content does the same, so a
repeated press doesn't run the action twice. A closing menu also stops taking touches, but that
reaches the UI a frame or more later, so it can't guarantee this on its own. `animation.open` is
ignored while closing, so a late layout can't hide the original again. The Android back button and
any `Dimensions` change close the menu.

### Consequences of this design

- The content is rendered a second time, inside the provider. It loses local state, and hooks that
  need a context below the provider throw when the menu opens. `preview` is the way around that; it
  also renders inside the provider, in the box of the original. Swapping `children` for `preview`
  isn't animated.
- With `renderBackdrop`, the library doesn't apply its own `opacity` to that layer, because a fading
  parent can break a native blur. The backdrop animates itself with `progress`.
- The wrapper around the menu has no width; the menu sizes itself. `MENU_WIDTH` belongs to the
  default `PeekMenuList`, and a custom menu needs its own `width`. The wrapper's `maxWidth` can't
  override a child's fixed `width`, so such a menu needs `maxWidth: '100%'` itself.
- `colorScheme` on the provider becomes `isDark`, which only the default `PeekMenuList` receives.
  A custom `renderMenu` gets no theme.
- A `PeekMenu` with no `items` and no `renderMenu`, its own or the provider's, is treated as
  `disabled`.
- `clipInsets` adds to the top and bottom insets for layout when the content and the menu fit within
  them (no drag range); otherwise layout and drag use only the safe area. When the original is
  partly under them, the copy is rendered twice, moving together: one in a view clipped to them, and
  one unclipped on top that fades in early with `progress` (`UNCOVERED_FADE`) and out late. The
  clipped one matches the original from the first frame, so only what's over those edges fades, and
  the cut at their edge shows only while the unclipped one is partly faded. This mirrors Telegram
  iOS's crossfade. The original isn't hidden then: `useMenuAnimation` sets the copies' offset on it
  every frame, so the original moves with them under whatever covers it, and a translucent header
  shows it instead of a cut.
- RTL: `getStyleLeft` flips `left` because React Native measures `left` from the right edge in RTL,
  while measurements stay physical. Positioning code should go through it.

## Conventions

- Public exports are decided only by `src/index.ts`. Public props are documented with JSDoc, and the
  README API tables mirror them, so update both together.
- `src/constants.ts` holds tunable values and defaults (timings, springs, paddings, sizes).
- Keep props in one place until there's a real need for more: `PeekMenuProvider` for what's shared
  across the app, `PeekMenu` for what differs per menu. `renderMenu` exists on both, and
  `PeekMenu`'s wins.
- Read and write shared values with `.get()` and `.set()`.
- Prettier: single quotes, trailing commas, width 100. It doesn't wrap comments, so keep them under
  100 characters by hand.
- README: plain usage wording, without library internals.

## Git

Work on a branch and merge through a squash-merged PR. Use Conventional Commits, for example
`feat: add a preview prop to PeekMenu`.
