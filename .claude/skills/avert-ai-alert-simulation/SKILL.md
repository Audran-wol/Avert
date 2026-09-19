---
name: avert-ai-alert-simulation
description: Implement Avert's context-grounded AI assistant, reviewed warning drafts, fictional-recipient SMS simulation, and internal notification activity without live message delivery.
---

# Avert AI and alert simulation

Read [AI and simulation contracts](../../../docs/avert-refactor/03_AI_AND_ALERT_SIMULATION.md) and the relevant sections of [screen specifications](../../../docs/avert-refactor/02_SCREEN_SPECIFICATIONS.md). Preserve the shared UI rules in [design system](../../../docs/avert-refactor/01_DESIGN_SYSTEM.md).

## Grounded analysis

Keep the actual risk engine authoritative for computed metrics. An LLM explains available evidence and prepares drafts; do not present its prose as a newly trained or validated flood model.

Capture immutable community/region, mode, event/time, method, metric, source and missing-input context for every request. Display that context. Cancel or discard superseded responses; never attach an old community's answer to a newly selected one. Validate source references and allowlisted map actions against existing records/features.

Provider calls and credentials stay server-side. Do not add client-side secret settings. If unconfigured or failing, expose an honest unavailable/error state and keep manual drafting functional. Scripted examples must be labeled examples. Untrusted source text cannot authorize commands, arbitrary tools or message delivery.

## Draft and simulation contract

Audience, Message and Review are separate functional steps. AI drafts are editable. Final review applies to a specific draft revision; changing message, audience, language or context clears it. SMS preview, length and segment count derive from actual edited text.

**All delivery is simulated. Never send SMS, email, push or other external messages to people while implementing or exercising this feature. Do not enable live sending based on the presence of credentials.**

Use only fictional recipient IDs in demo fixtures. Exposure estimates are not subscriber counts. Preserve DEMO in simulated resident messages and distinguish historical exercise context from present forecasts.

Implement deterministic run/attempt state with stable IDs. Counts derive from recipient outcomes and reconcile at each snapshot. Retry creates additional attempts for eligible failures without inflating unique recipients. Cancel pending work correctly. Dispose timers/listeners. Refresh, unmount and end-session behavior must follow the documented interruption/resume policy.

Use Run simulation and Simulate retry labels. Results and exports must identify all outcomes as simulated. Do not fabricate read receipts or claim real telecom partnerships.

## Operator notifications

Keep internal notifications separate from resident delivery records. Link them to specific run/context IDs, deduplicate completion events, track read status and respect future-event preferences. Notification clicks must resolve to the right detail screen or a clear missing-target state.

## Verification

Verify context-switch cancellation, missing provider, source-ID validation, reviewed-draft invalidation, duplicate-click protection, deterministic outcomes, retries, cancellation/refresh, SMS preview agreement and internal-notification deduplication. Confirm no live-send network path is invoked. Use meaningful tests for these invariants and browser inspection for the composer/results/assistant states.

Keep all visual details consistent with references R4–R6 while correcting their illustrative content and stepper/counter mistakes. Record actual validation outcomes; do not claim provider connectivity or delivery behavior that was not exercised.
