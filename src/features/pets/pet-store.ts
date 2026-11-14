import { create } from 'zustand';

import {
  consumeWebPreviewReset,
  createLocalPetPost,
  getPetSnapshot,
  resetPetDatabase,
  saveLocalPetProfile,
  saveLocalReaction,
} from '../../storage/pet-database';
import type { Pet, PetPost, PetPostInput, PetProfileInput, ReactionKind } from '../../types/pet';

interface PetStore {
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  pets: Pet[];
  posts: PetPost[];
  reactions: Record<string, ReactionKind>;
  hydrate: () => Promise<boolean>;
  refresh: () => Promise<void>;
  resetPreview: () => Promise<void>;
  saveProfile: (input: PetProfileInput, petId?: string) => Promise<Pet>;
  addPost: (input: PetPostInput) => Promise<PetPost>;
  toggleReaction: (postId: string, reaction: ReactionKind) => Promise<void>;
}

export const usePetStore = create<PetStore>((set, get) => ({
  isHydrated: false,
  isLoading: true,
  error: null,
  pets: [],
  posts: [],
  reactions: {},

  hydrate: async () => {
    const didReset = await consumeWebPreviewReset();
    if (!didReset && get().isHydrated) {
      return false;
    }
    await get().refresh();
    return didReset;
  },

  resetPreview: async () => {
    set({ error: null });
    await resetPetDatabase();
    await get().refresh();
  },

  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const snapshot = await getPetSnapshot();
      set({
        pets: snapshot.pets,
        posts: snapshot.posts,
        reactions: snapshot.reactions,
        isHydrated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'We could not open the pet collection. Please try again.',
      });
      throw error;
    }
  },

  saveProfile: async (input, petId) => {
    set({ error: null });
    const pet = await saveLocalPetProfile(input, petId);
    set((state) => ({
      pets: state.pets.some((item) => item.id === pet.id)
        ? state.pets.map((item) => (item.id === pet.id ? pet : item))
        : [...state.pets, pet],
    }));
    return pet;
  },

  addPost: async (input) => {
    set({ error: null });
    const post = await createLocalPetPost(input);
    set((state) => ({ posts: [post, ...state.posts] }));
    return post;
  },

  toggleReaction: async (postId, reaction) => {
    set({ error: null });
    const currentReaction = get().reactions[postId];
    const nextReaction = currentReaction === reaction ? null : reaction;
    await saveLocalReaction(postId, nextReaction);
    set((state) => {
      const reactions = { ...state.reactions };
      if (nextReaction) {
        reactions[postId] = nextReaction;
      } else {
        delete reactions[postId];
      }
      return { reactions };
    });
  },
}));
