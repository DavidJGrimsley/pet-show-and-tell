import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  AnimatedPressable,
  ExpositionNotice,
  GestureCard,
  KeyboardForm,
  PackageCard,
  ScreensCard,
  SoftwareMansionLogo,
} from '../../components/exposition';
import { useAppTheme } from '../../theme/provider';
import { TutorialLinkText } from './tutorial-link';
import { expositionLinks } from './tutorial-links';

export default function ExpositionScreen() {
  const theme = useAppTheme();
  const colors = theme.activeColors;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontFamily: theme.typography.fontFamily,
            fontWeight:
              theme.typography.fontFamily === 'System' ||
              theme.typography.fontFamily === 'monospace'
                ? '800'
                : 'normal',
          },
        ]}>
        Package Exposition
      </Text>
      <Text style={[styles.intro, { color: colors.text }]}>
        Browse the included Software Mansion packages, then keep only what your app needs.
      </Text>
      <ExpositionNotice />
      <PackageCard
        packageName="reanimated-color-picker"
        title="Stylist color editing"
        body="Stylist uses this package for the hue slider, color preview, and manual palette picker that writes theme tokens.">
        <TutorialLinkText
          link={expositionLinks.colorPicker}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="@react-native-async-storage/async-storage"
        title="Stylist local preferences"
        body="Stylist stores local-only preferences such as the Google Fonts API key, dismissed banners, and editor settings with Async Storage.">
        <TutorialLinkText
          link={expositionLinks.asyncStorage}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="react-native-safe-area-context"
        title="Stylist safe spacing"
        body="Stylist reads safe-area insets so editor controls stay clear of cutouts, native tabs, and device navigation areas.">
        <TutorialLinkText
          link={expositionLinks.safeArea}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="tailwindcss/colors"
        title="Stylist palette families"
        body="Stylist uses Tailwind color families and shade scales to drive the palette-family mode and accessible token previews.">
        <TutorialLinkText
          link={expositionLinks.tailwind}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="expo-router API routes"
        title="Stylist sync endpoint"
        body="Stylist uses an Expo Router +api route so both native and web can sync theme output files by calling /exposition/stylist-sync.">
        <TutorialLinkText
          link={expositionLinks.apiRoutes}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="react-native-reanimated + react-native-worklets"
        title="Motion that feels native"
        body="Press the button to see the Reanimated timing demo. Worklets make this kind of UI-thread animation possible.">
        <AnimatedPressable label="Press and hold" />
        <TutorialLinkText
          link={expositionLinks.reanimated}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="react-native-gesture-handler"
        title="Gesture-first interactions"
        body="Drag the card below. If your product does not need touch-heavy interactions, this demo helps you decide what to remove.">
        <GestureCard title="Drag me" body="This card springs back when the gesture ends." />
        <TutorialLinkText
          link={expositionLinks.gestureHandler}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="react-native-screens"
        title="Native navigation primitives"
        body="Screens support the navigation layer with native lifecycle and memory behavior.">
        <ScreensCard />
        <TutorialLinkText
          link={expositionLinks.screens}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="react-native-svg"
        title="Portable vector UI"
        body="Use SVG for marks, badges, charts, and vector states that need to scale cleanly.">
        <View style={styles.svgDemo}>
          <SoftwareMansionLogo width={150} height={80} />
        </View>
        <TutorialLinkText
          link={expositionLinks.svg}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
      <PackageCard
        packageName="react-native-keyboard-controller"
        title="Keyboard-heavy screens"
        body="Use this when forms, chat, notes, or auth flows need better keyboard control than manual offsets.">
        <KeyboardForm />
        <TutorialLinkText
          link={expositionLinks.keyboard}
          style={[styles.link, { color: colors.secondary }]}
        />
      </PackageCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f9fafb',
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
    paddingTop: 20,
  },
  title: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '900',
  },
  intro: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  svgDemo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
