import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function MyPetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isHydrated = usePetStore((state) => state.isHydrated);
  const isLoading = usePetStore((state) => state.isLoading);
  const error = usePetStore((state) => state.error);
  const pets = usePetStore((state) => state.pets);
  const posts = usePetStore((state) => state.posts);
  const reactions = usePetStore((state) => state.reactions);
  const refresh = usePetStore((state) => state.refresh);
  const toggleReaction = usePetStore((state) => state.toggleReaction);

  const ownedPets = pets.filter((item) => item.isUserPet);
  const targetPetId = params.id;
  const initialPet =
    (targetPetId ? pets.find((item) => item.id === targetPetId) : null) ?? ownedPets[0] ?? pets[0];

  const [activePetId, setActivePetId] = useState<string | undefined>(initialPet?.id);

  useEffect(() => {
    if (!isHydrated) {
      void refresh().catch(() => undefined);
    }
  }, [isHydrated, refresh]);

  // Keep activePetId in sync if targetPetId changes in navigation params
  const pet =
    pets.find((item) => item.id === (targetPetId ?? activePetId)) ?? ownedPets[0] ?? pets[0];

  const petPosts = pet ? posts.filter((post) => post.petId === pet.id) : [];

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#396e55" size="large" />
        <Text style={styles.loadingText}>Opening your pet profile…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyText}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refresh().catch(() => undefined)}
          style={styles.primaryButton}>
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!isHydrated) {
    return null;
  }
  if (!pet) {
    return <Redirect href="/pet-setup" />;
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      data={petPosts}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyTitle}>Your photo story starts here</Text>
          <Text style={styles.emptyText}>Add a post to share a moment with {pet.name}.</Text>
          {pet.isUserPet ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/create-post', params: { petId: pet.id } })}
              style={styles.primaryButton}>
              <Text style={styles.primaryText}>Share a photo</Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListHeaderComponent={
        <View style={styles.header}>
          {ownedPets.length > 0 ? (
            <View style={styles.switcherSection}>
              <View style={styles.switcherHeader}>
                <View>
                  <Text style={styles.switcherEyebrow}>YOUR PET FAMILY</Text>
                  <Text style={styles.switcherTitle}>
                    {ownedPets.length} {ownedPets.length === 1 ? 'Pet' : 'Pets'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add another pet"
                  onPress={() => router.push('/pet-setup')}
                  style={styles.addPetButton}>
                  <Text style={styles.addPetButtonText}>＋ Add pet</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.switcherScroll}
                style={styles.boundedScroll}>
                {ownedPets.map((p) => {
                  const isSelected = p.id === pet.id;
                  return (
                    <Pressable
                      key={p.id}
                      accessibilityRole="button"
                      accessibilityLabel={'Switch to ' + p.name}
                      onPress={() => {
                        setActivePetId(p.id);
                        if (targetPetId && targetPetId !== p.id) {
                          router.setParams({ id: p.id });
                        }
                      }}
                      style={[styles.petChip, isSelected ? styles.petChipSelected : null]}>
                      <View style={styles.chipAvatarWrap}>
                        <PetArtwork
                          aspectRatio={1}
                          name={p.name}
                          photoUri={p.photoUri}
                          species={p.species}
                        />
                      </View>
                      <View style={styles.chipTextWrap}>
                        <Text
                          numberOfLines={1}
                          style={[styles.chipName, isSelected ? styles.chipNameSelected : null]}>
                          {p.name}
                        </Text>
                        <Text numberOfLines={1} style={styles.chipSpecies}>
                          {p.species}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <PetArtwork
            aspectRatio={1.5}
            name={pet.name}
            photoUri={pet.photoUri}
            species={pet.species}
          />
          <View style={styles.profileInfo}>
            <View style={styles.profileNames}>
              <Text selectable style={styles.name}>
                {pet.name}
              </Text>
              <Text selectable style={styles.species}>
                {pet.species}
              </Text>
            </View>
            <View style={styles.profileButtons}>
              {pet.isUserPet ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/pet-setup',
                      params: { edit: 'true', id: pet.id },
                    })
                  }
                  style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit profile</Text>
                </Pressable>
              ) : null}
              {pet.isUserPet ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/create-post',
                      params: { petId: pet.id },
                    })
                  }
                  style={styles.shareMomentButton}>
                  <Text style={styles.shareMomentButtonText}>＋ Post</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <Text style={styles.personalityLabel}>Personality</Text>
          <Text selectable style={styles.description}>
            {pet.personality}
          </Text>
          <View style={styles.postHeading}>
            <Text style={styles.postHeadingTitle}>Shared moments</Text>
            <Text style={styles.postHeadingCount}>{petPosts.length}</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <PetPostCard
          onReact={(reaction) => {
            void toggleReaction(item.id, reaction).catch(() => undefined);
          }}
          pet={pet}
          post={item}
          reaction={reactions[item.id]}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  personalityLabel: {
    color: '#30483a',
    fontSize: 14,
    fontWeight: '900',
  },
  content: {
    backgroundColor: '#f7f5ef',
    flexGrow: 1,
    gap: 14,
    padding: 16,
    paddingBottom: 40,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: '#f7f5ef',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#65756b',
    fontSize: 13,
  },
  header: {
    gap: 12,
  },
  switcherSection: {
    backgroundColor: '#ffffff',
    borderColor: '#e8ece5',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
    overflow: 'hidden',
    padding: 14,
    width: '100%',
  },
  boundedScroll: {
    width: '100%',
  },
  switcherHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switcherEyebrow: {
    color: '#76877b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  switcherTitle: {
    color: '#263d32',
    fontSize: 17,
    fontWeight: '900',
  },
  addPetButton: {
    backgroundColor: '#396e55',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  addPetButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  switcherScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  petChip: {
    alignItems: 'center',
    backgroundColor: '#f6f5ee',
    borderColor: '#e2e6de',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  petChipSelected: {
    backgroundColor: '#e7f0e6',
    borderColor: '#5b8a6f',
  },
  chipAvatarWrap: {
    borderRadius: 12,
    height: 32,
    overflow: 'hidden',
    width: 32,
  },
  chipTextWrap: {
    maxWidth: 100,
  },
  chipName: {
    color: '#34473b',
    fontSize: 12,
    fontWeight: '800',
  },
  chipNameSelected: {
    color: '#214d34',
  },
  chipSpecies: {
    color: '#738378',
    fontSize: 10,
  },
  profileInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileNames: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  name: {
    color: '#263d32',
    fontSize: 24,
    fontWeight: '900',
  },
  species: {
    color: '#68776e',
    fontSize: 13,
  },
  profileButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#e5eee3',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  editButtonText: {
    color: '#355e48',
    fontSize: 11,
    fontWeight: '900',
  },
  shareMomentButton: {
    backgroundColor: '#396e55',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  shareMomentButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  description: {
    color: '#44584b',
    fontSize: 14,
    lineHeight: 21,
  },
  postHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
  },
  postHeadingTitle: {
    color: '#30483a',
    fontSize: 18,
    fontWeight: '900',
  },
  postHeadingCount: {
    color: '#6e7e72',
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    gap: 9,
    padding: 22,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    color: '#2f4938',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: '#6c7c70',
    fontSize: 12,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#386c54',
    borderRadius: 16,
    marginTop: 3,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
