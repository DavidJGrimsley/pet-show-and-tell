import { INITIAL_SEEDED_PETS, INITIAL_SEEDED_POSTS } from '../data/pet-seed';
import type {
  Pet,
  PetPost,
  PetPostInput,
  PetProfileInput,
  PetSnapshot,
  ReactionKind,
} from '../types/pet';

const SESSION_KEY = 'pet-show-and-tell.preview.v1';

interface MemoryState {
  pets: Pet[];
  posts: PetPost[];
  reactions: Record<string, ReactionKind>;
}

let state: MemoryState | undefined;

function cloneSeed(): MemoryState {
  return {
    pets: INITIAL_SEEDED_PETS.map((pet) => ({ ...pet })),
    posts: INITIAL_SEEDED_POSTS.map((post) => ({ ...post })),
    reactions: {},
  };
}

function isReaction(value: unknown): value is ReactionKind {
  return value === 'like' || value === 'love';
}

function readSession(): MemoryState | undefined {
  try {
    if (typeof sessionStorage === 'undefined') {
      return undefined;
    }
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as Partial<MemoryState>;
    if (!parsed || !Array.isArray(parsed.pets) || !Array.isArray(parsed.posts)) {
      return undefined;
    }
    const reactions: Record<string, ReactionKind> = {};
    if (parsed.reactions && typeof parsed.reactions === 'object') {
      for (const [postId, value] of Object.entries(parsed.reactions)) {
        if (isReaction(value)) {
          reactions[postId] = value;
        }
      }
    }
    return {
      pets: parsed.pets.map((pet) => ({ ...pet })),
      posts: parsed.posts.map((post) => ({ ...post })),
      reactions,
    };
  } catch {
    return undefined;
  }
}

function clearSession() {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // The tab keeps the in-memory snapshot when storage is blocked.
  }
}

function writeSession(next: MemoryState) {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    clearSession();
  }
}

function snapshotOf(next: MemoryState): PetSnapshot {
  return {
    pets: next.pets.map((pet) => ({ ...pet })),
    posts: next.posts
      .map((post) => ({ ...post }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    reactions: { ...next.reactions },
  };
}

function locationRequestsReset() {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    return new URLSearchParams(window.location.search).get('reset') === '1';
  } catch {
    return false;
  }
}

export function createLocalId(prefix: string) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export async function initializePetDatabase() {
  if (state) {
    return;
  }
  if (locationRequestsReset()) {
    clearSession();
    state = cloneSeed();
    return;
  }
  state = readSession() ?? cloneSeed();
}

export async function getPetSnapshot(): Promise<PetSnapshot> {
  await initializePetDatabase();
  return snapshotOf(state as MemoryState);
}

export async function saveLocalPetProfile(input: PetProfileInput, petId?: string): Promise<Pet> {
  await initializePetDatabase();
  const current = state as MemoryState;

  if (petId) {
    const index = current.pets.findIndex((pet) => pet.id === petId && pet.isUserPet);
    if (index < 0) {
      throw new Error('This pet profile could not be found.');
    }
    const updated: Pet = {
      ...current.pets[index],
      name: input.name.trim(),
      species: input.species.trim(),
      photoUri: input.photoUri,
      personality: input.personality.trim(),
    };
    current.pets[index] = updated;
    writeSession(current);
    return { ...updated };
  }

  const pet: Pet = {
    id: createLocalId('pet-user'),
    name: input.name.trim(),
    species: input.species.trim(),
    photoUri: input.photoUri,
    personality: input.personality.trim(),
    createdAt: new Date().toISOString(),
    isUserPet: true,
  };
  current.pets.push(pet);
  writeSession(current);
  return { ...pet };
}

export async function createLocalPetPost(input: PetPostInput): Promise<PetPost> {
  await initializePetDatabase();
  const current = state as MemoryState;
  const post: PetPost = {
    id: createLocalId('post-local'),
    petId: input.petId,
    photoUri: input.photoUri,
    caption: input.caption.trim(),
    createdAt: new Date().toISOString(),
  };
  current.posts.push(post);
  writeSession(current);
  return { ...post };
}

export async function saveLocalReaction(postId: string, reaction: ReactionKind | null) {
  await initializePetDatabase();
  const current = state as MemoryState;
  if (!reaction) {
    delete current.reactions[postId];
  } else {
    current.reactions[postId] = reaction;
  }
  writeSession(current);
}

export async function resetPetDatabase() {
  clearSession();
  state = cloneSeed();
}

export async function consumeWebPreviewReset() {
  if (!locationRequestsReset()) {
    return false;
  }
  await resetPetDatabase();
  return true;
}
