<div align="center">

# react-native-peek-menu

A performant, fully customizable long-press context menu for React Native.

<img src="assets/chat.gif" width="280" alt="Holding a chat message opens a frosted glass menu over a blurred screen" />
&nbsp;&nbsp;&nbsp;
<img src="assets/shop.gif" width="280" alt="Holding a sneaker in a shop lifts it above a blurred screen and opens a size picker with an Add to bag button" />

</div>

## Installation

Works with Expo and React Native CLI apps on the New Architecture.

Peer dependencies:

- `react-native-reanimated` >= 4.7
- `react-native-worklets` >= 0.13
- `react-native-gesture-handler` >= 3.3

First install and set up the peer dependencies by following their official guides:

- [Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started)
- [Worklets](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/getting-started)
- [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation)

Then install the library:

```sh
# Expo
npx expo install react-native-peek-menu

# React Native CLI
npm install react-native-peek-menu
```

## Quick start

Wrap your app in `PeekMenuProvider`, then wrap anything you want to hold in `PeekMenu`.

```tsx
import { Text, View } from 'react-native';
import { PeekMenu, PeekMenuProvider } from 'react-native-peek-menu';

export default function App() {
  return (
    <PeekMenuProvider>
      <PeekMenu
        items={[
          { title: 'Reply', onPress: reply },
          { title: 'Copy', onPress: copy },
          { title: 'Delete', destructive: true, onPress: remove },
        ]}
      >
        <View>
          <Text>Hold me</Text>
        </View>
      </PeekMenu>
    </PeekMenuProvider>
  );
}
```

## Recipes

### Icons

`icon` takes any element. Its color isn't changed by `destructive`.

```tsx
<PeekMenu
  items={[
    { title: 'Copy', icon: <CopyIcon />, onPress: copy },
    { title: 'Share', icon: <ShareIcon />, iconPosition: 'left', onPress: share },
  ]}
>
  <Message />
</PeekMenu>
```

### A custom menu

`renderMenu` replaces the default list. Set it on `PeekMenuProvider` for all menus, or on a `PeekMenu` for just that one.

```tsx
function MyCustomMenu({ items, onItemPress }: PeekMenuRenderProps) {
  return (
    <View style={styles.menu}>
      {items.map((item) => (
        <Pressable key={item.title} onPress={() => onItemPress(item)}>
          <Text style={styles.title}>{item.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

<PeekMenuProvider renderMenu={(props) => <MyCustomMenu {...props} />}>
```

The menu sizes itself to its content. A `width` wider than the screen needs `maxWidth: '100%'`.

### Anything as a menu

With `renderMenu` you don't need `items`. Show any component and call `close` when it's done. An action passed to `close` runs once, even on a fast double tap.

```tsx
<PeekMenu renderMenu={({ close }) => <SaveCard onSave={() => close(() => save(message))} />}>
  <Message />
</PeekMenu>
```

### An animated backdrop

`renderBackdrop` replaces the default backdrop. Make it fill the screen and animate it with `progress`.

```tsx
function MyCustomBackdrop({ progress }: PeekMenuBackdropProps) {
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(progress.get(), 1),
  }));

  return <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, style]} />;
}

<PeekMenuProvider renderBackdrop={(props) => <MyCustomBackdrop {...props} />}>
```

## API

### `PeekMenuProviderProps`

| Prop             | Type                                          | Default                   | Description                                                    |
| ---------------- | --------------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| `children`       | `ReactNode`                                   | required                  | The part of the app that can open menus.                       |
| `safeAreaInsets` | `PeekMenuInsets`                              | All `0`                   | Space to keep clear on each side. Add a tab bar's height here. |
| `backdropColor`  | `string`                                      | `'rgba(10, 14, 20, 0.5)'` | Color of the layer behind the menu.                            |
| `renderBackdrop` | `(props: PeekMenuBackdropProps) => ReactNode` |                           | Replaces that layer, and `backdropColor` is ignored.           |
| `renderMenu`     | `(props: PeekMenuRenderProps) => ReactNode`   |                           | Renders every menu. A `PeekMenu` can override it with its own. |

### `PeekMenuProps`

A `PeekMenu` needs `items`, `renderMenu`, or both.

| Prop           | Type                                        | Default    | Description                                                                                             |
| -------------- | ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `children`     | `ReactNode`                                 | required   | The content that opens the menu when held.                                                              |
| `items`        | `PeekMenuItem[]`                            | `[]`       | The rows, read when the menu opens. An empty list stops it from opening, unless there's a `renderMenu`. |
| `renderMenu`   | `(props: PeekMenuRenderProps) => ReactNode` |            | Renders this menu instead of the default list.                                                          |
| `preview`      | `ReactNode`                                 |            | Shown instead of the copy of `children`.                                                                |
| `placement`    | `'top' \| 'bottom'`                         | `'bottom'` | The side of the content the menu opens on.                                                              |
| `holdDuration` | `number`                                    | `300`      | How long to hold, in milliseconds.                                                                      |
| `disabled`     | `boolean`                                   | `false`    | Stops holding from opening the menu.                                                                    |
| `style`        | `StyleProp<ViewStyle>`                      |            | Layout of the wrapper, like `margin` or `alignSelf`.                                                    |
| `onOpen`       | `() => void`                                |            | Called when the menu starts to open.                                                                    |
| `onClose`      | `() => void`                                |            | Called once the menu has finished closing.                                                              |

### `PeekMenuItem`

| Field          | Type                | Default   | Description                                                  |
| -------------- | ------------------- | --------- | ------------------------------------------------------------ |
| `title`        | `string`            | required  | Text shown in the row.                                       |
| `onPress`      | `() => void`        | required  | Called when the row is pressed, as the menu starts to close. |
| `destructive`  | `boolean`           | `false`   | Shows the title in red, for actions like Delete.             |
| `icon`         | `ReactNode`         |           | Any element to show beside the title.                        |
| `iconPosition` | `'left' \| 'right'` | `'right'` | The side of the row the icon sits on.                        |

### `PeekMenuRenderProps`

What `renderMenu` receives.

| Field         | Type                            | Description                                                             |
| ------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `items`       | `PeekMenuItem[]`                | The rows of the open menu, empty if it has none.                        |
| `onItemPress` | `(item: PeekMenuItem) => void`  | Closes the menu and calls the item's `onPress`. Rows should call this.  |
| `close`       | `(action?: () => void) => void` | Closes the menu and runs `action` once.                                 |
| `progress`    | `SharedValue<number>`           | From 0 when closed to 1 when open. The open spring can pass 1 slightly. |

### `PeekMenuBackdropProps`

What `renderBackdrop` receives: `progress`, the same value as above.

## License

MIT
