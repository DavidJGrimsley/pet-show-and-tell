import type { Pet, PetPost } from '../types/pet';

export const KNOWN_LEGACY_SEED_PET_IDS = [
  'pet-milo',
  'pet-luna',
  'pet-pip',
  'pet-daisy',
  'pet-maple',
  'pet-oliver',
];

export const KNOWN_LEGACY_SEED_POST_IDS = [
  'post-milo-trail',
  'post-milo-stick',
  'post-luna-window',
  'post-luna-box',
  'post-pip-song',
  'post-daisy-garden',
  'post-maple-walk',
  'post-oliver-bookcase',
];

export const INITIAL_SEEDED_PETS: Pet[] = [
  {
    id: 'pet-nora',
    name: 'Nora',
    species: 'Dog',
    photoUri: 'asset:Nora.jpeg',
    personality: 'Sweet princess dog that likes to sleep in and bake in the sun.',
    createdAt: '2026-11-01T09:00:00.000Z',
    isUserPet: true,
  },
  {
    id: 'pet-mia',
    name: 'Mia',
    species: 'Dog',
    photoUri: 'asset:Mia.jpeg',
    personality: 'Little dog with a big personality.',
    createdAt: '2026-11-01T10:00:00.000Z',
    isUserPet: true,
  },
  {
    id: 'pet-mrs-frizzle',
    name: 'Mrs Frizzle',
    species: 'Snake',
    photoUri: 'asset:Mrs Frizzle.jpeg',
    personality: 'Likes to dig.',
    createdAt: '2026-11-01T11:00:00.000Z',
    isUserPet: true,
  },
  {
    id: 'pet-nala',
    name: 'Nala',
    species: 'Snake',
    photoUri: 'asset:Nala.jpeg',
    personality: 'Likes to climb.',
    createdAt: '2026-11-01T12:00:00.000Z',
    isUserPet: true,
  },
  {
    id: 'pet-lil-mama',
    name: "Lil' Mama",
    species: 'Dog',
    photoUri: 'asset:LilMama.jpeg',
    personality: 'A wiggle worm that has a heart of gold.',
    createdAt: '2026-11-01T13:00:00.000Z',
    isUserPet: true,
  },
  {
    id: 'pet-louie',
    name: 'Louie',
    species: 'Dog',
    photoUri: 'asset:Louie.jpeg',
    personality: 'Karuma as a dog but a cuddly bear at the same time.',
    createdAt: '2026-11-01T14:00:00.000Z',
    isUserPet: true,
  },
  {
    id: 'pet-tippy',
    name: 'Tippy',
    species: 'Cat',
    photoUri: 'asset:Tippy.jpeg',
    personality: 'Crazy and sweet.',
    createdAt: '2026-11-01T15:00:00.000Z',
    isUserPet: true,
  },
];

export const INITIAL_SEEDED_POSTS: PetPost[] = [
  {
    id: 'post-nora-1',
    petId: 'pet-nora',
    photoUri: 'asset:Nora.jpeg',
    caption: 'A cozy moment with Nora.',
    createdAt: '2026-11-06T11:00:00.000Z',
  },
  {
    id: 'post-mia-1',
    petId: 'pet-mia',
    photoUri: 'asset:Mia.jpeg',
    caption: 'A little moment with Mia.',
    createdAt: '2026-11-06T12:30:00.000Z',
  },
  {
    id: 'post-mrs-frizzle-1',
    petId: 'pet-mrs-frizzle',
    photoUri: 'asset:Mrs Frizzle.jpeg',
    caption: 'Meet Mrs Frizzle.',
    createdAt: '2026-11-05T13:15:00.000Z',
  },
  {
    id: 'post-nala-1',
    petId: 'pet-nala',
    photoUri: 'asset:Nala.jpeg',
    caption: 'Meet Nala.',
    createdAt: '2026-11-05T14:45:00.000Z',
  },
  {
    id: 'post-lil-mama-1',
    petId: 'pet-lil-mama',
    photoUri: 'asset:LilMama.jpeg',
    caption: "A moment with Lil' Mama.",
    createdAt: '2026-11-06T15:20:00.000Z',
  },
  {
    id: 'post-lil-mama-2',
    petId: 'pet-lil-mama',
    photoUri: 'asset:LilMama2.jpeg',
    caption: 'Happy wiggles and sunny smiles.',
    createdAt: '2026-11-04T10:05:00.000Z',
  },
  {
    id: 'post-louie-1',
    petId: 'pet-louie',
    photoUri: 'asset:Louie.jpeg',
    caption: 'A moment with Louie.',
    createdAt: '2026-11-06T16:10:00.000Z',
  },
  {
    id: 'post-louie-2',
    petId: 'pet-louie',
    photoUri: 'asset:Louie2.jpeg',
    caption: 'Another moment with Louie.',
    createdAt: '2026-11-04T16:40:00.000Z',
  },
  {
    id: 'post-tippy-1',
    petId: 'pet-tippy',
    photoUri: 'asset:Tippy.jpeg',
    caption: 'A moment with Tippy.',
    createdAt: '2026-11-05T17:00:00.000Z',
  },
];

// Backwards-compatible aliases
export const seededPets = INITIAL_SEEDED_PETS;
export const seededPosts = INITIAL_SEEDED_POSTS;
