# 01 — Design system and visual fidelity

## Design intent

The geography is the main visual feature. The app should feel like a carefully made earth-observation workspace: detailed terrain, controlled flood overlays, clear data and quiet controls. Use the approved Monitor reference as the visual foundation; use later references for screen-specific layouts. Do not convert it into a conventional pale dashboard or a science-fiction control room.

### Brand lock

Use the current repository logo, including its wordmark if combined. The images contain a generated wave mark that must be ignored. Resolve the asset path once, share the existing brand component across routes and record the chosen path in the status document. Do not use CSS filters to recolor it. If contrast is poor, change its containing surface or use an existing approved variant.

## Starting tokens

These are implementable starting values, not sampled guarantees. Tune subtly through browser comparison while preserving accessible contrast.

| Token | Value | Use |
| --- | --- | --- |
| canvas | `#08141D` | Application background |
| surface | `#0D1B25` | Primary panels and header |
| raised | `#142530` | Selected/raised surfaces |
| field | `#10212C` | Inputs and secondary controls |
| border | `#2A3D4B` | Control boundaries and dividers |
| text | `#F3F6F8` | Main readable text |
| secondary | `#B7C7D4` | Secondary content |
| muted | `#8EA5B7` | Metadata, subject to contrast checks |
| action | `#1677F8` | Active navigation, primary actions and focus |
| flood | `#65B6E9` | Flood geometry, translucent where appropriate |
| priority | `#F5B94D` | Priority and selected community emphasis |
| danger | `#F28B82` | Failure or severe state where data supports it |
| success | `#36BFA4` | Successful simulated delivery, accompanied by text |

Do not spread bright accent colors across every card or icon. Selected-map color does not imply danger; distinguish selection from status through shape/outline and labels.

## Typography and spacing

- Inspect the existing font and reuse it if it achieves the reference's clean, compact sans-serif character. Otherwise select one available, licensed sans family and document the choice. Do not introduce several ornamental fonts.
- Page headings: approximately 28–36 px, weight 600–650; compact community titles: 22–26 px.
- Body and form controls: 14–16 px; supporting text: 12–13 px; avoid essential text below 12 px. Generated image text is not a font specification.
- Use tabular numerals for changing counts and table values. Keep units, approximations and uncertainty ranges readable.
- Use a 4 px spacing base. Common gaps: 8, 12, 16, 24, 32. Panel padding usually 20–24 px on wide screens.
- Control height: 40–44 px, larger touch targets on compact layouts. Form labels remain visible independently of placeholders.
- Corners: panels 12–16 px, controls 8–10 px, compact badges 6 px. Do not turn every element into a pill.
- Panels use subtle borders, mostly opaque fills and a shallow shadow. Blur is optional and slight; text must not sit directly over busy map imagery.

## App shell

At wide desktop widths use a roughly 56–64 px header: existing Avert logo left, primary navigation Monitor / Communities / Alerts / Evidence, then Ask Avert, operator notifications and profile. Use a fine blue active indicator. Do not add a permanent thick sidebar to Monitor.

Use a roughly 44–48 px secondary context bar only where event context is needed. Consolidate country/basin, History/Forecast, applicable event/forecast time and evidence state. Keep community search easy to access without duplicating it on every bar.

Account and preferences use the same header plus their local settings navigation. They do not inherit an irrelevant History/Forecast toolbar.

## Monitor composition

- The map fills the remaining viewport after header/context bars. It must be an interactive geographic renderer, never a generated image or video background.
- Event title and compact metrics sit in the upper-left safe area. Keep them small enough to expose the map; collapse secondary summary details when needed.
- A community inspector occupies one right-side slot, typically 340–400 px wide. Ask Avert and contextual evidence reuse that slot; they do not stack on top of each other.
- In wide views an inset inspector may float visually, but map camera padding, click regions and controls must account for it.
- Playback has a dedicated lower map safe area. It never crosses the inspector, attribution, scale, legend or zoom controls.
- Reserve space through layout calculations. Do not fix overlap with arbitrary escalating z-index values.
- Keep the active location visible using map camera padding and resize handling. Preserve a deliberate user camera position unless a selection/navigation action warrants a fit.

## Map style and data

Use the existing licensed/available basemap and renderer. Reproduce the reference's restrained dark terrain treatment with supported styling, hillshade or imagery if available. Preserve attribution. Never download or invent operational terrain tiles just to mimic the mockup.

Generated references misplace labels and contain unrealistic terrain and water bodies. Real map data wins. The pictures define contrast, map prominence, panel positioning and layer hierarchy only.

Provide a usable dark vector fallback when satellite or terrain assets fail; identify unavailable layers. Keep river outlines and modeled flood extents distinct. Do not make flood areas look larger or more certain for visual effect. Render uncertainty and modeled versus observed status according to the source metadata.

Markers must have a clear unselected, hovered, keyboard-focused and selected appearance. Use clustering or appropriate level-of-detail rules where necessary. Do not duplicate community pins to populate a sparse map.

## Responsive layout contract

| Width | Required composition |
| --- | --- |
| 1440 px and wider | Full header, detailed map, compact summary and one inspector; secondary pages use reference proportions |
| 1100–1439 px | Condense event summary; inspector ~320–360 px; collapse low-priority header actions into labeled menus |
| 768–1099 px | Compact navigation; inspector or assistant becomes an accessible sheet/drawer; no two full information panels |
| Below 768 px | Dedicated compact experience; community list and detail views, optional map; forms stack and phone previews remain optional |

At every size, the information task remains possible without hover. Account and composer forms must work at 390 px width. Do not shrink the entire desktop screenshot into a miniature interface.

## Motion and interaction

Use short transitions, generally 140–220 ms for surfaces and 300–650 ms for camera changes if comfortable. Respect reduced-motion preferences; do not animate large travel when reduction is requested. Stop map/playback motion when paused. Do not invent continuous scans that suggest a live detection process.

All functional elements need default, hover, focus, active/selected, disabled and loading states where applicable. Inputs need validation and error recovery. Focus must be visible on dark surfaces. Dialogs/drawers must manage focus and Escape predictably. Icons use one consistent existing icon set and visible labels or accessible names.

## Visual fidelity standard

Match major region proportions, alignment, density, type hierarchy, panel material, action emphasis and map prominence closely at the reference viewport. Correct data, accessibility and responsive behavior take precedence over literal pixels. Compare actual screenshots; do not claim an invented similarity percentage or accept a design merely because its colors are dark.

Known mockup errors and required corrections are listed in [06_REFERENCE_MANIFEST.md](06_REFERENCE_MANIFEST.md).
