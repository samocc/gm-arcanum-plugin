---
name: combat-start-internal
description: Internal 'system' skill for preparing combat — routes to prepped or improvised mode based on the dispatch. Only for sub-agents use, the Narrative GM should never invoke this skill.
user-invocable: false
effort: medium
allowed-tools: Bash
---

# Combat Briefing Preparation — Mode Router

**Active campaign directory:** !`echo ${GM_ARCANUM_ACTIVE_CAMPAIGN}`

All file paths in this skill (and its mode files) are relative to that directory unless otherwise noted.

This skill has two operating modes. Read the narrative GM's dispatch **first**, then load the correct mode file:

| Dispatch signal | Mode | File to load |
|---|---|---|
| `Module Prep Reference` points to an existing combat-data file | **Prepped** | `${CLAUDE_SKILL_DIR}/mode-prepped.md` |
| `Module Prep Reference` says "Improvised encounter — no module prep" (or equivalent) | **Improvised** | `${CLAUDE_SKILL_DIR}/mode-improvised.md` |

Load **only** the mode file you need. The two modes have different pre-flight checks, different read lists, and different calibration behavior — loading both wastes context.

---

## What You Write

Both modes produce the same output: `combat-briefing.md` at `.sessions/combat-briefing.md` (relative to the active campaign dir shown above), following `${CLAUDE_SKILL_DIR}/combat-briefing-template.md`. Both modes also write `party-status-seed.json` to the same `.sessions/` directory (`.sessions/party-status-seed.json`). The briefing scope covers **the combat encounter only** — from the moment initiative is rolled until the turn-by-turn fight ends. Aftermath elements (post-combat dialog, loot, narrative hooks) are out of scope.

## Debug Mode

**If the dispatch says `Debug: true`:** Include the full difficulty calibration reasoning in your report — what adjustments you made, why, the math behind to-hit/save probabilities, and how the encounter targets party vulnerabilities. This is for testing and validation.

**If Debug is False (default):** Omit calibration details from your report. The narrative GM doesn't need them during live play.

---

Now load the correct mode file and proceed.
