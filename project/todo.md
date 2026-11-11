# Pet Show and Tell TODO

## Bug Fixes & Regressions

Add defects only as `- [ ] [Bug · Origin: Phase N] <concrete defect>`; do not duplicate them in a phase.

## Phase 0 — Orientation And Planning

- [x] Confirm StyleSheet-only component strategy in `project/info.md`; reviewed the generated app and confirmed no Expo UI, Universal Components, or Native Tabs conflicts.
- [x] Review the MDS ejection inventory. MDS reports no generated inventory for this scaffold; recorded that result and retained the tutorial routes.
- [x] Review `project/` product, technical, and style notes; resolve all optional context markers.
- [x] Review the Stylist page and confirm the warm neutral, green, and coral visual direction in `project/style.md` and `project/theme.json`.
- [x] Review package exposition routes and retain them as tutorial material for now.
- [x] Upgrade Expo stepwise from the generated SDK to SDK 58; update the versioned guidance and Expo-compatible dependencies.
- [x] Defer EAS and release setup; this milestone targets local Android Expo Go only.

## Phase 1 — App Shell And First Flow

- [x] Replace the starter home with the Pet Show and Tell feed and Expo Router routes.
- [x] Implement multi-screen onboarding, required local pet-profile setup, and first-post composition.
- [x] Implement feed, local pet profile, photo selection, post detail, and Like/Love interactions.
- [x] Keep first-run profile setup required and provide a sample illustration when no profile image has been selected.

## Phase 2 — Data Layer

- [x] Add typed pet, post, and reaction models plus six seeded pets and eight posts in `src/data/pet-seed.ts`.
- [x] Persist the local pet profile, posts, and Like/Love reactions with Expo SQLite in `src/storage/pet-database.ts`.
- [x] Connect screens to shared Zustand state and copy selected photos into app-owned local storage.
- [ ] Add a local comments table and typed comment actions in `src/storage/pet-database.ts` and `src/features/pets/pet-store.ts`; verify a saved comment appears after reopening a post.
- [ ] Add a comment list and composer to `src/features/pets/post-detail-screen.tsx`; verify empty, populated, and submitted-comment states.
- [x] Replace the seeded illustrations with bundled pet photos and create a post for each supplied photo.

## Phase 3 — Complete Product Flows

Real accounts, public sharing, cloud storage, moderation, and cross-device sync are deferred until after this local prototype. No Phase 3 implementation task is active.

## Phase 4 — Polish, Safeguards, And Release

No store, web, or public release is planned for this milestone. Revisit content review, release checks, and repository protections if the project later moves toward distribution.
