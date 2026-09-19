# 05 — Visual and functional acceptance gates

## Definition of done

A build is not enough. The running product must reproduce the approved hierarchy and support the specified journeys. Use a browser-capable tool available in the implementation environment. If browser execution is blocked, report that fact and do not claim visual verification or complete fidelity.

## Baseline before editing

Record the current build/typecheck/test commands from package scripts and run the relevant baseline. Capture the existing Monitor state and list existing functional features. Identify any pre-existing failures separately from introduced regressions. Do not silently relabel an environment failure as a passing check.

## Reference comparison procedure

1. Open the approved PNG for the screen. Verify its actual dimensions and set the browser screenshot to the same viewport or document proportional scaling.
2. Use a fixed supported region, event and selected time. For dynamic imagery, wait for map readiness and compare UI composition independently of tile variation.
3. Capture the running page, not a code-generated stand-in. Inspect it side by side with the reference; overlays/crops can help where available.
4. Inspect in this order: logo; major regions; map prominence; typography; panel width/position; action hierarchy; spacing; borders/colors; icons and small metadata.
5. Fix the largest visible discrepancy, recapture the affected state and repeat until concrete differences are resolved or justified. Do not stop at a rough first pass.
6. Record material departures and their reasons. Actual geography, current data, accessibility and responsive correctness are valid reasons; implementation convenience alone is not.

Do not calculate a misleading overall pixel-similarity percentage across changing maps. No one should be able to mistake the result for a different template just because the colors are similar.

## Required visual captures

| State | Essential evidence |
| --- | --- |
| Monitor, event overview | Header, summary, map, legend and playback aligned |
| Monitor, community selected | One inspector, active marker visible, controls unobstructed |
| Forecast | Correct valid/issue time, actual data state, no historical date confusion |
| Communities | Filtered list and corresponding selection on map |
| Evidence | Media match scope, metadata and missing-photo state |
| Ask Avert | Active context, source references, loading/error or unavailable state |
| Alerts home | Real saved draft/run or useful empty state |
| Composer | Audience, Message and Review step states; phone preview matches text |
| Simulation results | Consistent recipient counts, failures, retry and notification activity |
| Account / Preferences | Current logo, real/demo identity, usable form states |
| Compact phone preview | Assessment, coverage and historical/demo label readable |

At minimum capture the main desktop style near 1600×1000, a 1366×768 laptop layout, a 1024×768 compact layout, and a 390×844 phone flow. Prioritize desktop maps and phone composer/account/compact preview. Also check essential controls at 200% browser zoom without losing access to them.

## Zero-tolerance visual defects

- Generated replacement logo or recolored original mark.
- Map controls, timeline, legend, credits or notification drawer unintentionally covering important content.
- Text cut off with no way to read it, horizontal page overflow on forms, hidden buttons or inconsistent panel scrolling.
- Broken images, empty map tile areas with no recovery, misaligned field labels or jumpy layout during media loading.
- Hover-only navigation, invisible focus, color-only risk meaning or unreachable close buttons.
- Entire mockup embedded as an image with pretend hitboxes.
- Generated basemap geography or decorative fake scientific readings presented as operational data.

## Functional acceptance matrix

| Journey | Required result |
| --- | --- |
| Enter and exit session | Login/demo entry reaches app; ending session returns appropriately and stops active local operations |
| Switch Ghana to Cameroon | Context, list, map, metrics and sources all update coherently |
| Switch History to Forecast | Correct state/time model; historical metrics do not leak into forecast |
| Playback and scrub | Map/summary follow available timestamps; pause actually stops progression |
| Select row/pin/search result | Same community ID across all views, appropriate camera fit and details |
| Open AI then switch community | Old request cannot populate new context; prior chat remains labeled correctly |
| Provider missing/fails | Honest unavailable/error state, retry where appropriate, manual work remains usable |
| Source action | Cited item resolves to the actual registered source or explicit unavailable state |
| Edit reviewed draft | Review confirmation is reset; running requires reviewing the changed version |
| Run simulation | No external-send calls; counters derive from actual simulated recipient states |
| Retry/cancel/refresh | Attempt history and counts remain coherent; interrupted state follows documented policy |
| Open notification | Correct run opens; unread count and read state update without duplicates |
| Save preferences | Values rehydrate and actually affect UI; Reset defaults works |
| Evidence mismatch/no image | Clear regional/unknown/empty state; no unrelated image passed off as local proof |
| QR/mobile location | Reachable configured link where available; permission denial and unsupported area handled honestly |
| Export | Correct scope/data, working file, correct source/date/simulation labels |

## Focused tests

Add or extend meaningful tests around context invalidation, draft review revision, deterministic simulation/retry/cancel accounting, source validation and persistence migration when these behaviors are introduced. Reuse existing tests for analysis. Do not add brittle tests that assert CSS strings or merely duplicate implementation logic.

Run the repository's typecheck/build and relevant tests after implementation. Check browser console/network for introduced exceptions and failed assets. For simulation, inspect network activity or service boundaries to demonstrate there is no live-send integration. Resolve failures tied to this work; describe remaining pre-existing/environmental blockers accurately.

## Completion report checklist

- Exact original logo component/path retained.
- Scope checklist marking implemented, verified, unavailable or deferred with reason.
- Reference and actual-browser screenshot paths, including responsive states.
- Commands run and honest outcomes.
- Known reference corrections and visual departures.
- Provider/data/public-origin configuration requirements, without secrets.
- Any functionality changed or preserved differently from baseline.

Do not report “pixel perfect”, “production ready”, “100% accurate” or “fully tested” without evidence appropriate to that claim. State the concrete completed checks instead.
