# Campaign Manifest — Template

Template for the campaign-level CLAUDE.md file. This is the campaign's document index and auto-loading configuration.

Documents listed in the "Auto-Loaded Documents" section use `@` references — these are automatically loaded into Claude's context when the CLAUDE.md file is read. This eliminates redundant file reads at session start for universal documents. Session-specific documents (gm-canon, session logs, combat-briefing, character sheets, npc-directory, inventory) are loaded explicitly by their session skills

Copy this template and fill in the campaign-specific details. The structure is fixed; only the content within brackets changes.

---

## Section Standards

### Auto-Loaded Documents

These are loaded into context automatically via `@` references when the CLAUDE.md file is read. Universal documents needed for ALL session types. **Add one `@` line per PC `character-info.md`** and one per companion guide as those are added to the party.

### Narrative-Break Marker (Universal Partial Loading)

Any file in the campaign directory — character sheets, the NPC directory, inventory, custom docs — can opt into partial loading by including an HTML-comment marker: `<!-- narrative-break -->`. Content above the marker loads automatically in narrative sessions; content below loads on-demand or in combat sessions. Narrative sessions grep the campaign root for this marker at startup and load each matching file up to its marker line (excluding `archive/`, `gm-prep/`, and `session-logs/`). Files without the marker are unaffected — they follow their normal loading rule. The marker is a no-op on files already `@`-auto-loaded (the whole file is already in context). Players can move the marker, or reorder sections around it, to tune what the narrator sees.

### Custom References (Optional)

Player-authored instructions that point the GM to additional files (homebrew rules, rules references, lore supplements) live in a free-form `## Custom References` section at the bottom of the campaign CLAUDE.md. Since CLAUDE.md is always in context, any natural-language note there reaches the GM — no special wiring needed. Always-on custom docs should use `@` auto-load instead.

### Player Characters

Multi-row table. Add one row per PC. Solo campaigns have a single row; multi-PC campaigns add additional rows as PCs join (via `/gm:add-pc`).

### Companions

Add one row per companion. Remove this section entirely if no companions in the party.

### GM Prep

Module prep entries are added by `/gm:prep`. Modules are prefixed with the session number when created — keeps them sorted chronologically and disambiguates revisits.

---

## Template

```markdown
# Campaign CLAUDE.md

**[Name] — [Setting/Subtitle]**

[One-line campaign description.]

## Auto-Loaded Documents

@campaign-settings.md
@gm-directives.md
@campaign-pitch.md
@campaign-summary.md
@recent-events.md
@world-info.md
# One @-line per PC:
@campaign-members/pc-[name]/character-info.md

## Campaign Members

### Player Characters
| PC | Info | Sheet |
|---|---|---|
| [Name] ([Race] [Class]) | [character-info](campaign-members/pc-[name]/character-info.md) | [character-sheet](campaign-members/pc-[name]/character-sheet.md) |

### Companions
| Companion | Guide | Sheet |
|---|---|---|
| [Name] ([Race] [Class]) | [companion-guide](campaign-members/co-[name]/companion-guide.md) | [character-sheet](campaign-members/co-[name]/character-sheet.md) |

## GM Prep (GM Eyes Only)

| File | Status |
|---|---|

## Session Logs
Stored in [session-logs/](session-logs/) — populated after each session.
```
