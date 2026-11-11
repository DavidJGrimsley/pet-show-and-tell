# Pet Show and Tell

An Android Expo Go demo for introducing a pet, sharing an on-device photo post, browsing a sample pet feed, and reacting with Like or Love.

## Run locally

1. Install Node.js and npm.
2. Install dependencies with `npm install`.
3. Start Expo with `npm start`.
4. Open the project in a matching Expo Go app on an Android emulator.

The app uses Expo SDK 58, TypeScript, Expo Router, StyleSheet, Zustand, Expo SQLite, ImagePicker, and FileSystem. A matching SDK 58 version of Expo Go is required.

## Demo boundaries

- Seven pet profiles and nine photo posts are seeded locally from bundled assets.
- Your pets can be added and edited independently, and each post belongs to a selected pet.
- Profile, photo posts, and Like/Love reactions persist in SQLite on this device.
- Selected photos are copied into app-owned storage. Nothing is uploaded or shared with other devices.
- Comments, real accounts, public sharing, moderation, and backend storage are deferred.

## Tutorial routes

- `/` — pet feed and reactions
- `/pet-setup` — create or edit the local pet profile
- `/create-post` — choose a photo or sample and add a local post
- `/my-pet` — browse local pet profiles and their posts
- `/post/[id]` — post detail; comments are a planned follow-up
- `/exposition` — MDS package learning material

See `project/info.md`, `project/style.md`, `project/guidelines.md`, and `project/todo.md` for scope and project memory.
