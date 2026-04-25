---
name: companion-evolve
description: Evolve a companion's guide to reflect relationship milestones. Delegates to gm-evolution agent.
user-invocable: false
---

# Companion RP Evolution

Update a `companion-guide.md` to reflect how the companion's relationship with the party has evolved past a lifecycle milestone. The evolution agent reads session evidence and rewrites the designated sections to match the companion's current stage.

The work runs in the background — tell the player what's happening and where the archive backup will be, then continue gameplay.

**Dispatch:** Compose the agent briefing by adapting the reference below — one briefing per companion being evolved. If multiple companions are evolving, spawn separate background agents for each. Spawn as a **background** `gm-evolution` agent.

**Agent briefing reference:**

```markdown
# Companion RP Evolution

## Mode
Execute — Companion RP Evolution

## Campaign
The active campaign is at `[campaign path]`.

## Companion
[Companion name]. Guide at `[full path to the companion-guide]`.

## Transition
[Current stage] → [target stage] (progress: [N], threshold: [T])

## Context
Sessions played: [N]. Last evolution: [session N or never].
[Any additional context from the evolution check — e.g., key moments that define this transition.]

## Notes
[Optional. Player requirements, preferences, or emphasis for this evolution — distilled from conversation, not pasted verbatim. Examples: "Player wants emphasis on the cave rescue moment", "Player asked not to change speech patterns yet". Omit section if no player input.]
```

---

## After Completion

When the agent reports back, relay to the player at a natural pause:
- Confirm which companion(s) were evolved and the transition (e.g., "Xalyth: acquaintance → teammate")
- Mention the archive location
- Summarize the key changes the agent reported
- Suggest the player review the updated guide — especially any sections the agent flagged for review
