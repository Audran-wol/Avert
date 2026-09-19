# 07 — Skills and design research

## Included custom skills

The pack contains original, project-specific instructions, not copies of third-party repositories:

- `.claude/skills/avert-ui-refactor/SKILL.md`: fidelity to the approved reference set, original-logo preservation, progressive implementation and visual verification.
- `.claude/skills/avert-ai-alert-simulation/SKILL.md`: grounded explanations, context isolation, reviewed drafts, fictional recipients and deterministic simulated outcomes.

Use the first throughout the refactor and the second for the AI/alert/notification subsystem. Both refer to the canonical specifications under `docs/avert-refactor/` so requirements stay in one place.

Claude Code supports project skills under `.claude/skills/<name>/SKILL.md` and explicit invocation by `/name`. If the client does not discover them, ask it to read those files directly. This pack does not need plugin installation to be usable. See [official Claude Code skills documentation](https://code.claude.com/docs/en/skills).

## Research that informed the workflow

| Source | Relevant contribution | Application here |
| --- | --- | --- |
| [Impeccable](https://github.com/pbakaus/impeccable) | Shape, critique, strengthen, simplify and polish interfaces with browser iteration | Compare real rendered screens, establish the visual system before expanding |
| [Anthropic Frontend Design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Deliberate subject-specific identity and one memorable focal point | Geographic detail is Avert's focal point; surrounding UI stays restrained |
| [Taste Skill — Redesign](https://github.com/Leonxlnx/taste-skill/blob/main/skills/redesign-skill/SKILL.md) | Improving an existing interface through hierarchy, layout and visual craft | Incremental refactor that preserves working features |
| [Taste Skill — Image Direction](https://github.com/Leonxlnx/taste-skill/blob/main/skills/imagegen-frontend-web/SKILL.md) | Stronger compositions and coherent visual references | Approved screenshots guide the design; marketing-specific conventions are not forced onto the dashboard |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Supporting palette, typography, UI and usability guidance | Supporting review only; no automatic template replacement |
| [Felt](https://felt.com/) | Geographic applications and analysis as a coherent workspace | Domain reference for map prominence and contextual information |

These references were reviewed during the design discussion. Repository contents can change; use the actual version available if installing an external skill later. Their generic rules do not override Avert's approved design or factual integrity.

## Optional external skills

The supplied custom skills are sufficient to execute this handoff. If Impeccable or another design skill is already installed, use its critique and polish capabilities selectively. Do not bulk-install overlapping frameworks or follow external scripts without inspecting their purpose. Avoid importing unrelated landing-page sections, ornamental animation systems or different brand directions.

The source material is credited for design principles. The approved images remain concepts; external sources do not validate the screenshots' geographic or numerical content.
