---
name: prep
description: Prepare and delegate a module prep document to a background creative agent. Execute when the player explicitly requests module prep (e.g., 'prep the next zone', 'can you prep the eastern passages').
user-invocable: false
---

# Module Prep — Orchestration

Determine scope, compose a briefing for a `gm-creative` agent, spawn it in the background, and continue gameplay while it works.

**Scope:** Use $ARGUMENTS if provided. Otherwise determine the next logical content block from the party's current situation. If unclear, ask the player.

**Dispatch:** Compose the agent briefing by adapting the reference below — replace `[placeholders]` with what you already know from the current session. Do not load additional files for this — provide what you have, the agent fills gaps from campaign docs. Spawn as a **background** `gm-creative` agent.

**Agent briefing reference:**

```markdown
# Generate Module Prep

[Prose paragraph: what to prep, the narrative situation, where the party is, what this content block covers and where its boundaries are.]

## Campaign
The active campaign is at `[campaign path]`.

## Important Context
[What you already know from the current ongoing session — best effort only from your current context, include what's relevant. *Some* good things to include are:
- Party state (HP, resources, rest status)
- Combat difficulty preference
- Active threads to develop or avoid
- NPC movements or plans
- Environmental context
- Player-expressed interests or plans
- Companion recruitment (if relevant). If companion slots are open module prep calls should request introducing companion candidates as part of the module.
- Anything else the agent should know that isn't in campaign docs]

## Output
**Naming convention:** `[NNN]-[zone-name].md` — session number (zero-padded to 3 digits), kebab-case zone name.

Write the completed prep to `[output path]`.

After writing, add a new row to `[campaign path]/CLAUDE.md`'s GM Prep manifest table (File | Status) with Status set to `Ready`.

**Report:** State the file path. Summarize: number of discoveries, encounters, and items. Flag any significant creative decisions (new NPCs, new factions, plot developments) the player might want to review. Note any threads left open for future preps.
```

---

## After Delegation

Continue gameplay. When the agent reports back, briefly acknowledge to the player that the prep is ready and where it was written. Read it yourself before the party reaches that content.
