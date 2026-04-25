---
name: gm-guide
description: Custom campaign document knowledge base — common use cases, drafting guidance, and manifest integration. MetaGM session only.
user-invocable: false
---

# Custom Campaign Documents — Knowledge Base

Custom campaign documents are optional, player-authored files that provide additional instructions or references to the GM. They are regular campaign files — no different from any other document in the campaign. They get wired into the campaign CLAUDE.md, which is always in context — either via an `@` auto-load reference for always-on docs, or as a natural-language note pointing the GM to the file when a topic comes up.

There is no enforced subfolder or naming convention. The player decides where files live and how they're organized — the manifest link points to wherever the file is.

---

## Common Use Cases

| Category | Description | Examples |
|---|---|---|
| **Homebrew Rules** | House rules, custom mechanics, or rule modifications the player wants enforced | A homebrew flanking system, modified rest rules, custom crit tables, adjusted multiclass restrictions |
| **Mechanical/Rules Reference** | Clarifications on specific spells, features, or class mechanics where edition confusion or training-data inaccuracy is likely | 2024 vs 2014 spell differences (Mirror Image, Counterspell), specific feat interactions, multiclass spellcasting slot rules, subclass feature details |
| **Lore Supplement** | Additional worldbuilding beyond what `world-info.md` covers — deeper faction lore, historical context, cultural details | A detailed pantheon, a faction's internal politics, regional history the GM should reference during play |
| **Custom System Rules** | Structured gameplay systems the player wants to add | Alchemy crafting rules, ship combat, faction reputation mechanics, downtime activity systems |
| **Combat Tactics** | A reference of the party go-to combat tactics | Common strategies, positioning, roles, complex turns, action economy for a complex interaction |
| **Reference Cards** | Quick-reference summaries for complex or recurring mechanics | A combat cheat sheet for a complex companion build, a summary of how a custom subsystem works |

### Recognizing the Need

Players don't always ask for a "custom document." They describe a problem:

- *"I have some homebrew rules I want to use..."* — homebrew rules doc
- *"The GM keeps getting [spell/feature] wrong..."* or *"This works differently in 2024..."* — mechanical reference doc
- *"I want to flesh out [faction/region/deity] more than world-info covers..."* — lore supplement
- *"Can we add a crafting system?"* or *"I want downtime activities to matter..."* — custom system rules
- *"Can you make a quick reference for [complex mechanic]?"* — reference card

When a player request matches one of these patterns, suggest creating a custom campaign document and proceed with drafting.

---

## Drafting Guidance

When helping the player create a custom campaign document:

1. **Understand the intent.** Ask what problem the document solves or what information the GM needs. The document should answer: "What do I want the GM to know or do differently?"
2. **Keep it focused.** One document per topic. Homebrew combat rules should not also contain lore about the pantheon. If the player has multiple topics, create multiple documents.
3. **Keep it actionable.** The GM reads this during a session. Write rules as clear directives, not essays. Tables, bullet lists, and explicit examples are better than paragraphs of explanation.
4. **Use the player's voice.** These are the player's instructions to the GM. Preserve their intent and phrasing — refine for clarity, not for formality.
5. **Include context for why.** A rule without rationale is harder for the GM to apply correctly in edge cases. A one-line "why" after a rule helps the GM make judgment calls: e.g., *"Flanking grants +2 (not advantage) — advantage is too strong for the campaign's difficulty setting."*
6. **Target length.** Most documents should be under 100 lines. If a document is growing past that, consider splitting into multiple focused documents. Context is a finite resource — every line loaded at session start is a line the GM carries.

### Document Structure

There is no rigid template — structure should match the content. Every document should have:

- A `# Title` heading that clearly identifies the topic
- A brief opening line explaining what the document covers and why it exists
- Organized sections appropriate to the content:
  - Rules and mechanics: bullet lists or tables
  - Lore and worldbuilding: narrative sections with clear headers
  - References: lookup-friendly format (tables, alphabetical lists, categorized sections)

---

## Campaign Integration

When a custom campaign document is ready to be saved:

### 1. File Location

Ask the player where they want the file. Common patterns:
- Campaign root: `[campaign]/homebrew-rules.md`
- A subfolder: `[campaign]/guides/combat-rules.md`

The player's choice — whatever makes sense for their organization. If they don't have a preference, campaign root is fine for one or two documents; suggest a subfolder if they're creating several.

Create any needed directories:
```bash
mkdir -p [target-directory]
```

### 2. Loading Behavior

Ask the player how the document should reach the GM during sessions:

- **Always-on:** The document is small and universally relevant — load it at the start of every session.
- **Partial (narrative-break):** Larger doc where only the top portion needs to be always-on. Split it with a `<!-- narrative-break -->` marker — everything above loads automatically in narrative sessions, everything below is read on-demand. See the **Narrative-Break Marker** section of this MetaGM session for full details.
- **On-demand / conditional:** Only relevant when a specific topic comes up (e.g., homebrew crafting rules loaded if the party discusses crafting; a spell reference loaded if the relevant spell is cast).

### 3. Wiring into Campaign CLAUDE.md

The campaign `CLAUDE.md` is always in context during a session, so any instruction placed there reaches the GM. Wire the document based on the player's preference:

**Always-on:** Add an `@` reference in the Auto-Loaded Documents section:

```markdown
@path/to/document.md
```

Place after the existing auto-loaded documents (after companion guides if present).

**Partial (narrative-break):** Still wire the file via `@` auto-load as above — the narrative-break marker inside the file itself controls how much loads at session start. No separate manifest entry needed.

**On-demand / conditional:** Add a short natural-language note to the campaign CLAUDE.md pointing the GM to the file and describing when to read it. A dedicated `## Custom References` section (or similar heading) keeps these organized. Example:

```markdown
## Custom References

- Homebrew crafting rules live at [homebrew-crafting.md](homebrew-crafting.md) — consult when the party attempts to craft items or discusses crafting downtime.
- 2024 spell corrections at [spell-notes.md](spell-notes.md) — check before resolving Mirror Image, Counterspell, or other spells the player has flagged.
```

The GM reads these instructions whenever CLAUDE.md enters context and will load the referenced file when the described trigger fires.

### 4. Confirmation

After integration, confirm to the player:
- Where the file was saved
- How it's wired into CLAUDE.md (auto-loaded or natural-language reference)
- When it will reach the GM (every session vs. when the trigger fires)
- Remind them they can edit the file directly at any time, or return to a MetaGM session to revise it collaboratively
