# Pet Show and Tell Guidelines

## Source of Truth
- Read project/info.md, project/todo.md, project/style.md, and this file before product or architecture changes.
- These project files hold product intent, roadmap, visual style, and technical rules.
- Ask before changing the local-only product boundary or adding a backend, account system, or public publishing.
- Keep the IDE reference folder read-only.

## Product Boundary
- First release is an Android Expo Go demo for one device.
- A static web export is in scope for the hosted i² phone-frame preview. It is session-only, same-origin, and not a public website. `npm run export:web` writes it; `PET_WEB_BASE_PATH` sets the sub-path.
- `eas.json` has an Android emulator APK profile. Store submission and iOS stay out of scope.
- The user creates one pet profile and local photo posts; seeded community-style posts are also shown.
- No sign-in, network API, public upload, shared storage, moderation service, or cross-device sync.
- Comments stay as an explicit tutorial-sized follow-up unless the owner updates the roadmap.
- Pet profiles use name, species, picture, and short description. Posts use pet ID, picture, description, and timestamp.
- Seed six pets and eight posts total, with some pets appearing in two posts.

## Expo Architecture
- Expo Router routes live under src/app.
- Keep route files thin and put screens, shared UI, fixtures, local persistence, and services in src/features, src/components, src/data, src/storage, and src/services.
- Use TypeScript and npm.
- Use React Native StyleSheet only; do not introduce Uniwind, NativeWind, or a second style system.
- Use Zustand for shared state across feed, detail, profile, and composer.
- Keep image selection on device and use an Expo-compatible image picker.
- Use local data and SQLite for on-device persistence. The web preview uses an in-memory session copy instead of SQLite, because the hosted frame has no cross-origin-isolation headers. Do not add remote calls.
- Do not add Expo UI, Native Tabs, authentication, or legal-document generation.
- EAS stays limited to the Android emulator APK profile. Do not submit to a store.
- Never put secrets in the app or EXPO_PUBLIC variables.

## Visual Direction
- Keep screens calm and photo-forward, with readable contrast and a friendly tone.
- Pet photos should be visually prominent.
- Use StyleSheet values consistent with project/style.md and project/theme.json.
- Include visible pressed/selected states for reactions, clear form validation, and accessible labels.
- Provide a bundled sample image path if photo-library permission is denied.

## Starter and Tutorial Code
- Treat exposition and stylist pages as temporary learning material; keep them until the tutorial phase is complete.
- Review project/todo.md and update task state as work is completed.
- Keep tutorial TODOs bite-sized, route/file-specific, and easy to verify by observation.
- Don't remove useful MDS onboarding, data, or settings examples without updating the ejection inventory.

## Workflow
- Use MDS guidance for project planning and app setup.
- This project uses Expo SDK 58. Before adding a package, check SDK 58 compatibility and use the Expo-compatible package version.
- After adding a package, install it with npm and capture any package-manager failure in the TODO.
- Use MDS Doctor and Expo Doctor when the owner asks for verification or when a tool reports a failed diagnostic that needs resolution.
- Do not claim a diagnostic passed unless its command output confirms it.
- Keep the generated test-to-main workflow documented for future repo work, but do not create branches unless requested.

## Safety and Public Sharing
- This milestone stores profile images and post images on device only.
- Never upload or publish user photos.
- Before adding public posting, plan authentication, shared storage, privacy, image rights, abuse reporting, and moderation.
