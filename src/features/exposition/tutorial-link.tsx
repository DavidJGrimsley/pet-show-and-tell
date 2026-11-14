import { Linking, Text, type StyleProp, type TextStyle } from 'react-native';

import type { TutorialLink } from './tutorial-link-types';

export function TutorialLinkText({
  link,
  style,
}: {
  link: TutorialLink;
  style?: StyleProp<TextStyle>;
}) {
  if (!link.href) {
    return <Text style={style}>{link.label}</Text>;
  }

  const href = link.href;
  return (
    <Text accessibilityRole="link" onPress={() => void Linking.openURL(href)} style={style}>
      {link.label}
    </Text>
  );
}
