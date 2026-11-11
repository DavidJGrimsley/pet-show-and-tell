import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PetArtwork } from '../../components/pet-artwork';
import type { ReactionKind } from '../../types/pet';
import { usePetStore } from './pet-store';

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const postId = typeof params.id === 'string' ? params.id : '';
  const isHydrated = usePetStore((state) => state.isHydrated);
  const isLoading = usePetStore((state) => state.isLoading);
  const error = usePetStore((state) => state.error);
  const pets = usePetStore((state) => state.pets);
  const posts = usePetStore((state) => state.posts);
  const reactions = usePetStore((state) => state.reactions);
  const refresh = usePetStore((state) => state.refresh);
  const toggleReaction = usePetStore((state) => state.toggleReaction);
  const post = posts.find((item) => item.id === postId);
  const pet = pets.find((item) => item.id === post?.petId);
  const reaction = reactions[postId];

  useEffect(() => {
    if (!isHydrated) {
      void refresh().catch(() => undefined);
    }
  }, [isHydrated, refresh]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#396e55" size="large" />
        <Text style={styles.loadingText}>Opening this pet moment…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFoundTitle}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refresh().catch(() => undefined)}
          style={styles.backButton}>
          <Text style={styles.backText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!isHydrated) {
    return null;
  }

  if (!post || !pet) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFoundTitle}>We could not find that post</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={styles.backButton}>
          <Text style={styles.backText}>Back to the feed</Text>
        </Pressable>
      </View>
    );
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(post.createdAt));

  const react = (kind: ReactionKind) => {
    void toggleReaction(post.id, kind).catch(() => undefined);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      style={styles.screen}>
      <PetArtwork
        aspectRatio={0.98}
        name={pet.name}
        photoUri={post.photoUri}
        species={pet.species}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'View ' + pet.name + "'s profile"}
        onPress={() => router.push({ pathname: '/my-pet', params: { id: pet.id } })}
        style={styles.titleGroup}>
        <View style={styles.titleRow}>
          <Text style={styles.petName}>{pet.name}</Text>
          <View style={styles.profileLink}>
            <Text style={styles.profileLinkText}>View profile ›</Text>
          </View>
        </View>
        <Text style={styles.species}>
          {pet.species} · {dateLabel}
        </Text>
      </Pressable>
      <Text selectable style={styles.description}>
        {post.caption}
      </Text>
      <View>
        <Text style={styles.personalityLabel}>Personality</Text>
        <Text selectable style={styles.description}>
          {pet.personality}
        </Text>
      </View>

      <View style={styles.reactions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Like ' + pet.name + "'s post"}
          accessibilityState={{ selected: reaction === 'like' }}
          onPress={() => react('like')}
          style={[styles.reaction, reaction === 'like' ? styles.likeSelected : null]}>
          <Text style={styles.reactionEmoji}>👍</Text>
          <Text style={[styles.reactionText, reaction === 'like' ? styles.activeText : null]}>
            Like
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Love ' + pet.name + "'s post"}
          accessibilityState={{ selected: reaction === 'love' }}
          onPress={() => react('love')}
          style={[styles.reaction, reaction === 'love' ? styles.loveSelected : null]}>
          <Text style={styles.reactionEmoji}>💚</Text>
          <Text style={[styles.reactionText, reaction === 'love' ? styles.activeText : null]}>
            Love
          </Text>
        </Pressable>
      </View>

      <View style={styles.localNote}>
        <Text style={styles.localNoteEmoji}>🔒</Text>
        <Text style={styles.localNoteText}>
          Your reaction is saved on this device. This demo does not publish activity to a public
          service.
        </Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Back to the feed</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  personalityLabel: {
    color: '#30483a',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  screen: {
    backgroundColor: '#f7f5ef',
    flex: 1,
  },
  content: {
    gap: 15,
    padding: 18,
    paddingBottom: 36,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: '#f7f5ef',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#65756b',
    fontSize: 13,
  },
  notFoundTitle: {
    color: '#34473b',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleGroup: {
    gap: 3,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileLink: {
    backgroundColor: '#e5eee3',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  profileLinkText: {
    color: '#355e48',
    fontSize: 11,
    fontWeight: '800',
  },
  petName: {
    color: '#263d32',
    fontSize: 24,
    fontWeight: '900',
  },
  species: {
    color: '#68776e',
    fontSize: 12,
  },
  description: {
    color: '#35483b',
    fontSize: 16,
    lineHeight: 24,
  },
  reactions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 3,
  },
  reaction: {
    alignItems: 'center',
    borderColor: '#dfe5db',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  likeSelected: {
    backgroundColor: '#e7f1e9',
    borderColor: '#74a887',
  },
  loveSelected: {
    backgroundColor: '#fbe9e6',
    borderColor: '#dc9487',
  },
  reactionEmoji: {
    fontSize: 17,
  },
  reactionText: {
    color: '#506057',
    fontSize: 13,
    fontWeight: '800',
  },
  activeText: {
    color: '#294a38',
  },
  localNote: {
    alignItems: 'center',
    backgroundColor: '#eef1e9',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  localNoteEmoji: {
    fontSize: 14,
  },
  localNoteText: {
    color: '#526459',
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#386c54',
    borderRadius: 17,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  backText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
