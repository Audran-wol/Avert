# Implementation status — Avert dark-workspace refactor

Living document, updated after each phase. See `../../../.claude/plans/` history for the original approved plan (phases below mirror it).

## Baseline (Phase 0 audit, recorded before any refactor code changed)

- Repo: `D:\Dev_Work\MineOPs`, single branch `main` (no other branches/worktrees). Working tree had pre-existing uncommitted changes from the login/branding pass (index.html, App.tsx, CommandBar.tsx, DemoMode.tsx, SourceConfidence.tsx, data/sources.ts, index.css, main.tsx) plus untracked `public/`, `src/auth/`, `src/pages/`, `src/platform/` — all preserved, none reverted by this work.
- Package scripts: `dev` (vite), `build` (`tsc -b && vite build`), `preview`. No `test` script existed before this phase.
- `tsc --noEmit -p tsconfig.json`: **clean** before Phase 1 changes.
- Brand asset: `src/components/BrandMark.tsx` — the one and only approved logo (SVG wave + "Avert" wordmark, `compact`/`tone` props). Used in header/login already.
- App entry: `src/main.tsx` → `AuthProvider` (`src/auth/AuthContext.tsx`) → `src/App.tsx` → `LoginPage` (`src/pages/LoginPage.tsx`) or `MapWorkspace`.
- Router: `src/platform/router.tsx` — custom `navigate`/`usePathname`/`AppLink`, no library. Only distinguishes `/login` vs `/login/recover` today.
- State store: `src/store.ts` (Zustand) — Monitor-only (`eventId`, `selectedId`, `stepIndex`, `mode`, panel/drawer flags). No Communities/Evidence/Alerts/AI/notification state yet.
- Map: `src/components/MapView.tsx` + `src/mapBus.ts`. Sources: `communities`, `flood`, `rivers`, `districts`. Layers: `comm-dot`, `comm-halo`, `flood-fill`, `flood-line`, `river-line`, `district-line`. Basemaps: `streets`/`satellite`/`dark`.
- Risk/exposure calculations: `src/services/exposure.ts` (`computeStep`, `communityById`), `src/services/forecast.ts` (`forecastRanking`, `computeForecastRisk`), `src/data/features.ts` (susceptibility). Evidence doctrine types in `src/models/contracts.ts`.
- Evidence registry: `src/data/sources.ts` (honest `SOURCES`, real/curated/modeled/planned), `src/data/photos.ts` (4 exact community matches + regional fallbacks with credit/license/note). No Evidence *screen* exists yet — only the small inline provenance-chip component `src/components/Evidence.tsx`.
- Auth/session: `src/auth/AuthContext.tsx` — demo-only session (`sessionStorage`), no real backend/API adapter exists anywhere in the repo.
- No AI, alerts, simulation, notifications, Account, Preferences, or QR-preview code exists yet.
- Dependencies available: React 18, Zustand 5, MapLibre 4.7.1, `@turf/*` (incl. `distance`), Motion, Lucide. No router library, no test runner, no QR library. `puppeteer-core` is a devDependency (unused so far, available for headless screenshot QA).
- Reference images: all 8 approved PNGs present and verified openable at `docs/avert-refactor/references/`.
- `.gitignore` blanket-excluded `*.md`/`*.pdf`; added narrow negations for `docs/avert-refactor/**` and `.claude/skills/**` so this handoff and its skills are tracked (verified via `git check-ignore`).

## Feature-preservation checklist (must survive the shell reshell unchanged in behavior)

- [x] History/Forecast mode toggle
- [x] Region/basin switching (Lower Volta, White Volta, Far North, Douala)
- [x] Event/year selector per basin
- [x] Playback (play/pause/scrub) — `TimelinePlayer.tsx`
- [x] Data layer visibility toggles — `NavRail.tsx` popover logic
- [x] Community selection (map click + list) and camera fly-to
- [x] Community inspector (Overview: exposure, priority, factors, susceptibility) — `FloatingCommunityCard.tsx`
- [x] Flood history drawer — `HistoryPanel.tsx`
- [x] Source confidence drawer — `SourceConfidence.tsx`
- [x] Scripted demo walkthrough — `DemoMode.tsx` (restyled only, logic untouched)
- [x] Basemap switching (streets/satellite/dark) — `MapControls.tsx` + now also `Preferences > Map appearance`

## Phase log

- **Phase 0 (done):** handoff pack installed at `docs/avert-refactor/` + `.claude/skills/`; gitignore exceptions added; this file created.
- **Phase 1 (done):** design tokens retargeted; `AppHeader`/`ContextBar` shell built; `NavRail`/`LeftPanel`/`FloatingCommunityCard`/`CommandBar` retired; `CommunityInspector` docked right with Overview/Evidence tabs; `EventSummaryOverlay`/`LayersControl` added; map camera padding recomputed. `tsc`/`vite build` clean.
- **Phase 2 (done):** responsive breakpoints (1440/1100/768) on header, community list and inspector; inspector becomes a full-bleed drawer with scrim below 1100px.
- **Phase 3 (done):** `CommunitiesPage` (table + map, export, save view) sharing the one mounted `MapView` instance with Monitor.
- **Phase 4 (done):** `EvidencePage` (Photographs/Maps & layers/Reports) on real photo/source data, local mismatch feedback.
- **Phase 5 (done):** `assessmentContext.ts`, `server/askAvert.ts` (OpenAI, server-side key), Vite dev middleware, `AskAvertPanel`. `OPENAI_API_KEY` placeholder added to `.env.local`/`.env.example`, left blank for the user to fill in.
- **Phase 6 (done):** deterministic simulation engine + tests, SMS segmenter + tests, `AlertsHomePage`/`AlertComposerPage`/`SimulationResultsPage`, `NotificationsPanel`.
- **Phase 7 (done):** `AccountPage`, `PreferencesPage` (all toggles wired to real effect — see `IMPLEMENTATION_REPORT.md`), `/m` compact QR preview + `QrPreviewCard`.
- **Phase 8 (done):** final `tsc`/`vite build`/`vitest run` all clean; code-level defect sweep (no `alert()`/`confirm()`, no dead buttons, no leftover debug logging); `IMPLEMENTATION_REPORT.md` written. Browser-based visual verification against the reference PNGs was intentionally left to the user, who is checking the running app directly — not performed by the agent in this session.
