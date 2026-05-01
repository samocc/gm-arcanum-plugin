# Character Sheet — Writing Standards & Template

Section-by-section writing standards for character-sheet documents. This is primarily a mechanical reference document.

## Narrative-Break Marker

Character sheets can include a `<!-- narrative-break -->` HTML-comment marker. This marks what portion of the sheet is relevant for narration, the rest is only combat relevant, when creating a new character-sheet adhere to the default positions.

**Default marker positions:**
* **PC sheets:** marker at end of file (full narrative load).
* **Companion sheets:** no marker by default.

**Customization:** The marker is player-tunable. MetaGM can move it, or reorder sections around it, to change what the narrator sees for a given character. If a particular companion has important standing state (e.g. a familiar that matters in scenes), move the marker down past `## Notes` on that sheet, or move individual sections above the marker. An absent marker means the full file loads.

---

## Section Standards

The template below contains detailed placeholder descriptions for most fields. These standards cover areas where additional guidance is needed beyond what the template specifies.

### Ability Scores

Mark proficient saving throws with an asterisk on the Ability name (e.g., "WIS*"). The Save column must be the final calculated value including proficiency bonus, equipment bonuses, and feature bonuses.

Save Bonuses use bullet sub-entries with source, effect, and "(included in table)" marker when already reflected in the Save values above.

### Features

**Default: list features by name only.** The GM is expected to know standard class features. Include resource counts in parentheses when the feature has a limited resource.

* **Group related sub-features** under a parent entry (e.g., Channel Divinity with its options).
* **Add a mechanical note only when** the feature deviates from standard rules (homebrew, edition-specific changes) or the combat application is non-obvious.

Correct detail level:
* Fey Ancestry — name only
* Darkvision — name only
* Extra Attack — name only
* Lay on Hands (40 HP pool) — name + resource count
* Relentless Endurance (1/LR) — name + resource count
* **Channel Divinity:** Turn Undead, Radiance of the Dawn — grouped sub-features

Incorrect:
* Fey Ancestry: Advantage on saving throws to avoid or end the Charmed condition — unnecessary, standard well-known feature
* Lay on Hands: Pool of 40 HP. As an action, touch a creature to restore HP... — resource count is fine, full mechanic description is not

* **Subclass threshold:** If the subclass is not yet active, include only base class features and features from other sources (race, background, feats). Subclass features are added when the character reaches the activation level.

### Combat — Class-Specific Subsections

If the class has a major combat mode (Wild Shape, Rage, Ki, Metamagic), create a dedicated combat subsection with mechanical details: activation cost, resource pool, effects, available options. Detailed combat mechanics for major class features belong in their own subsection, not in the Features list.

### Spellcasting

Omit this entire section if the character has no spellcasting.

**Spell Slots:** Show progression as pipe-separated counts by level (e.g., "4 | 3 | 2" for a level 5 full caster = 4 first-level, 3 second-level, 2 third-level). Positional — first number is always 1st-level slots. Update on level-up.

**Prepared Spells:** Show current count, maximum, and when they can be changed. The swap rule varies by class:
* **Swap freely on LR:** Cleric, Druid, Paladin, Wizard — prepare any spells from their list/spellbook after each Long Rest.
* **Swap one on level-up:** Sorcerer, Bard, Ranger, Warlock — choose prepared spells at level-up; can swap one spell for another on each level-up. (2024 rules use "prepared" terminology for all classes, but the swap timing is unchanged from prior editions.)

Always-prepared spells from subclass, race, or feats don't count against the preparation limit. Show the total in parentheses with sources listed, e.g., "(+10 always-prepared from Subclass, Race, Feats)".

**Organization:** Organize spells by casting time (Cantrips, Action, Bonus Action, Reaction, Ritual). Categorize each spell by the action required to cast it, not by ongoing maintenance (e.g., Moonbeam is cast as an Action even though it can be moved as a Bonus Action on later turns — list it under Action). If a casting-time category has 10 or more spells, break it into functional sub-groups (e.g., Damage, Control, Support) for scannability.

**Sorting:** Within each casting-time category (or sub-group), sort always-prepared spells first (subclass, race, feats), then regular prepared spells. Within each group, sort by base spell level ascending. This puts the permanent fixtures at the top and makes it easy to scan from low-cost to high-cost options.

**Key rules:**
* **Non-standard sources:** Spells that consume slots go in main action-economy lists tagged with source (e.g., "Burning Hands (Domain)"). Spells that do NOT consume slots get a separate labeled source entry (e.g., "Mystic Arcanum: Summon Fiend (1/LR)").
* **Dual-source spells:** If castable both with and without a slot (e.g., a racial spell that grants one free cast but can also use spell slots), list in both places.
* **Class features are not spells.** Reactions and features that use action economy (Warding Flare, Cutting Words, Deflect Missiles) belong in the Combat subsection, not in the spell lists.
* **Completeness:** Include all cantrips and spells from racial features, feats, and subclass abilities — not just base class spells.

### Flavor

Strictly sensory/combat-visual narration — what strikes, spells, or class features look, sound, and feel like in combat. No personality, motivations, backstory, or non-combat behavior.

---

## Final Review Checklist

Before finishing, verify internal consistency:
* Ability score modifiers correctly derive from scores.
* Saving throw values reflect proficiency and all equipment/feature bonuses.
* HP and AC breakdowns are arithmetically correct and match listed equipment.
* Spell Save DC and Spell Attack match casting ability and proficiency bonus.
* Number of prepared spells matches class features table exactly.
* Spell slot counts match class level progression.
* No spell exceeds the maximum spell level for the character's class level.
* Attunement count does not exceed 3.
* Reactions line includes all available reactions (Opportunity Attack, spells, features).
* Map Token is set and unique within the party (no two party members share a color).

---

## Template

```markdown
# Character Sheet - [Name]

## General

* **Name:** [Character's full name]
* **Role:** [Player Character (PC) | Companion party member (NPC)]
* **Race:** [Race and subrace if applicable]
* **Class:** [Class(es) with level and subclass, e.g., "Paladin 8 (Oath of the Ancients)". If the character's level is below their class's subclass activation level, annotate the intended subclass without listing it as active, e.g., "Cleric 2 (Light Domain selected — becomes active at level 3)"]
* **System:** [TTRPG system and edition, e.g., "D&D 5e (2024)"]
* **Proficiency Bonus:** [+N, derived from total character level]
* **Map Token:** [Emoji circle for battle maps — chosen by player from party palette: 🟢 🔵 🟣 🟡]
* **Coin:** [For PCs: this PC's coin (each PC tracks their own funds), e.g., "15 gp" or "10 gp 5 sp 3 cp". For Companions: always "0 (managed by a PC)" — companions do not carry party funds.]

## Abilities

### Ability Scores

| Ability | Score | Mod | Save |
|---------|-------|-----|------|
| STR | [Score] | [Mod] | [Save] |
| DEX | [Score] | [Mod] | [Save] |
| CON | [Score] | [Mod] | [Save] |
| INT | [Score] | [Mod] | [Save] |
| WIS | [Score] | [Mod] | [Save] |
| CHA | [Score] | [Mod] | [Save] |

**Save Bonuses:** [List modifiers as bullet sub-entries. Use "* (None)" if none.]
* [Source, e.g., "Fey Ancestry", "Ring of Protection"]: [Effect] [(included in table) if already reflected in Save values above]

### Skills

* **Proficiencies:** [All skill and tool proficiencies, comma-separated]
* **Expertise:** [Skills with expertise. "(None)" if none.]
* **Bonuses:** [Special skill bonuses with sources, e.g., "+1 Perception (Sentinel's Brooch)". "(None)" if none.]

## Notes

[Standing narrative state — things the narrative GM needs to know about the character outside combat. Examples: known Teleportation Circles, Transport Via Plants locations, familiar details, default behaviors ("casts Mage Armor every morning before setting out — assume it is always on"), persistent world ties, standing pacts. "(None)" if nothing applies. May be empty for most characters.]

## Feats

* [Feat Name (source, e.g., "Origin feat", "Level 4 ASI trade")]

## Features

* [Feature Name] or [Feature Name (resource, e.g., "1/LR", "40 HP pool")]
* **[Feature Group]:** [Sub-feature], [Sub-feature]

## Combat

### Stats

* **HP:** [Total (breakdown, e.g., "84 (52 base + 16 CON + 16 Tough)")]
* **AC:** [Total (breakdown, e.g., "19 (15 Scale Mail +1 + 2 DEX + 2 Shield)")]
* **Speed:** [Walking speed. Include breakdown if bonuses apply. Add other movement types if applicable.]
* **Resistances:** [Type and source. "(None)" if none.]
* **Reactions:** [Index of all available reactions. Always include Opportunity Attack.]
* **Spell Save DC:** [Value (breakdown). Omit if non-caster.]
* **Spell Attack:** [+Bonus (breakdown). Omit if non-caster.]
* [Class-specific combat fields as applicable, e.g., "**Fighting Style:** Interception", "**Weapon Mastery:** Greataxe (Cleave)"]

### Spellcasting
[Omit this entire section if the character has no spellcasting.]

* **Spell Slots:** [Pipe-separated counts by level, e.g., "4 | 3 | 2"]
* **Prepared:** [Current] of [Max] — [Swap rule, e.g., "Swap freely on LR" or "Swap one on level-up"] (+[N] always-prepared from [sources])
* **Cantrips:** [List. "(None)" for half-casters with no cantrips.]
* **Action:** [Spell list]
* **Bonus Action:** [Spell list]
* **Reaction:** [Spell list. "(None)" if none.]
* **Ritual:** [Spell list. "(None)" if none.]
* **Scrolls:** [Spell scrolls held. Omit if none.]
* **Special uses (no spell slot):** [Omit if none. Group by source. Dual-source spells that can ALSO be cast with slots should appear in the action-economy lists above AND here.]
  * **[Source Name]:** [Spell (frequency), e.g., "Disguise Self (1/LR), Nondetection (1/LR)"]

#### Spellbook
[Wizard only. Omit entirely if not a Wizard. Non-prepared spells in the spellbook, swappable after Long Rest.]

* **General:** [Non-prepared, non-Ritual spells]
* **Ritual:** [Non-prepared Ritual spells]

### Martial

#### Weapons

* [Weapon with properties, e.g., "+1 Greataxe (Heavy, Cleave mastery)"]

#### Weapon Bonuses

* **[Bonus Name]:** [Attack/damage or mechanical effect, e.g., "+1 Greataxe: +9 to hit, 1d12 + 6 Slashing"]

### [Class-Specific Combat Subsection, e.g., "Wild Shape", "Rage", "Channel Divinity"]

## Equipment

### Equipped

* [Item Name (A) — mark attuned items with (A). Respect attunement limit of 3.]

### Backpack

* **Equipment:** [Gear not equipped. "(None)" if none.]
* **Consumables:** [Potions, scrolls, single-use items with quantities. "(None)" if none.]
* **Components:** [Spell components with gold values. "(None)" if none.]
* **Various:** [Personal items, clothing, adventuring gear. "(None)" if none.]

## Flavor

[Optional — short prose (1-2 paragraphs) describing how abilities manifest in combat. Sensory texture only. Omit if standard for the class.]

```

**Marker placement in generated sheets:**
* **PC sheet:** place `<!-- narrative-break -->` at the end of the file (after `## Flavor`), as shown in the template above.
* **Companion sheet:** no marker by default.
