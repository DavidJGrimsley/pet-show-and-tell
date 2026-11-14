import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PetArtwork } from '../../components/pet-artwork';
import { usePetStore } from './pet-store';
import { PetPostCard } from './pet-post-card';

export default function FeedScreen() {
  const router = useRouter();
  const isHydrated = usePetStore((state) => state.isHydrated);
  const isLoading = usePetStore((state) => state.isLoading);
  const error = usePetStore((state) => state.error);
  const pets = usePetStore((state) => state.pets);
  const posts = usePetStore((state) => state.posts);
  const reactions = usePetStore((state) => state.reactions);
  const hydrate = usePetStore((state) => state.hydrate);
  const refresh = usePetStore((state) => state.refresh);
  const toggleReaction = usePetStore((state) => state.toggleReaction);
  const ownedPets = useMemo(() => pets.filter((pet) => pet.isUserPet), [pets]);
  const localPet = ownedPets[0];
  const petsById = useMemo(() => new Map(pets.map((pet) => [pet.id, pet])), [pets]);
  const visiblePosts = useMemo(
    () => posts.filter((post) => petsById.has(post.petId)),
    [petsById, posts]
  );

  useEffect(() => {
    let cancelled = false;
    void hydrate()
      .then((didReset) => {
        if (!cancelled && didReset) {
          router.replace('/');
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hydrate, router]);

  useEffect(() => {
    if (isHydrated && ownedPets.length === 0) {
      router.replace('/onboarding');
    }
  }, [isHydrated, ownedPets.length, router]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#44775e" size="large" />
        <Text style={styles.loadingText}>Finding the pet pictures…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>The feed is taking a little break</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!isHydrated) {
    return null;
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.feed}
      data={visiblePosts}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>Your first pet moment starts here</Text>
          <Text style={styles.emptyBody}>Share a picture to add it to your feed.</Text>
        </View>
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.topLine}>
            <View style={styles.brand}>
              <Text style={styles.eyebrow}>A LITTLE JOY, EVERY DAY</Text>
              <Text style={styles.title}>Pet Show and Tell</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ownedPets.length > 0 ? 'View your pets' : 'Create a pet profile'}
              onPress={() => router.push(ownedPets.length > 0 ? '/my-pet' : '/pet-setup')}
              style={styles.profileButton}>
              <Text style={styles.profileEmoji}>🐾</Text>
              <Text style={styles.profileButtonText}>
                {ownedPets.length > 1 ? 'My pets (' + ownedPets.length + ')' : 'My pet'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Good pictures. Good company. Good pets.</Text>
          <View style={styles.communityCard}>
            <View style={styles.communityCopy}>
              <Text style={styles.communityTitle}>Share a little moment</Text>
              <Text style={styles.communityBody}>
                Add a photo of {ownedPets.length > 1 ? 'your pets' : (localPet?.name ?? 'your pet')}{' '}
                to your on-device feed.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/create-post')}
              style={styles.addButton}>
              <Text style={styles.addButtonText}>＋ Post</Text>
            </Pressable>
          </View>

          {ownedPets.length > 0 ? (
            <View style={styles.petReel}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petReelScroll}>
                {ownedPets.map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={'View ' + p.name + "'s profile"}
                    onPress={() => router.push({ pathname: '/my-pet', params: { id: p.id } })}
                    style={styles.petReelItem}>
                    <View style={styles.petReelAvatarWrap}>
                      <PetArtwork
                        aspectRatio={1}
                        name={p.name}
                        photoUri={p.photoUri}
                        species={p.species}
                      />
                    </View>
                    <Text numberOfLines={1} style={styles.petReelName}>
                      {p.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add another pet"
                  onPress={() => router.push('/pet-setup')}
                  style={styles.addPetReelButton}>
                  <View style={styles.addPetIconWrap}>
                    <Text style={styles.addPetIcon}>＋</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.addPetText}>
                    Add pet
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.feedHeading}>
            <Text style={styles.feedTitle}>Meet the pets</Text>
            <Text style={styles.feedCount}>{visiblePosts.length} moments</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const pet = petsById.get(item.petId);
        if (!pet) {
          return null;
        }
        return (
          <PetPostCard
            onReact={(reaction) => {
              void toggleReaction(item.id, reaction).catch(() => undefined);
            }}
            pet={pet}
            post={item}
            reaction={reactions[item.id]}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  feed: {
    backgroundColor: '#f7f5ef',
    flexGrow: 1,
    gap: 16,
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: '#f7f5ef',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 28,
  },
  loadingText: {
    color: '#52645a',
    fontSize: 14,
  },
  errorTitle: {
    color: '#34473b',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorBody: {
    color: '#617067',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retry: {
    backgroundColor: '#386c54',
    borderRadius: 22,
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  header: {
    gap: 13,
  },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  brand: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: '#78897c',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    color: '#263d32',
    fontSize: 23,
    fontWeight: '900',
  },
  subtitle: {
    color: '#65756b',
    fontSize: 13,
  },
  profileButton: {
    alignItems: 'center',
    backgroundColor: '#e6eee5',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 11,
  },
  profileEmoji: {
    fontSize: 16,
  },
  profileButtonText: {
    color: '#355e48',
    fontSize: 12,
    fontWeight: '800',
  },
  communityCard: {
    alignItems: 'center',
    backgroundColor: '#e5eee3',
    borderColor: '#d4e1d3',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  communityCopy: {
    flex: 1,
    gap: 3,
  },
  communityTitle: {
    color: '#2d4c39',
    fontSize: 14,
    fontWeight: '900',
  },
  communityBody: {
    color: '#52685a',
    fontSize: 11,
    lineHeight: 16,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#396e55',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 13,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  petReel: {
    paddingVertical: 2,
  },
  petReelScroll: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 2,
  },
  petReelItem: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  petReelAvatarWrap: {
    borderColor: '#396e55',
    borderRadius: 24,
    borderWidth: 2,
    height: 48,
    overflow: 'hidden',
    width: 48,
  },
  petReelName: {
    color: '#34473b',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  addPetReelButton: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  addPetIconWrap: {
    alignItems: 'center',
    backgroundColor: '#e5eee3',
    borderColor: '#c6d6c3',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  addPetIcon: {
    color: '#396e55',
    fontSize: 18,
    fontWeight: '900',
  },
  addPetText: {
    color: '#556b5d',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedHeading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
    paddingTop: 2,
  },
  feedTitle: {
    color: '#283e33',
    fontSize: 19,
    fontWeight: '900',
  },
  feedCount: {
    color: '#708076',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    gap: 10,
    marginTop: 10,
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    color: '#2f4938',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyBody: {
    color: '#6c7c70',
    fontSize: 13,
    textAlign: 'center',
  },
});
