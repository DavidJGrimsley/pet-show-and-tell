# Pet Show and Tell Project Info

## App Name
Pet Show and Tell

## Overview
Pet Show and Tell gives pet owners a safe, friendly place to enjoy pictures of pets. The first implementation is an on-device Android demo of onboarding a pet, sharing a photo post, browsing a community-style feed, and reacting to posts. Nothing is published to a service.

## Target Users
Pet owners who want to create a profile for a pet, share pictures, and browse pictures of other people's pets.

## Problem this app solves
People who enjoy pets need a welcoming place to introduce their pets and browse pet photos. This milestone validates the first-time and feed experience before real public sharing is added.

## Product Goals
- Run in Expo Go on an Android emulator.
- Introduce the app, collect one local pet profile, and let the user add a photo post.
- Browse a community-style feed containing curated demo pets and the current device's own posts.
- Open post detail and toggle Like or Love.
- Keep implementation and remaining TODOs bite-sized and tutorial-friendly.

## Non-Goals
- No sign-in, account management, or remote identity.
- No backend, shared database, cloud media storage, public distribution, or cross-device sync.
- No moderation service, reporting, or notifications.
- No web/iOS, EAS, monetization, or store submission in this milestone.
- Comments are a follow-up TODO for the prototype to complete, not part of the initial runnable flow.

## First User Flow
1. A multi-screen introduction explains creating a pet profile, sharing pictures of that pet, and browsing other people's pets.
2. The user can create multiple local pet profiles with a name, species, optional profile picture, and short description. A sample illustration remains available when no photo is selected.
3. The user adds a first photo post with a short description. The photo is selected from the device library and remains local.
4. The user enters the feed, browses seeded and locally created posts, opens post detail, and uses Like or Love.

## Core Flows and Features
- Multi-screen onboarding that hands off to local pet-profile creation.
- Create one local pet profile with name, species, optional picture, and short description.
- Create a local photo post associated with that pet; post fields are pet ID, picture, description, and timestamp.
- Browse the seeded feed plus posts created on this device.
- Open a post-detail screen.
- Like or Love a post; only one reaction can be selected at a time, and tapping it again clears it.
- Persist profile, posts, and reactions on device so they remain available while navigating and after restarting the app.
- Comments remain a Phase 2/prototype follow-up task. No network publishing.

## Screens
- Multi-screen onboarding.
- Pet profile setup.
- First photo-post composer using the device image library.
- Feed.
- Post detail with photo, description, and Like/Love reactions.
- Adding a comment list and composer is a tutorial-friendly TODO.
- No login/account screens, remote publishing UI, or moderation screens.

## Seed Data and Assets
- Seed six pets with at least one post each. Some pets may have a second post; use eight posts total.
- Each seeded pet has a name, species, picture, and short description.
- Each seeded post has pet ID, picture, description, and timestamp.
- The offline seed collection contains seven pet profiles and nine bundled local photos; keep asset paths easy to update.
- Newly created profile and post photos stay on device. Do not upload images.

## Data Needs
- Data mode: device-local Expo SQLite with Zustand shared state; no remote or server data.
- Local app state and device-local persistence only.
- Store one local pet profile, local posts, and the user's Like/Love reaction per post.
- Seed six pets and eight posts. Keep the data models and fixtures in files that can be edited without a backend.
- Use Expo SQLite for durable local records and Zustand for shared screen state.
- User-selected photos remain local to the device; there is no upload or external API.
- Expo SDK: 58; use versioned SDK 58 docs and SDK-matched Expo Go on Android.
- No accounts, shared database, real-time collaboration, analytics, or notifications.

## Platforms
- Target and first MVP platform: Android.
- Local preview: Android emulator through Expo Go.
- No production release is planned.

## Release Strategy
The first version is an internal demo run locally in Expo Go on an Android emulator for prototype and tutorial use. It is not released through a store, web deployment, or public hosting.

## Monetization Strategy
No monetization planned.

## Team Context
One developer using MDS and beginner-friendly agent-guided tutorials. Remaining tasks should be independently actionable and have observable acceptance checks.

## Legal and Compliance Contact
No legal documents are generated for this local-only demo. Before real public publishing, decide business/contact details and review privacy, image rights, and moderation requirements.

## Later Scope and Possibilities
- Real accounts and a shared public community feed.
- Remote database and cloud image storage.
- Cross-device sync and public moderation/reporting.
- Comments, starting with a local comment list and composer as the tutorial follow-up.
These items are separate from the on-device demo and need product/security planning before release.

## Research, Notes, and References
- Product direction: a safe place for pet owners to enjoy pictures of pets.
- Planning/design reference: F:/SoftwareDev/mrdj-dev-suite-i2Workspace/temp/Dual-Screen IDE Design-11-7-26. Read-only; do not modify.
- Product-specific pet photos have not yet been supplied; use local bundled examples/placeholders until they are added to the repo.
- Preserve the prototype journey: onboarding/profile, share a pet photo, browse feed, open detail, react; comments remain a follow-up.

## Tech Stack and MDS Setup
- Expo React Native, TypeScript, npm.
- Expo Router, routes under src/app.
- Android only, platform-specific files/layouts.
- React Native StyleSheet only; Zustand for shared app state.
- No auth/backend starter or separate API server.
- Local data mode; persist profile, posts, and reactions on device. No remote API calls.
- Use `expo-image-picker` for local photos and `expo-file-system` to copy them into app-owned storage; files remain on device.
- No Expo UI or Native Tabs; preserve Expo Go compatibility.
- Multi-screen onboarding; handoff to pet setup and then the app.
- No EAS, legal-document generation, or store deployment.
- Keep the MDS project/guidelines template and test-to-main safeguards.
- Do not save these selections as permanent personal defaults.

## Acceptance Criteria
- Android Expo Go launches and onboarding completes without login.
- User can create multiple pet profiles with the defined fields; profile pictures are optional.
- User can select a device image or use a bundled sample and create a local photo post.
- Feed shows six seeded pets and eight seeded posts, plus the user's local post.
- Post detail displays the matching pet name, species, picture, and description.
- Like/Love state updates consistently and persists on device.
- Profile, posts, and reaction state remain local and can be restored after app restart.
- No user content is sent to a service.
- Comments remain an explicit TODO for the prototype to complete.

## Phase 0-2 Roadmap Intent
Phase 0 records this product and stack boundary. Phase 1 builds the app shell, onboarding/profile setup, local image selection, feed, and post detail. Phase 2 defines typed pet/post/reaction models, six local fixtures with eight posts, device-local persistence, and shared state actions. Leave comments and small tutorial-friendly polish tasks open for the prototype path. Each TODO should name the route or data file, describe an observable acceptance check, and give one direct next action.

# Tech Stack and CESS Onboarding

- TypeScript: Yes
- Package Manager: npm
- Navigation: Expo Router
- Navigation type: Stack
- Expo Router app directory: src/app
- Platform strategy: Android-only, platform-specific files and layouts
- Web output: none
- Style library: React Native StyleSheet only
- create-expo-app components: No
- Expo UI: No
- Expo UI Universal components: No
- Expo Native Tabs: No
- Software Mansion packages: defaults retained only as needed
- State management: Zustand
- Auth: None
- Onboarding flow: multi-screen
- Onboarding completion: enter-app after local pet setup
- Legal documents/update gate: none
- Onboarding persistence: zustand-local
- Data categories: local app state
- Starting data mode: local dummy data with Expo SQLite
- Internationalization: none
- Analytics: none
- EAS: No
- Deployment plan: local Android emulator with Expo Go
- Project/guidelines template: Yes
- Test-to-main safeguards: Yes
- Save personal defaults: No

## Component Strategy
- Style library: StyleSheet
- Expo UI: No
- Expo UI Universal components: No
- Expo Native Tabs: No
- Conflicts: none
- Decision: confirmed

## Ejection Inventory
- Decision: not applicable; the MDS ejection inventory is absent for this scaffold. Retain the existing onboarding, settings, data, exposition, and Stylist tutorial routes for this milestone, then revisit cleanup if the project moves toward release.
