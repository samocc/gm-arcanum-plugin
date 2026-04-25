# Content Sources — Template

Template for the workspace-root `content-sources.md`. This file is the single source of truth for what classes and subclasses are available for character creation and level-up, and where the mechanical reference comes from.

Init creates this file with the default SRD entries. Players extend it with purchased content, homebrew, or other materials they have access to.

---

## Starter Content

```markdown
# Content Sources

Reference material for character creation and level-up. Classes and subclasses listed here are supported — the GM checks this file when building or updating character sheets.

- **To use a reference doc:** add the file to `ref/` and link it in the Reference column.
- **To use model knowledge:** set Reference to `Model Knowledge`. The model uses its built-in knowledge of the game system. Generally reliable for well-known content but may confuse edition-specific details (e.g., 2014 vs 2024 rules) — player should review mechanical output.
- **To add new content:** add a row to the appropriate table. Directory convention: `ref/[system]/[Class].md`, `ref/[system]/[Class]-[Subclass].md`, `ref/homebrew/[Name].md`.

---

## D&D 5e (2024)

### Classes

| Class | Reference |
|---|---|
| Barbarian | Model Knowledge |
| Bard | Model Knowledge |
| Cleric | Model Knowledge |
| Druid | Model Knowledge |
| Fighter | Model Knowledge |
| Monk | Model Knowledge |
| Paladin | Model Knowledge |
| Ranger | Model Knowledge |
| Rogue | Model Knowledge |
| Sorcerer | Model Knowledge |
| Warlock | Model Knowledge |
| Wizard | Model Knowledge |

### Subclasses

| Class | Subclass | Reference |
|---|---|---|
| Barbarian | Berserker | Model Knowledge |
| Bard | College of Lore | Model Knowledge |
| Cleric | Life Domain | Model Knowledge |
| Druid | Circle of the Land | Model Knowledge |
| Fighter | Champion | Model Knowledge |
| Monk | Warrior of the Open Hand | Model Knowledge |
| Paladin | Oath of Devotion | Model Knowledge |
| Ranger | Hunter | Model Knowledge |
| Rogue | Thief | Model Knowledge |
| Sorcerer | Draconic Sorcery | Model Knowledge |
| Warlock | Fiend Patron | Model Knowledge |
| Wizard | Evoker | Model Knowledge |
```
