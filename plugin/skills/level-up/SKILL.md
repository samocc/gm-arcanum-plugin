---
name: level-up
description: Level up the party — update character-sheets and campaign-settings. Use --auto for autonomous companion choices. MetaGM session only.
argument-hint: "--auto"
disable-model-invocation: true
---

# Level Up

Level up the party. Updates `character-sheet.md` doc for every party member and the party level in `campaign-settings.json`.

## Pre-flight Check

- [ ] **Read the character sheet template.** This contains section standards, writing rules, and the document structure. All sheet updates must conform to these standards.

### Documents to Read

- [ ] **`meta-session.md`** — session type instructions (identity, output style, archive protocol)
- [ ] **Campaign `CLAUDE.md`** — active campaign and document manifest
- [ ] **`campaign-settings.json`** — `ttrpg_system`, `current_level`, `level_gain`, `members[]`, `sessions_played`, `last_level_up`. Schema reference: [`doc-templates/campaign-settings.md`](../doc-templates/campaign-settings.md).
- [ ] `campaign-pitch.md` — tone, system, player preferences

---

## Mode Selection

Check `$ARGUMENTS` for flags:

- `--auto` → **Autonomous mode** — companion level-ups run in background; PCs are walked collaboratively.
- `--pc=name` → **Single-PC mode** — target one named PC. Other PCs and companions are skipped. Combine with `--auto` to handle companions in background while focusing on the named PC.
- `--companions-only` → **Companions-only mode** — run only the companion batch; no PC work, **no campaign-settings bookkeeping** (a companions-only run does not mark the level-up done).
- No arguments → ask the player which mode they'd like:

> **Collaborative** — we go through each character together, discuss the changes, and you make all the decisions.
> **Autonomous** — I level up the companions in the background while we work on your PC(s) together.

If the player has already indicated a preference, default to that.

**Flag combinations.**
- `--auto` + `--pc=name` is valid: `--pc=name` selects which PC gets the foreground collaborative slot; `--auto` continues to fire companion sub-agents in background. Other PCs are skipped (run them in parallel sessions or in a separate invocation).
- `--pc=name` + `--companions-only` is contradictory — reject and ask the player which they meant.
- `--auto` + `--companions-only` is contradictory (no PC means nothing to background-around) — reject.

### Parallel Sessions

Multi-PC tables can level up in parallel: each player opens their own MetaGM session against the shared campaign workspace and runs `/gm:level-up --pc=their-pc-name`. Companion level-ups happen once via `--companions-only` (or roll into one of the PC runs by adding `--auto` to that invocation). Bookkeeping (`current_level`, `last_level_up` in `campaign-settings.json`) is last-write-wins — values are deterministic from `level_gain`, so parallel writes converge on the same final state.

`argument-hint` only advertises `--auto` to keep the surface compact; the additional flags are documented here in the body.

---

## Procedure

### Step 1 — Determine Level Change

Read `current_level` and `level_gain` from `campaign-settings.json`. Propose the new level as `current_level + level_gain` (e.g., if `current_level: 6` and `level_gain: "2 levels"`, propose level 8). Confirm with the player — they can override the target level.

For multi-level jumps (e.g., level 5 → 7), all changes across all levels gained are compiled together before any file writes. The player sees the cumulative result with a per-level breakdown showing what came from each level.

### Step 2 — Branch by Mode

**Collaborative (default):**

Process characters one at a time — **PC(s) first** (each in turn for multi-PC parties), then companions. For each character, run Steps 3 through 6 below.

**Autonomous (`--auto`):**

Companion level-ups run in the background while you work on the PC(s) collaboratively. See the **Autonomous Mode** section below for the orchestration procedure. Then run Steps 3 through 6 for each PC in turn (or just the named PC if `--pc=name` is also set).

**Single-PC (`--pc=name`):**

Skip the party loop. Run Steps 3 through 6 for the named PC only. Other PCs and companions are not processed. (Combine with `--auto` to also fire companion background work; without `--auto`, companions are skipped entirely.)

**Companions-only (`--companions-only`):**

Run the autonomous orchestration (see Autonomous Mode) without the foreground PC work. Skip Steps 3 through 6 entirely. **Skip the campaign-settings bookkeeping step** in Wrap-Up — companions-only does not mark the level-up done.

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

**IP Validation gate.** If finalized decisions **added** a new Class (multi-classing) or selected a Subclass for the first time, check the addition against the matching section in `content-sources.md` at the workspace root. For any addition not listed, emit one IP Validation intent marker per addition (one per line):

```
>> **IP Validation: kind=Class, value=<Class>**
>> **IP Validation: kind=Subclass, value=<Subclass>**
```

Then **stop** — do not proceed to Step 6. Do NOT re-flag an existing Class or Subclass that the PC already had — that selection was validated at character creation. Race never changes at level-up.

**Resume handling:**
- *Player confirmed rights*. Add a new entry to the matching section in `content-sources.md`: `kind=Class` → Classes (`- Class — Model Knowledge`), `kind=Subclass` → Subclasses (`- Class / Subclass — Model Knowledge`, using the PC's class). Then proceed to Step 6.
- *Player asked for alternative*. Do NOT modify `content-sources.md`. Instead propose from the existing available options in `content-sources.md` (Classes section for a multi-class addition, Subclasses section for a first-time subclass selection) and walk the player through a new selection. If the player steers it towards yet another selection not present in `content-sources.md` you must re-send the IP Validation gate and repeat the protocol until either the player's IP Validation gate reply confirms or the choices are all present in `content-sources.md`.

If no addition was made (or every addition is listed) on first check, proceed to Step 6 normally.

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

1. For each entry in `campaign-settings.json` `members[]` with `role: "Companion"`, compose an agent briefing by adapting the reference below.
2. Spawn a **background** `gm-evolution` agent for each companion.
3. Immediately proceed with the PC collaborative level-up (Steps 3-6) — for multi-PC parties, walk each PC in turn (or just the `--pc=name` target if specified). Under `--companions-only`, skip this step entirely.

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

When companion agents report back, relay each report to the player (level-up runs in MetaGM — the whole session is `> PRIMARY`; SECONDARY is disabled):
- Companion name and level change
- Summary of what changed (features, HP, spells, ASI/feat)
- Archive location
- Any decisions the agent flagged as judgment calls

The player can request adjustments to any autonomous choice — make the edits directly if needed.

**IP Validation aggregation.** Inspect each companion report's `IP Validation findings` line. For every flagged finding across all companion reports, emit one IP Validation intent marker in the same response (alongside the relayed reports). Stop after presenting the relayed reports + markers — do not advance to Wrap-Up until the player resolves any IP cards.

**Resume handling:**
- *Player confirmed rights*. Add a new entry to the matching section in `content-sources.md`: `kind=Class` → Classes (`- Class — Model Knowledge`), `kind=Subclass` → Subclasses (`- Class / Subclass — Model Knowledge`, using the affected companion's class — match each marker to the report it came from). Then proceed to Wrap-Up.
- *Player asked for alternative for a flagged companion*. Do NOT modify `content-sources.md`. Instead propose from the existing available options in `content-sources.md` and ask the player to pick a new selection for that companion's affected slot, then redo that companion's level-up with the new pick. If the alternative is also not in `content-sources.md` you must re-send the IP Validation gate and repeat the protocol until either the player's IP Validation gate reply confirms or the choices are all present in `content-sources.md`.

If no companion report flagged anything on first check, proceed to Wrap-Up normally.

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
1. **Update `campaign-settings.json`** — *skip this step entirely under `--companions-only`.* Default, `--auto`, and `--pc=name` runs all perform this update; under parallel sessions it's last-write-wins (values converge from `level_gain`).
   - Edit `current_level` to the new level. Fragment: `"current_level": <old>,` → `"current_level": <new>,`. Preserve the trailing comma.
   - Edit `last_level_up` to the current `sessions_played` value. Fragment: `"last_level_up": <old>,` → `"last_level_up": <sessions_played>,`. Preserve the trailing comma.

   Both fields are guaranteed present in the schema. See [doc-templates/campaign-settings.md — Plugin Edit Discipline](../doc-templates/campaign-settings.md#plugin-edit-discipline).
2. **Update each leveled PC's `status.json`.** Run this once per PC processed in this invocation. (Companion `status.json` files are updated by `level-up-internal` as part of each companion's sub-agent flow — no work needed here for companions.) Skip entirely under `--companions-only`.

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
