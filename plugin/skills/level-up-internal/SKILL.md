---
name: level-up-internal
description: Internal skill for autonomous companion level-up execution — compile changes, make personality-consistent decisions, update character-sheet docs. Only for sub-agent use; MetaGM should never invoke this skill directly.
user-invocable: false
allowed-tools: Bash
effort: high
---

The workspace root is: !`pwd`

# Companion Level-Up — Execute Procedure

Autonomously level up a single companion. Read the briefing for the companion name, character-sheet path, target level, and any player notes.

## Pre-flight Check

- [ ] **Read the character sheet template** from the `doc-templates` skill (`character-sheet.md`). This contains section standards, writing rules, and the document structure. All sheet updates must conform to these standards.

### Documents to Read

Verify all of these are loaded before proceeding. If any are missing, read them now.

- [ ] `character-sheet.md` — read in full, this is the core document to work with
- [ ] `companion-guide.md` — read Combat Initiation and Problem Solving sections for personality-consistent decisions
- [ ] `campaign-settings.md` — for `Sessions Played` (archive naming)
- [ ] **Reference files** — read `content-sources.md` at `[workspace-root]/content-sources.md` (using the workspace root provided at the top of this skill's content) and find this companion's class and subclass. If the reference links to a file, read it as the mechanical source of truth. If it says `Model Knowledge`, proceed using built-in knowledge. If the class/subclass is not listed, proceed using built-in knowledge but note reduced reliability.

---

## Procedure

### Step 1 — Compile All Changes

Determine everything that changes between the current level and the target level. For multi-level jumps, walk through each level gained and compile the cumulative list. Reference the **Level-Up Guidance** section below for domain-specific guidance.

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

### Step 2 — Make Decisions

Make all choices for this companion using the **Autonomous Decision Rules** below. Honor any player notes from the briefing — those take priority over the default decision rules.

### Step 3 — Apply Updates

1. Archive the character-sheet (see Archive Protocol in agent instructions): `character-sheet-[Name]-s[NNN].md`
2. Choose update strategy based on scope:
   - **Full file rewrite** when changes cascade across multiple sections (ASI increasing a modifier, proficiency bonus increase, or 4+ sections affected). A full rewrite ensures no cascading value is missed.
   - **Targeted edits** when changes are isolated (adding a single feature, updating HP only, adding one spell). Faster and lower risk of accidentally altering unrelated content.

Preserve all existing content, customizations, and formatting. Only change the values that the level-up affects:
- **General:** Class level (e.g., `Fighter 7` → `Fighter 8`), Proficiency Bonus if changed
- **Abilities:** Save values if proficiency cascade
- **Combat Stats:** HP, Spell Save DC, Spell Attack modifier if cascade
- **Features:** Add new features to the list
- **Spellcasting:** New spells, updated slot/prepared counts, new cantrips
- **Martial:** Updated attack bonuses if cascade, new damage scaling
- **Notes:** Updated standing narrative state only if the new level adds something (e.g., new Teleportation Circles known, familiar stat block updates, new always-on effects). Most level-ups will not touch Notes.

### Step 4 — Update status.json

Update the companion's `status.json` (alongside the updated `character-sheet.md`). Load `doc-templates/status-json-template.md` for schema reference (mandatory).

Read the existing `status.json` (if present) and apply these changes:

- **HP.baseMax** and **HP.max** — both raised by the HP increase calculated in Step 1 (level-up is a permanent change, so both fields advance together).
- **HP.current** — `current + HP_gain` so the HP gain is added as a buffer. If no existing status.json, set `current = max`.
- **Spells** — update `max` for each existing slot level. If a new spell level was gained, add the entry with `{ current: <new max>, max: <new max> }`.
- **Class resources** — update `max` for any resource that scaled with level (Rage charges, BI uses, Ki, etc.). Set `current = max` for resources that gained capacity. If a newly-granted resource is added, populate its `tooltip` when the rule text is clear.
- **HD** — increment `max` by the levels gained; set `current = max`.
- **AC** — `{current, max}` object. If the new level raises the character's base AC (new armor proficiency, natural armor progression, monk unarmored bonus from WIS/DEX bumps), update **both** `current` and `max` to the new value.
- **token, team, Conditions** — preserve as-is (level-up doesn't affect these).
- **name, system, role, currency, concentration** — **preserve the existing values** from the current `status.json`; do not reset them during level-up. `name`, `system`, and `role` are set once at character creation and never change. `currency` and `concentration` track live play state and must survive the rewrite.
- **classInfo** — **update this field** to reflect the new level and any subclass added at this level (e.g., `"Bard 8 (College of Lore)"` after leveling from 7 to 8; `"Fighter 3 / Rogue 2"` after a multiclass dip). This is the authoritative class/subclass/level summary the companion renders.
- **level** — set to the new total character level.
- **proficiencyBonus** — update when the PB tier crosses (levels 5, 9, 13, 17).
- **abilities** — on ASI, update the affected ability's `{score, mod, save}`. On a PB cascade, update `save` for every proficient ability; recompute each `mod` from its `score` for any ability whose score changed.
- **Speed** — update `max` (and `current` if they match) when the level grants new movement (Monk Unarmored Movement step, Barbarian Fast Movement at 5, etc.). Usually unchanged.
- **SpellDC / SpellAttack** — recalculate and update if the PB cascaded or the spellcasting ability changed via ASI.
- **spells[]** — add entries for newly prepared/learned spells per the sheet update. For spells-known classes that swapped a spell, reflect the replacement. Attach `tooltip` for high-reference additions where authoritative rule text is clear.
- **feats[]** — when a feat was taken at this level (in place of ASI), add an entry with `tooltip` if the rule text is clear.
- **skillProficiencies / skillExpertise** — update only if the level grants a new proficiency or expertise (uncommon — Rogue Expertise bumps, some subclass features).
- **weapons[], race** — preserve unchanged — level-up doesn't normally touch these. Update only if the level grants a new weapon proficiency added to the equipped loadout or (exceptional homebrew) a race change.

If no existing `status.json`, generate a fresh one from the updated character-sheet following the template.

Write to `campaign-members/co-[name]/status.json`.

### Step 5 — Report

Report what was done:

> **[Name] ([Class] [new level]):**
> HP: +[N] ([hit die] fixed + [CON mod] CON) → [total] total
> New Feature: [feature name] — [brief description]
> [ASI/Feat if applicable]: [what changed and cascading effects]
> [Spells if applicable]: added `[spell]` ([level], [brief note])
> status.json updated (or "created" if didn't exist)
> Archive: `[archive file path]`

Flag any decisions where you made a judgment call (e.g., choosing between two equally viable feats) so the player knows what to review.

**IP Validation findings.** If this level-up **added** a new Class (multiclass) or selected a Subclass for the first time, check that addition against the matching section in `content-sources.md` at the workspace root. Report one of:
* `IP Validation findings: none` — the addition is listed (or marked `Model Knowledge`), or this level-up made no Class/Subclass addition.
* One bullet per unlisted addition, in marker-payload form so the parent can drop it straight into an intent marker:
  * `kind=Class, value=<Class>` (multiclass into a non-listed class)
  * `kind=Subclass, value=<Subclass>` (subclass selection of a non-listed subclass)

Do NOT re-flag an existing or pre-selected Class/Subclass that the companion already had at the start of this level-up — that selection was validated at character creation.

---

## Autonomous Decision Rules

- **HP:** Fixed value + CON modifier (see HP Increase below).
- **ASI/Feat:** Increase the primary ability score by 2 (up to 20). If already at 20, increase the secondary. If a feat clearly synergizes with the character's build, prefer the feat.
- **Spells:** Choose based on the character's role in the party, existing spell list, and party composition gaps. Lean toward thematic, on-brand picks that fit the character's identity and established playstyle over pure power optimization.
- **Feature choices:** Pick the option that best fits the character's established combat style and build.

---

## Level-Up Guidance

Reference material for handling specific mechanical domains. Consult as needed from Steps 1 and 3.

### HP Increase

Use the fixed HP value for the class — the hit die average rounded up, as per D&D 2024 rules:

| Hit Die | Fixed Value |
|---|---|
| d6 | 4 |
| d8 | 5 |
| d10 | 6 |
| d12 | 7 |

Add the character's CON modifier to the fixed value. For multi-level jumps, calculate HP gain per level separately.

### Proficiency Cascade

When proficiency bonus increases (at levels 5, 9, 13, 17), multiple derived values change. Update **all** of the following:

- **Proficiency Bonus** in the General section
- **Saving throws** — recalculate all proficient saves (ability mod + new PB)
- **Spell Save DC** — recalculate (8 + PB + spellcasting ability mod + item bonuses)
- **Spell Attack modifier** — recalculate (PB + spellcasting ability mod + item bonuses)
- **Weapon attack bonuses** — recalculate for all proficient weapons (PB + ability mod + item bonuses)
- **Class feature DCs** that use proficiency bonus in their formula
- **Companion creature / summon stat blocks** that reference proficiency bonus or class level

This is the most error-prone part of a level-up. Work through the cascade methodically — check the character's Abilities, Combat Stats, Martial, Spellcasting, and Notes sections for anything that operates based on proficiency bonus.

### Spell Management

**Do NOT** swap prepared spells. Spell preparation is a Long Rest activity during normal gameplay — not part of level-up.

**DO:**
- Add subclass auto-prepared spells that come from the new level
- For classes that **learn spells permanently** (Sorcerer, Bard, Ranger, Warlock): select new spells. Choose based on the character's role, existing spell list, and party composition.
- For classes that **prepare from a full list** (Cleric, Druid, Paladin, Artificer): note the new prepared spell count but do not fill new slots — the player can choose during the next Long Rest in gameplay.
- For **Wizards**: add new spellbook entries (2 per Wizard level gained, any level the Wizard has spell slots for). Choose flavourful options based on the character's theme.

---

## Edge Cases

**Multiclass characters:**
Proficiency bonus is based on total character level, not class level. Spell slots use the multiclass spellcasting table. Flag multiclass complexity in the report.

**Already at target level:**
If the character-sheet already shows the target level, skip and report it. This handles interrupted level-ups.

**Companion creatures / summons:**
If the character has companion creatures or summons with stat blocks in their Notes section, update those stat blocks for any values that scale with class level or proficiency bonus.
