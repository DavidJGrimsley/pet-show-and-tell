import type { TutorialLink } from './tutorial-link-types';

export type { TutorialLink };

export const expositionLinks = {
  colorPicker: {
    label: 'Reanimated Color Picker',
    href: 'https://github.com/alabsi91/reanimated-color-picker',
  },
  asyncStorage: {
    label: 'Async Storage Docs',
    href: 'https://react-native-async-storage.github.io/async-storage/',
  },
  safeArea: {
    label: 'Expo SDK - SafeAreaContext',
    href: 'https://docs.expo.dev/versions/latest/sdk/safe-area-context/',
  },
  tailwind: {
    label: 'Tailwind CSS - Colors',
    href: 'https://tailwindcss.com/docs/customizing-colors',
  },
  apiRoutes: {
    label: 'Expo Router - API Routes',
    href: 'https://docs.expo.dev/router/web/api-routes/',
  },
  reanimated: {
    label: 'Software Mansion - Reanimated',
    href: 'https://docs.swmansion.com/react-native-reanimated',
  },
  gestureHandler: {
    label: 'Software Mansion - Gesture Handler',
    href: 'https://docs.swmansion.com/react-native-gesture-handler',
  },
  screens: {
    label: 'Software Mansion - Screens',
    href: 'https://docs.swmansion.com/react-native-screens',
  },
  svg: {
    label: 'Expo SDK - SVG',
    href: 'https://docs.expo.dev/versions/latest/sdk/svg',
  },
  keyboard: {
    label: 'Kirill Zyusko - Keyboard Controller',
    href: 'https://kirillzyusko.github.io/react-native-keyboard-controller/',
  },
} satisfies Record<string, TutorialLink>;

export const sdkDocLinks = {
  expoUi: {
    label: 'Expo UI docs',
    href: 'https://docs.expo.dev/versions/latest/sdk/ui/',
  },
  universal: {
    label: 'Universal components docs',
    href: 'https://docs.expo.dev/versions/latest/sdk/ui/universal/',
  },
  nativeState: {
    label: 'useNativeState docs',
    href: 'https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/usenativestate/',
  },
  dropIn: {
    label: 'Drop-in replacements docs',
    href: 'https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/',
  },
  inlineModules: {
    label: 'Inline modules tutorial',
    href: 'https://docs.expo.dev/modules/inline-modules-tutorial/',
  },
  nativeTabs: {
    label: 'Native tabs docs',
    href: 'https://docs.expo.dev/versions/latest/sdk/router/native-tabs/',
  },
  widgets: {
    label: 'Widgets docs',
    href: 'https://docs.expo.dev/versions/latest/sdk/widgets/',
  },
  audio: {
    label: 'Expo Audio docs',
    href: 'https://docs.expo.dev/versions/latest/sdk/audio/',
  },
} satisfies Record<string, TutorialLink>;

export const sdkVideoLinks = [
  {
    label:
      "What's New in Expo SDK 56: Expo UI, Inline Swift/Kotlin Modules, and Faster Builds by Expo",
    href: 'https://www.youtube.com/watch?v=MKqGbv-Tssg&t',
  },
  {
    label: 'Everything new in Expo SDK 56 by Code with Beto',
    href: 'https://www.youtube.com/watch?v=ywvywq0AGPM',
  },
] satisfies TutorialLink[];
