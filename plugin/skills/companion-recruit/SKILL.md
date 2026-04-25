---
name: companion-recruit
description: Generate a companion guide and character sheet for a new companion. Two-step flow: guide first (with player approval), then sheet. Delegates to gm-creative in the background.
---

# Companion Recruitment — Orchestration

Generate a companion-guide and character-sheet for a new companion through a two-step background process with a player approval gate between.

---

## Step 1 — Companion Guide

**Scope:** Use `$ARGUMENTS` and conversation context. The input can range from very detailed (name, race, class, personality notes from in-session play) to near-zero ("recruit a companion for the campaign"). Include whatever you have — the agent handles the rest from campaign documents and its own creative judgment.

**Dispatch:** Compose the agent briefing by adapting the reference below. The critical principle: **you have session context the agent does not.** The briefing should capture unrecorded details — in-session interactions, player comments, how the recruitment unfolded, player preferences. Do NOT repeat information already in campaign documents (npc-directory, recent-events, etc.) — reference those docs by name instead. If you have very little context, that's fine — say so and let the agent work from campaign docs. Spawn as a **background** `gm-creative` agent. Continue on with gameplay or campaign creation steps accordingly.

**Guide briefing reference:**

```markdown
# Generate Companion Guide

## Campaign
The active campaign is at `[campaign path]`.

## Context
[Everything you know about this companion that ISN'T already in campaign docs. Can range from extensive to minimal:

- **Rich context** (mid-campaign recruitment): Name, race, class if known. Unrecorded in-session interactions, dialogue, personality observed during play. How the recruitment unfolded. Player reactions and preferences expressed during the session. Reference existing docs by name where info is already captured (e.g., "See `npc-directory.md` for their established background").

- **Moderate context** (campaign creation): What the player said about the companion during setup — could be a name + class + personality sketch, or just a general desire like "a healer who's cynical about religion."

- **Minimal context**: Just a general direction like "the player wants a second companion" or "recruit a companion for the campaign." The agent will derive direction from campaign-pitch and party analysis.

Everything in this section is treated as canon.]

## Player Notes
[Optional. Player preferences, requests, or emphasis — e.g., "Player wants her to be prickly and slow to trust", "Should be a melee frontliner". Omit section if no player input.]
```

---

## Step 2 — Present to Player

When the guide agent reports back, present the **Player Card** from the report to the player at a natural pause. The Player Card is a formatted introduction (name, race, class, visual, in-character intro) — NOT the full guide. The rest of the report (concept summary, party role, creative decisions) is GM context — share only if the player asks.

Ask the player: does this feel right for the party?

---

## Step 3 — Player Decision

**Approved:**

1. **Map Token Selection.** Ask the player to choose a map token color for the companion's battle map marker. Present the available colors from the party palette (🟢 🔵 🟣 🟡), noting which are already taken by existing party members (check character-sheets in `campaign-members/` for Map Token fields). If only one color remains, inform the player and auto-assign.

2. Compose a sheet briefing and spawn another **background** `gm-creative` agent. The sheet agent writes the `character-sheet.md` only — no campaign integration. Continue gameplay while the agent works.

**Sheet briefing reference:**

```markdown
# Generate Companion Sheet

## Campaign
The active campaign is at `[campaign path]`.

## Companion
[Name]. Guide at `[full path to the companion-guide.md doc]`.

## Map Token
[Emoji circle chosen by the player, e.g., 🟣]

## Player Notes
[Optional. Mechanical preferences expressed during the approval step — e.g., "Player wants defensive spells prioritized", "Take Sentinel feat instead of ASI". Omit if none.]
```

After dispatching the sheet agent, **immediately** proceed to Step 4 (Campaign Integration). Do not wait for the sheet agent — the `companion-guide.md` doc has all the information needed for integration.

When the sheet agent eventually reports back, link the file path to the player — you generally don't need to read character sheets.

**Rejected / Wants changes:** Archive the companion guide using the standard archive protocol (`archive/[CampaignName]/companion-guide-[Name]-rejected.md`), then remove the companion's `co-[name]` directory. If the player wants a different take rather than outright rejection, re-run from Step 1 with updated notes incorporating their feedback.

---

## Step 4 — Campaign Integration

After dispatching the sheet agent, read the approved companion-guide and integrate the companion into the campaign's cross-cutting documents. **Conditional:** only perform integration if the companion is NOT already in campaign-settings.md (i.e., this is a new companion, not a regeneration for an existing one). If already present, skip this step entirely.

1. **Update campaign-settings.md** — add the companion to the `Members` list under Party: `[Name] (Companion) - [Race] [Class]`
2. **Update campaign CLAUDE.md** — add a row to the Companions manifest table, following the existing row format
3. **Create (Companion) thread in gm-canon.md** (read the companion-guide's Motivations section for direction):
   * Thread name: `### [Name]: [Arc Theme] (Companion)`
   * Direction from Motivations + guide context
   * Party Knows: empty (newly recruited, no progression yet)
   * No breadcrumbs initially
   * Prefer one thread per companion; only split if two genuinely distinct and independent arcs are clear
The `status.json` file is written by the sheet sub-agent alongside `character-sheet.md` — no additional step needed here.
