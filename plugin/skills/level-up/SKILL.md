---
name: level-up
description: Level up the party — update character-sheets and campaign-settings. Use --auto for autonomous companion choices. MetaGM session only.
argument-hint: "--auto"
disable-model-invocation: true
---

# Level Up

Level up the party. Updates `character-sheet.md` doc for every party member and the party level in `campaign-settings.md`.

## Pre-flight Check

- [ ] **Read the character sheet template.** This contains section standards, writing rules, and the document structure. All sheet updates must conform to these standards.

### Documents to Read

- [ ] **`meta-session.md`** — session type instructions (identity, output style, archive protocol)
- [ ] **Campaign `CLAUDE.md`** — active campaign and document manifest
- [ ] **`campaign-settings.md`** — system, level, party composition, session count
- [ ] `campaign-pitch.md` — tone, system, player preferences

---

## Mode Selection

Check `$ARGUMENTS`:
- `--auto` → **Autonomous mode** (see Autonomous Mode below)
- No arguments → ask the player which mode they'd like:

> **Collaborative** — we go through each character together, discuss the changes, and you make all the decisions.
> **Autonomous** — I level up the companions in the background while we work on your PC together.

If the player has already indicated a preference, default to that.

---

## Procedure

### Step 1 — Determine Level Change

Read campaign-settings `Level` and `Level Gain` fields under Party. Propose the new level as `current level + Level Gain` (e.g., if Level is 6 and Level Gain is 2, propose level 8). Confirm with the player — they can override the target level.

For multi-level jumps (e.g., level 5 → 7), all changes across all levels gained are compiled together before any file writes. The player sees the cumulative result with a per-level breakdown showing what came from each level.

### Step 2 — Branch by Mode

**Collaborative (default):**

Process characters one at a time — **PC first**, then companions. For each character, run Steps 3 through 6 below.

**Autonomous (`--auto`):**

Companion level-ups run in the background while you work on the PC collaboratively. See the **Autonomous Mode** section below for the orchestration procedure. Then run Steps 3 through 6 for the PC.

### Step 3 — Load Character Documents

For the character being leveled:

1. Read their `character-sheet.md` from the campaign's `campaign-members/` directory.
2. Determine their class and subclass from the sheet's General section. The Class field format is `[ClassName] [Level] ([SubclassName])` (e.g., `Fighter 7 (Champion)`, `Wizard 8 (Evocation)`).
3. **Find reference files.** List all files under `ref/` and scan the filenames for anything that looks like it matches the character's class or subclass. Reference files may be organized in subdirectories or at the top level, and naming may vary — use your judgement to identify relevant matches.
4. Read any reference files found. If nothing relevant exists for a class or subclass, proceed using your built-in knowledge of the game system. The player reviews all changes before they're applied.

### Step 4 — Compile All Changes

Determine everything that changes at the target level. Use reference files when available, built-in knowledge when not. For multi-level jumps, walk through each level gained and compile the cumulative list. Reference the **Level-Up Guidance** section below for domain-specific guidance on HP calculation, proficiency cascade, and spell management.

**Always check:**
- HP increase (fixed value for class hit die + CON modifier)
- New class features (from class progression table)
- New subclass features (from subclass reference)
- Spell slot changes (new slots, new spell levels)
- Prepared spell count changes
- New spells gained (subclass auto-prepared, new spell level access)
- Cantrip count changes

**Check at specific levels:**
- Proficiency Bonus increase (levels 5, 9, 13, 17) → triggers **Proficiency Cascade**
- ASI / Feat (class-specific levels — typically 4, 8, 12, 16, 19)
- Class resource scaling (Focus Points, Sorcery Points, Rage charges, etc.)
- Martial damage dice changes (Martial Arts die, Sneak Attack dice, etc.)
- Feature upgrades (Extra Attack improvement, etc.)

### Step 5 — Decisions

Present everything that changes, and clearly identify any **decisions** required (spell selection, ASI allocation, feat choice, feature options):
- New features with descriptions (from reference files or built-in knowledge)
- HP gain (calculated)
- Spell changes (new slots, new spells available, prepared count changes)
- Resource changes (class resource pool increases)
- Proficiency cascade (if applicable — list every affected value)
- ASI/Feat choice (if applicable)

Wait for the player to discuss and finalize all decisions before proceeding.

### Step 6 — Apply Updates

Once all decisions are finalized:

1. Archive the character-sheet using the MetaGM archive protocol: `character-sheet-[Name]-s[NNN].md`
2. Choose update strategy based on scope:
   - **Full file rewrite** when changes cascade across multiple sections (ASI increasing a modifier, proficiency bonus increase, or 4+ sections affected).
   - **Targeted edits** when changes are isolated (adding a single feature, updating HP only, adding one spell).

Preserve all existing content, customizations, and formatting. Only change the values that the level-up affects:
- **General:** Class level (e.g., `Fighter 7` → `Fighter 8`), Proficiency Bonus if changed
- **Abilities:** Save values if proficiency cascade
- **Combat Stats:** HP, Spell Save DC, Spell Attack modifier if cascade
- **Features:** Add new features to the list
- **Spellcasting:** New spells, updated slot/prepared counts, new cantrips
- **Martial:** Updated attack bonuses if cascade, new damage scaling
- **Notes:** Updated standing narrative state only if the new level adds something (e.g., new Teleportation Circles known, familiar updates). Most level-ups will not touch Notes.

3. Confirm what was changed. Invite the player to review the updated sheet before moving to the next character.

---

## Autonomous Mode

### Orchestration

After Step 1 (level change confirmed):

1. For each companion in campaign-settings `Members`, compose an agent briefing by adapting the reference below.
2. Spawn a **background** `gm-evolution` agent for each companion.
3. Immediately proceed with the PC's collaborative level-up (Steps 3-6).

**Agent briefing reference:**

```markdown
# Companion Level-Up

## Mode
Execute — Companion Level-Up

## Campaign
The active campaign is at `[campaign path]`.

## Companion
[Companion name]. Sheet at `[full path to the character-sheet doc]`.

## Level Change
[Current level] → [target level]

## Reference Files
Class/subclass reference files are under `ref/`. Scan for matches to this companion's class and subclass.

## Notes
[Optional. Player preferences for this companion's level-up — e.g., "Player wants defensive spells prioritized", "Skip ASI, take Sentinel feat". Omit section if no player input.]
```

### After Completion

When companion agents report back, relay each report to the player:
- Companion name and level change
- Summary of what changed (features, HP, spells, ASI/feat)
- Archive location
- Any decisions the agent flagged as judgment calls

The player can request adjustments to any autonomous choice — make the edits directly if needed.

---

## Level-Up Guidance

Reference material for handling specific mechanical domains during a level-up. These are not steps — consult them as needed from Steps 4 and 6.

### HP Increase

Use the fixed HP value for the class — the hit die average rounded up, as per D&D 2024 rules:

| Hit Die | Fixed Value |
|---|---|
| d6 | 4 |
| d8 | 5 |
| d10 | 6 |
| d12 | 7 |

Add the character's CON modifier to the fixed value. Present clearly:

> [Name]: +5 (d8 fixed) + 2 CON = 7 new HP (52 total).

For multi-level jumps, calculate HP gain per level separately and show the breakdown.

### Proficiency Cascade

When proficiency bonus increases (levels 5, 9, 13, 17), update all derived values: Proficiency Bonus (General), proficient saving throws, Spell Save DC, Spell Attack modifier, weapon attack bonuses, class feature DCs, and any companion creature / summon stat blocks that reference proficiency bonus or class level. Check the character's Abilities, Combat Stats, Martial, Spellcasting, and Notes sections for anything that operates on proficiency bonus.

### Spell Management

**Do NOT** swap prepared spells. Spell preparation is a Long Rest activity during normal gameplay — not part of level-up.

**DO:**
- Add subclass auto-prepared spells that come from the new level
- For classes that **learn spells permanently** (Sorcerer, Bard, Ranger, Warlock): select new spells known. Suggest popular choices based on the character's build and party composition — the player decides.
- For classes that **prepare from a full list** (Cleric, Druid, Paladin, Artificer): note the new prepared spell count. The player can choose new preparations now or defer to their next Long Rest during gameplay.
- For **Wizards**: add new spellbook entries (2 per Wizard level gained, any level the Wizard has spell slots for). Suggest flavourful options based on the character's theme.

Lean toward thematic, on-brand picks that fit the character's identity and established playstyle. Mention clear no-brainers for the build, but prioritize spells that feel right for this character. The player makes all final decisions.

---

## Wrap-Up

After all characters are done (including companion agent reports in autonomous mode):
1. Update campaign-settings.md:
   - Set the `Level` field to the new level.
   - Set the `Last Level-Up` field (under Session Tracking) to the current `Sessions Played` value. If the field does not exist, add it after `Campaign Stage`.
2. **Update PC `status.json`.** (Companion `status.json` files are updated by `level-up-internal` as part of each companion's sub-agent flow — no work needed here for companions.)

   - Load `doc-templates/status-json-template.md` for schema reference.
   - Read the PC's existing `status.json` and apply:
     - **HP.baseMax** and **HP.max**: both raised by the HP gain. **HP.current**: `current + HP_gain` so the HP gain is added as a buffer.
     - **Spells**: update `max` for each existing slot level. Add entries for newly gained spell levels with `{ current: max, max: max }`.
     - **Class resources**: update `max` for any resource that scaled with level. Set `current = max` for resources that gained capacity. If a newly-granted resource is added, populate its `tooltip` when the rule text is clear.
     - **HD**: increment `max` by levels gained; set `current = max`.
     - **AC, token, Conditions**: preserve unless explicitly changed during level-up.
     - **role, currency, concentration**: **preserve the existing values** from the current `status.json`; do not reset them during level-up.
     - **classInfo**: **update this field** to reflect the new level and any subclass added at this level (e.g., `"Bard 8 (College of Lore)"` after leveling from 7 to 8; `"Fighter 3 / Rogue 2"` after a multiclass dip).
     - **level**: set to the new total character level.
     - **proficiencyBonus**: update when the PB tier crosses (levels 5, 9, 13, 17).
     - **abilities**: on ASI, update the affected ability's `{score, mod, save}`. On a PB cascade, update `save` for every proficient ability; recompute each `mod` from its `score` for any ability whose score changed.
     - **Speed**: update `max` (and `current` if they match) when the level grants new movement (Monk Unarmored Movement step, Barbarian Fast Movement at 5, etc.). Usually unchanged.
     - **SpellDC / SpellAttack**: recalculate and update if the PB cascaded or the spellcasting ability changed via ASI.
     - **spells[]**: add entries for newly prepared/learned spells per the sheet update. For spells-known classes that swapped a spell, reflect the replacement. Attach `tooltip` for high-reference additions where authoritative rule text is clear.
     - **feats[]**: when a feat was taken at this level (in place of ASI), add an entry with `tooltip` if the rule text is clear.
     - **skillProficiencies / skillExpertise**: update only if the level grants a new proficiency or expertise (uncommon — Rogue Expertise bumps, some subclass features).
     - **weapons[], race**: preserve unchanged. Update only if the level grants a new weapon proficiency added to the equipped loadout or (exceptional homebrew) a race change.
   - If no `status.json` exists yet (campaign predates party status tracking), generate a fresh one from the updated sheet per the template.
   - Write to `campaign-members/pc-{name}/status.json`.
3. Confirm completion and list all files that were modified or archived. Include PC and companion status.json updates in the final player-facing summary.
4. **Roll macros check.** If the active campaign has a `rolls.json` file (check `${GM_ARCANUM_ACTIVE_CAMPAIGN}/rolls.json`), flag to the player:

   > Your roll macros may need updating. This level-up could affect attack bonuses, damage dice, or unlock new rolls worth bundling. Run `/gm:rolls-config` to review and update?

   Wait for confirmation. On yes, invoke `/gm:rolls-config`. If no `rolls.json` exists, skip this step silently — macros are opt-in and most campaigns don't use them.

---

## Edge Cases

**ASI / Feat level:**
Present the choice clearly — ability score increase (+2 to one / +1 to two) or a feat. List current ability scores for reference.

**Multiclass characters:**
Proficiency bonus is based on total character level, not class level. Spell slots use the multiclass spellcasting table. Flag multiclass complexity to the player and work through it carefully.

**Already at target level:**
If a character-sheet already shows the target level, skip that character and note it.

**Companion creatures / summons:**
If a character has companion creatures or summons with stat blocks in their Notes section (familiar, beast companion, construct, etc.), update those stat blocks for any values that scale with class level or proficiency bonus.
