# Agent Worksheet — Pet Show and Tell Cleanup

Status: COMPLETE

## Task source and requirements

User asked to clean up CESS-generated clutter in Pet Show and Tell, specifically calling out the exposition folder, and requested a new branch. The user requested the Ping-Pong Planning workflow. Keep product flows intact, work on a descriptive feature branch, and do not commit or push without a request.

## Starting state

- Repository: `F:/SoftwareDev/pet-show-and-tell`
- Starting commit: `3e10f6358f41def281dafb88de2f535484a593b4`
- Starting branch: `main`; tracked and untracked Git status was clean.
- `project/todo.md` and project notes are the available project plan; no dedicated cleanup plan found yet.
- Current notes say to retain exposition/stylist tutorial pages, but the user's current cleanup request supersedes that earlier choice.
- The app entry route is the pet feed. Expo/MDS exposition routes remain registered; the old generated `features/home/home-screen.tsx` links to them but is not the app entry.
- `.expo`, `dist-web`, and `tmp` are ignored local outputs/cache directories. Leave user-local contents alone unless their tracked status/use proves they are safe to remove.

## Plan

1. Complete the requested two-family PPP initial reviews and one challenge/integration round.
2. Remove only obsolete CESS/MDS exposition/demo scaffold, and prune its links/config/docs. Preserve functional pet flows and useful settings.
3. Update project notes so they describe the new cleanup decision; keep edits scoped to confirmed dead generated artifacts.
4. Inspect the final diff and Git status. No tests were requested; do not add or run tests unless the user asks.

## Progress

- Investigation complete; independent planning reviews pending.

## PPP panel update

- User preference: no OpenAI models for planning or implementation. Use Google Gemini and xAI Grok; Gemini Flash for grunt work, Hydrogen for middle-level planning, and Grok for high-level work or review.
- OpenAI/Codex could not be used in this Windows setup: `jamsession list codex` reported native Codex control requires Unix sockets. Native Claude model selection also failed; the recommended model ID was rejected and its model-picker helper failed on Python `fcntl`. No analysis was received from those sessions. Do not retry OpenAI.
- Independent initial planner: xAI native Grok 4.7 high, session `b6706475-efbf-4ecc-afcb-d411a3052f26`, COMPLETE. It made no changes. Pre/post source tree SHA256 both matched `88A426A1691E1AB702B87665F677557D3F853DAAAFDFC8BC20787D6F016E3264` (131 files).
- The Jam Session CLI failed to append worksheet logs because it normalized this Windows path to `/f/SoftwareDev/...`; session details and prompts are retained manually here.
- Grok recommends removing exposition routes/screens/components, the old Super Stack home page, mock task DB/adapters, demo-only SWMansion components, and unused starter files after checking references. Keep the actual pet flow, web Settings restore action, onboarding, and app theme tokens. Remove obsolete ejection/tutorial docs and Stylist commands. Do not delete `.expo`, `dist-web`, or `tmp`; they are ignored local outputs. It also flagged package pruning as a separate follow-up after checking use rather than part of the first cleanup.

- Independent initial planner: Google Antigravity / Gemini 4 Hydrogen High, session `35cb61bd-f6e0-4f8b-82e3-adedd10b62f2`, COMPLETE. It used edit transport because Antigravity does not support read mode, but explicitly performed no writes; the pre/post source tree SHA256 matched `EA40FC588579F661EADD572387EBEC1D219F1FF1FB53982B25B02A2F5B2E9023` (131 files).
- Gemini independently agrees on deleting exposition, unused starter home/mock task store, and unreferenced starter components/store; update routes, README, and project notes. Keep the active pet routes, web Settings restore, onboarding, live theme tokens, and MDS CI/doctor. It suggests pruning exposition-only package scripts and direct packages only after verifying the import/config graph. Keep ignored output dirs. Its exact response was returned to the caller but not logged by Jam Session due to the Windows worksheet path issue.

## Candidate scope after independent drafts

1. Remove the unmounted CESS Super Stack home screen, exposition route tree and registrations, exposition screens/components, showcase-only Software Mansion components, mock app/tasks, exposition local-data adapters, and the Stylist route sync API/helper.
2. Remove unreferenced starter files (`Button.tsx`, `ScreenContent.tsx`, `EditScreenInfo.tsx`, bear `store/store.ts`) and optional debug-only `cesconfig.jsonc` after confirming no active config references.
3. Remove route-specific MDS ejection/Android Stylist API scripts, while keeping `mds:stylist:sync`, MDS Doctor/CI tooling, and shared theme files because the theme runtime and style workflow still use them.
4. Remove only exposition-only direct packages `reanimated-color-picker`, `react-native-svg`, and `tailwindcss`, after confirming their sole imports are within the files being removed; update `package-lock.json` via npm. Keep root providers/native dependencies and other uncertain packages.
5. Update README routes and project TODO/info/guidelines to record removal; keep Settings (including web Restore sample pets), pet product flows, onboarding/legal state, real pet DB, theme, MDS CI, and ignored outputs.
6. Do not delete `.expo`, `dist-web`, or `tmp`; no tests were requested. Review final references/status/diff only.

Challenge requested from Grok; integration requested from Gemini after that review.

## Round 1 challenge

- Grok challenged the candidate and confirmed the cleanup boundary against the repository. Key corrections: remove all three ejection commands, including generic `mds:eject` (it defaults to exposition); keep `mds:stylist:sync` because it edits live theme tokens/style/font assets; update the guidelines clause about MDS data examples so it no longer protects the obsolete exposition task adapter; keep the Stylist token markers in `project/style.md`; do not run the ejection commands as a cleanup mechanism. Keep `expo-web-browser`, root providers, Reanimated/Worklets, Settings, `Container.tsx`, and active pet/theme/CI paths. It confirmed the three selected package imports are confined to deleted exposition/showcase files and the listed starter files/config have no active references. No changes occurred.

## Round 1 integration complete

- Gemini independently checked Grok's challenge corrections against the repository and the installed `@mr.dj2u/cli` behavior. All listed corrections are supported: delete generic `mds:eject` too; keep `mds:stylist:sync` and the style markers, remove only the Android sync helper; clarify exposition task adapter vs pet DB in guidelines; do not run `mds eject`; remove the 3 exposition-only packages with their files; preserve settings, pet/theme/CI/native paths, and local outputs.
- PPP complete: one initial independent draft each, Grok challenge, Gemini integration. Gemini Hydrogen High session `35cb61bd-f6e0-4f8b-82e3-adedd10b62f2`; Grok 4.7 High session `b6706475-efbf-4ecc-afcb-d411a3052f26`. No unresolved scope item blocks this cleanup; Settings placeholder auth text and minor unused packages/config can remain for a separate decision.

## Implementation

- Starting now on `chore/pet-show-and-tell-cleanup`.
- Remove the resolved unused CESS exposition/demo/starter artifacts and obsolete scripts/packages, update the route/doc references, and retain project-specific settings, pet store/database, theme sync, MDS Doctor/CI, and ignored outputs.
- Do not stage or commit. Do not run tests unless the user asks.


## Final result

- Completed the requested cleanup on branch `chore/pet-show-and-tell-cleanup`.
- Removed 6,589 lines across the exposition/tutorial/demo implementation, unreferenced CESS starter components/store, CESS debug config, and obsolete Android Stylist helper. Removed the empty exposition, home, showcase, bear-store, and app/legal directories.
- Updated Expo route registration, README, TODO, project info/guidelines, and package scripts. Removed direct packages used only by deleted showcase files; npm refreshed `package-lock.json` and removed 60 local packages.
- Preserved the pet app routes/database, Settings sample restore, onboarding, live theme system/style sync, native root providers, MDS Doctor/CI, and ignored `.expo`, `dist-web`, and `tmp` outputs.
- Closeout evidence: `git diff --check` exit 0; `rg` found no references to exposition/local-data/mock-app/Stylist API or the removed package/script names in `src`, `scripts`, `package.json`, or README. No tests or diagnostics were run. No files were staged or committed.
- The branch contains the task worksheet as an untracked `.agents/worksheets/` file; other changes are unstaged working-tree changes.
