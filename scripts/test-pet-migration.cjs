const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const originalLoad = Module._load;
const originalTs = require.extensions['.ts'];
let db;
require.extensions['.ts'] = (mod, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  mod._compile(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    filename
  );
};
Module._load = function (request, parent, isMain) {
  if (request === 'expo-sqlite') return { openDatabaseAsync: async () => db };
  return originalLoad.call(this, request, parent, isMain);
};
function newDb() {
  const raw = new DatabaseSync(':memory:');
  return {
    raw,
    execAsync: async (sql) => raw.exec(sql),
    runAsync: async (sql, ...args) => raw.prepare(sql).run(...args),
    getFirstAsync: async (sql, ...args) => raw.prepare(sql).get(...args) ?? null,
    getAllAsync: async (sql, ...args) => raw.prepare(sql).all(...args),
    withTransactionAsync: async (fn) => {
      raw.exec('BEGIN');
      try {
        await fn();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
function loadDatabaseModule() {
  const filename = path.join(root, 'src/storage/pet-database.ts');
  delete require.cache[filename];
  return require(filename);
}
async function main() {
  db = newDb();
  let api = loadDatabaseModule();
  let snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.pets.length, 7);
  assert.equal(snapshot.posts.length, 9);
  assert.deepEqual(snapshot.comments, []);
  assert.deepEqual(snapshot.commentReactions, {});
  const schemaEntries = db.raw
    .prepare(
      "SELECT type, name FROM sqlite_master WHERE name IN ('comments', 'comment_reactions', 'idx_comments_postId_createdAt')"
    )
    .all();
  assert.equal(schemaEntries.length, 3);
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-nora-1').caption,
    'What a cozy girl.'
  );
  assert.equal(snapshot.posts.find((post) => post.id === 'post-mia-1').caption, 'Is that a smile?');
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-mrs-frizzle-1').caption,
    'Coming right at ya.'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-nala-1').caption,
    'Beware of the beauty.'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-lil-mama-1').caption,
    'Always wanting belly rubs'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-lil-mama-2').caption,
    'Right before she ran away.'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-louie-1').caption,
    'My what a big mouth you have, Grandma.'
  );
  assert.equal(
    snapshot.pets.find((pet) => pet.id === 'pet-mrs-frizzle').photoUri,
    'asset:Mrs Frizzle.jpg'
  );
  assert.equal(snapshot.pets.find((pet) => pet.id === 'pet-mia').isUserPet, false);
  assert.equal(snapshot.pets.find((pet) => pet.id === 'pet-tippy').isUserPet, false);
  assert.equal(snapshot.pets.find((pet) => pet.id === 'pet-louie').isUserPet, true);

  await assert.rejects(
    api.saveLocalPetProfile({
      name: 'No Photo',
      species: 'Dog',
      photoUri: '   ',
      personality: 'Missing photo',
    })
  );
  const addedPet = await api.saveLocalPetProfile({
    name: 'Test pet',
    species: 'Dog',
    photoUri: 'file:test',
    personality: 'Test',
  });
  const editedKeepPhoto = await api.saveLocalPetProfile(
    {
      name: 'Test pet',
      species: 'Dog',
      photoUri: '',
      personality: 'Updated',
    },
    addedPet.id
  );
  assert.equal(editedKeepPhoto.photoUri, 'file:test');
  const addedPost = await api.createLocalPetPost({
    petId: addedPet.id,
    photoUri: 'file:post',
    caption: 'Test post',
  });
  assert.equal(
    (await api.getPetSnapshot()).posts.find((post) => post.id === addedPost.id).petId,
    addedPet.id
  );
  await assert.rejects(api.deleteLocalPetPost('post-mia-1'));
  await api.saveLocalReaction(addedPost.id, 'love');

  // Comment validation, creation, ordering, per-comment reactions, and cascade delete on post delete
  await assert.rejects(api.createLocalPetComment({ postId: addedPost.id, body: '' }));
  await assert.rejects(api.createLocalPetComment({ postId: addedPost.id, body: '   \n\t  ' }));
  await assert.rejects(api.createLocalPetComment({ postId: addedPost.id, body: 'a'.repeat(181) }));
  await assert.rejects(api.createLocalPetComment({ postId: 'missing-post', body: 'Hello' }));
  assert.throws(() => {
    db.raw
      .prepare(
        "INSERT INTO comments (id, postId, body, createdAt) VALUES ('bad-empty', ?, '   ', '2026-11-16T12:00:00.000Z')"
      )
      .run(addedPost.id);
  });
  assert.throws(() => {
    db.raw
      .prepare(
        "INSERT INTO comments (id, postId, body, createdAt) VALUES ('bad-long', ?, ?, '2026-11-16T12:00:00.000Z')"
      )
      .run(addedPost.id, 'b'.repeat(181));
  });

  const maxComment = await api.createLocalPetComment({
    postId: addedPost.id,
    body: `  ${'x'.repeat(180)}  `,
  });
  assert.equal(maxComment.body, 'x'.repeat(180));
  const secondComment = await api.createLocalPetComment({
    postId: addedPost.id,
    body: 'Second comment newest',
  });
  await api.saveLocalCommentReaction(secondComment.id, 'like');
  assert.throws(() => {
    db.raw
      .prepare("INSERT INTO comment_reactions (commentId, value) VALUES (?, 'wow')")
      .run(secondComment.id);
  });
  snapshot = await api.getPetSnapshot();
  const addedPostComments = snapshot.comments.filter((c) => c.postId === addedPost.id);
  assert.equal(addedPostComments.length, 2);
  assert.equal(addedPostComments[0].id, secondComment.id);
  assert.equal(addedPostComments[1].id, maxComment.id);
  assert.equal(snapshot.reactions[addedPost.id], 'love');
  assert.equal(snapshot.commentReactions[secondComment.id], 'like');

  // Toggle comment reaction (like -> love -> clear) while preserving post reaction
  await api.saveLocalCommentReaction(secondComment.id, 'love');
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.commentReactions[secondComment.id], 'love');
  assert.equal(snapshot.reactions[addedPost.id], 'love');
  await api.saveLocalCommentReaction(secondComment.id, null);
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.commentReactions[secondComment.id], undefined);
  assert.equal(snapshot.reactions[addedPost.id], 'love');
  await api.saveLocalCommentReaction(secondComment.id, 'like');

  await api.deleteLocalPetPost(addedPost.id);
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.posts.some((post) => post.id === addedPost.id),
    false
  );
  assert.equal(
    snapshot.comments.some((comment) => comment.postId === addedPost.id),
    false
  );
  assert.equal(snapshot.commentReactions[secondComment.id], undefined);
  assert.equal(
    db.raw.prepare('SELECT COUNT(*) AS count FROM comments WHERE postId = ?').get(addedPost.id)
      .count,
    0
  );
  assert.equal(
    db.raw
      .prepare('SELECT COUNT(*) AS count FROM comment_reactions WHERE commentId = ?')
      .get(secondComment.id).count,
    0
  );

  const recreatedPost = await api.createLocalPetPost({
    petId: addedPet.id,
    photoUri: 'file:post',
    caption: 'Test post',
  });
  await api.saveLocalReaction(recreatedPost.id, 'love');
  const keptOlderComment = await api.createLocalPetComment({
    postId: recreatedPost.id,
    body: 'First kept comment',
  });
  const keptNewerComment = await api.createLocalPetComment({
    postId: recreatedPost.id,
    body: 'Second kept comment',
  });
  await api.saveLocalCommentReaction(keptNewerComment.id, 'love');
  await assert.rejects(
    api.saveLocalPetProfile(
      { name: 'Missing', species: 'Dog', photoUri: '', personality: 'Test' },
      'missing'
    )
  );
  const louie = snapshot.pets.find((pet) => pet.name === 'Louie');
  await api.saveLocalPetProfile(
    { name: 'Louie', species: 'Dog', photoUri: 'file:mine', personality: 'Edited' },
    louie.id
  );
  api = loadDatabaseModule();
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.pets.find((pet) => pet.id === louie.id).personality, 'Edited');
  assert.equal(snapshot.pets.find((pet) => pet.id === louie.id).photoUri, 'file:mine');
  assert.equal(snapshot.posts.length, 10);
  assert.equal(snapshot.posts.find((post) => post.id === recreatedPost.id).caption, 'Test post');
  assert.equal(snapshot.reactions[recreatedPost.id], 'love');
  const reloadedComments = snapshot.comments.filter((c) => c.postId === recreatedPost.id);
  assert.deepEqual(
    reloadedComments.map((c) => c.id),
    [keptNewerComment.id, keptOlderComment.id]
  );
  assert.equal(snapshot.commentReactions[keptNewerComment.id], 'love');

  // Upgrade an existing installation and preserve a caption the user changed,
  // while still updating an unchanged old caption even if the post photo was replaced.
  db.raw.exec(
    "DELETE FROM app_migrations WHERE id IN ('seed-captions-v1', 'seed-v2'); UPDATE pets SET photoUri = 'asset:Mrs Frizzle.jpeg' WHERE id = 'pet-mrs-frizzle'; UPDATE pets SET isUserPet = 1 WHERE id IN ('pet-mia', 'pet-tippy'); UPDATE posts SET description = 'Sweet princess dog that likes to sleep in and bake in the sun.' WHERE id = 'post-nora-1'; UPDATE posts SET description = 'My own caption' WHERE id = 'post-mia-1'; UPDATE posts SET photoUri = 'asset:Mrs Frizzle.jpeg', description = 'Meet Mrs Frizzle.' WHERE id = 'post-mrs-frizzle-1'; UPDATE posts SET photoUri = 'file:custom-louie-post', description = 'A moment with Louie.' WHERE id = 'post-louie-1';"
  );
  api = loadDatabaseModule();
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-nora-1').caption,
    'What a cozy girl.'
  );
  assert.equal(snapshot.posts.find((post) => post.id === 'post-mia-1').caption, 'My own caption');
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-mrs-frizzle-1').photoUri,
    'asset:Mrs Frizzle.jpg'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-mrs-frizzle-1').caption,
    'Coming right at ya.'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-louie-1').photoUri,
    'file:custom-louie-post'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-louie-1').caption,
    'My what a big mouth you have, Grandma.'
  );
  assert.equal(snapshot.pets.find((pet) => pet.id === 'pet-mia').isUserPet, false);
  assert.equal(snapshot.pets.find((pet) => pet.id === 'pet-tippy').isUserPet, false);

  // Regression: seed-captions-v1 already recorded, seeded post photo replaced,
  // and original seeded caption left unchanged by an earlier photo-coupled migration.
  db.raw.exec(
    "DELETE FROM app_migrations WHERE id = 'seed-v2'; INSERT OR IGNORE INTO app_migrations (id) VALUES ('seed-captions-v1'); UPDATE posts SET photoUri = 'file:custom-louie-post-v1', description = 'Karuma as a dog but a cuddly bear at the same time.' WHERE id = 'post-louie-1'; UPDATE posts SET photoUri = 'file:custom-nora-post', description = 'Sweet princess dog that likes to sleep in and bake in the sun.' WHERE id = 'post-nora-1'; UPDATE posts SET photoUri = 'file:custom-tippy-post', description = 'Crazy and sweet.' WHERE id = 'post-tippy-1'; UPDATE posts SET photoUri = 'file:custom-mia-post', description = 'My custom Mia caption' WHERE id = 'post-mia-1';"
  );
  api = loadDatabaseModule();
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-louie-1').photoUri,
    'file:custom-louie-post-v1'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-louie-1').caption,
    'My what a big mouth you have, Grandma.'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-nora-1').photoUri,
    'file:custom-nora-post'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-nora-1').caption,
    'What a cozy girl.'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-tippy-1').photoUri,
    'file:custom-tippy-post'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-tippy-1').caption,
    'A moment with Tippy.'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-mia-1').photoUri,
    'file:custom-mia-post'
  );
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-mia-1').caption,
    'My custom Mia caption'
  );
  assert.equal(snapshot.posts.find((post) => post.id === recreatedPost.id).photoUri, 'file:post');
  assert.equal(snapshot.posts.find((post) => post.id === recreatedPost.id).caption, 'Test post');

  db = newDb();
  db.raw.exec(
    "PRAGMA foreign_keys=ON; CREATE TABLE pets (id TEXT PRIMARY KEY, name TEXT NOT NULL, species TEXT NOT NULL, photoUri TEXT NOT NULL, description TEXT NOT NULL, createdAt TEXT NOT NULL, isUserPet INTEGER NOT NULL); CREATE TABLE posts (id TEXT PRIMARY KEY, petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE, photoUri TEXT NOT NULL, description TEXT NOT NULL, createdAt TEXT NOT NULL); CREATE TABLE reactions (postId TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE, value TEXT NOT NULL); INSERT INTO pets VALUES ('pet-local','Louie','Dog','file:old','Old','2026-01-01',1), ('pet-milo','Milo','Dog','seed:dog','Old','2026-01-01',0); INSERT INTO posts VALUES ('post-user','pet-local','file:post','Mine','2026-01-01'), ('post-milo-trail','pet-milo','seed:trail','Old','2026-01-01'), ('post-user-other','pet-milo','file:post','Mine','2026-01-01'); INSERT INTO reactions VALUES ('post-user','love'), ('post-milo-trail','like');"
  );
  api = loadDatabaseModule();
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.pets.filter((pet) => pet.name === 'Louie').length, 1);
  assert.equal(snapshot.pets.find((pet) => pet.name === 'Louie').id, 'pet-local');
  assert.ok(snapshot.posts.some((post) => post.id === 'post-user-other'));
  assert.ok(snapshot.posts.some((post) => post.id === 'post-milo-trail'));
  assert.equal(snapshot.reactions['post-user'], 'love');
  assert.equal(snapshot.reactions['post-milo-trail'], 'like');
  assert.deepEqual(snapshot.comments, []);
  assert.deepEqual(snapshot.commentReactions, {});

  // Legacy seed cleanup must NOT delete a legacy seeded post that has comments (even with no post reaction).
  db = newDb();
  db.raw.exec(
    "PRAGMA foreign_keys=ON; CREATE TABLE pets (id TEXT PRIMARY KEY, name TEXT NOT NULL, species TEXT NOT NULL, photoUri TEXT NOT NULL, description TEXT NOT NULL, createdAt TEXT NOT NULL, isUserPet INTEGER NOT NULL); CREATE TABLE posts (id TEXT PRIMARY KEY, petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE, photoUri TEXT NOT NULL, description TEXT NOT NULL, createdAt TEXT NOT NULL); CREATE TABLE reactions (postId TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE, value TEXT NOT NULL); CREATE TABLE comments (id TEXT PRIMARY KEY NOT NULL, postId TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 180), createdAt TEXT NOT NULL); CREATE TABLE comment_reactions (commentId TEXT PRIMARY KEY NOT NULL REFERENCES comments(id) ON DELETE CASCADE, value TEXT NOT NULL CHECK (value IN ('like', 'love'))); INSERT INTO pets VALUES ('pet-milo','Milo','Dog','seed:dog','Old','2026-01-01',0), ('pet-luna','Luna','Cat','seed:cat','Old','2026-01-01',0); INSERT INTO posts VALUES ('post-milo-trail','pet-milo','seed:trail','Old','2026-01-01'), ('post-luna-window','pet-luna','seed:window','Old','2026-01-01'); INSERT INTO comments VALUES ('c-milo-1','post-milo-trail','Keep me','2026-01-02T10:00:00.000Z'); INSERT INTO comment_reactions VALUES ('c-milo-1','love');"
  );
  api = loadDatabaseModule();
  snapshot = await api.getPetSnapshot();
  assert.ok(snapshot.posts.some((post) => post.id === 'post-milo-trail'));
  assert.ok(snapshot.pets.some((pet) => pet.id === 'pet-milo'));
  assert.equal(
    snapshot.posts.some((post) => post.id === 'post-luna-window'),
    false
  );
  assert.equal(
    snapshot.pets.some((pet) => pet.id === 'pet-luna'),
    false
  );
  assert.equal(snapshot.comments.find((c) => c.id === 'c-milo-1').body, 'Keep me');
  assert.equal(snapshot.commentReactions['c-milo-1'], 'love');

  // Existing post-seed-v2 DB without comments tables upgrades cleanly and supports pet-delete cascade.
  db = newDb();
  db.raw.exec(
    "PRAGMA foreign_keys=ON; CREATE TABLE pets (id TEXT PRIMARY KEY, name TEXT NOT NULL, species TEXT NOT NULL, photoUri TEXT NOT NULL, description TEXT NOT NULL, createdAt TEXT NOT NULL, isUserPet INTEGER NOT NULL); CREATE TABLE posts (id TEXT PRIMARY KEY, petId TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE, photoUri TEXT NOT NULL, description TEXT NOT NULL, createdAt TEXT NOT NULL); CREATE TABLE reactions (postId TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE, value TEXT NOT NULL); CREATE TABLE app_migrations (id TEXT PRIMARY KEY NOT NULL); INSERT INTO app_migrations VALUES ('personal-pets-v1'), ('louie-caption-v1'), ('seed-captions-v1'), ('seed-v2'); INSERT INTO pets VALUES ('pet-user-1','Pip','Dog','file:pip','Friendly','2026-01-01',1); INSERT INTO posts VALUES ('post-user-1','pet-user-1','file:pip-post','Hello','2026-01-02'); INSERT INTO reactions VALUES ('post-user-1','like');"
  );
  api = loadDatabaseModule();
  snapshot = await api.getPetSnapshot();
  assert.equal(snapshot.reactions['post-user-1'], 'like');
  const upgradedComment = await api.createLocalPetComment({
    postId: 'post-user-1',
    body: 'Upgraded DB comment',
  });
  await api.saveLocalCommentReaction(upgradedComment.id, 'like');
  db.raw.exec("DELETE FROM pets WHERE id = 'pet-user-1'");
  assert.equal(
    db.raw.prepare('SELECT COUNT(*) AS count FROM comments WHERE id = ?').get(upgradedComment.id)
      .count,
    0
  );
  assert.equal(
    db.raw
      .prepare('SELECT COUNT(*) AS count FROM comment_reactions WHERE commentId = ?')
      .get(upgradedComment.id).count,
    0
  );

  console.log(
    'Actual database migration: fresh, restart, Louie reuse, posts, reactions, comments, and cascades passed.'
  );
}
main()
  .finally(() => {
    Module._load = originalLoad;
    require.extensions['.ts'] = originalTs;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
