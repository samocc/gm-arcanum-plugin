---
name: campaign-summary
description: Fold recent-events into campaign-summary — integrative update with thread label promotion. Delegates to gm-evolution agent.
user-invocable: false
---

# Campaign Summary Fold

Fold `recent-events.md` into `campaign-summary.md`. This is an integrative rewrite — not an append — that produces a coherent narrative overview of the campaign so far. Thread label promotion (emergent → Core Arc / Secondary Arc) also happens during this process.

The work runs in the background — tell the player what's happening and continue gameplay.

**Dispatch:** Compose the agent briefing by adapting the reference below. Spawn as a **background** `gm-evolution` agent. Do not wait for completion — continue gameplay. When the agent reports back, drop a lean inline OOC marker on its own line at a natural pause: `> 📜 Campaign summary fold complete.` Nothing more — the player can review `campaign-summary.md` at their convenience.

**Agent briefing reference:**

```markdown
# Campaign Summary Fold

## Mode
Execute — Campaign Summary Fold

## Campaign
The active campaign is at `[campaign path]`.

## Context
[Any additional context about why the fold was triggered — e.g., "evolution checker recommended this at session start" or "player requested directly".]

## Notes
[Optional. Player requirements or preferences for the summary fold — distilled from conversation, not pasted verbatim. Examples: "Player wants emphasis on the political threads", "Player noted the Collector storyline is most important". Omit section if no player input.]
```

