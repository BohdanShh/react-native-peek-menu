# Contributing

Thanks for your interest in improving `react-native-peek-menu`! Bug reports, ideas and pull requests are all welcome.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all your interactions with the project.

## Before you start

- For a bug, open an [issue](https://github.com/BohdanShh/react-native-peek-menu/issues) with the versions of `react-native-peek-menu`, React Native, Reanimated, Worklets and Gesture Handler, the platform, and a minimal example that reproduces it.
- For a new feature or a change to the API, open an issue first to discuss it. That way nobody spends time on a pull request that doesn't fit the library.
- Small fixes, like typos or clear bugs, can go straight to a pull request.

## Development setup

You need [Bun](https://bun.sh) and the usual React Native tooling: Xcode for iOS and Android Studio for Android.

1. Fork the repository and clone your fork.
2. Install the dependencies of the library and of the example app:

   ```sh
   bun install
   cd example && bun install && cd ..
   ```

3. Run the example app:

   ```sh
   cd example
   bun run ios     # or: bun run android
   ```

## Making changes

The library lives in `src/`, and `example/` is an Expo app that uses it.

```
src/
├── components/   # PeekMenuProvider, PeekMenu, the overlay and the default menu
├── hooks/        # the hold gesture and the open and close animations
├── utils/        # where the menu and the content are placed on screen
├── constants.ts  # timings, springs, paddings and sizes
├── types.ts      # public types
└── index.ts      # public exports
```

The example app runs the library straight from `src/`, so your changes show up right away with Fast Refresh. You only need to rebuild the app with `bun run ios` or `bun run android` after changing native dependencies of the example.

A few things to keep in mind:

- Anything exported from `src/index.ts` is public API. If you add or change a prop, document it with JSDoc and update the API tables in the README.
- Keep the library free of native code. It should only rely on React Native, Reanimated, Worklets and Gesture Handler.
- Read and write shared values with `.get()` and `.set()`.
- Gestures and animations can only be checked on a device or a simulator. Please try your change on iOS and Android when you can, and say in the pull request which ones you tested.

## Checks

`bun install` sets up a [Husky](https://typicode.github.io/husky) pre-commit hook that checks every commit:

1. `bun run types` checks the types of the library, the hook scripts and the example app.
2. [lint-staged](https://github.com/lint-staged/lint-staged) runs Prettier and `oxlint --fix` on the files you're committing. What they can fix is fixed and added to the commit.

If either step fails, the commit is stopped and the errors are printed. CI runs the same checks on the whole project for every pull request, and also builds the library and bundles the example app for iOS and Android.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org):

- `feat:` a new feature, like `feat: add a preview prop to PeekMenu`
- `fix:` a bug fix, like `fix: keep the menu on screen in landscape`
- `docs:` changes to the README or other docs
- `refactor:` code changes that don't change behavior
- `chore:` tooling, dependencies and other maintenance

Pull requests are squash-merged, so the title of the pull request becomes the commit message. Please follow the same format in the title.

## Pull requests

- Keep each pull request focused on one change.
- Describe what changed and why, and link the related issue.
- Add a short video or screenshot for anything visual.
- Make sure CI passes.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
