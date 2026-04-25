---
name: companion-sheet-internal
description: Internal skill for companion character sheet generation — mechanical build from an existing companion guide. Standalone — can be used independently. Sub-agent use only.
user-invocable: false
allowed-tools: Bash
effort: high
---

The workspace root is: !`pwd`

# Companion Sheet Generation — Execute Procedure

Generate a mechanically sound, rules-legal character-sheet for a companion from their existing companion-guide.

## Pre-flight Check

- [ ] **Read the character sheet template** from the `doc-templates` skill (`character-sheet.md`). This contains section-by-section writing standards and the document structure. All sheet content must conform to these standards.

### Documents to Read

- [ ] `companion-guide.md` for this companion (path provided in briefing) — primary source for name, race, class, and thematic concept. All build decisions must align with the concept defined here.
- [ ] `campaign-settings.md` — system, level, party composition
- [ ] `campaign-pitch.md` — system edition, tone
- [ ] The PC `character-sheet.md` doc — power level reference
- [ ] **Reference files** — read `content-sources.md` at `[workspace-root]/content-sources.md` (using the workspace root provided at the top of this skill's content) and find this companion's class and subclass. If the Reference column links to a file, read it as the mechanical source of truth. If it says `Model Knowledge`, proceed using built-in knowledge. If the class/subclass is not listed, proceed using built-in knowledge but note reduced reliability.

---

## Sheet Generation

Follow these steps in order. Each step builds on the previous — do not calculate derived values until their dependencies are resolved.

### Step 1: Establish Identity

Read the companion-guide to extract Name, Race, and Class. Read campaign-settings.md for party level.
* Set System from campaign-settings.
* Set Role to "Companion party member (NPC)".
* Set Proficiency Bonus based on total character level.
* Set Map Token to the emoji circle color provided in the briefing. If no Map Token was specified in the briefing, assign from available party colors (🟢 🔵 🟣 🟡) — check existing party member character-sheets to avoid duplicates.
* Set Coin to `0 (managed by PC)` — companions never carry party funds. Party funds live on the PC character sheet.

### Step 2: Generate Ability Scores

Use the **Standard Array** (15, 14, 13, 12, 10, 8) as the base. **DO NOT roll for ability scores. Companions ALWAYS use the Standard Array — never 4d6-drop-lowest, never point buy, never any other method.** Apply modifiers in this order:
1. **Assign** the six values to the six abilities. Prioritize the primary ability score(s) for the character's class and assign the remaining scores to reflect the companion's personality and role.
2. **Apply racial modifiers** according to the TTRPG system's rules for the character's race or background. When applying modifiers, first maximize the primary stat(s) for the class (SAD → pump one core stat, MAD → pump both), then prioritize bumping odd scores to even to maximize modifier gains — a +1 to an odd score (e.g., 13→14) gains a modifier increase; the same +1 to an even score (e.g., 14→15) does not.
3. **Apply ASIs** earned from class level progression, respecting the score maximum of 20 unless a feature explicitly allows exceeding it. Some ASIs may be traded for feats — account for those trades in Step 3.

### Step 3: Determine Feats

* If the system includes Origin Feats (e.g., D&D 5e 2024), select one that fits the companion's concept.
* For each ASI level where a feat is taken instead of an ability score increase, select a feat that supports the build and concept.
* Note the source of each feat (origin, class feature, ASI trade, etc.).

### Step 4: Compile Class Features

List all class features, racial traits, and other non-spell, non-feat abilities at their level. Follow the detail-level guidance in the doc-templates character sheet template (name-only default, resource counts for limited features, grouped sub-features, mechanical notes only for deviations).

### Step 5: Assign Equipment

Determine starting equipment based on level tier:
* **Levels 1-4:** Standard starting equipment for the class. No magic items.
* **Levels 5-9:** Mundane equipment upgraded to next tier where appropriate. One Uncommon magic item.
* **Levels 10-14:** Further upgrades. One Uncommon and one Rare magic item.
* **Levels 15+:** Top-tier equipment. One Uncommon, one Rare, one Very Rare magic item.

Equipment rules:
* Magic items must be thematically appropriate to the companion's class, role, and personality.
* Respect the attunement limit of 3. Mark attuned items with (A).
* Use the PC's `character-sheet.md` doc as a power level reference — the companion should not significantly outshine or fall behind the PC in equipment quality.

### Step 6: Calculate Combat Stats

With ability scores and equipment finalized, calculate all derived combat values:
* **HP:** Class hit dice + CON modifier per level (use fixed values: d6=4, d8=5, d10=6, d12=7).
* **AC:** Armor + DEX modifier + shield + equipment/feature bonuses. Include breakdown.
* **Speed:** Walking speed with breakdown if bonuses apply. Add other movement types if applicable.
* **Resistances:** From race, class features, or equipment. List sources.
* **Reactions:** Index of all available reactions (always include Opportunity Attack).
* **Spell Save DC:** 8 + proficiency bonus + casting ability modifier. Omit if non-caster.
* **Spell Attack:** Proficiency bonus + casting ability modifier. Omit if non-caster.

If the class has a major combat mode (Wild Shape, Rage, Ki, Metamagic, etc.), create a dedicated combat subsection with activation cost, resource pool, effects, and available options.

### Step 7: Select Spells

If the character is a spellcaster:
* **Selection philosophy:** Spells must reflect the companion's personality, role, and combat style from the guide. Balance combat, utility, and support.
* **Prepared casters (CRITICAL):** Fill ALL preparation slots. Subclass/domain always-prepared spells don't count against the limit.
* **Known casters:** Select the exact number of spells known for the class and level.
* **Spell level verification (CRITICAL):** Every spell must be available at the character's class level. No spells above their maximum spell level.
* **Organization:** By casting time (Cantrips, Action, Bonus Action, Reaction, Ritual). Categorize by the action to cast, not ongoing maintenance.
* **Non-standard sources:** Slot-consuming spells go in action-economy lists tagged with source. Non-slot spells get separate source entries. Dual-source spells appear in both places.
* **Completeness:** Include all spells from racial features, feats, and subclass abilities.

### Step 8: Assign Skills

Select proficiencies from class and background options. Add expertise or special bonuses from features, feats, or equipment.

### Step 9: Fill Notes and Flavor

* **Notes:** Standing narrative state relevant at this level — known teleportation circles, familiar details, default behaviors ("casts Mage Armor every morning"), persistent ties. "(None)" if none apply. Most companions will have "(None)" or a single line.
* **Flavor (optional):** Only if the companion's abilities manifest in a thematically distinct way based on the guide. Short prose (1-2 paragraphs) — sensory combat-visual texture only. No personality, motivations, or non-combat behavior. Omit if abilities present in a standard way for the class.

### Step 10: Place Narrative-Break Marker

Insert `<!-- narrative-break -->` **immediately before `## Feats`**. This is the companion default: `## General`, `## Abilities`, and `## Notes` load in narrative sessions; everything below (Feats, Features, Combat, Equipment, Flavor) loads on-demand or in combat sessions.

### Step 11: Final Review

Before writing the file, verify internal consistency:
* Ability score modifiers correctly derive from scores.
* Saving throw values reflect proficiency and all equipment/feature bonuses.
* HP and AC breakdowns are arithmetically correct and match listed equipment.
* Spell Save DC and Spell Attack match casting ability and proficiency bonus.
* Number of prepared/known spells matches the class features table exactly.
* Spell slot counts match class level progression.
* No spell exceeds the maximum spell level for the character's class level.
* Attunement count does not exceed 3.
* Reactions line includes all available reactions.

---

### Step 12: Generate status.json

Also produce `status.json` alongside the character sheet — you already have all the data in context from the prior steps: identity, abilities, race/level/PB, Speed, HP/AC/HD, spell slots and prepared list, class resources, feats, weapons, skills, SpellDC/SpellAttack, map token.

1. Read the status JSON template from the `doc-templates` skill (`status-json-template.md`).
2. The template file contains schema reference and filling instructions. Follow them in full — including the expanded static fields (`abilities`, `race`, `level`, `proficiencyBonus`, `Speed`), the array schemas (`spells[]`, `feats[]`, `weapons[]`), and tooltip conventions for class resources and high-reference spells/feats.

Omit resource keys and array fields the companion doesn't have. Don't add redundant `longRest: "max"` (that's the default).

---

## Output

Write two files to the companion's existing directory:
- `character-sheet.md` — the full mechanical sheet
- `status.json` — the live party-status tracker seed

---

## Report

State:
* File paths for both the sheet and status.json
* Mechanical summary (class, level, key combat stats, notable spell/feat choices)
* Any mechanical judgment calls (feat selection, spell choices, equipment — things the player might want to adjust)
