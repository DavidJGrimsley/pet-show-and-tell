import type { Href } from 'expo-router';

export type OnboardingCompletionMode = 'enter-app' | 'auth' | 'account-setup' | 'custom';

export interface OnboardingValueProp {
  title: string;
  body: string;
}

export interface OnboardingFeatureHighlight {
  id: string;
  title: string;
  body: string;
  badge?: string;
}

export interface OnboardingCompletionConfig {
  mode: OnboardingCompletionMode;
  route: Href;
  label: string;
  helperText: string;
}

export interface OnboardingConfig {
  appName: string;
  welcomeEyebrow: string;
  welcomeTitle: string;
  welcomeBody: string;
  valueProps: OnboardingValueProp[];
  nextRouteAfterWelcome: Href;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresBody: string;
  featureHighlights: OnboardingFeatureHighlight[];
  nextRouteAfterFeatures: Href;
  legal: {
    title: string;
    body: string;
  };
  completeTitle: string;
  completeBody: string;
  completion: OnboardingCompletionConfig;
}

export const onboardingConfig: OnboardingConfig = {
  appName: 'Pet Show and Tell',
  welcomeEyebrow: 'A cozy corner for pets',
  welcomeTitle: 'Every pet has a story worth sharing',
  welcomeBody:
    'Make a little profile for your pet, share a favorite picture, and enjoy the pets other people love.',
  valueProps: [
    {
      title: 'Give your pet a little introduction',
      body: 'Add a name, species, picture, and a few words about what makes them special.',
    },
    {
      title: 'Share a favorite moment',
      body: 'Choose a picture from your device and add a short description.',
    },
    {
      title: 'Meet the neighborhood',
      body: 'Browse a feed of pets, open their posts, and leave a Like or Love.',
    },
  ],
  nextRouteAfterWelcome: '/onboarding/features' as Href,
  featuresEyebrow: 'Your first visit',
  featuresTitle: 'Start with one pet',
  featuresBody:
    'Create a simple pet profile first. You can add another photo any time, then browse the full pet feed.',
  featureHighlights: [
    {
      id: 'workflow',
      title: 'Pet profile',
      body: 'Choose a name, species, picture, and short description.',
      badge: 'First',
    },
    {
      id: 'integrations',
      title: 'Photo post',
      body: 'Share a moment from your device with a short caption.',
      badge: 'Next',
    },
    {
      id: 'control',
      title: 'Pet feed',
      body: 'Enjoy the sample community feed and react to favorite posts.',
      badge: 'Then',
    },
  ],
  nextRouteAfterFeatures: '/pet-setup' as Href,
  legal: {
    title: '',
    body: '',
  },
  completeTitle: 'Your pet is ready to meet everyone',
  completeBody: 'Create a pet profile and share a first photo to start your local feed.',
  completion: {
    mode: 'enter-app',
    route: '/' as Href,
    label: 'Open the feed',
    helperText: 'Your profile, photos, and reactions stay on this device.',
  },
};
