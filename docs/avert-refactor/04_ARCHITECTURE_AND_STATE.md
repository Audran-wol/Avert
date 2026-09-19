# 04 — Integration architecture and state

## Work inside the current application

Inspect the current repository, package scripts, deployment target and module boundaries. Preserve existing analytical code. The boundaries below describe responsibilities, not a mandatory directory migration. Avoid a framework rewrite or new backend platform solely to reproduce the mockups.

## Suggested responsibility boundaries

| Boundary | Owns | Must not own |
| --- | --- | --- |
| App shell | Brand, route navigation, search, account and notification access | Scientific calculations |
| Assessment selectors/service | Region/event/time selection and derived current metrics | Provider-generated prose |
| Map workspace | Real layers, camera, picking, panel padding and attribution | Hardcoded screenshot geometry |
| Evidence registry | Sources, media, temporal/geographic relationships | Fabricated matching photos |
| AI service | Context validation, provider calls, allowed actions and responses | Credentials in client state, live delivery |
| Alert drafts | Audience, message, revision and review state | Implicit changes from later map selection |
| Simulator | Fictional recipients, attempts, timing, outcomes and cancellation | Telecom endpoints |
| Notifications | Internal operator messages and unread state | Resident contact information |
| Session/preferences | Current real/demo identity and local settings | Fake server authorization |
| Compact preview | Mobile assessment presentation using shared selectors | A second independent risk engine |

## State partitioning

### Selection state

Represent region, mode, event/forecast, selected time and community as stable identifiers. Validate dependent selections atomically: switching regions clears invalid event/community IDs, changes the available time range and updates the map coherently. Do not momentarily show Ghana's metrics under Cameroon's title.

Persist/share a compact URL representation where the existing router supports it. Validate URL values and use a safe supported default for invalid parameters. Back/forward navigation should restore a coherent selection. Do not place chats, keys, personal coordinates or message bodies in URLs.

### UI state

Represent the right-hand surface as a mutually exclusive state: none, community, contextual evidence, or assistant. Full Evidence/Alerts routes are separate page views. Map controls calculate their safe area from current layout. Keep list selection, current source, unsaved composer edits and scroll state independent enough to prevent accidental resets.

### Domain state

Assessments, evidence, drafts, conversations, recipients, attempts and notifications have separate identifiers. Drafts capture immutable assessment/message snapshots at review and run start. A simulation results page uses the run's snapshot, not whatever location happens to be selected globally.

### Persistence

Use a versioned, application-specific local namespace for demo preferences, named views, fictional drafts/runs and notifications. Bound retained history and provide explicit clearing where appropriate. Do not store provider keys, auth credentials, real recipient numbers or raw geolocation in demo storage.

For conversations, prefer session memory by default. If current product requirements already persist chats, preserve the existing legitimate mechanism and clearly handle demo-session exit. Catch storage errors, schema changes and corrupted values; recover to defaults rather than crash.

If backend persistence already exists, use it through its actual session boundaries. Do not downgrade an authenticated product to local-only persistence based on old screenshots.

## Shared domain representation

Keep units, nulls, ranges, method labels, source IDs and timestamps with metric values. Avoid bare numbers with UI-invented captions. Use shared formatting for units, approximate values, dates and unavailable states.

Media records should include asset ID, source URL, attribution, known dates, known geographic scope and relationship to the selected community/event. A different community ID must not simply pick a fallback photo by hash and present it as an exact match.

Keep a registry or adapter for current datasets rather than duplicating JSON into every page. Reuse map feature IDs in list rows and AI actions. The compact mobile view and brief export consume the same assessment snapshot as the dashboard.

## Map and rendering lifecycle

- Reuse a map instance where practical. Do not recreate the whole map on every keystroke or chat token.
- Observe container dimensions; resize and update camera padding after panels, headers or breakpoints change.
- Handle layers added after style changes. Preserve selection and data overlays when switching available basemaps.
- Dispose listeners, controls and animation timers on unmount. Provide a recoverable map-load error.
- Keep heavyweight terrain/imagery behind available data sources. Lazy-load expensive routes/analysis modules when helpful.
- Cluster or reduce marker density with existing mechanisms. Keep hit targets usable without inflating flood extent.
- Use selection-driven transitions; avoid continually resetting the camera during playback unless required by the actual feature.

## Server-side AI boundary

Match the existing runtime. A typed adapter can accept context/query and return a validated answer/actions envelope, optionally streaming. Authenticate or constrain access according to the real/demo session model; a public preview must not become an unrestricted proxy to a paid API.

Validate external content, response sizes and source IDs. Log operational errors without keys or sensitive conversations. Respect current provider configuration and handle failures. Document exact environment variable names in the existing example configuration without real secrets.

## Download and sharing behavior

Exports must use real filtered data and current formatting, with source/date/evidence metadata. Restore pending/loading state on success or failure. Downloads are allowed user actions; external publication is not implied.

QR generation needs a configured public app origin and compact route. Do not deploy automatically to satisfy that requirement. If no accessible origin is available, implement local preview and report the configuration dependency explicitly.

## Scope control

Migrate working components incrementally, preserving current changes. Add libraries only for a concrete missing capability and use the existing package manager/lockfile. Avoid importing a large UI kit that overrides the accepted design or duplicating existing icon/date/map utilities. Keep original source calculations reviewable and untouched unless a separately identified bug requires correction with evidence.

## Handoff files produced during implementation

Maintain `IMPLEMENTATION_STATUS.md` and finish with `IMPLEMENTATION_REPORT.md`, plus browser screenshots under a documented local QA directory. Report actual commands and outcomes, known limitations and remaining data/provider configuration. Keep screenshots out of production assets unless they are real application content rather than design references.
