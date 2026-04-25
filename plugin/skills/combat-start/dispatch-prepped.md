# Dispatch Template — Prepped Path

Use this template when the encounter has an existing combat-data prep file (e.g., `gm-prep/NNN-*-combat.md`). The combat-prep agent will read the prep file directly for stat blocks and tactics — **do not restate them in this dispatch**.

Compose the briefing by adapting the reference below. Replace `[placeholders]` with what you already know from the current session. Spawn as a **background** `gm-combat-prep` agent (`run_in_background: true`) — this keeps the player's chat clean while the agent works. You'll be notified automatically when it completes.

## Agent briefing reference

```markdown
# Prepare Combat
Prepare combat and fill the combat briefing with the info provided below.
> Debug: false

## Campaign
The active campaign is at `[campaign path]`.

## Last Narrative Output
[Scene text — copy your last narrative message verbatim, the one that set the combat scene and ended with the `>> **Roll Initiative**` event marker.]

## Setting
[Describe how the immediate environment actually rendered at the table — physical dimensions, terrain, lighting, crowd, any narrative-only features. You are the source of truth for this; it may drift from the prep file's expected layout based on how the party engaged the scene. Include approximate dimensions if apparent — e.g., "a 60-foot stretch of waterfront, 30 feet deep" — for battle map grid sizing.]

## Enemy State-of-Play
[1-3 lines describing what the party perceives right now — enemy count, positioning at the moment initiative is rolled, any drift from the prep file's expected starting layout. DO NOT restate enemy descriptions, stat blocks, or tactics — the prep combat-data file has all of that. Example: "Three Sylvari Dominion fighters in tight triangular formation at the north starting line, ~60 ft from La Selección. The party has scouted them extensively and knows the formation." That's enough.]

## Party Status
[Deltas only. Current HP only if NOT at full; active conditions/buffs; resources expended earlier in the session (spell slots, Focus points, charges). Do NOT list every spell slot, do NOT restate weapons/features/abilities — the agent reads character sheets directly. Example:
- El Brody: full HP, concentrating on Blade Ward
- Hugol: full HP, holding a d8 Bardic Inspiration die from Brody
- El Kaiser: full HP, Aid +5 max HP active
That's enough.]

## Module Prep Reference
[Required — the path to the combat-data file. Example: "Encounter 2 — Shore Surge, combat data at `gm-prep/005-merebank-prep-combat.md`". **If this file does not exist, the agent will abort.**]

## Narrative Constraints
[All in one place — include here if any apply, omit the section if none:
- Team plan (if the player declared one): one concise block, Turn 1 / Turn 2 / backup. DO NOT repeat it in Party Status.
- Sanctioned rules or match constraints (e.g., "no intentional killing", "surrender honored")
- Narrative weight the Combat GM should preserve (e.g., philosophical stakes, established NPC behavior)
- Special pre-combat conditions (e.g., "the party chose to fight in the open instead of retreating to cover")
- Inversion clauses (e.g., "if Captain falls, party can keep fighting — opposing side cannot")
]

## Party Status File
`.sessions/${CLAUDE_SESSION_ID}/party-status.json` (relative to the active campaign dir)

## Output
Write `combat-briefing.md` to `.sessions/combat-briefing.md` (relative to the active campaign dir).
```

---

## What to cut vs current behavior

- **No Enemy Description restatement.** The prep file has the full enemy detail. 1-3 lines of party-perceived state is enough.
- **No team plan duplication.** The team plan lives in Narrative Constraints ONCE — not in Party Status.
- **Party Status = deltas only.** Not a full state dump. If HP is full and no conditions/expenditures, a single line per character is enough.
- **Setting stays full.** You are the source of truth for how the scene rendered at the table.

## After Completion

When the background agent's completion notification arrives, signal the player:

> Combat handoff is ready. Start a new Claude Code session and state your initiative roll: **Initiative roll: XX**. The Combat GM will pick up from there. If unsure, start the session saying **Combat session** and the GM will guide you.

If the agent reported a failure (e.g., missing prep file), report the error to the player instead and recommend a fix (correct the path, or switch to improvised dispatch).
