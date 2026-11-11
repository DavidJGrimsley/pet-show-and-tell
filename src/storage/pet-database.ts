import * as SQLite from 'expo-sqlite';

import {
  INITIAL_SEEDED_PETS,
  INITIAL_SEEDED_POSTS,
  KNOWN_LEGACY_SEED_PET_IDS,
  KNOWN_LEGACY_SEED_POST_IDS,
} from '../data/pet-seed';
import type {
  Pet,
  PetPost,
  PetPostInput,
  PetProfileInput,
  PetSnapshot,
  ReactionKind,
} from '../types/pet';

const DATABASE_NAME = 'pet-show-and-tell.db';

interface PetRow extends Omit<Pet, 'isUserPet'> {
  isUserPet: number;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;
let initializationPromise: Promise<void> | undefined;

function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
}

export function createLocalId(prefix: string) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export async function initializePetDatabase() {
  initializationPromise ??= (async () => {
    const database = await getDatabase();
    await database.execAsync(
      [
        'PRAGMA foreign_keys = ON;',
        'CREATE TABLE IF NOT EXISTS pets (',
        '  id TEXT PRIMARY KEY NOT NULL,',
        '  name TEXT NOT NULL,',
        '  species TEXT NOT NULL,',
        '  photoUri TEXT NOT NULL,',
        '  description TEXT NOT NULL,',
        '  createdAt TEXT NOT NULL,',
        '  isUserPet INTEGER NOT NULL DEFAULT 0',
        ');',
        'CREATE TABLE IF NOT EXISTS posts (',
        '  id TEXT PRIMARY KEY NOT NULL,',
        '  petId TEXT NOT NULL,',
        '  photoUri TEXT NOT NULL,',
        '  description TEXT NOT NULL,',
        '  createdAt TEXT NOT NULL,',
        '  FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE',
        ');',
        'CREATE TABLE IF NOT EXISTS reactions (',
        '  postId TEXT PRIMARY KEY NOT NULL,',
        "  value TEXT NOT NULL CHECK (value IN ('like', 'love')),",
        '  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE',
        ');',
        'CREATE TABLE IF NOT EXISTS app_migrations (',
        '  id TEXT PRIMARY KEY NOT NULL',
        ');',
      ].join('\n')
    );

    await database.withTransactionAsync(async () => {
      const updateSeedCaptions = async () => {
        const done = await database.getFirstAsync<{ id: string }>(
          'SELECT id FROM app_migrations WHERE id = ?',
          'seed-captions-v1'
        );
        if (done) return;
        const oldCaptions: Record<string, string> = {
          'post-nora-1': 'Sweet princess dog that likes to sleep in and bake in the sun.',
          'post-mia-1': 'Little dog with a big personality.',
          'post-mrs-frizzle-1': 'Likes to dig.',
          'post-nala-1': 'Likes to climb.',
          'post-lil-mama-1': 'A wiggle worm that has a heart of gold.',
          'post-louie-1': 'Karuma as a dog but a cuddly bear at the same time.',
          'post-tippy-1': 'Crazy and sweet.',
        };
        for (const post of INITIAL_SEEDED_POSTS) {
          const oldCaption = oldCaptions[post.id];
          if (oldCaption) {
            await database.runAsync(
              'UPDATE posts SET description = ? WHERE id = ? AND photoUri = ? AND description = ?',
              post.caption,
              post.id,
              post.photoUri,
              oldCaption
            );
          }
        }
        await database.runAsync('INSERT INTO app_migrations (id) VALUES (?)', 'seed-captions-v1');
      };
      const applied = await database.getFirstAsync<{ id: string }>(
        'SELECT id FROM app_migrations WHERE id = ?',
        'personal-pets-v1'
      );
      if (applied) {
        const captionFixed = await database.getFirstAsync<{ id: string }>(
          'SELECT id FROM app_migrations WHERE id = ?',
          'louie-caption-v1'
        );
        if (!captionFixed) {
          await database.runAsync(
            'UPDATE posts SET description = ? WHERE id = ? AND description = ?',
            'Another moment with Louie.',
            'post-louie-2',
            'Full cuddly bear mode in his favorite cozy spot.'
          );
          await database.runAsync('INSERT INTO app_migrations (id) VALUES (?)', 'louie-caption-v1');
        }
        await updateSeedCaptions();
        return;
      }
      // 1. Remove legacy sample seeds idempotently, preserving user-created records and reactions
      for (const legacyPostId of KNOWN_LEGACY_SEED_POST_IDS) {
        await database.runAsync(
          'DELETE FROM posts WHERE id = ? AND NOT EXISTS ' +
            '(SELECT 1 FROM reactions WHERE reactions.postId = posts.id) ' +
            'AND EXISTS (SELECT 1 FROM pets WHERE pets.id = posts.petId AND pets.isUserPet = 0)',
          legacyPostId
        );
      }
      for (const legacyPetId of KNOWN_LEGACY_SEED_PET_IDS) {
        await database.runAsync(
          'DELETE FROM pets WHERE id = ? AND isUserPet = 0 ' +
            'AND NOT EXISTS (SELECT 1 FROM posts WHERE posts.petId = pets.id)',
          legacyPetId
        );
      }

      // 2. Reuse existing owned Louie profile if present, retain his posts, and apply supplied details/photo
      const existingLouie =
        (await database.getFirstAsync<PetRow>(
          "SELECT * FROM pets WHERE isUserPet = 1 AND LOWER(TRIM(name)) = 'louie' " +
            "ORDER BY CASE WHEN id = 'pet-local' THEN 0 ELSE 1 END, createdAt, id LIMIT 1"
        )) ?? undefined;

      const louieSeedPet = INITIAL_SEEDED_PETS.find((p) => p.name === 'Louie')!;
      let louiePetId = 'pet-louie';

      if (existingLouie) {
        louiePetId = existingLouie.id;
        await database.runAsync(
          'UPDATE pets SET name = ?, species = ?, photoUri = ?, description = ?, isUserPet = 1 WHERE id = ?',
          louieSeedPet.name,
          louieSeedPet.species,
          louieSeedPet.photoUri,
          louieSeedPet.personality,
          louiePetId
        );
      } else {
        const occupied = await database.getFirstAsync<{ id: string }>(
          'SELECT id FROM pets WHERE id = ?',
          louiePetId
        );
        if (occupied) louiePetId = createLocalId('pet');
        await database.runAsync(
          'INSERT OR IGNORE INTO pets (id, name, species, photoUri, description, createdAt, isUserPet) ' +
            'VALUES (?, ?, ?, ?, ?, ?, 1)',
          louiePetId,
          louieSeedPet.name,
          louieSeedPet.species,
          louieSeedPet.photoUri,
          louieSeedPet.personality,
          louieSeedPet.createdAt
        );
      }

      // Insert Louie's bundled posts (retaining any existing posts the user already had for Louie)
      const louiePosts = INITIAL_SEEDED_POSTS.filter((p) => p.petId === 'pet-louie');
      for (const post of louiePosts) {
        await database.runAsync(
          'INSERT OR IGNORE INTO posts (id, petId, photoUri, description, createdAt) ' +
            'VALUES (?, ?, ?, ?, ?)',
          post.id,
          louiePetId,
          post.photoUri,
          post.caption,
          post.createdAt
        );
      }

      // 3. Insert the other 6 owned pets
      for (const pet of INITIAL_SEEDED_PETS) {
        if (pet.name === 'Louie') {
          continue;
        }
        await database.runAsync(
          'INSERT OR IGNORE INTO pets (id, name, species, photoUri, description, createdAt, isUserPet) ' +
            'VALUES (?, ?, ?, ?, ?, ?, 1)',
          pet.id,
          pet.name,
          pet.species,
          pet.photoUri,
          pet.personality,
          pet.createdAt
        );
      }

      // 4. Insert the posts for the other pets
      for (const post of INITIAL_SEEDED_POSTS) {
        if (post.petId === 'pet-louie') {
          continue;
        }
        await database.runAsync(
          'INSERT OR IGNORE INTO posts (id, petId, photoUri, description, createdAt) ' +
            'VALUES (?, ?, ?, ?, ?)',
          post.id,
          post.petId,
          post.photoUri,
          post.caption,
          post.createdAt
        );
      }
      await database.runAsync('INSERT INTO app_migrations (id) VALUES (?)', 'personal-pets-v1');
      await database.runAsync('INSERT INTO app_migrations (id) VALUES (?)', 'louie-caption-v1');
      await updateSeedCaptions();
    });
  })();

  try {
    await initializationPromise;
  } catch (error) {
    initializationPromise = undefined;
    databasePromise = undefined;
    throw error;
  }
}

export async function getPetSnapshot(): Promise<PetSnapshot> {
  await initializePetDatabase();
  const database = await getDatabase();
  const pets = await database.getAllAsync<PetRow>(
    'SELECT id, name, species, photoUri, description AS personality, createdAt, isUserPet FROM pets'
  );
  const posts = await database.getAllAsync<PetPost>(
    'SELECT id, petId, photoUri, description AS caption, createdAt FROM posts ORDER BY createdAt DESC'
  );
  const reactionRows = await database.getAllAsync<{ postId: string; value: ReactionKind }>(
    'SELECT postId, value FROM reactions'
  );

  return {
    pets: pets.map((pet) => ({ ...pet, isUserPet: Boolean(pet.isUserPet) })),
    posts,
    reactions: Object.fromEntries(
      reactionRows.map((reaction) => [reaction.postId, reaction.value])
    ),
  };
}

export async function saveLocalPetProfile(input: PetProfileInput, petId?: string): Promise<Pet> {
  await initializePetDatabase();
  const database = await getDatabase();
  const createdAt = new Date().toISOString();

  if (petId) {
    const result = await database.runAsync(
      'UPDATE pets SET name = ?, species = ?, photoUri = ?, description = ? WHERE id = ? AND isUserPet = 1',
      input.name.trim(),
      input.species.trim(),
      input.photoUri,
      input.personality.trim(),
      petId
    );
    if (result.changes === 0) throw new Error('This pet profile could not be found.');
    const existing = await database.getFirstAsync<PetRow>(
      'SELECT id, name, species, photoUri, description AS personality, createdAt, isUserPet FROM pets WHERE id = ?',
      petId
    );
    if (existing) {
      return {
        ...existing,
        isUserPet: Boolean(existing.isUserPet),
      };
    }
    throw new Error('This pet profile could not be found.');
  }

  const id = createLocalId('pet-user');
  await database.runAsync(
    'INSERT INTO pets (id, name, species, photoUri, description, createdAt, isUserPet) ' +
      'VALUES (?, ?, ?, ?, ?, ?, 1)',
    id,
    input.name.trim(),
    input.species.trim(),
    input.photoUri,
    input.personality.trim(),
    createdAt
  );

  return {
    id,
    name: input.name.trim(),
    species: input.species.trim(),
    photoUri: input.photoUri,
    personality: input.personality.trim(),
    createdAt,
    isUserPet: true,
  };
}

export async function createLocalPetPost(input: PetPostInput): Promise<PetPost> {
  await initializePetDatabase();
  const database = await getDatabase();
  const post: PetPost = {
    id: createLocalId('post-local'),
    petId: input.petId,
    photoUri: input.photoUri,
    caption: input.caption.trim(),
    createdAt: new Date().toISOString(),
  };
  await database.runAsync(
    'INSERT INTO posts (id, petId, photoUri, description, createdAt) VALUES (?, ?, ?, ?, ?)',
    post.id,
    post.petId,
    post.photoUri,
    post.caption,
    post.createdAt
  );
  return post;
}

export async function saveLocalReaction(postId: string, reaction: ReactionKind | null) {
  await initializePetDatabase();
  const database = await getDatabase();
  if (!reaction) {
    await database.runAsync('DELETE FROM reactions WHERE postId = ?', postId);
    return;
  }

  await database.runAsync(
    'INSERT INTO reactions (postId, value) VALUES (?, ?) ' +
      'ON CONFLICT(postId) DO UPDATE SET value = excluded.value',
    postId,
    reaction
  );
}
