# 06 — Approved visual references

## Authoritative set

These eight PNGs are included under `references/`. They are the approved dark geographic direction, not the previously rejected light dashboard concepts. Open the relevant image before implementing its screen.

| ID | File | Screen and visual role |
| --- | --- | --- |
| R1 | [01-monitor.png](references/01-monitor.png) | Primary art direction: dark terrain map, compact metrics, one community inspector, playback |
| R2 | [02-communities.png](references/02-communities.png) | Community list/map split; operational header with Ask Avert and notifications |
| R3 | [03-evidence.png](references/03-evidence.png) | Media viewer, thumbnails, match scope and source detail |
| R4 | [04-ai-assistant.png](references/04-ai-assistant.png) | Contextual chat in the inspector slot, source references and map/draft actions |
| R5 | [05-alert-composer.png](references/05-alert-composer.png) | Message editor and resident phone preview |
| R6 | [06-simulation-results.png](references/06-simulation-results.png) | Outcome accounting and internal activity/notification drawer |
| R7 | [07-account.png](references/07-account.png) | Profile, saved regions, current workspace and session controls |
| R8 | [08-preferences.png](references/08-preferences.png) | Map appearance, defaults, AI preferences and notification settings |

## Interpret references correctly

The images are visual design targets, not source data, completed application screenshots or ready-to-use interface assets. Build semantic components and real interactions. Do not ship these PNGs as page backgrounds or use their maps/photos as flood evidence.

Preserve composition, dark surfaces, spacing, typography hierarchy, selected-state treatment and action emphasis. The following corrections are expressly required and are not violations of fidelity.

## Mandatory corrections and normalization

1. **Logo:** every image contains generated brand artwork. Reuse the current repository logo exactly instead. This is the highest-priority image exception.
2. **Geography:** rivers, terrain, labels, coastlines, country proportions and community locations in generated maps can be wrong. Use actual geographic data and the current map engine. Decorative account banners must not be presented as authoritative maps.
3. **Metrics:** exposure, priority, area and list values are sample values. Bind UI to actual data, source labels and units; never copy a count just to match a screenshot.
4. **Photos:** the generated flood images are illustrative. Use actual licensed/provenanced application media for evidence, or a clearly labeled illustration/empty state. Never attach a generated photo to a real incident as proof.
5. **Header:** use one shared header implementation. R2 gives the intended global Ask Avert/bell/profile access. Normalize small differences in icons, button style or ordering across R1–R8.
6. **Chat:** sources must resolve to real registry entries. Do not copy the example conversation as a live answer. Source cards and suggested actions appear only when supported.
7. **Composer:** R5 shows an inconsistent stepper with a final action while Message is selected. Implement Audience → Message → Review, with Run simulation only on Review. Remove any leaked developer instruction from the audience helper. Compute the actual message/segment count.
8. **Simulation:** R6's delivery counts and 95% describe an optional deterministic demo fixture. Derive all displayed counts from the run. Do not copy the percentages into production analytics or report simulated outcomes as real.
9. **Preferences:** R8's miniature preview resembles a video player. Implement a static/lightweight map preview; add playback only if the actual preference preview genuinely needs it. Region labels must use verified geographic names.
10. **Layout:** improve generated text clipping, inconsistent spacing, unnecessary scale bars on decorative images and accessibility defects. Keep corrected copy concise and human-readable.
11. **Missing screens:** derive Forecast, Alerts home, composer steps 1/3, notifications full view and QR compact preview from the same design system. They do not require invented reference images or a new visual theme.
12. **Scientific marks:** background rainfall bars, outlines and scan effects must correspond to actual data or be omitted. The screenshot's appearance does not authorize a fake live sensor state.

## Comparison guidance

Use R1 for overall character, R2 for shared header consistency and each relevant reference for page-specific organization. Inspect actual image dimensions; do not rely on a thumbnail. On laptop/mobile widths adapt layout according to the written responsive contract rather than cropping the desktop composition.

The archive's `REFERENCE_CHECKSUMS.json` records original packaged file dimensions and SHA-256 hashes for handoff integrity. It is not a visual-similarity score.
