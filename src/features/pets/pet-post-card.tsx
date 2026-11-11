import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PetArtwork } from '../../components/pet-artwork';
import type { Pet, PetPost, ReactionKind } from '../../types/pet';

interface PetPostCardProps {
  pet: Pet;
  post: PetPost;
  reaction?: ReactionKind;
  onReact: (reaction: ReactionKind) => void;
}

export function PetPostCard({ pet, post, reaction, onReact }: PetPostCardProps) {
  const router = useRouter();
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(post.createdAt));

  return (
    <Pressable
      accessible={false}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={styles.card}>
      <View style={styles.postHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'View ' + pet.name + "'s profile"}
          onPress={(event) => {
            event.stopPropagation();
            router.push({ pathname: '/my-pet', params: { id: pet.id } });
          }}
          style={styles.nameGroup}>
          <Text numberOfLines={1} selectable style={styles.petName}>
            {pet.name}
          </Text>
          <Text numberOfLines={1} selectable style={styles.species}>
            {pet.species} · {dateLabel}
          </Text>
        </Pressable>
        {pet.isUserPet ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'View ' + pet.name + "'s profile"}
            onPress={(event) => {
              event.stopPropagation();
              router.push({ pathname: '/my-pet', params: { id: pet.id } });
            }}>
            <Text style={styles.yourPet}>YOUR PET</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'View ' + pet.name + "'s post: " + post.caption}
        onPress={(event) => {
          event.stopPropagation();
          router.push({ pathname: '/post/[id]', params: { id: post.id } });
        }}
        style={styles.postContent}>
        <PetArtwork
          aspectRatio={1.23}
          name={pet.name}
          photoUri={post.photoUri}
          species={pet.species}
        />
        <Text style={styles.description}>{post.caption}</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Like ' + pet.name + "'s post"}
          accessibilityState={{ selected: reaction === 'like' }}
          onPress={(event) => {
            event.stopPropagation();
            onReact('like');
          }}
          style={[styles.reactionButton, reaction === 'like' ? styles.likeSelected : null]}>
          <Text style={styles.reactionEmoji}>👍</Text>
          <Text style={[styles.reactionLabel, reaction === 'like' ? styles.activeLabel : null]}>
            Like
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Love ' + pet.name + "'s post"}
          accessibilityState={{ selected: reaction === 'love' }}
          onPress={(event) => {
            event.stopPropagation();
            onReact('love');
          }}
          style={[styles.reactionButton, reaction === 'love' ? styles.loveSelected : null]}>
          <Text style={styles.reactionEmoji}>💚</Text>
          <Text style={[styles.reactionLabel, reaction === 'love' ? styles.activeLabel : null]}>
            Love
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e8e9df',
    borderRadius: 22,
    borderWidth: 1,
    gap: 13,
    padding: 14,
  },
  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  postContent: {
    gap: 13,
  },
  nameGroup: {
    flex: 1,
    gap: 2,
    paddingRight: 10,
  },
  petName: {
    color: '#263d32',
    fontSize: 17,
    fontWeight: '900',
  },
  species: {
    color: '#68776e',
    fontSize: 12,
  },
  yourPet: {
    color: '#376b55',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  description: {
    color: '#33443a',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingTop: 1,
  },
  reactionButton: {
    alignItems: 'center',
    borderColor: '#dfe5db',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
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
    fontSize: 15,
  },
  reactionLabel: {
    color: '#506057',
    fontSize: 12,
    fontWeight: '700',
  },
  activeLabel: {
    color: '#294a38',
  },
});
