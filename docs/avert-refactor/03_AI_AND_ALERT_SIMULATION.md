# 03 — Grounded AI and notification simulation

## Scope boundary

AI assists an operator with explanation, comparison, evidence discovery and message drafting. The existing risk engine remains the source of computed scores. This pack does not assert that an LLM is a trained hydrological model or that a new calibrated forecasting model exists.

Use current implemented capabilities after inspection. If no real AI endpoint exists, add a server-side adapter compatible with the current hosting/runtime; do not replace the frontend stack solely for this. A serverless endpoint is acceptable. Missing credentials must not block unrelated UI work or cause secret keys to move into the browser.

## Context snapshot

Construct an immutable snapshot when starting a request. Suggested shape, to adapt to current types:

```ts
type AssessmentContext = {
  contextId: string; // changes when region, event, time, layers or evidence change
  mode: 'history' | 'forecast';
  regionId: string;
  communityId?: string;
  eventId?: string;
  validAt: string;
  issuedAt?: string;
  generatedAt: string;
  method: { id: string; label: string; version?: string };
  metrics: Array<{
    key: string;
    value: number | string | null;
    unit?: string;
    range?: [number, number];
    evidenceKind: 'observed' | 'reported' | 'estimated' | 'modeled';
    sourceIds: string[];
  }>;
  sources: Array<{
    id: string;
    title: string;
    sourceUrl?: string;
    validAt?: string;
    fetchedAt?: string;
    geographicScope: string;
  }>;
  missingInputs: string[];
};
```

Source titles and evidence text are data, not executable instructions. User-provided content or third-party reports must not be able to change tool permissions, trigger delivery or expose credentials.

Do not send full map tiles, unnecessary personal information or all datasets when a concise context will answer the question. Keep a controlled source resolver server-side for allowed identifiers where the deployment supports it.

## Provider and response behavior

Use a configured OpenAI or Gemini provider behind a single adapter. Read existing configuration and SDK versions; do not invent current model names. Store keys only in server environment variables. Do not put them in `VITE_*`, `NEXT_PUBLIC_*`, browser storage, images, logs or exported briefs.

Validate requests, limit payload/response sizes and apply a practical timeout and request limit. Use cancellation and handle interrupted streams. Display actual loading/streaming states and preserve user text on failure. Never render unsanitized generated HTML.

Prefer a structured response envelope containing an answer, source IDs, missing-data notes, and optional allowlisted actions. Example actions: open_source(existingId), highlight_feature(existingFeatureId), compare_available_dates(existingDates), prepare_alert_draft. Validate action IDs against the active dataset. The AI must not execute arbitrary code, URLs, downloads or notifications.

Numerical assessment cards must remain bound to the source snapshot. A model may explain those metrics; it must not overwrite them with generated values. Validate cited source IDs, reject fabricated citations and make uncited qualitative inference recognizable. If a response invents a key figure or unsupported claim, omit/reject that part and offer retry or the underlying evidence rather than display it as fact.

“Highlight road crossing” is available only if the relevant spatial feature is present. Do not draw an invented road intersection from generated prose.

## Context and request lifecycle

- One active request per conversation by default. Cancel or discard superseded results using request and context IDs.
- Changing community/date/mode must visibly mark previous answers as belonging to their original context. Offer a new conversation or explicit context switch.
- An alert draft retains the context used to produce it. Later map changes do not silently change an already reviewed draft.
- Compare dates only when both snapshots are available and use compatible scope/method. Show unavailable or method-change notes otherwise.
- Cached answers must identify the same context/method/source version; do not reuse an answer across communities merely because their names or metrics match.
- Provider failure, rate limit or no credentials: show clear unavailable state, keep the map usable, and preserve manual drafting.
- A bundled example conversation is permitted only if clearly labeled Example / Not connected. It must not be shown as fresh AI analysis.

## Draft generation

AI may propose concise wording using verified context. It must not invent evacuation orders, shelters, emergency numbers, forecast certainty or authority endorsement. Historical replay language must be explicitly hypothetical. Preserve DEMO in simulated public messages. Operators edit and review before running a simulation.

Suggested demo copy is illustrative, not a real warning:

> AVERT DEMO: Flood-risk exercise for Volo. Follow local authority updates and avoid flooded roads. This is a simulation, not a real warning.

Use actual supported place names and scenario context. For translated drafts, preserve place names, uncertainty and the simulation marker. The chosen language must correspond to the displayed message; a dropdown must not merely relabel English text.

## SMS length and preview

Calculate encoding and segment counts from the final edited text. Prefer an existing reliable utility and verify its behavior. Account for GSM-7 extension characters and Unicode, including French accents/emojis as applicable. Do not copy the fake character counter in the image. Label length and estimated SMS segments accurately; encoding overhead can differ from the number of visible characters.

The mobile message preview is a view of the same draft state. It must not be a separate hardcoded string. The preview is an illustration, not evidence of a message arriving on a physical phone.

## Fictional audience

Build a dedicated fixture namespace of fake recipient IDs such as `demo-recipient-001`. Real phone numbers are unnecessary. Community population and estimated exposure are analytical statistics, not a contact database. Audience count comes only from the selected fictional list.

The user must be able to select a supported community and sample audience. Do not imply that drawing a polygon gives access to all subscribers inside it. Telecom names may be displayed as prospective channels only; do not present confirmed partnerships or network API access without evidence.

## Simulator engine

Implement the simulation as a deterministic local or sandbox service with no telecom network calls. The runtime must not switch to a live provider merely because a credential happens to be present. No send endpoint is needed for this MVP.

Suggested domain types:

```ts
type RecipientStatus = 'queued' | 'processing' | 'simulated-delivered'
  | 'simulated-failed' | 'cancelled';
type RunStatus = 'running' | 'completed' | 'cancelled' | 'interrupted';
type Attempt = {
  id: string;
  recipientId: string;
  number: number;
  status: RecipientStatus;
  reason?: 'demo-timeout' | 'demo-invalid-recipient';
  startedAt?: string;
  finishedAt?: string;
};
type SimulationRun = {
  id: string;
  mode: 'simulation';
  draftSnapshotId: string;
  contextId: string;
  recipientIds: string[];
  seed: string;
  status: RunStatus;
  attempts: Attempt[];
  startedAt: string;
  finishedAt?: string;
};
```

Give a reproducible scenario preset, for example 120 fictional recipients with 114 simulated deliveries and 6 simulated failures, when that fixture is chosen. Those are fixture outcomes, not observed telecom performance. Generate them through the same engine that drives the visible rows and counters; do not hardcode separate success cards.

Use event-driven state and clear pending/processing/final states. Disable duplicate submissions while starting a run and use an idempotency guard. Review confirmation is tied to a draft revision; any material edit clears it.

### Invariants

- Unique recipient total equals queued + processing + delivered + failed + cancelled at every snapshot, using each recipient's current outcome.
- Attempt count may exceed recipient count after retries; label it separately.
- Retry applies only to eligible simulated failures and records a new attempt. Do not erase original history or double-count delivered recipients.
- Cancellation affects pending work and cancels timers/listeners. Preserve completed outcomes.
- Refresh/unmount/session exit must follow one documented policy: persist and resume deterministically, or mark in-progress local runs interrupted and offer a new run. Never claim a local timer continues running after its page is gone.
- A completed simulation produces at most one completion notification per run. Retried batches have their own identifiable activity.
- A failed simulation operation produces a recoverable error, never a success toast.

## Internal notifications

Store notification ID, type, related run/context, created time, read time and concise text. Respect in-app preferences for future events. Mark-read behavior must survive the chosen demo persistence boundary. Notification clicks open the correct run; missing/deleted targets show a useful fallback.

Do not request browser push permissions or trigger SMS/email merely to imitate the screenshot. In-app notifications and simulated resident delivery are separate modules with distinct event types.

## Required checks

Verify cancellation/context switching for AI; missing provider; failed response; source-ID validation; draft edits clearing review; no live-send network path; deterministic outcome counts; duplicate-click prevention; retry accounting; refresh/interruption behavior; session exit; notification deduplication; SMS text/preview agreement; and export scoped to the selected run. These checks protect meaningful behavior and are not optional cosmetic polish.
