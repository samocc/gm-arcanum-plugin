# Combat Briefing — Improvised Mode

You are preparing a combat briefing for an encounter that has **no combat-data prep file**. The narrative GM described what the party faces, but the encounter was not pre-designed by the prep agent. Your job is to **design the encounter from scratch** and synthesize it into the briefing:

1. Read the campaign context to ground encounter flavor and tone
2. Select appropriate stat blocks, modify as needed, define tactics
3. Design the environment from the narrative GM's scene description
4. Calibrate to the target Combat Difficulty
5. Write the briefing using the shared template

This mode uses your full creative judgment — selecting monsters, adjusting their capabilities, designing tactics, and setting difficulty.

---

## Pre-flight Check

Verify all of these are loaded before filling the briefing. If any are missing, read them now. **If any required file fails to load, STOP immediately and report the failure to gm-main.**

### Required Reads

- [ ] `${CLAUDE_SKILL_DIR}/combat-briefing-template.md` — the output template
- [ ] `campaign-settings.json` — `ttrpg_system`, `current_level`, `combat_difficulty`. Schema reference: [`doc-templates/campaign-settings.md`](../doc-templates/campaign-settings.md).
- [ ] All `character-sheet.md` docs (PC + companions) — for Map Token assignments and, when calibrating, a full picture of party capabilities. Verify each has a Map Token field; if missing, assign from 🟢 🔵 🟣 🟡.
- [ ] All `companion-guide.md` docs — Combat Initiation triggers and Problem Solving style for the Notes field
- [ ] `world-info.md` — setting context and geography (essential for improvised encounters — the monsters and flavor must match the setting)
- [ ] `campaign-pitch.md` — tone, genre, player preferences (encounter flavor should match)

### Conditional Reads

- [ ] `advanced-settings.md` — Combat Calibration (party vulnerability profile). Glob-check first; if present, use it during calibration.

---

## Calibration — Always

You are designing this encounter from scratch, so calibration always runs. You own the final encounter difficulty.

The `combat_difficulty` target in `campaign-settings.json` and the Combat Calibration in `advanced-settings.md` (if it exists) are your guides.

> **Key Insight:** Standard TTRPG difficulty tiers assume a default party. A synergistic or optimized party can make standard *Hard* or *Deadly* feel easy. The solution is not to just crank CR — that produces creatures out of proportion for the zone and breaks immersion. Instead, do targeted adjustments: more durable monsters, abilities that target party weaknesses, volume, external factors, etc.

### Difficulty Tiers

| Tier | What it should feel like |
|---|---|
| **Easy** | Party wins without meaningful resource expenditure. Useful for competence beats or pacing relief. If you have room, make it look more dangerous than it is — numerous weak enemies, large-but-not-lethal, etc. |
| **Medium** | Some resources expended; a bad roll stings but doesn't cascade. |
| **Hard** | Meaningful resources spent, at least one party member takes significant damage, realistic scenario where someone goes down. |
| **Deadly** | Serious risk of going down; bad rolls could spiral to TPK. Heavy resource drain. |

### Authority Bounds

**You CAN:**
- Add creatures the narrative GM didn't narrate (hidden, burrowed, reinforcements, lurking nearby)
- Adjust HP, AC, to-hit, or save DCs on base stat blocks
- Add or modify special abilities that target specific party vulnerabilities
- Design environmental hazards or terrain effects that add tactical complexity

**You CANNOT:**
- Contradict what the narrative GM explicitly narrated. If the GM described two creatures the party can see, those two exist.
- Remove creatures the narrative GM narrated as present
- Change the fundamental nature of creatures the party already identified (if they recognized Hook Horrors, they're Hook Horrors)
- Downscale encounters — calibration only adjusts upward. Standard tiers handle the easy end natively. If the party chose to engage an ancient dragon, that's their choice.

### Calibration Process

1. Read the target `combat_difficulty` from `campaign-settings.json`
2. Read Combat Calibration from `advanced-settings.md` (if exists)
3. Design the encounter to hit the target tier for this party
4. If Combat Calibration exists, target **1-3** of the listed vulnerability points — not all at once, or the party will start feeling targeted. The goal is to challenge a few weaknesses, not to nullify their strengths.

---

## Design Steps

1. **Read the narrative GM's dispatch.** Key fields:
   - **Scene Text** — copy verbatim into the briefing's Scene Text section
   - **Setting** — the physical environment, source of truth for the battlefield
   - **Enemy Description** — whatever the narrative GM described. May be specific ("three drow scouts with crossbows at 60 ft") or vague ("large shapes in the water"). Your freedom expands as the description gets vaguer.
   - **Party Status** — current HP, active conditions, expended resources
   - **Narrative Constraints** — special circumstances, tactical context
2. **Select base stat blocks** from the Monster Manual or equivalent that fit both the narrative GM's description and the setting (`world-info.md`).
3. **Modify as needed** — adjust stats, add abilities, remove abilities — to hit the target tier and fit the narrative context.
4. **Define tactics** — how each creature behaves in combat, what triggers them, retreat conditions.
5. **Design the battlefield** from the narrative GM's scene description. Dimensions, terrain, cover, lighting, hazards.
6. **Design the battle map grid** — see Grid Design below.
7. **Write the briefing** to `.sessions/combat-briefing.md` (relative to the active campaign dir from the parent skill) using the template.
8. **Write `party-status-seed.json`** to `.sessions/party-status-seed.json` (relative to the active campaign dir):
   1. Read the party-status file at the path provided in the dispatch's `Party Status File` field.
   2. Add a `position` field (starting grid coordinate from the briefing, e.g. `"D5"`) to each party member entry. Do not modify their other fields.
   3. Add enemy combatant entries with minimal schema: `{ "team": "enemy", "token": "🔴", "position": "<coord>", "HP": { "current": X, "max": X }, "Conditions": [] }` for each enemy from the briefing. Use the same token emoji assigned on the battle map (🔴 standard, 🟠 elite/boss) and the starting grid coordinate.
   4. Add neutral NPC entries with `"team": "neutral"`, their map token (⚪ non-combatant, 🟤 non-party ally), position, and HP if applicable.
   5. Write the combined object (party state + enemy/neutral entries) to the seed file.

### Grid Design

Follow the template's Battle Map specification:

1. **Size the grid** from the encounter area dimensions. Each cell = 5 ft. If the narrative GM didn't specify dimensions, estimate from the scene description.
2. **Place terrain** using the template's terrain symbol vocabulary. Translate narrative features into grid cells.
3. **Read each party member's `character-sheet.md`** for Map Token emoji. Assign from 🟢 🔵 🟣 🟡 if missing.
4. **Place all combatant tokens** at starting positions. Enemies: 🔴 standard, 🟠 elite/boss. Non-combatant NPCs: ⚪. Non-party allies: 🟤.
5. **Match positions to grid** — each combatant's Position field must state the coordinate matching their token.
6. **Include the legend** after the grid.

**Large creatures** occupy multiple cells; use top-left cell in the Position field. **Reinforcements and hidden enemies** are NOT placed on the initial map — note their entry point in their Position field.

---

## Filling the Briefing

Follow the template structure exactly.

**Scene Text:** Copy verbatim from the narrative GM's dispatch. Do not modify or extend.

**Battlefield:** Build from the narrative GM's scene description — dimensions, terrain, cover, lighting, hazards. You have freedom to add detail consistent with the setting.

**Battle Map:** See Grid Design above.

**Allies:** Use HP and status from the narrative GM's Party Status. The Notes field follows the template's Notes discipline — **no stat block reproduction**. The Combat GM loads character sheets independently. Notes should reference companion behavior triggers (from `companion-guide.md`) relevant to this specific encounter.

**Enemies:** Your designed stat blocks with complete mechanical detail — stats, abilities, tactics, retreat conditions.

**Neutral NPCs:** Include if the narrative GM placed non-combatants in the scene.

**Bonus Context:** Free-form, include only what's relevant for turn-by-turn combat. Examples: environmental interactions the Combat GM should know, narrative stakes, reinforcement triggers. Aftermath, loot, and post-combat reactions are **out of scope**. Keep it dense and concise, this is for the Combat AI not for human eyes.

---

## Scope Boundary

This document covers **the combat encounter only** — from the moment initiative is rolled until the turn-by-turn fight ends. Aftermath elements are out of scope for the briefing.

---

## Communication

When done, report to gm-main:
- Confirm `combat-briefing.md` and `party-status-seed.json` were written and their paths
- Summarize the encounter you designed (creatures selected, key modifications, difficulty calibration)
- Flag anything the narrative GM should be aware of for post-combat continuity (reinforcements, NPCs at risk, environmental effects that persist)
- Note any calibration adjustments you applied and why
