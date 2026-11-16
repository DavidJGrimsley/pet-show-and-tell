const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const databaseFile = path.join(root, 'src/storage/pet-database.web.ts');
const storeFile = path.join(root, 'src/features/pets/pet-store.ts');
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
  if (request === '../../storage/pet-database') {
    return originalLoad.call(this, databaseFile, parent, isMain);
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

function loadStore() {
  delete require.cache[storeFile];
  return require(storeFile);
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
  assert.deepEqual(snapshot.comments, []);
  assert.deepEqual(snapshot.commentReactions, {});

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

  // Comment validation, newest-first order, comment reaction toggles, and post-delete cascade
  await assert.rejects(api.createLocalPetComment({ postId: post.id, body: '' }));
  await assert.rejects(api.createLocalPetComment({ postId: post.id, body: '   ' }));
  await assert.rejects(api.createLocalPetComment({ postId: post.id, body: 'a'.repeat(181) }));
  await assert.rejects(api.createLocalPetComment({ postId: 'missing-post', body: 'Hello' }));
  const firstComment = await api.createLocalPetComment({
    postId: post.id,
    body: `  ${'m'.repeat(180)}  `,
  });
  assert.equal(firstComment.body, 'm'.repeat(180));
  const secondComment = await api.createLocalPetComment({
    postId: post.id,
    body: 'Newest comment',
  });
  await api.saveLocalCommentReaction(secondComment.id, 'like');
  snapshot = await api.getPetSnapshot();
  assert.deepEqual(
    snapshot.comments.filter((c) => c.postId === post.id).map((c) => c.id),
    [secondComment.id, firstComment.id]
  );
  assert.equal(snapshot.reactions[post.id], 'like');
  assert.equal(snapshot.commentReactions[secondComment.id], 'like');
  await api.saveLocalCommentReaction(secondComment.id, 'love');
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.commentReactions[secondComment.id], 'love');
  assert.equal(snapshot.reactions[post.id], 'like');
  await api.saveLocalCommentReaction(secondComment.id, null);
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.commentReactions[secondComment.id], undefined);
  assert.equal(snapshot.reactions[post.id], 'like');
  await api.saveLocalCommentReaction(secondComment.id, 'love');

  const noraComment = await api.createLocalPetComment({
    postId: 'post-nora-1',
    body: 'Comment on another post',
  });
  await api.saveLocalCommentReaction(noraComment.id, 'like');

  await api.deleteLocalPetPost(post.id);
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.posts.some((item) => item.id === post.id),
    false
  );
  assert.equal(snapshot.reactions[post.id], undefined);
  assert.equal(
    snapshot.comments.some((item) => item.postId === post.id),
    false
  );
  assert.equal(snapshot.commentReactions[secondComment.id], undefined);
  assert.ok(snapshot.comments.some((item) => item.id === noraComment.id));
  assert.equal(snapshot.commentReactions[noraComment.id], 'like');

  const keptPost = await api.createLocalPetPost({
    petId: pet.id,
    photoUri: pet.photoUri,
    caption: 'Biscuit found a sunbeam.',
  });
  const keptComment1 = await api.createLocalPetComment({
    postId: keptPost.id,
    body: 'Kept comment one',
  });
  const keptComment2 = await api.createLocalPetComment({
    postId: keptPost.id,
    body: 'Kept comment two',
  });
  await api.saveLocalReaction(keptPost.id, 'love');
  await api.saveLocalCommentReaction(keptComment2.id, 'like');

  api = loadDatabase();
  snapshot = await api.getPetSnapshot();
  assert.ok(snapshot.pets.some((item) => item.id === pet.id));
  assert.ok(snapshot.posts.some((item) => item.id === keptPost.id));
  assert.deepEqual(
    snapshot.comments.filter((c) => c.postId === keptPost.id).map((c) => c.id),
    [keptComment2.id, keptComment1.id]
  );
  assert.equal(snapshot.reactions[keptPost.id], 'love');
  assert.equal(snapshot.commentReactions[keptComment2.id], 'like');

  await api.resetPetDatabase();
  snapshot = await api.getPetSnapshot();
  assert.deepEqual(ids(snapshot.pets), seedPetIds);
  assert.deepEqual(ids(snapshot.posts), seedPostIds);
  assert.deepEqual(snapshot.comments, []);
  assert.deepEqual(snapshot.commentReactions, {});
  assert.equal(
    snapshot.pets.some((item) => item.id === pet.id),
    false
  );

  // One-time v1 -> v2 import preserving pets/posts/reactions, adding empty comments,
  // never writing/deleting v1, never letting v1 overwrite v2, and preserving reset.
  const v1Writes = [];
  const rawBacking = new Map();
  const trackedBacking = installSessionStorage({
    getItem(key) {
      return rawBacking.has(key) ? rawBacking.get(key) : null;
    },
    setItem(key, value) {
      if (key === 'pet-show-and-tell.preview.v1') {
        v1Writes.push(['set', key]);
      }
      rawBacking.set(key, String(value));
    },
    removeItem(key) {
      if (key === 'pet-show-and-tell.preview.v1') {
        v1Writes.push(['remove', key]);
      }
      rawBacking.delete(key);
    },
  });
  void trackedBacking;
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
  const initialV1Json = JSON.stringify(preChangeSnapshot);
  rawBacking.set('pet-show-and-tell.preview.v1', initialV1Json);

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
  assert.deepEqual(snapshot.comments, []);
  assert.deepEqual(snapshot.commentReactions, {});
  assert.ok(rawBacking.has('pet-show-and-tell.preview.v2'));
  assert.equal(rawBacking.get('pet-show-and-tell.preview.v1'), initialV1Json);
  assert.deepEqual(v1Writes, []);

  // Mutate v2, externally alter v1, and confirm v1 never overwrites v2.
  const v2Comment = await api.createLocalPetComment({
    postId: 'post-local-custom',
    body: 'Imported post comment',
  });
  await api.saveLocalCommentReaction(v2Comment.id, 'like');
  const alteredV1 = {
    ...preChangeSnapshot,
    pets: [
      ...preChangeSnapshot.pets,
      {
        id: 'pet-v1-later',
        name: 'RogueV1',
        species: 'Cat',
        photoUri: 'asset:Tippy.jpeg',
        personality: 'Should not overwrite v2',
        createdAt: '2026-11-08T10:00:00.000Z',
        isUserPet: true,
      },
    ],
  };
  rawBacking.set('pet-show-and-tell.preview.v1', JSON.stringify(alteredV1));
  api = loadDatabase();
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.pets.some((item) => item.id === 'pet-v1-later'),
    false
  );
  assert.ok(snapshot.comments.some((item) => item.id === v2Comment.id));
  assert.equal(snapshot.commentReactions[v2Comment.id], 'like');
  assert.equal(snapshot.reactions['post-local-custom'], 'love');
  assert.deepEqual(v1Writes, []);

  // Resetting v2 stays reset across reload even though v1 still exists, and never writes v1.
  await api.resetPetDatabase();
  api = loadDatabase();
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.pets.some((item) => item.id === 'pet-user-custom'),
    false
  );
  assert.deepEqual(snapshot.comments, []);
  assert.deepEqual(snapshot.commentReactions, {});
  assert.deepEqual(snapshot.reactions, {});
  assert.deepEqual(v1Writes, []);

  // Verify Zustand store actions, comment reaction toggles, cascade on deletePost, and resetPreview.
  installSessionStorage();
  api = loadDatabase();
  const { usePetStore } = loadStore();
  await usePetStore.getState().hydrate();
  assert.deepEqual(usePetStore.getState().comments, []);
  assert.deepEqual(usePetStore.getState().commentReactions, {});

  const storePet = await usePetStore.getState().saveProfile({
    name: 'Zustand Pup',
    species: 'Dog',
    photoUri: 'asset:Louie.jpeg',
    personality: 'State-driven.',
  });
  const storePost = await usePetStore.getState().addPost({
    petId: storePet.id,
    photoUri: 'asset:Louie.jpeg',
    caption: 'Store post',
  });
  await usePetStore.getState().toggleReaction(storePost.id, 'love');
  const storeComment1 = await usePetStore.getState().addComment({
    postId: storePost.id,
    body: 'First store comment',
  });
  const storeComment2 = await usePetStore.getState().addComment({
    postId: storePost.id,
    body: 'Second store comment',
  });
  assert.deepEqual(
    usePetStore
      .getState()
      .comments.filter((c) => c.postId === storePost.id)
      .map((c) => c.id),
    [storeComment2.id, storeComment1.id]
  );
  await usePetStore.getState().toggleCommentReaction(storeComment2.id, 'like');
  assert.equal(usePetStore.getState().commentReactions[storeComment2.id], 'like');
  assert.equal(usePetStore.getState().reactions[storePost.id], 'love');
  await usePetStore.getState().toggleCommentReaction(storeComment2.id, 'love');
  assert.equal(usePetStore.getState().commentReactions[storeComment2.id], 'love');
  assert.equal(usePetStore.getState().reactions[storePost.id], 'love');
  await usePetStore.getState().toggleCommentReaction(storeComment2.id, 'love');
  assert.equal(usePetStore.getState().commentReactions[storeComment2.id], undefined);
  assert.equal(usePetStore.getState().reactions[storePost.id], 'love');
  await usePetStore.getState().toggleCommentReaction(storeComment2.id, 'like');

  await usePetStore.getState().deletePost(storePost.id);
  assert.equal(
    usePetStore.getState().posts.some((p) => p.id === storePost.id),
    false
  );
  assert.equal(
    usePetStore.getState().comments.some((c) => c.postId === storePost.id),
    false
  );
  assert.equal(usePetStore.getState().commentReactions[storeComment2.id], undefined);
  assert.equal(usePetStore.getState().reactions[storePost.id], undefined);

  const resetComment = await usePetStore.getState().addComment({
    postId: 'post-nora-1',
    body: 'Before reset',
  });
  await usePetStore.getState().toggleCommentReaction(resetComment.id, 'love');
  await usePetStore.getState().resetPreview();
  assert.deepEqual(usePetStore.getState().comments, []);
  assert.deepEqual(usePetStore.getState().commentReactions, {});

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
