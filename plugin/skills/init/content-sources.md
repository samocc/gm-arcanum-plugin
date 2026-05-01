# Content Sources — Template

Template for the workspace-root `content-sources.md`. This file is the single source of truth for what races, classes, and subclasses are available for character creation and level-up, and where the mechanical reference comes from.

Init creates this file with the default SRD entries. Players extend it with purchased content, homebrew, or other materials they have access to.

---

## Starter Content

```markdown
# Content Sources

Reference material for character creation and level-up. Races, classes, and subclasses listed here are supported — the GM checks this file when building or updating character sheets.

> ⚠️ **Rights declaration.** Adding an entry to this file states that you hold the rights to use that content — whether from a purchased sourcebook, your own homebrew, or other licensed material. SRD-baseline content ships pre-populated.

- **To use a reference doc:** add the file to `ref/` and link it as the reference. Directory convention: `ref/[system]/[Race].md`, `ref/[system]/[Class].md`, `ref/[system]/[Class]-[Subclass].md`, `ref/homebrew/[Name].md`.
- **To use model knowledge:** set the reference to `Model Knowledge`. The model uses its built-in knowledge of the game system. Generally reliable for well-known content but may confuse edition-specific details (e.g., 2014 vs 2024 rules) — player should review mechanical output.
- **To add new content:** add a line to the appropriate section. Format: `- Name — Reference` for Races and Classes; `- Class / Subclass — Reference` for Subclasses.

---

## D&D 5e (2024)

### Races
- Human — Model Knowledge
- Elf — Model Knowledge
- Dwarf — Model Knowledge
- Halfling — Model Knowledge
- Dragonborn — Model Knowledge
- Gnome — Model Knowledge
- Goliath — Model Knowledge
- Orc — Model Knowledge
- Tiefling — Model Knowledge
- Aasimar — Model Knowledge

### Classes
- Barbarian — Model Knowledge
- Bard — Model Knowledge
- Cleric — Model Knowledge
- Druid — Model Knowledge
- Fighter — Model Knowledge
- Monk — Model Knowledge
- Paladin — Model Knowledge
- Ranger — Model Knowledge
- Rogue — Model Knowledge
- Sorcerer — Model Knowledge
- Warlock — Model Knowledge
- Wizard — Model Knowledge

### Subclasses
- Barbarian / Berserker — Model Knowledge
- Bard / College of Lore — Model Knowledge
- Cleric / Life Domain — Model Knowledge
- Druid / Circle of the Land — Model Knowledge
- Fighter / Champion — Model Knowledge
- Monk / Warrior of the Open Hand — Model Knowledge
- Paladin / Oath of Devotion — Model Knowledge
- Ranger / Hunter — Model Knowledge
- Rogue / Thief — Model Knowledge
- Sorcerer / Draconic Sorcery — Model Knowledge
- Warlock / Fiend Patron — Model Knowledge
- Wizard / Evoker — Model Knowledge
```
