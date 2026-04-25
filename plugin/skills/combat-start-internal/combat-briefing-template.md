# COMBAT BRIEFING

## Scene Text
[Paste the narrator's **Last Narrtive Output** here — this is the scene-setting text the player already read.]

## Battlefield
[A detailed description of the combat environment. Should include dimensions, key features (e.g., river, pillars, vegetation), terrain effects (like difficult terrain or cover), and current lighting conditions.]

### Battle Map

<!-- ASCII grid map of the battlefield.

Grid format (column letters, row numbers, 2-char-wide cells):

      A  B  C  D  E  F  G  H  I  J
 1    ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
 2    ·  ·  ·  ·  ░░ ░░ ·  ·  ·  ·
 3    ·  🟢 ·  ·  ░░ ░░ ·  ·  ·  ·
 ...

Tokens:
  Party members: emoji circle from their character-sheet Map Token field (🟢 🔵 🟣 🟡)
  Enemies: 🔴 (standard), 🟠 (elite/boss)
  Relevant NPCs: ⚪ (non-combatants the party cares about, e.g. escorted civilian)
  Non-party allies: 🟤 (e.g. town guards fighting alongside the party)
  Reserve: ⚫ (environmental hazards, objectives, anything not relevant not covered by other markers — use if needed)

Terrain symbols:
  ·  Open ground
  ██ Wall / pillar (impassable)
  ░░ Difficult terrain (rubble, undergrowth)
  ≈≈ Water (difficult terrain)
  ♦♦ Interactable object (lever, chest, brazier)
  Additional symbols can be introduced with legend entries.

Grid sizing (each cell = 5 ft):
  8×8 tight (alley, small room) | 10×10 standard | 12×15 large | 18×18+ exceptional
  Use the narrowest grid that fits the encounter. No wasted empty edges.

Legend after the grid — two lines:
  Line 1: party tokens mapped to names │ enemy tokens mapped to names
  Line 2: terrain key for all symbols used on this map
-->

[Generate the grid, tokens, and legend here following the specification above.]

## Combatants

### Allies
<!-- List each player character, companion, and temporary ally involved in the fight. 'Companion' in this context refers to permanent party members to the main character, not minions or summons.

**CRITICAL — Notes field discipline.** The Combat GM independently loads `character-sheet.md` for the PC and all companions at session start. Everything in those sheets is already in its context. The Notes field MUST NOT duplicate that content. Keep each Notes entry to 1-3 lines and include ONLY:
  * Active narrative-only conditions/buffs not obvious from the sheet (e.g., "concentrating on Blade Ward, plans to drop for Bane T1")
  * Combat-relevant equipment status differing from the sheet (e.g., "wielding pike instead of greatsword for this match")
  * Companion behavior trigger relevant to THIS encounter (1 line, reference by name — e.g., "Vulnerability Response on the table if struck")
  * Plan reference if the player declared one (1 line — e.g., "T1: Dash forward; T2: Action Surge on captain")

**DO NOT** restate: weapon stats, attack bonuses, damage dice, modifiers, feats, class features, spell slots, AC, saves, or anything the Combat GM will read directly from the character sheet. Restating sheet content bloats the briefing and slows preparation without adding information.

The sub-agent also writes `party-status-seed.json` containing the machine-readable party state plus enemy entries. The Combat GM receives this as the live status file — do not duplicate resource details in Notes.

Good Notes example:
  Notes: Concentrating on Blade Ward (plans to drop for Bane T1). Plan: push captain with Mobile Flourish T2 to break formation. Halfling Lucky available.

Bad Notes example (DO NOT write this):
  Notes: AC 16 with Defensive Flourish. Sneak Attack 2d6. Scimitar +6 to hit 1d6+3. Two 2nd-level slots. Halfling Lucky, Brave, Stout. Bardic Inspiration 4/5. Defensive, Slashing, Mobile flourishes available. Fancy Footwork. Rakish Audacity. [... and so on]
-->

1. Name: [Name of the Player Character] (PC)
   * Sheet/Stats: See `character-sheet.md` for the player character
   * HP: [Current HP]/[Total HP]
   * Position: [Grid coordinate + context. Must match token placement on the Battle Map. Example: "B3 — near the north door" or "H6 — behind the overturned cart (half cover)"]
   * Status: [Active status effects including their source. Example: Restrained by webs (environment), Blessed (Greg the Cleric), Hidden (behind brush). If no active effects, write "None".]
   * Notes: [1-3 lines max. See the Notes field discipline rules above.]

2. Name: [Name of the companion or ally] (NPC)
   * Sheet/Stats: [Reference to a full `character-sheet.md` if available in your context, a standard stat block name for an NPC, e.g., 'Guard', 'Priest', or class and level, or class/subclass and level]
   * HP: [Current HP]/[Total HP]
   * Position: [Grid coordinate + context. Must match token placement on the Battle Map.]
   * Status: [Active status effects, including their source. Example: Poisoned (Spiderling A). If no active effects, write "None".]
   * Notes: [1-3 lines max. See the Notes field discipline rules above.]

### Enemies
<!-- List each enemy or group of enemies involved in the fight -->

1. Name: [Name of the enemy or group, e.g., 'Orc War Chief', 'Goblins x4']
   * Sheet/Stats: [The standard stat block name to be used, e.g., 'Orc', 'Goblin Boss']
   * HP: [Current HP]/[Total HP]
   * Position: [Grid coordinate + context. Must match token placement on the Battle Map.]
   * Status: [Status Effects]
   * Notes: [Brief description of persona or appearance, weapons, tactics, or current actions, e.g., 'Taking cover behind pillars', 'Appears to be the leader']

### Neutral NPCs
<!-- List each Neutral NPC characters involved in the fight. Omit this section if none available -->

1. Name: [Name of the neutral character or group, e.g., 'Circus Performer', 'Tamed Lion x2']
   * Sheet/Stats: [The standard stat block name to be used, e.g., 'Noble', 'Commoner']
   * HP: [Current HP]/[Total HP]
   * Position: [Grid coordinate + context. Must match token placement on the Battle Map.]
   * Status: [Status Effects]
   * Notes: [Brief description of persona or appearance, goals, or current situation, e.g., 'Frightened and trying to flee', 'Will side with whoever seems to be winning']

<!-- Do not add sections beyond this template. The briefing contains only what the combat GM needs to run the fight. No aftermath notes, no post-combat guidance, no loot, no narrative hooks. The Battle Map subsection is part of the Battlefield section, not a new top-level section. -->

## Bonus Context

[This section is open for any remaining relevant information for the CombatGM to run the encounter. Free form, add what you need but only if relevant and not already covered on other sections, skip if no bonus context is needed.]