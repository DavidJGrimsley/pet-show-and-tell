import * as ImagePicker from 'expo-image-picker';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PetArtwork } from '../../components/pet-artwork';
import { copyPetImageIntoAppStorage } from '../../services/pet-image-storage';
import { usePetStore } from './pet-store';

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();
  const isHydrated = usePetStore((state) => state.isHydrated);
  const isLoading = usePetStore((state) => state.isLoading);
  const storeError = usePetStore((state) => state.error);
  const pets = usePetStore((state) => state.pets);
  const refresh = usePetStore((state) => state.refresh);
  const addPost = usePetStore((state) => state.addPost);

  const ownedPets = pets.filter((item) => item.isUserPet);
  const initialPetId =
    (params.petId ? ownedPets.find((p) => p.id === params.petId)?.id : null) ?? ownedPets[0]?.id;

  const [selectedPetId, setSelectedPetId] = useState<string | undefined>(initialPetId);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePetId = selectedPetId ?? initialPetId;
  const pet = ownedPets.find((item) => item.id === activePetId) ?? ownedPets[0];

  useEffect(() => {
    if (!isHydrated) {
      void refresh().catch(() => undefined);
    }
  }, [isHydrated, refresh]);

  const choosePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo access is off. You can use the sample picture or try again in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.88,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const sharePost = async () => {
    if (!pet || isSaving) {
      return;
    }
    if (!pickedUri) {
      setError('Choose a picture or use the sample picture before sharing.');
      return;
    }
    if (!caption.trim()) {
      setError('Add a short caption for this pet moment.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const photoUri = await copyPetImageIntoAppStorage(pickedUri);
      await addPost({ petId: pet.id, photoUri, caption });
      router.replace('/');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The post could not be saved. Your draft is still here; try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#396e55" size="large" />
        <Text style={styles.loadingText}>Opening your pet profile…</Text>
      </View>
    );
  }
  if (storeError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{storeError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refresh().catch(() => undefined)}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!isHydrated) {
    return null;
  }
  if (params.petId && !ownedPets.some((item) => item.id === params.petId)) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>This pet is not available for a new post.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/my-pet')}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Back to your pets</Text>
        </Pressable>
      </View>
    );
  }
  if (!pet) {
    return <Redirect href="/pet-setup" />;
  }

  const previewUri = pickedUri ?? pet.photoUri ?? 'seed:user-post';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>A MOMENT WITH {pet.name.toUpperCase()}</Text>
        <Text style={styles.title}>Share a pet moment</Text>
        <Text style={styles.subtitle}>This post stays on this device in the demo feed.</Text>
      </View>

      {ownedPets.length > 1 ? (
        <View style={styles.petSelectorContainer}>
          <Text style={styles.petSelectorLabel}>Choose which pet you are posting for:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petSelectorScroll}>
            {ownedPets.map((p) => {
              const isSelected = p.id === pet.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={'Select ' + p.name}
                  onPress={() => {
                    setSelectedPetId(p.id);
                  }}
                  style={[
                    styles.petSelectorChip,
                    isSelected ? styles.petSelectorChipActive : null,
                  ]}>
                  <View style={styles.petSelectorAvatarWrap}>
                    <PetArtwork
                      aspectRatio={1}
                      name={p.name}
                      photoUri={p.photoUri}
                      species={p.species}
                    />
                  </View>
                  <Text
                    style={[
                      styles.petSelectorChipText,
                      isSelected ? styles.petSelectorChipTextActive : null,
                    ]}>
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <PetArtwork aspectRatio={1.18} name={pet.name} photoUri={previewUri} species={pet.species} />

      <View style={styles.photoActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void choosePhoto()}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>
            {pickedUri ? 'Choose another photo' : 'Choose a photo'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setPickedUri(pet.photoUri || 'seed:user-post');
            setError(null);
          }}
          style={styles.sampleButton}>
          <Text style={styles.sampleText}>Use pet photo</Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Caption</Text>
        <TextInput
          accessibilityLabel="Post caption"
          maxLength={180}
          multiline
          onChangeText={setCaption}
          placeholder={'A little story about ' + pet.name}
          placeholderTextColor="#89948d"
          style={styles.input}
          value={caption}
        />
        <Text style={styles.counter}>{caption.length}/180</Text>
      </View>

      <View style={styles.privacyNote}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyText}>
          Your photo and post are saved locally and are not uploaded.
        </Text>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => void sharePost()}
        style={[styles.primaryButton, isSaving ? styles.disabledButton : null]}>
        <Text style={styles.primaryText}>
          {isSaving ? 'Saving your moment…' : 'Add to the feed'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/')}
        style={styles.cancelButton}>
        <Text style={styles.cancelText}>Not right now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f7f5ef',
    flex: 1,
  },
  content: {
    gap: 13,
    padding: 18,
    paddingBottom: 38,
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
  intro: {
    gap: 5,
  },
  eyebrow: {
    color: '#55745f',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#263d32',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#65756b',
    fontSize: 13,
    lineHeight: 19,
  },
  petSelectorContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#e8ece5',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  petSelectorLabel: {
    color: '#4f6256',
    fontSize: 11,
    fontWeight: '800',
  },
  petSelectorScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  petSelectorChip: {
    alignItems: 'center',
    backgroundColor: '#f6f5ee',
    borderColor: '#e2e6de',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  petSelectorChipActive: {
    backgroundColor: '#e7f0e6',
    borderColor: '#4d8263',
  },
  petSelectorAvatarWrap: {
    borderRadius: 10,
    height: 24,
    overflow: 'hidden',
    width: 24,
  },
  petSelectorChipText: {
    color: '#34473b',
    fontSize: 12,
    fontWeight: '700',
  },
  petSelectorChipTextActive: {
    color: '#1f4831',
    fontWeight: '900',
  },
  photoActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#e5eee3',
    borderRadius: 16,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryText: {
    color: '#355e48',
    fontSize: 12,
    fontWeight: '900',
  },
  sampleButton: {
    alignItems: 'center',
    borderColor: '#d5ded4',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sampleText: {
    color: '#63746a',
    fontSize: 12,
    fontWeight: '800',
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#35473b',
    fontSize: 12,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#dce3d9',
    borderRadius: 15,
    borderWidth: 1,
    color: '#283e33',
    fontSize: 14,
    minHeight: 94,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    color: '#7a887e',
    fontSize: 10,
  },
  privacyNote: {
    alignItems: 'center',
    backgroundColor: '#eef1e9',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  privacyIcon: {
    fontSize: 14,
  },
  privacyText: {
    color: '#526459',
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    color: '#9c483f',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#386c54',
    borderRadius: 18,
    marginTop: 2,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.62,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  cancelButton: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  cancelText: {
    color: '#547461',
    fontSize: 12,
    fontWeight: '800',
  },
});
