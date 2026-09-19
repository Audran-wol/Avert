---
name: avert-ui-refactor
description: Refactor the existing Avert application to its approved dark geographic design, preserving the original logo and real map behavior, with browser-based visual verification. Use for this Avert refactor and its screen refinements.
---

# Avert UI refactor

## Read and inspect

The canonical handoff is at `docs/avert-refactor/` from the repository root. From this skill directory it is `../../../docs/avert-refactor/`.

Read [the implementation contract](../../../docs/avert-refactor/00_IMPLEMENTATION_CONTRACT.md), [design system](../../../docs/avert-refactor/01_DESIGN_SYSTEM.md), [screen specifications](../../../docs/avert-refactor/02_SCREEN_SPECIFICATIONS.md), and [reference manifest](../../../docs/avert-refactor/06_REFERENCE_MANIFEST.md). Open the actual PNG for the screen being implemented. Read [state architecture](../../../docs/avert-refactor/04_ARCHITECTURE_AND_STATE.md) before changing state boundaries and [visual QA](../../../docs/avert-refactor/05_VISUAL_QA.md) before verification.

Audit the current repository, applicable instructions and existing changes first. Prior screenshots and older stack descriptions are not authoritative about current functionality. Preserve unrelated work.

## Brand and fidelity contract

**Use the current repository Avert logo exactly. All generated logos in the reference PNGs are rejected. Do not trace, crop, regenerate, recolor or replace the existing mark. Record the original asset/component path.**

Match the approved dark geographic workspace closely: dominant map, compact navigation, refined hierarchy, restrained blue actions, warm risk accents, readable opaque panels and one contextual inspector. Preserve proportions and spacing through actual browser comparison. Do not substitute a generic pale dashboard, add a thick Monitor sidebar, or flood the interface with cards, gradients or neon effects.

The references determine visual intent. Actual geography, data, source relationships, user requirements and accessible behavior override generated-image mistakes. Never copy fake geometry, population values, dates, logos, rainfall bars or incident photos into operational data. Never implement the page as a screenshot with hitboxes.

## Execution discipline

1. Establish shared tokens, original brand component and shell. Build Monitor plus a selected community first.
2. Capture and inspect the running vertical slice against R1. Resolve major layout/type/surface discrepancies before expanding the component system.
3. Implement the remaining screens with those shared primitives and actual state. Preserve all existing analytical functions behind clear controls.
4. Reserve space for map controls and playback. Community details, evidence and chat share one inspector slot. Resize the map and update camera padding when layout changes.
5. Implement meaningful empty/error/loading states and every visible action. Missing providers show honest unavailability; they do not excuse dead navigation or fake success.
6. Finish the requested scope, then run focused workflow and responsive checks. Continue correcting concrete defects until gates pass or an actual environment blocker is documented.

For AI, alerts and notifications, also read `.claude/skills/avert-ai-alert-simulation/SKILL.md`.

## Completion gate

No clipped critical text, inaccessible actions, broken media, overlapping map controls, incorrect-logo substitutions or fabricated data claims. Test the reference desktop viewport, 1366px laptop and compact/phone flows described in QA. Build/typecheck success alone does not prove visual fidelity.

If browser tools are unavailable, document the limitation instead of claiming visual verification. Report completed work, screenshot evidence, meaningful deviations and remaining integration requirements in `IMPLEMENTATION_REPORT.md`. This skill does not authorize external publication or sending notifications to people.
