import type { TutorialLink } from './tutorial-link-types';

function labelOnly(label: string): TutorialLink {
  return { label, href: null };
}

export const expositionLinks = {
  colorPicker: labelOnly('Reanimated Color Picker'),
  asyncStorage: labelOnly('Async Storage Docs'),
  safeArea: labelOnly('Expo SDK - SafeAreaContext'),
  tailwind: labelOnly('Tailwind CSS - Colors'),
  apiRoutes: labelOnly('Expo Router - API Routes'),
  reanimated: labelOnly('Software Mansion - Reanimated'),
  gestureHandler: labelOnly('Software Mansion - Gesture Handler'),
  screens: labelOnly('Software Mansion - Screens'),
  svg: labelOnly('Expo SDK - SVG'),
  keyboard: labelOnly('Kirill Zyusko - Keyboard Controller'),
};

export const sdkDocLinks = {
  expoUi: labelOnly('Expo UI docs'),
  universal: labelOnly('Universal components docs'),
  nativeState: labelOnly('useNativeState docs'),
  dropIn: labelOnly('Drop-in replacements docs'),
  inlineModules: labelOnly('Inline modules tutorial'),
  nativeTabs: labelOnly('Native tabs docs'),
  widgets: labelOnly('Widgets docs'),
  audio: labelOnly('Expo Audio docs'),
};

export const sdkVideoLinks = [
  labelOnly(
    "What's New in Expo SDK 56: Expo UI, Inline Swift/Kotlin Modules, and Faster Builds by Expo"
  ),
  labelOnly('Everything new in Expo SDK 56 by Code with Beto'),
];
