---
name: prep-internal
description: Internal skill for module prep execution — reading list, design rules, pacing, content design guidance, and output templates for main module and combat data files. Only for sub-agent use; the narrative GM should never invoke this skill.
user-invocable: false
effort: high
---

# Module Prep — Agent Guide

This guide contains everything you need to generate a module prep document: reading list, design rules, and the template. Follow it strictly.

## General Rules

- **Prep docs are GM reference notes, not narrative prose.** Write lean, scannable content. No filler, no dialogue samples. The narrative GM adds voice during play — your job is to give them the right material to work with.
- **Follow the template EXACTLY.** Do not add sections, blockquotes, meta-instructions, or structural elements not present in the template. Do not pattern-match style from existing prep files in `gm-prep/` — this guide is the sole authority on format.
- **Length constraints are embedded in `[bracketed placeholders]`.** Respect them. When a placeholder says "1-2 sentences max" that is a hard limit.
- **Scope determines length.** Short travel or small zone → lean shorter (3 discoveries, 1 encounter). Long travel, large zone, or story-critical module → lean longer (5 discoveries, 2-3 encounters). Do not pad a small module to fill the template.

## Pre-flight Check

### Required Documents

Verify all of these are loaded before generating. If any are missing, read them now. **If any file fails to load (permission error, file not found, empty read), STOP immediately and report the failure to the player. Do not attempt to proceed without required documents or improvise replacements — the output quality depends on these inputs and the process is too long to risk a failed run.**

#### Templates (critical — check first)
- [ ] `${CLAUDE_SKILL_DIR}/module-prep-template.md` — the output template for the main module
- [ ] `${CLAUDE_SKILL_DIR}/combat-data-template.md` — the output template for combat data (read now even if you may not need it)

#### Campaign Documents
- [ ] `campaign-pitch.md` — tone, length, pacing preferences (critical for pacing decisions). May contain a **Special** section with campaign-specific mechanics, session structure, custom economy, or gameplay phases — if present, these directly shape module design.
- [ ] `campaign-settings.json` — `sessions_played`, `campaign_stage`, `ttrpg_system`, `current_level`, `members[]`. Schema reference: [`doc-templates/campaign-settings.md`](../doc-templates/campaign-settings.md).
- [ ] `world-info.md` — geography, locations, factions, world knowledge
- [ ] **gm-directives.md** — GM style preferences (item design, exploration tone)
- [ ] `recent-events.md` — what happened most recently
- [ ] `campaign-summary` — long-term narrative arc
- [ ] **`gm-canon.md`** — multi-module thread state and continuity (if it exists)
- [ ] **All `companion-guide.md` files** in `campaign-members/` — needed for companion beats
- [ ] `npc-directory.md` — recurring NPCs who might appear
- [ ] **All `character-info.md` files** in `campaign-members/` — identity, backstory, hooks per PC
- [ ] `inventory.md` — current party items (for item design decisions)

#### Custom Campaign Documents
- [ ] **Scan the campaign's `CLAUDE.md`** for any player-authored references or instructions beyond the standard auto-loaded documents — homebrew rules, custom system rules, mechanical references for party abilities, lore supplements. Load any that are relevant to module prep (e.g., rules that affect encounter design).

## Pacing

Read `campaign_stage` from `campaign-settings.json` and apply the **pacing matrix** from your agent context (Pacing Awareness section). The matrix determines what kind of arc content is appropriate at the current stage — follow it when deciding what story threads to introduce, escalate, or keep dormant in this module.

## Content Design

**Synthesis, not regurgitation.** Do not copy-paste from campaign documents. Synthesize world knowledge, character relationships, and narrative momentum into new, original content.

**Continuity:**
- Use `gm-canon.md` as your primary continuity source — it tracks multi-module threads, arc direction, breadcrumbs planted, and what the party knows vs. doesn't.
- Pick 1-3 threads from gm-canon that are relevant to this module's scope — *(Companion)* threads don't count against this limit. Do NOT try to advance every thread. If a companion thread overlaps naturally with this module's content, design space for it; if not, leave it alone.
- Reference events from `recent-events.md` that the party experienced
- Not contradict established facts or repeat discovered content
- Leave open threads or seeds for future preps to pick up

**New Seeds:**
- **Zone-scoped, local, or short to medium term seeds:** Freely introduce these as needed to transcend the module and possibly connect some other landmarks or future modules into a coherent narrative. Not every landmark or future module needs to be part of that narrative, some should remain standalone as well.
- **World-scoped or long term seeds**: *(For Early stage in a Medium or longer campaign)* If less than [1 for Medium | 2 for longer Campaign] long-term *Unlabeled* threads are present — Attempt to plan seeds that can evolve into a new genuinely interesting long-term thread that is independent or parallel to the Core Arc.

## Template Filling Guidance
These are core insights and rules on how to fill template sections or entries. They complement the in-template placeholders — adhere to them strictly.

* **Companion beats:** Reference specific companion-guide triggers by name (trigger name, maneuver name, trigger category) — do not re-describe the full behavioral sequence. The GM has the guide loaded. Omit companions from beats where they wouldn't meaningfully react. Check Personal Plot Hooks for triggers that overlap with this module's content — if a hook could naturally fire, design content that leaves the door open without forcing it. Use full detail ONLY for module-specific logic not found in the guide (e.g., session-gated mechanics, item interaction rules).

* **Items:** Follow `gm-directives.md` item design rules. Check `inventory.md` and fill gaps — don't duplicate what the party already has. State mechanics only — no design rationale or flavor justification.

* **Encounters:** 1-3 encounters per module. Tag encounter types clearly. Use Monster Manual stat blocks as base with clearly noted modifications in the combat data file.

* **Skill checks — DC-tier-first format:**
  The DC tier determines what information is revealed. Listed skills are SUGGESTIONS — the GM accepts any skill the player can justify.

  Format: `- **DC 10:** The drag marks are from multiple species, all moving outward. *Likely: Survival, Nature*`

  Exception — domain-locked skills (rare): When information genuinely requires specialized training that general observation or reasoning cannot provide, specify the skill as required:

  Format: `- **DC 12 (Medicine):** Cause of death is systemic organ failure.`

  Test: "Could a skilled tracker/investigator/observer figure this out without specialized training?" If yes → DC-first with suggested skills. If no → domain-locked.

---

## Output

This guide produces one or two files depending on module content:

1. **Main module file** (`[NNN]-[module-name].md`) — always produced. Contains everything the narrative GM needs: overview, atmosphere, discoveries, encounters (narrative-facing info only), items, NPC notes, transition.
2. **Combat data file** (`[NNN]-[module-name]-combat.md`) — produced only when the module has Combat-type encounters. Contains mechanical details (stat blocks, tactics, environment, difficulty). Read by the combat prep agent, not the narrative GM.

Skill Challenge and Social encounters stay entirely in the main module file — no split needed.

---

## Templates

You should have already loaded both templates during the pre-flight check. Follow their structure exactly — do not add sections, blockquotes, meta-instructions, or structural elements not present in the template.

- **Main module template:** `${CLAUDE_SKILL_DIR}/module-prep-template.md` — always produced.
- **Combat data template:** `${CLAUDE_SKILL_DIR}/combat-data-template.md` — produced only when the module has Combat-type encounters. If the module has no combat encounters, do not create this file.
