# Dispatch Template — Improvised Path

Use this template when the encounter has **no combat-data prep file** — the party walked into a fight you didn't pre-design, or chose a scene that diverged from your prep. The gm-creative agent will design the encounter from scratch using your description, `world-info.md`, and `campaign-pitch.md`.

Compose the briefing by adapting the reference below. Replace `[placeholders]` with what you already know from the current session. Spawn as a **background** `gm-creative` agent (`run_in_background: true`) — this keeps the player's chat clean while the agent designs and writes the briefing. You'll be notified automatically when it completes.

## Agent briefing reference

```markdown
# Prepare Combat
Prepare combat and fill the combat briefing with the info provided below.
> Debug: false

## Campaign
The active campaign is at `[campaign path]`.

## Last Narrative Output
[Scene text — copy your last narrative message verbatim, the one that set the combat scene and ended with the `>> **Roll Initiative**` event marker.]

## Enemy Description
[What the party perceived — creature count, type (if identified or described), positioning relative to the party, and current behavior. Can be as specific or vague as your narration established. If the party identified Hook Horrors, say so. If they only saw "large shapes in the water," say that. The sub-agent will work with whatever you provide and design from there. Your freedom expands as the description gets vaguer.]

## Setting
[Narrate how the immediate environment looks and any distinguishable terrain constraints. Include approximate dimensions if apparent — e.g., "a 60-foot stretch of waterfront, 30 feet deep" — for battle map grid sizing.]

## Party Status
[Current HP for each party member (only if NOT at full), active conditions or buffs (Mirror Image, Mage Armor, etc.), and any key resources expended earlier in the session (spell slots, Focus points, charges). Do NOT list every ability or every weapon — the agent reads character sheets directly. Focus on deltas from full state.]

## Module Prep Reference
Improvised encounter — no module prep.

## Narrative Constraints
[All in one place — include here if any apply, omit the section if none:
- Special pre-combat conditions (e.g., "the party chose to fight in the open instead of retreating to cover")
- Established NPC behavior (e.g., "Xalyth already used Innate Sorcery earlier today", "one creature is focused on destroying a boat, not attacking the party")
- Narrative weight the Combat GM should preserve
- Team plan if the player declared one — ONCE, here, not in Party Status
]

## Party Status File
`.sessions/${CLAUDE_SESSION_ID}/party-status.json` (relative to the active campaign dir)

## Output
Write `combat-briefing.md` to `.sessions/combat-briefing.md` (relative to the active campaign dir).
```

---

## Notes

- **Party Status** should be deltas, not a full state dump. The agent reads character sheets for baseline stats.
- **Team plan** (if any) goes in Narrative Constraints ONLY — do not duplicate it in Party Status.
- **Enemy Description** has full latitude here, unlike the prepped path. The agent is designing from scratch and needs your description as its creative seed.

## After Completion

When the background agent's completion notification arrives, signal the player:

> Combat handoff is ready. Start a new Claude Code session and state your initiative roll: **Initiative roll: XX**. The Combat GM will pick up from there. If unsure, start the session saying **Combat session** and the GM will guide you.
