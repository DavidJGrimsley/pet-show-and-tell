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

const NON_USER_SEEDED_PET_IDS = new Set(['pet-mia', 'pet-tippy']);

const LEGACY_SEED_CAPTIONS: Record<string, Set<string>> = {
  'post-nora-1': new Set([
    'Sweet princess dog that likes to sleep in and bake in the sun.',
    'A cozy moment with Nora.',
  ]),
  'post-mia-1': new Set(['Little dog with a big personality.', 'A little moment with Mia.']),
  'post-mrs-frizzle-1': new Set(['Likes to dig.', 'Meet Mrs Frizzle.']),
  'post-nala-1': new Set(['Likes to climb.', 'Meet Nala.']),
  'post-lil-mama-1': new Set([
    'A wiggle worm that has a heart of gold.',
    "A moment with Lil' Mama.",
  ]),
  'post-lil-mama-2': new Set(['Happy wiggles and sunny smiles.', 'Right before she ran away']),
  'post-louie-1': new Set([
    'Karuma as a dog but a cuddly bear at the same time.',
    'A moment with Louie.',
  ]),
  'post-louie-2': new Set(['Full cuddly bear mode in his favorite cozy spot.']),
  'post-tippy-1': new Set(['Crazy and sweet.']),
};

const SEEDED_CAPTION_BY_ID = new Map(INITIAL_SEEDED_POSTS.map((post) => [post.id, post.caption]));

function migrateSessionState(loaded: MemoryState): { next: MemoryState; changed: boolean } {
  let changed = false;

  const pets = loaded.pets.map((pet) => {
    let nextPet = pet;
    if (NON_USER_SEEDED_PET_IDS.has(pet.id) && pet.isUserPet) {
      nextPet = { ...nextPet, isUserPet: false };
      changed = true;
    }
    if (pet.id === 'pet-mrs-frizzle' && pet.photoUri === 'asset:Mrs Frizzle.jpeg') {
      nextPet = { ...nextPet, photoUri: 'asset:Mrs Frizzle.jpg' };
      changed = true;
    }
    return nextPet;
  });

  const posts = loaded.posts.map((post) => {
    let nextPost = post;
    if (post.id === 'post-mrs-frizzle-1' && post.photoUri === 'asset:Mrs Frizzle.jpeg') {
      nextPost = { ...nextPost, photoUri: 'asset:Mrs Frizzle.jpg' };
      changed = true;
    }
    const oldCaptions = LEGACY_SEED_CAPTIONS[post.id];
    const targetCaption = SEEDED_CAPTION_BY_ID.get(post.id);
    if (
      oldCaptions &&
      targetCaption &&
      oldCaptions.has(post.caption) &&
      post.caption !== targetCaption
    ) {
      nextPost = { ...nextPost, caption: targetCaption };
      changed = true;
    }
    return nextPost;
  });

  return {
    next: {
      pets,
      posts,
      reactions: loaded.reactions,
    },
    changed,
  };
}

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
  const stored = readSession();
  if (!stored) {
    state = cloneSeed();
    return;
  }
  const { next, changed } = migrateSessionState(stored);
  state = next;
  if (changed) {
    writeSession(state);
  }
}

export async function getPetSnapshot(): Promise<PetSnapshot> {
  await initializePetDatabase();
  return snapshotOf(state as MemoryState);
}

export async function saveLocalPetProfile(input: PetProfileInput, petId?: string): Promise<Pet> {
  await initializePetDatabase();
  const current = state as MemoryState;
  const trimmedPhotoUri = input.photoUri.trim();

  if (petId) {
    const index = current.pets.findIndex((pet) => pet.id === petId && pet.isUserPet);
    if (index < 0) {
      throw new Error('This pet profile could not be found.');
    }
    const updated: Pet = {
      ...current.pets[index],
      name: input.name.trim(),
      species: input.species.trim(),
      photoUri: trimmedPhotoUri || current.pets[index].photoUri,
      personality: input.personality.trim(),
    };
    current.pets[index] = updated;
    writeSession(current);
    return { ...updated };
  }

  if (!trimmedPhotoUri) {
    throw new Error('A profile photo is required.');
  }

  const pet: Pet = {
    id: createLocalId('pet-user'),
    name: input.name.trim(),
    species: input.species.trim(),
    photoUri: trimmedPhotoUri,
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

export async function deleteLocalPetPost(postId: string): Promise<void> {
  await initializePetDatabase();
  const current = state as MemoryState;
  const post = current.posts.find((item) => item.id === postId);
  if (!post) {
    throw new Error('This moment could not be deleted.');
  }
  const pet = current.pets.find((item) => item.id === post.petId && item.isUserPet);
  if (!pet) {
    throw new Error('This moment could not be deleted.');
  }
  current.posts = current.posts.filter((item) => item.id !== postId);
  delete current.reactions[postId];
  writeSession(current);
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
