# Implementation report — Avert dark-workspace refactor

## Completed scope

All ten scope areas from `00_IMPLEMENTATION_CONTRACT.md` are implemented and wired to real data/logic, not mockups:

| Area | Status | Notes |
| --- | --- | --- |
| App shell | Done | New `AppHeader` (logo, primary nav, search, Ask Avert, notifications, account) + `ContextBar` (region, History/Forecast, date, Sources, Demo). Replaces `CommandBar`/`NavRail`/`LeftPanel`. |
| Monitor | Done | Real map (`MapView`, unchanged rendering logic), `EventSummaryOverlay` (title + 3 compact metrics), `LayersControl`, `CommunityInspector` (docked right, Overview/Evidence tabs), playback, history drawer, source drawer, demo mode all preserved. |
| Communities | Done | `CommunitiesPage`: sortable/filterable table on real `computeStep`/`forecastRanking` data, row↔pin sync via existing `selectedId`, CSV export (formula-injection guarded), Save view (localStorage, versioned). |
| Evidence | Done | `EvidencePage`: Photographs (real community-matched photos only, deduped, relationship-labeled), Maps & layers (activates real map layers), Reports (event `sources`/`externalIds`, honest "no linked document" where true), local mismatch feedback. |
| Ask Avert | Done | `AskAvertPanel` + `assessmentContext.ts` (immutable per-selection snapshot) + `server/askAvert.ts` (OpenAI adapter, server-side key only) + Vite dev middleware. Context invalidation, cancel, retry, source citation validated against the real registry, allowlisted actions, honest unavailable state. |
| Alerts | Done | `AlertsHomePage` (Drafts/Simulations), `AlertComposerPage` (real Audience→Message→Review steps, fixing the reference's stepper bug), `SimulationResultsPage`. Deterministic seeded simulator (`domain/simEngine.ts`), fictional recipients only, DEMO marker enforced, reconciled counts, retry/cancel. |
| Notifications | Done | `NotificationsPanel` (bell popover + inline on results), dedup per completion event, mark read/all read, preference-gated. |
| Account | Done | `AccountPage`: demo identity, local display-name/saved-regions (persisted), real non-interactive map banner, End demo session (real `signOut`). |
| Preferences | Done | `PreferencesPage`: the 3 *actually available* basemaps (not an invented "Terrain" layer), default region, language, units, motion, remembered view, AI/notification toggles — each wired to real effect (see below). Static map preview, no fake scrubber. |
| Compact QR preview | Done | `/m` public route (`CompactPreviewPage`), manual picker + explicit geolocation (`@turf/distance` nearest-match), honest "outside coverage" state, `QrPreviewCard` (real QR via `qrcode` when a public origin exists, honest "configuration needed" on localhost). |

## Preference toggles — real wiring, not decoration

Per the explicit requirement that toggles must "actually affect UI" and never be silently ignored:

- **Default basemap / default region** → applied immediately to the live Monitor store on Save.
- **Units** → MapLibre's `ScaleControl` unit, live-reactive.
- **Motion** → `force-reduced-motion` / `force-full-motion` body classes (index.css), independent of the OS media query.
- **Remember last-viewed region/mode** → persisted/restored in `store.ts`, gated live on the toggle.
- **Use selected community context** → `assessmentContext.ts` genuinely omits the community from what's sent to Ask Avert when off, not just hidden in the UI.
- **Generate explanations automatically** → `AskAvertPanel` auto-asks "why this priority" once per new context when both the panel is open and the toggle is on; never fires on load or continuously.
- **Notification toggles** → gate the two `pushNotification` calls in `alertsStore.ts` directly.

## Baseline vs. final checks

| Check | Baseline (Phase 0) | Final |
| --- | --- | --- |
| `tsc --noEmit -p tsconfig.json` | Clean | Clean |
| `vite build` | Not run as part of this task's baseline | Succeeds (`dist/` produced; pre-existing >500KB chunk warning, unrelated to this work) |
| `vitest run` | No test runner existed | 2 files, 10 tests, all passing (reconciliation, determinism, cancellation, retry accounting, SMS segmentation) |

Commands run: `npx tsc --noEmit -p tsconfig.json`, `npx vite build`, `npx vitest run`, all re-verified after each phase, not only at the end.

## Deviations from the reference images (all required by `06_REFERENCE_MANIFEST.md`)

- Logo: the current repository `BrandMark` component is used everywhere; the references' generated wave marks were never used.
- Composer stepper: implemented as real Audience → Message → Review (R5 mixes step labels with a final action; corrected).
- Preferences basemap picker: labeled Dark/Streets/Satellite (the 3 basemaps this build actually has), not R8's invented "Terrain".
- Preferences workspace preview: a real static/non-interactive MapLibre view, not R8's video-scrubber mockup.
- Simulation counts (120/114/6, 95%): those are the *deterministic engine's typical output* at the default ~95% delivery rate, not a hardcoded card — verified by the reconciliation tests.
- Evidence photos: only 4 exact community-photo matches exist in the current data (`data/photos.ts`); everything else is honestly labeled "Regional reference" or shows an empty state rather than a mismatched photo.
- Account/Preferences map banners: real MapLibre instances (`interactive: false`), never a static generated image presented as geography.

## Known limitations / not implemented

- **Visual/browser verification was not performed by the agent.** The user is verifying the running app visually themselves in this session; no screenshots were captured against the reference PNGs at the required viewports (1600×1000 / 1366×768 / 1024×768 / 390×844). This report should not be read as claiming pixel/layout fidelity — only that the code implements the specified composition, states and behavior.
- **Ask Avert requires `OPENAI_API_KEY`** in `.env.local` (server-side only; placeholder line already added, left blank intentionally — the user will fill it in). Without it, Ask Avert correctly shows its "unavailable" state and the rest of the app is unaffected.
- **QR code needs a real public origin.** On localhost, `QrPreviewCard` correctly shows a "configuration needed" state with a copyable local link instead of a misleading QR. No deployment was performed as part of this task.
- **"Brief" export**: the pre-refactor build had a non-functional "Brief" button (no `onClick`, already broken before this task). It was not carried into the new header, since it was placeholder-only to begin with. Working exports now exist for Communities (CSV) and Simulation results (CSV); a dedicated Monitor "brief" document is not implemented.
- **Language preference scope**: `language` (EN/FR) is fully real where it currently reaches — the Alert composer's message templates/AI-drafting instruction and the phone preview label. It does not yet translate the rest of the application chrome (header, buttons, page copy). This is a deliberately scoped-down but honest implementation rather than a decorative dropdown; extending it to the full UI is future work.
- **Responsive breakpoints** (1440/1100/768) are implemented via Tailwind arbitrary breakpoints on the inspector, header and community list, but were not checked against the reference viewports in a real browser per the note above.
- npm audit reports pre-existing vulnerabilities in dev-tooling transitive dependencies (vitest/puppeteer chain); not addressed in this pass since `audit fix --force` risks breaking changes and none are in the shipped client bundle.

## Environment / configuration required

- `OPENAI_API_KEY` — server-side only, in `.env.local` (placeholder line added). Never a `VITE_*` variable.
- `OPENAI_MODEL` — optional override, defaults to `gpt-4o-mini`.
- Deploy target for the AI endpoint and the QR's public origin — intentionally left undecided per the user's direction ("let's see it built first"); `server/askAvert.ts` is a plain framework-agnostic handler, currently mounted only as Vite dev middleware (`vite.config.ts`), portable to whatever host is chosen later without rewriting the handler.

## Changed/added files (high-level)

New: `src/components/{AppHeader,ContextBar,LayersControl,EventSummaryOverlay,CommunityInspector,AskAvertPanel,NotificationsPanel,MapBanner,QrPreviewCard}.tsx`, `src/pages/{CommunitiesPage,EvidencePage,AlertsHomePage,AlertComposerPage,SimulationResultsPage,AccountPage,PreferencesPage,CompactPreviewPage}.tsx`, `src/domain/{alertTypes,simEngine,sms}.ts` (+ tests), `src/stores/{alertsStore,preferencesStore}.ts`, `src/services/{askAvert,askAvertTypes,assessmentContext}.ts`, `server/askAvert.ts`.

Removed (superseded, fully unused after the reshell): `src/components/{CommandBar,NavRail,LeftPanel,FloatingCommunityCard}.tsx`.

Modified: `src/App.tsx` (route composition), `src/store.ts` (removed `panelOpen`, added `askAvertOpen`, remembered-view persistence), `src/components/{MapView,DemoMode,SourceConfidence}.tsx` (token/positioning updates, resize triggers), `src/index.css` (design tokens + motion-preference classes), `vite.config.ts` (Ask Avert dev middleware), `package.json` (added `vitest`, `qrcode`, `@types/node`, `@types/qrcode`; added `test` script).
