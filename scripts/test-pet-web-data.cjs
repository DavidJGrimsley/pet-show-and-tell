const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const databaseFile = path.join(root, 'src/storage/pet-database.web.ts');
const originalLoad = Module._load;

require.extensions['.ts'] = (mod, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  mod._compile(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    filename
  );
};

Module._load = function (request, parent, isMain) {
  if (request === 'expo-sqlite' || request === 'expo-file-system') {
    throw new Error(`The web data test loaded ${request}.`);
  }
  return originalLoad.call(this, request, parent, isMain);
};

function installSessionStorage(methods = {}) {
  const backing = new Map();
  const storage = {
    getItem(key) {
      if (methods.getItem) {
        return methods.getItem(key);
      }
      return backing.has(key) ? backing.get(key) : null;
    },
    setItem(key, value) {
      if (methods.setItem) {
        methods.setItem(key, value);
        return;
      }
      backing.set(key, String(value));
    },
    removeItem(key) {
      if (methods.removeItem) {
        methods.removeItem(key);
        return;
      }
      backing.delete(key);
    },
  };
  globalThis.sessionStorage = storage;
  return backing;
}

function loadDatabase() {
  delete require.cache[databaseFile];
  return require(databaseFile);
}

function ids(items) {
  return items.map((item) => item.id).sort();
}

async function main() {
  const seed = require(path.join(root, 'src/data/pet-seed.ts'));
  const seedPetIds = ids(seed.INITIAL_SEEDED_PETS);
  const seedPostIds = ids(seed.INITIAL_SEEDED_POSTS);
  assert.ok(seedPetIds.length >= 6);
  assert.ok(seedPostIds.length >= 8);

  installSessionStorage();
  let api = loadDatabase();
  let snapshot = await api.getPetSnapshot();
  assert.deepEqual(ids(snapshot.pets), seedPetIds);
  assert.deepEqual(ids(snapshot.posts), seedPostIds);
  assert.deepEqual(snapshot.reactions, {});

  const pet = await api.saveLocalPetProfile({
    name: 'Biscuit',
    species: 'Dog',
    photoUri: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    personality: 'Soft ears.',
  });
  const post = await api.createLocalPetPost({
    petId: pet.id,
    photoUri: pet.photoUri,
    caption: 'Biscuit found a sunbeam.',
  });
  snapshot = await api.getPetSnapshot();
  assert.ok(snapshot.pets.some((item) => item.id === pet.id && item.name === 'Biscuit'));
  assert.ok(snapshot.posts.some((item) => item.id === post.id && item.caption === post.caption));

  await assert.rejects(
    api.saveLocalPetProfile({
      name: 'No Photo',
      species: 'Dog',
      photoUri: '',
      personality: 'Missing photo',
    })
  );
  await assert.rejects(api.deleteLocalPetPost('post-mia-1'));
  await api.saveLocalReaction(post.id, 'like');
  await api.deleteLocalPetPost(post.id);
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.posts.some((item) => item.id === post.id),
    false
  );
  assert.equal(snapshot.reactions[post.id], undefined);
  const keptPost = await api.createLocalPetPost({
    petId: pet.id,
    photoUri: pet.photoUri,
    caption: 'Biscuit found a sunbeam.',
  });

  api = loadDatabase();
  snapshot = await api.getPetSnapshot();
  assert.ok(snapshot.pets.some((item) => item.id === pet.id));
  assert.ok(snapshot.posts.some((item) => item.id === keptPost.id));

  await api.resetPetDatabase();
  snapshot = await api.getPetSnapshot();
  assert.deepEqual(ids(snapshot.pets), seedPetIds);
  assert.deepEqual(ids(snapshot.posts), seedPostIds);
  assert.equal(
    snapshot.pets.some((item) => item.id === pet.id),
    false
  );

  // Migrate a persisted pre-change sessionStorage snapshot while preserving custom user data.
  const preChangeBacking = installSessionStorage();
  const preChangeSnapshot = {
    pets: [
      ...seed.INITIAL_SEEDED_PETS.map((item) => {
        if (item.id === 'pet-mia' || item.id === 'pet-tippy') {
          return { ...item, isUserPet: true };
        }
        if (item.id === 'pet-mrs-frizzle') {
          return { ...item, photoUri: 'asset:Mrs Frizzle.jpeg' };
        }
        return { ...item };
      }),
      {
        id: 'pet-user-custom',
        name: 'Maple',
        species: 'Cat',
        photoUri: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        personality: 'Loves boxes.',
        createdAt: '2026-11-07T10:00:00.000Z',
        isUserPet: true,
      },
    ],
    posts: [
      ...seed.INITIAL_SEEDED_POSTS.map((item) => {
        if (item.id === 'post-nora-1') {
          return { ...item, caption: 'A cozy moment with Nora.' };
        }
        if (item.id === 'post-mia-1') {
          return { ...item, caption: 'User edited Mia caption' };
        }
        if (item.id === 'post-mrs-frizzle-1') {
          return {
            ...item,
            photoUri: 'asset:Mrs Frizzle.jpeg',
            caption: 'Meet Mrs Frizzle.',
          };
        }
        if (item.id === 'post-lil-mama-2') {
          return { ...item, caption: 'Right before she ran away' };
        }
        if (item.id === 'post-louie-1') {
          return { ...item, photoUri: 'data:image/custom-louie', caption: 'A moment with Louie.' };
        }
        return { ...item };
      }),
      {
        id: 'post-local-custom',
        petId: 'pet-user-custom',
        photoUri: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        caption: 'Maple in a shoebox.',
        createdAt: '2026-11-07T11:00:00.000Z',
      },
    ],
    reactions: {
      'post-local-custom': 'love',
    },
  };
  preChangeBacking.set('pet-show-and-tell.preview.v1', JSON.stringify(preChangeSnapshot));

  api = loadDatabase();
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.pets.find((item) => item.id === 'pet-mia').isUserPet, false);
  assert.equal(snapshot.pets.find((item) => item.id === 'pet-tippy').isUserPet, false);
  assert.equal(
    snapshot.pets.find((item) => item.id === 'pet-mrs-frizzle').photoUri,
    'asset:Mrs Frizzle.jpg'
  );
  assert.equal(
    snapshot.posts.find((item) => item.id === 'post-mrs-frizzle-1').photoUri,
    'asset:Mrs Frizzle.jpg'
  );
  assert.equal(
    snapshot.posts.find((item) => item.id === 'post-mrs-frizzle-1').caption,
    'Coming right at ya.'
  );
  assert.equal(
    snapshot.posts.find((item) => item.id === 'post-nora-1').caption,
    'What a cozy girl.'
  );
  assert.equal(
    snapshot.posts.find((item) => item.id === 'post-mia-1').caption,
    'User edited Mia caption'
  );
  assert.equal(
    snapshot.posts.find((item) => item.id === 'post-lil-mama-2').caption,
    'Right before she ran away.'
  );
  assert.equal(
    snapshot.posts.find((item) => item.id === 'post-louie-1').photoUri,
    'data:image/custom-louie'
  );
  assert.equal(
    snapshot.posts.find((item) => item.id === 'post-louie-1').caption,
    'My what a big mouth you have, Grandma.'
  );
  assert.ok(snapshot.pets.some((item) => item.id === 'pet-user-custom' && item.name === 'Maple'));
  assert.ok(snapshot.posts.some((item) => item.id === 'post-local-custom'));
  assert.equal(snapshot.reactions['post-local-custom'], 'love');

  installSessionStorage({
    getItem() {
      throw new Error('sessionStorage is blocked');
    },
    setItem() {
      throw new Error('sessionStorage is blocked');
    },
    removeItem() {
      throw new Error('sessionStorage is blocked');
    },
  });
  api = loadDatabase();
  snapshot = await api.getPetSnapshot();
  assert.deepEqual(ids(snapshot.pets), seedPetIds);
  const blockedPet = await api.saveLocalPetProfile({
    name: 'Pebble',
    species: 'Cat',
    photoUri: 'asset:Tippy.jpeg',
    personality: 'Quiet.',
  });
  const blockedPost = await api.createLocalPetPost({
    petId: blockedPet.id,
    photoUri: 'asset:Tippy.jpeg',
    caption: 'Pebble stayed in memory.',
  });
  snapshot = await api.getPetSnapshot();
  assert.ok(snapshot.pets.some((item) => item.id === blockedPet.id));
  assert.ok(snapshot.posts.some((item) => item.id === blockedPost.id));
  await api.resetPetDatabase();
  snapshot = await api.getPetSnapshot();
  assert.deepEqual(ids(snapshot.pets), seedPetIds);
  assert.equal(
    snapshot.posts.some((item) => item.id === blockedPost.id),
    false
  );

  api = loadDatabase();
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.pets.some((item) => item.name === 'Pebble'),
    false
  );
  assert.deepEqual(ids(snapshot.pets), seedPetIds);

  console.log('web pet data: seed, create, reset, and storage fallback passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
