---
name: companion-recruit
description: Generate a companion guide and character sheet for a new companion. Two-step flow: guide first (with player approval), then sheet. Delegates to gm-creative in the background.
---

# Companion Recruitment — Orchestration

Generate a companion-guide and character-sheet for a new companion through a two-step background process with a player approval gate between.

Companion Recruitment can run in parallel or as secondary to other tasks (during narrative gameplay). In those cases use the `SECONDARY` channel to run the process while the `PRIMARY` channel stays focused on the main task.

---

## Step 1 — Companion Guide

**Scope:** Use `$ARGUMENTS` and conversation context to understand the user's intent for the companion. The input can range from very detailed (name, race, class, personality notes from in-session play) to near-zero ("recruit a companion for the campaign"). Include whatever you have — the agent handles the rest from campaign documents and its own creative judgment.

**Dispatch:** Once enough context about the companion or the user has finished providing their input, compose the agent briefing by adapting the reference below. The briefing should capture unrecorded details — in-session interactions, player comments, how the recruitment unfolded, player preferences. Do NOT repeat information already in campaign documents (npc-directory, recent-events, etc.) — reference those docs by name instead. If you have very little context, that's fine — say so and let the agent work from campaign docs. Spawn as a **background** `gm-creative` agent. Continue on with gameplay or assisting the user accordingly. More than one companion can be recruited in parallel.

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

When the guide agent reports back:
1. Read the provided **Character Card**
2. Inspect the **IP Validation gate** section (the report's `IP Validation findings` line).
3. Two paths:

   A. (Follow this path when running via `SECONDARY` channel - narrative session) In your response include:
      1. The **Character Card** via `SECONDARY` channel.
      2. In the `PRIMARY` channel:

         > Full profile for [CompanionName] is complete — see Table Talk for details. If this feels right, we'll proceed to make [CompanionName] an official part of the team.

      3. If the IP validation contained anything other than `none`, also add a note in the `PRIMARY` channel with this shape:

         > One note: the agent proposed [list findings as `[kind] "[value]"`, joined naturally] which [isn't / aren't] in your content sources. Want to proceed, or pick alternatives?

   B. (Follow this path when running via `PRIMARY` channel - meta session) In your response include (all in `PRIMARY` channel):
      1. The **Character Card**
      2. Confirmation request:

         If this feels right, we'll proceed to make [CompanionName] an official part of the team.

      3. If the IP validation contained anything other than `none`, also add a note:

         > One note: the agent proposed [list findings as `[kind] "[value]"`, joined naturally] which [isn't / aren't] in your content sources. Want to proceed, or pick alternatives?

Then **halt this process** and continue narration or other tasks while waiting for the player to approve or request changes. Resume when they do. If changes are requested due to the IP-validation note, refer to Case 2 of the next section.

**Rejected / Wants changes:** Archive the companion guide using the standard archive protocol (`archive/[CampaignName]/companion-guide-[Name]-rejected.md`), then remove the companion's `co-[name]` directory. If the player wants a different take rather than outright rejection, re-run from Step 1 with updated notes incorporating their feedback.

## Step 2.5 — IP Validation
*Skip this step entirely if the IP validation findings from the previous step were empty.*

If the player confirmed they want to proceed, your next response must emit the IP Validation gate markers, for example:

```
>> **IP Validation: kind=Race, value=<Race>**
>> **IP Validation: kind=Subclass, value=<Subclass>**
```

The player will then either approve to move forward OR request you suggest an alternative.

* Case 1 — The player approved:
   1. Read the `content-sources.md` file at the workspace directory root and append the new validated instances to the logical section where they belong. Mark them as `Model Knowledge` by default.
   2. Proceed to the next step, consider the companion as approved already.

* Case 2 — The player requested changes:
   1. Read the `content-sources.md` file at the workspace directory root, it contains what Races, Classes and Sub-classes are already validated. Suggest alternatives to the player that are the best or closest fits, or walk the player toward finding a valid, IP-compliant alternative.

   **NOTE:** If the player once again decides on a Race/Class/Subclass not in `content-sources.md`, you must re-run Step 2.5 and re-send the IP Validation gate markers.

*To exit this step: Race, Class and Subclass must all exist in `content-sources.md` either because they were present already or because they were added on this step due to player approval*

---

## Step 3 — Sheet generation

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

When the sheet agent eventually reports back, link the file path to the player, then sync the new companion into the live session so they appear on the companion app immediately:

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/party-status-add-member.js ${CLAUDE_SESSION_ID}
```

Include `>> **Party Sync**` in the same response — this triggers the app push via the Stop hook. The new companion's status is now in `.sessions/${CLAUDE_SESSION_ID}/party-status.json`; read that file only if the player flags a discrepancy.

You generally don't need to read character sheets.

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
