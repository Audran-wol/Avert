# 02 — Screens and interaction specification

## Shared rules

All routes share the approved dark design system, original logo, readable type, consistent buttons, source semantics and local/remote loading states. Paths below are conceptual route names; adapt to the current router without changing stable public links unnecessarily.

Every exposed action must work, have a real disabled reason, or be removed until implemented. A mocked screenshot is not an implementation. Every page needs loading, empty, unavailable and recoverable error behavior appropriate to its data.

## 1. Monitor — reference 01

**Job:** understand a selected event or forecast and inspect an affected community.

Keep event selection, region switching, layers, community search, map navigation, source inspection, playback, existing analysis and brief generation. Identify the preserved features in the audit before redesigning their controls.

### History

- Consolidate country, region/basin, event and selected date in the context bar. Supported areas include Lower Volta, White Volta, Far North/Logone and Douala when present in current data.
- Show event title and a compact metric strip. Metrics must use the current scene/date unless explicitly labeled as event totals. Do not present cumulative displacement as current exposure.
- Provide play/pause, scrubber, current time and event date range. Do not infer values between timestamps unless the existing model supports that interpolation.
- Do not draw decorative rainfall bars. Use a real aligned rainfall series with units and source; otherwise use plain time ticks.
- Fit the event on initial selection while respecting panel space. Clicking a community centers it appropriately and opens the inspector.

### Forecast — derived screen, no dedicated mockup

Keep the same shell and inspector geometry. Replace the history context with forecast issue time, valid window and selected horizon supported by the current provider. Display rainfall and local susceptibility inputs with their timestamps. Show data age and incomplete-input states. Do not retain history dates as though they were forecast timestamps.

Keep heuristic risk labels separate from calibrated flood probabilities. Reuse the existing method; do not silently change thresholds, calculations or prediction behavior. If a trained model now exists, inspect its actual output contract and provenance before labeling it.

### Community inspector

Order: name/location; selected date and evidence state; compact exposure and priority; source-aware photo if available; road access and other important facts; explanation; actions. Keep existing water-depth, nearest-location, population and priority-factor information accessible through details when supported.

Clearly distinguish response priority from probability. A nearby town must not be called a verified safe destination unless the data supports that status. Show units and estimation ranges where provided.

Tabs: Overview and Evidence. Ask Avert replaces the inspector content slot when opened. Closing it restores the prior selection and focus. Draft alert opens the composer with a snapshot of the assessment; create brief exports the selected context with source/date labels.

## 2. Communities — reference 02

**Job:** compare communities and choose the next one to inspect.

- On wide screens, use the reference's table/map split; selecting a row updates the pin and preview. Selecting a pin updates the row and scrolls it into view without unexpected page jumps.
- Provide actual search, region/event scope, priority/access filters, stable sortable columns and empty-filter reset.
- Show community, estimated exposure, road status and priority. Preserve numeric ranges in details. Missing values display Unknown or Not available, never zero.
- Open assessment navigates to Monitor with the selected context intact.
- Export list must export the filtered records with units, selected event/date, evidence type and source identifiers. Protect spreadsheet exports from formula interpretation in text fields.
- Save view persists a compact named filter/view configuration, not a copy of a large data feed. Provide reopen and delete. Store locally for demo access.
- On small screens use readable row summaries and an explicit List/Map switch.

The extra community values in the generated image are illustrative. Use actual supported records only.

## 3. Evidence — reference 03

**Job:** verify what an assessment is based on.

Tabs cover photographs, mapped layers and reports. Search/filter scope must match the chosen region and event. Keep media source URL, attribution, license/usage metadata, capture/publication date, geographic relationship and verification state available.

Use explicit relationship labels: This community; Same event, nearby location; Regional reference; Illustrative image. Never present a regional image as proof of an exact community or timestamp. Exact matches appear first. If a source lacks coordinates or a date, say so; do not fabricate precision.

The main viewer should support accessible thumbnail selection and optional enlargement. Render image loading/error states with a stable aspect ratio. Deduplicate by canonical source/asset identifier and, where available, media hash. Reusing a regional asset across places is allowed only with its relationship clearly visible.

Opening a mapped layer shows its metadata and can activate it on Monitor. Opening a report goes to the actual document or source; missing URLs produce an honest unavailable state.

Report a mismatch records a local feedback item in the demo and confirms that scope. It must not silently email a source or claim a support ticket was sent. If no feedback persistence is implemented, omit that action rather than fake it.

## 4. Ask Avert — reference 04

**Job:** help an operator reason about the active data.

Use a drawer/inspector slot opened from the header or a contextual action. Preserve map context. Display the active community/region, event or forecast and time. Include clear action to update the context after the user changes selections.

Required actions: ask a question; cancel a running response; retry an error; open cited sources; highlight an existing map feature; prepare an alert draft; start a new conversation. Display an unavailable state when no provider is configured. Source-grounded cached or scripted examples require a visible example label.

Suggested prompts should be executable against available data, such as explaining priority or summarizing evidence. Show Compare dates only when comparable snapshots exist. Keep conversation history scoped to context and session; never show an old answer as the current assessment.

Use the behavior and validation contracts in [03_AI_AND_ALERT_SIMULATION.md](03_AI_AND_ALERT_SIMULATION.md).

## 5. Alerts home — derived screen

**Job:** resume drafts and inspect prior simulation runs.

Use the dark shell with Alerts selected. Show a compact title, New simulation action and tabs Drafts / Simulations. A table or readable list includes name, community/region, last update, state and available action. Support open, duplicate draft, delete local draft and inspect run. Destructive actions should be clearly labeled and recoverable where practical.

Initial empty state explains how to select a community and prepare a message. New simulation can select existing context or require explicit selection. Preserve multiple drafts and runs with stable IDs; do not overwrite the latest run globally.

## 6. Composer — reference 05

Implement three real steps. The reference mixes step labels and final actions; correct that behavior.

| Step | Contents | Primary action |
| --- | --- | --- |
| Audience | Assessment snapshot, community selection, fictional recipient list and supported preview channel | Continue to message |
| Message | Editable draft, AI drafting when configured, language, accurate SMS length/segment preview and resident phone preview | Review simulation |
| Review | Final audience, message, scenario date, demo gateway and explicit review confirmation | Run simulation |

Back navigation preserves the draft. Editing message, audience, language or assessment after review clears the confirmation. Save draft works throughout. Selection on a map never means permission or ability to contact every resident in that area.

Use a fictional sample subscriber list. Example recipient counts are not the population-exposure estimate. SMS is the required channel. Do not add enabled voice/WhatsApp options without a functioning preview implementation.

Keep Simulation mode visible; the primary action must never be labeled Send now. A historical event is a scenario replay, not a current warning. The simulated SMS itself must include an unmistakable DEMO marker. Phone preview and editor must use the same message value.

Do not copy the mockup's developer-facing instruction about equating contacts and exposure into the interface. Replace it with concise copy such as “120 fictional recipients”. Calculate character and segment counts; the mockup's count is not authoritative.

## 7. Results and operator notifications — reference 06

**Job:** inspect one simulation and understand its activity.

Display run identifier, message snapshot, community, scenario context, start/finish time and explicit simulated scope. Show totals for pending, simulated delivered, simulated failed and cancelled when present; counts must reconcile.

Recipient outcomes need filtering/pagination and stable fake recipient IDs. No real phone numbers are required. Search and export use the selected run. Do not implement SMS read receipts or delivery guarantees from simulated acceptance states.

Simulate retry targets eligible failures and creates recorded additional attempts. Preserve the original result and don't inflate unique-recipient totals. Show progress and allow cancellation while pending work exists. Keep completed outcomes intact after cancellation.

The bell opens operator notifications: draft saved if useful, simulation completed, simulated failures and relevant data-load errors. Notification clicks navigate to the exact run/context. Support mark read, mark all read and sensible deduplication. They are internal application notifications, separate from resident SMS previews. A notification drawer must reserve space or intentionally overlay with proper focus, never collide with map controls.

## 8. Account — reference 07

Use the reference's dark settings layout and existing logo. The map banner is decorative context with no required scale/coordinate claim. Do not ship a generated map as a geographic source.

For demo access, show Demo operator, Demo workspace and Preview access. Allow a local display name and saved regions. Email is disconnected/read-only unless real auth provides it. Do not imply local profile changes alter server permissions.

If real authentication exists now, preserve the authenticated identity and actual sign-out behavior. Do not replace it with a pretend identity. Use the app's existing session contract.

End demo session clears session-scoped selection, private conversations and active work according to the declared persistence policy; preserve saved preferences where intended. Warn about unsaved edits with a meaningful choice, then return to login. Never leave a simulated run accidentally executing after the session ends.

## 9. Preferences — reference 08

Map appearance options must correspond to available basemaps. Disabled/unavailable terrain is preferable to a broken source. Preview should be a lightweight representative map view; do not copy the generated video's timestamp controls.

Support default region, implemented language options, units, reduced motion, remembered view and internal simulation notification preferences. Language changes must translate real UI content; do not offer a language that changes only the dropdown. All displayed units must follow the selected convention consistently.

AI preferences may control whether selected context is attached and whether explanations are requested automatically. Auto-generation defaults off; debounce/context-cache it if enabled. Turning context off must not silently send it anyway. Credentials are never editable client-side profile values.

Use explicit Save preferences and Reset defaults; indicate unsaved changes. Persist and rehydrate with a versioned schema. Notification preferences affect subsequent in-app notifications, not resident deliveries.

## 10. QR-linked compact community preview — derived screen

This carries forward the requested mobile demonstration. It is deliberately simpler than desktop Monitor.

- Generate a QR from a configured, publicly reachable application origin and an actual compact route. Never use localhost as a phone-accessible link or expose secrets in it.
- A phone view opens an explicitly marked demo/assessment page. Offer manual supported-community selection and optional user-triggered geolocation.
- Geolocation requires an explicit action, handles denied access and does not need raw coordinates persisted in local storage or analytics.
- Show honest loading, then selected location, assessment time, risk/category as supported, a short grounded explanation, evidence summary and practical information from the existing content.
- Outside supported coverage, say No assessment available. Do not map any arbitrary location to the nearest flood and claim it applies.
- Reuse the assessment service used by desktop. A brief loading state is acceptable; artificial “AI scanning” must not imply an unperformed computation.
- Optional Simulated SMS preview opens the same fictional warning template with DEMO marker. It does not subscribe the device or send a message.
- Without a reachable origin, the desktop displays configuration-needed state and a local preview link. A QR visual alone is not proof of cross-device access.

## 11. Brief/export and other preserved functions

Keep existing reports and source registry reachable. Generated briefs must include scope, date, method/evidence labels and source links. Do not export raw chat claims as verified measurements. Account dropdown, help/guided demo and return-to-login paths should work from every main route. Preserve active context when navigating among operational pages.
