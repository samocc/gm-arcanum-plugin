---
name: combat-start
description: Start combat — prepare a briefing via sub-agent and hand off to a combat session
user-invocable: false
---

# Start Combat

Prepare the handoff from narrative play to a combat session. Only invoke after you have narrated the combat trigger scene.

You do NOT need to read `character-sheet.md` docs, the combat-data prep file, or calibrate stat blocks — the sub-agent handles all of that. Your job is to **route** the dispatch and compose the scene-state context the sub-agent needs.

---

## Routing

Two paths based on whether the encounter has an existing combat-data prep file:

| Situation | Agent | Dispatch template |
|---|---|---|
| Encounter has a combat-data prep file (e.g., `gm-prep/NNN-*-combat.md`) | **gm-combat-prep** (sonnet) | `${CLAUDE_SKILL_DIR}/dispatch-prepped.md` |
| Improvised encounter — no combat-data prep file | **gm-creative** (opus) | `${CLAUDE_SKILL_DIR}/dispatch-improvised.md` |

**Load only the dispatch template for the path you need.** The two templates differ meaningfully — the prepped template is slim (the prep file has enemy detail) while the improvised template is fuller (the agent is designing from scratch).

Spawn the agent as a **background** call (`run_in_background: true`). The prep work does not need to happen in parallel with other narration — we background it purely to keep the player's chat window clean. Visible tool calls, reads, and agent "thinking" output bloat the chat and push the last narrative message out of view; background execution hides that noise.

**After dispatching:** end your turn with a brief system-note line below the combat trigger narration so the player knows what to expect:

> `> Combat prep running in the background. I'll signal the handoff when it's ready.`

Then stop. Do not keep narrating, do not poll the agent. When the background agent completes, you'll be automatically notified and can resume with the handoff signal (see "After Completion" in the dispatch template you used).

---

## Common Pitfalls to Avoid

**Do not duplicate content across sections.** If the team plan appears in Narrative Constraints, do not also put it in Party Status. Pick one place and stick to it.

**Do not dump every state detail.** Party Status is for deltas from full state (HP if not full, active conditions, expended resources). Full HP + no conditions + full resources = one line per character. The agent reads character sheets for everything else.

**Do not restate what's in the prep file (prepped path only).** Enemy stat blocks, tactics, and difficulty are already in the combat-data file the agent will read. A 1-3 line party-perceived summary is enough.

**Do keep the Setting field full.** You (the narrative GM) are the source of truth for how the scene actually rendered at the table. The agent will honor your version even if it drifts from the prep file's expected layout.

---

## Failure Handling

**If the prepped path is taken but the combat-data file does not exist** at the path you referenced, the agent will abort with an error. In that case:
1. Report the error to the player
2. Either fix the path (if you had the wrong filename) or switch to the improvised path and re-dispatch

Do not try to work around a missing prep file by guessing or improvising in the dispatch — let the agent handle one path cleanly.

---

## After Completion

Simply emit the event marker to trigger a combat session for the user, nothing else, no trailing content.

```
>> **Start Session: mode=combat**
```
