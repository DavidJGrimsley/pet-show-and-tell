import { Image, StyleSheet, Text, View } from 'react-native';

import { resolvePetImageSource } from '../services/pet-assets';

interface PetArtworkProps {
  photoUri: string;
  name: string;
  species: string;
  aspectRatio?: number;
}

function getArtwork(photoUri: string, species: string) {
  const key = photoUri.toLowerCase() + ' ' + species.toLowerCase();
  if (key.includes('snake')) {
    return { emoji: '🐍', background: '#e1ede0', accent: '#bcd5bb' };
  }
  if (key.includes('bird') || key.includes('parakeet')) {
    return { emoji: '🐦', background: '#d9eee4', accent: '#b0d7bf' };
  }
  if (key.includes('rabbit') || key.includes('bunny')) {
    return { emoji: '🐇', background: '#f7e6d9', accent: '#f0cdbf' };
  }
  if (key.includes('cat') || key.includes('tabby')) {
    return { emoji: '🐈', background: '#e7e3f1', accent: '#cec3e1' };
  }
  if (key.includes('corgi')) {
    return { emoji: '🐕', background: '#f5e6c8', accent: '#e8c98d' };
  }
  return { emoji: '🐶', background: '#f4e6d5', accent: '#e7cbb0' };
}

export function PetArtwork({ photoUri, name, species, aspectRatio = 1.3 }: PetArtworkProps) {
  const imageSource = resolvePetImageSource(photoUri);
  if (imageSource) {
    return (
      <View style={[styles.imageFrame, { aspectRatio }]}>
        <Image
          accessibilityLabel={name + ', ' + species}
          resizeMode="cover"
          source={imageSource}
          style={styles.imageContent}
        />
      </View>
    );
  }

  const artwork = getArtwork(photoUri, species);
  return (
    <View
      accessibilityLabel={'Sample picture of ' + name + ', ' + species}
      style={[styles.sample, { aspectRatio, backgroundColor: artwork.background }]}>
      <View style={[styles.sun, { backgroundColor: artwork.accent }]} />
      <View style={styles.horizon} />
      <Text style={styles.emoji}>{artwork.emoji}</Text>
      <View style={styles.caption}>
        <Text style={styles.captionTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.captionSpecies} numberOfLines={1}>
          {species}
        </Text>
      </View>
      <View style={styles.sampleBadge}>
        <Text style={styles.sampleBadgeText}>SAMPLE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageFrame: {
    backgroundColor: '#f1eee8',
    borderRadius: 18,
    overflow: 'hidden',
    width: '100%',
  },
  imageContent: {
    height: '100%',
    width: '100%',
  },
  sample: {
    borderRadius: 18,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  sun: {
    borderRadius: 100,
    height: 90,
    opacity: 0.75,
    position: 'absolute',
    right: '12%',
    top: '10%',
    width: 90,
  },
  horizon: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    bottom: -36,
    height: '48%',
    left: '-6%',
    position: 'absolute',
    right: '-6%',
  },
  emoji: {
    alignSelf: 'center',
    fontSize: 88,
    marginTop: -6,
    textAlign: 'center',
  },
  caption: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 14,
    bottom: 12,
    left: 12,
    maxWidth: '72%',
    paddingHorizontal: 11,
    paddingVertical: 7,
    position: 'absolute',
  },
  captionTitle: {
    color: '#31433b',
    fontSize: 13,
    fontWeight: '800',
  },
  captionSpecies: {
    color: '#53645b',
    fontSize: 11,
    marginTop: 1,
  },
  sampleBadge: {
    backgroundColor: 'rgba(49, 67, 59, 0.72)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'absolute',
    right: 11,
    top: 11,
  },
  sampleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
});
