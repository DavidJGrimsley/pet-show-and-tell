import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import { Platform, StatusBar } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import themeFontAssets from '../theme/font-assets';
import { AppThemeProvider, useAppTheme } from '../theme/provider';

function RouterThemeBridge({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const prefersDark = theme.activeScheme === 'dark';
  const base = prefersDark ? DarkTheme : DefaultTheme;
  const shellColor = theme.activeColors.background;
  const routerTheme = useMemo(
    () => ({
      ...base,
      colors: {
        ...base.colors,
        background: shellColor,
        border: theme.activeColors.surface,
        card: shellColor,
        notification: theme.activeColors.warning,
        primary: theme.activeColors.primary,
        text: theme.activeColors.text,
      },
    }),
    [base, shellColor, theme.activeColors]
  );

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync?.(shellColor);
  }, [shellColor]);

  return <ThemeProvider value={routerTheme}>{children}</ThemeProvider>;
}

function LayoutInner() {
  const theme = useAppTheme();
  const shellColor = theme.activeColors.background;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: shellColor }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <RouterThemeBridge>
            <StatusBar
              barStyle={theme.activeScheme === 'dark' ? 'light-content' : 'dark-content'}
            />
            {Platform.OS === 'android' ? (
              <NavigationBar style={theme.activeScheme === 'dark' ? 'dark' : 'light'} />
            ) : null}
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: shellColor },
                headerBackButtonDisplayMode: 'minimal',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: shellColor },
                headerTintColor: theme.activeColors.primary,
                headerTitleStyle: { color: theme.activeColors.text, fontWeight: '700' },
              }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/features" options={{ title: 'Your first visit' }} />
              <Stack.Screen name="onboarding/complete" options={{ title: 'All set' }} />
              <Stack.Screen name="pet-setup" options={{ title: 'Pet profile' }} />
              <Stack.Screen name="create-post" options={{ title: 'Share a photo' }} />
              <Stack.Screen name="my-pet" options={{ title: 'My pet' }} />
              <Stack.Screen name="post/[id]" options={{ title: 'Pet moment' }} />
              <Stack.Screen
                name="settings"
                options={{ presentation: 'modal', title: 'Settings' }}
              />
              <Stack.Screen name="exposition/index" options={{ title: 'Package Exposition' }} />
              <Stack.Screen name="exposition/stylist" options={{ title: 'Stylist' }} />
              <Stack.Screen name="exposition/data" options={{ title: 'Data' }} />
              <Stack.Screen name="exposition/sdk-56" options={{ title: 'Expo SDK' }} />
            </Stack>
          </RouterThemeBridge>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function Layout() {
  const hasFontAssets = Object.keys(themeFontAssets).length > 0;
  const [fontsLoaded, fontsError] = useFonts(themeFontAssets);

  if (hasFontAssets && !fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <AppThemeProvider>
      <LayoutInner />
    </AppThemeProvider>
  );
}
