import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import type { Pet } from '../../types/pet';
import { usePetStore } from './pet-store';

interface SetupFormProps {
  initialPet?: Pet;
  isEdit: boolean;
  onSave: (data: {
    name: string;
    species: string;
    personality: string;
    photoUri: string;
  }) => Promise<void>;
}

function SetupForm({ initialPet, isEdit, onSave }: SetupFormProps) {
  const [name, setName] = useState(initialPet?.name ?? '');
  const [species, setSpecies] = useState(initialPet?.species ?? '');
  const [personality, setPersonality] = useState(initialPet?.personality ?? '');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUri = pickedUri ?? initialPet?.photoUri ?? 'seed:pet-profile';

  const choosePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(
        'Photo access is off. You can save the profile with its illustration and choose a photo later.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const submitProfile = async () => {
    if (isSaving) {
      return;
    }
    if (!name.trim() || !species.trim() || !personality.trim()) {
      setError('Add a pet name, species, and a short personality to continue.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const photoUri = pickedUri
        ? await copyPetImageIntoAppStorage(pickedUri)
        : (initialPet?.photoUri ?? 'seed:pet-profile');
      await onSave({ name, species, personality, photoUri });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Your pet profile could not be saved. Your details are still here; try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>{isEdit ? 'UPDATE PROFILE' : 'NEW PET'}</Text>
        <Text style={styles.title}>
          {isEdit ? 'Update ' + (name.trim() || 'pet') + "'s profile" : 'Who are we meeting?'}
        </Text>
        <Text style={styles.subtitle}>
          Add a few details so everyone knows who is in the pictures.
        </Text>
      </View>

      <PetArtwork
        aspectRatio={1.45}
        name={name.trim() || 'Your pet'}
        photoUri={previewUri}
        species={species.trim() || 'Pet'}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => void choosePhoto()}
        style={styles.photoButton}>
        <Text style={styles.photoButtonText}>
          {pickedUri ? 'Choose a different picture' : 'Add a profile picture'}
        </Text>
      </Pressable>
      <Text style={styles.helper}>
        A picture is optional. The illustration is a placeholder until you choose a photo.
      </Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Pet name</Text>
          <TextInput
            accessibilityLabel="Pet name"
            autoCapitalize="words"
            maxLength={32}
            onChangeText={setName}
            placeholder="For example, Milo"
            placeholderTextColor="#89948d"
            returnKeyType="next"
            style={styles.input}
            value={name}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Species</Text>
          <TextInput
            accessibilityLabel="Pet species"
            autoCapitalize="words"
            maxLength={32}
            onChangeText={setSpecies}
            placeholder="Dog, cat, snake, rabbit…"
            placeholderTextColor="#89948d"
            returnKeyType="next"
            style={styles.input}
            value={species}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Personality</Text>
          <TextInput
            accessibilityLabel="Pet personality"
            maxLength={140}
            multiline
            onChangeText={setPersonality}
            placeholder="Favorite things, tiny habits, or a fun fact"
            placeholderTextColor="#89948d"
            returnKeyType="default"
            style={[styles.input, styles.multiline]}
            value={personality}
          />
          <Text style={styles.counter}>{personality.length}/140</Text>
        </View>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => void submitProfile()}
        style={[styles.primaryButton, isSaving ? styles.disabledButton : null]}>
        <Text style={styles.primaryButtonText}>
          {isSaving ? 'Saving profile…' : isEdit ? 'Save changes' : 'Save pet profile'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export default function PetSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string; id?: string }>();
  const isEdit = params.edit === 'true';
  const pets = usePetStore((state) => state.pets);
  const isHydrated = usePetStore((state) => state.isHydrated);
  const isLoading = usePetStore((state) => state.isLoading);
  const storeError = usePetStore((state) => state.error);
  const refresh = usePetStore((state) => state.refresh);
  const saveProfile = usePetStore((state) => state.saveProfile);

  const ownedPets = pets.filter((pet) => pet.isUserPet);
  const currentPet = isEdit
    ? params.id
      ? ownedPets.find((pet) => pet.id === params.id)
      : ownedPets[0]
    : undefined;

  useEffect(() => {
    if (!isHydrated) {
      void refresh().catch(() => undefined);
    }
  }, [isHydrated, refresh]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#396e55" size="large" />
        <Text style={styles.loadingText}>Getting things ready…</Text>
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
          style={styles.photoButton}>
          <Text style={styles.photoButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!isHydrated) {
    return null;
  }
  if (isEdit && !currentPet) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>We could not find that pet profile.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/my-pet')}
          style={styles.photoButton}>
          <Text style={styles.photoButtonText}>Back to your pets</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = async (data: {
    name: string;
    species: string;
    personality: string;
    photoUri: string;
  }) => {
    const saved = await saveProfile(data, currentPet?.id);
    router.replace({ pathname: '/my-pet', params: { id: saved.id } });
  };

  return (
    <SetupForm
      key={currentPet?.id ?? 'new-pet'}
      initialPet={currentPet}
      isEdit={isEdit}
      onSave={handleSave}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f7f5ef',
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 18,
    paddingBottom: 36,
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
    letterSpacing: 1.1,
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
  photoButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5eee3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  photoButtonText: {
    color: '#355e48',
    fontSize: 12,
    fontWeight: '900',
  },
  helper: {
    color: '#77847b',
    fontSize: 11,
    lineHeight: 16,
  },
  form: {
    gap: 12,
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
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    color: '#7a887e',
    fontSize: 10,
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
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
