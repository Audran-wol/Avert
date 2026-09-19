# 00 — Implementation contract

## Product and outcome

Avert is a disaster-intelligence startup with a working flood-focused MVP for supported areas of Ghana and Cameroon. Future hazards, including landslides, are part of the vision. This assignment upgrades the operational application for a competition demonstration and continued development. The goal is an impressive, coherent, usable product; claims of operational coverage must reflect actual implementation.

The approved visual language is the dark geographic Monitor image and seven matching screen references. Earlier pale dashboard mockups were rejected and are not design inputs.

## Authority and conflict resolution

Apply these rules within existing repository and execution permissions:

1. The user's explicit requirements, including preservation of the existing logo, govern the refactor.
2. Current verified application behavior, source data, geographical geometry and evidence provenance govern factual content.
3. This written pack governs interaction behavior, corrections, responsive behavior and scope.
4. Approved references govern visual composition, proportions and material treatment where compatible with 1–3.
5. External design skills provide supporting judgment. They must not override the accepted direction or introduce their own templates.

If a reference shows a fabricated value, a different logo, impossible geography, clipped copy or a nonfunctional control, implement the correct behavior and preserve its visual intent. Record significant deviations. A corrected caption is appropriate; a completely different layout requires a concrete technical or usability reason.

## Non-negotiable requirements

- **Reuse the original Avert logo asset/component from the CURRENT repository.** Preserve shape, wordmark, proportions, colors and clear space. Use an existing dark-surface variant if available. Do not edit logo path data, substitute wave art, or crop a logo from a reference.
- Inspect the current repository and any applicable instructions before modifying code. Other agents may have added auth, APIs, imagery and forecasts since earlier screenshots.
- Preserve functioning region selection, history, forecasts, community search, layers, playback, source inspection, briefs, demos and analysis. Reorganize controls without removing these capabilities.
- Preserve actual map coordinates, geometries, projections, event dates and calculations. A UI refactor does not authorize changing scientific logic to resemble a picture.
- Keep historical and forecast states explicitly distinguishable. Label modeled, estimated, reported and observed information correctly.
- Implement actual stateful interactions. No dead buttons, empty routes presented as complete features, pretend exports, nonfunctional searches or hardcoded success toasts.
- Reuse the map renderer and analytical modules wherever feasible. Do not rebuild a functioning map stack to gain a visual effect.
- Use contextual AI backed by a configured server provider, or an honest unavailable/demo state. Never pretend a fixed script is live AI.
- Resident notification delivery is simulation only. No external telecom calls or messages are authorized by this pack.
- Preserve existing login styling; connect it to the app shell. Retain real authentication if already implemented. Otherwise identify demo access accurately.
- Keep the public marketing website outside this refactor unless necessary to repair a broken app link.

## Scope

| Area | Required result |
| --- | --- |
| App shell | Responsive dark header, navigation, search, contextual Ask Avert, notifications and account access |
| Monitor | History and Forecast, actual map layers, community inspection, sources, playback, analysis, briefs |
| Communities | Search/filter/sort list, map synchronization, selection, exports and saved views |
| Evidence | Photo and source relationships, layers, reports, provenance and honest empty states |
| Ask Avert | Context-aware conversation, source references, map actions and alert-draft handoff |
| Alerts | Draft/history list, three-step composer, recipient preview, simulated runs, results and retries |
| Notifications | Operator activity, unread states, settings and links into simulations |
| Account | Current identity or demo profile, preferences, saved regions, session exit |
| Compact community preview | QR-linked mobile view using existing assessment data, manual location selection and optional geolocation |

No new landslide prediction engine, billing system, organization invitation system, trained flood model, live telecom integration or data-acquisition campaign is required. Existing implementations of these must not be deleted blindly; inspect first and preserve authorized functionality.

## Repository reconnaissance deliverable

Create `IMPLEMENTATION_STATUS.md` beside this file. Record:

- Current branch/worktree, existing uncommitted changes, commands available from the package scripts.
- Exact paths for the original logo, app entry, route setup, state stores, map, risk calculations, evidence registry, auth/session, API adapter and exports.
- Existing data providers, feature availability and recent additions that affect this plan.
- A feature-preservation checklist and the baseline build/typecheck status.
- Reference image availability and any missing dependencies or credentials without printing secrets.

Earlier context suggested React, TypeScript, Vite, MapLibre, Turf and Zustand. Treat that as a starting hypothesis only. Do not invent file paths from it.

## Delivery sequence

1. Audit and baseline. Identify original brand assets and verify all references can be viewed.
2. Build shared tokens and shell, then Monitor with one selected community. Render and compare it before spreading the design.
3. Preserve History/Forecast transitions, map controls, responsive inspector and playback. Resolve layout regressions now.
4. Implement Communities and Evidence on the same state/model.
5. Add contextual Ask Avert and its provider/unavailable paths.
6. Implement Alerts home, composer, simulated delivery results and operator notifications.
7. Implement account, preferences and compact QR-linked preview. Reuse any existing versions rather than duplicate them.
8. Run the visual and functional gates; fix concrete issues; produce the completion report.

Continue autonomously through routine reversible choices. Ask only when a truly missing decision blocks work; continue independent tasks meanwhile. Do not pause after every screen to request approval.

## Completion reporting

Provide a concise report with completed scope, changed modules, baseline versus final checks, screenshots, discrepancies resolved, deviations from references and integration limitations. Distinguish implementation, browser verification and untested behavior.

Inspect `.gitignore` before claiming this handoff is tracked. Earlier project notes mentioned Markdown exclusions. If needed, add narrow exceptions for these docs/skills rather than removing unrelated ignore rules. Preserve unrelated work; do not force-push or publish as part of this assignment.
