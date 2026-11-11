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
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-nora-1').caption,
    'A cozy moment with Nora.'
  );
  const addedPet = await api.saveLocalPetProfile({
    name: 'Test pet',
    species: 'Dog',
    photoUri: 'file:test',
    personality: 'Test',
  });
  const addedPost = await api.createLocalPetPost({
    petId: addedPet.id,
    photoUri: 'file:post',
    caption: 'Test post',
  });
  assert.equal(
    (await api.getPetSnapshot()).posts.find((post) => post.id === addedPost.id).petId,
    addedPet.id
  );
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
  assert.equal(snapshot.posts.find((post) => post.id === addedPost.id).caption, 'Test post');

  // Upgrade an existing installation and preserve a caption the user changed.
  db.raw.exec(
    "DELETE FROM app_migrations WHERE id = 'seed-captions-v1'; UPDATE posts SET description = 'Sweet princess dog that likes to sleep in and bake in the sun.' WHERE id = 'post-nora-1'; UPDATE posts SET description = 'My own caption' WHERE id = 'post-mia-1';"
  );
  api = loadDatabaseModule();
  snapshot = await api.getPetSnapshot();
  assert.equal(
    snapshot.posts.find((post) => post.id === 'post-nora-1').caption,
    'A cozy moment with Nora.'
  );
  assert.equal(snapshot.posts.find((post) => post.id === 'post-mia-1').caption, 'My own caption');

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
  console.log(
    'Actual database migration: fresh, restart, Louie reuse, posts and reactions passed.'
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
