---
name: campaign-create
description: Collaborative campaign creation workflow — guides the player through creating all foundational campaign documents.
effort: high
allowed-tools: Bash
---

# Campaign Creation

Create a new campaign from scratch through a collaborative conversation with the player. This skill is independent of any session type — there is no existing campaign to read.

The workflow is a sequential, multi-phase conversation that produces all foundational campaign documents. Each phase has a different balance of player input vs. model initiative. Documents are written to disk as each phase completes.

**Important:** Everything created here is a starting point. All settings and documents are fully editable and customizable — the player has full control and can update anything at any time during the campaign. If the player hesitates on a choice, reassure them that nothing is locked in.

**Conversational pacing:** Walk the player through each phase one topic at a time. Do not present the full list of questions or sections upfront — the player should feel like they're having a guided conversation, not filling out a form. Ask about one topic (or a small cluster of closely related topics), incorporate the response, then move naturally to the next. If the player volunteers information about upcoming topics in their response, take note and incorporate it when the time comes — no need to re-ask.

---

## Response Template

Campaign creation is a sequence of turns, each falling into one of two cadences. 

**Conversation cadence (most of Phase 1, 2, 3, 4, 5):**
```
> PRIMARY
[Conversational paragraph incorporating or responding to the player's last response]
[One question, or a tight cluster of closely related questions including your own suggestions and guidance. Propose, this is not a Q&A]
```

**Write-and-report cadence (Phase 2 output, Phase 3 output, Phase 6, Phase 7):**
```
[All tool calls — Read templates, Write files, Bash — happen first]
> PRIMARY
[Single summary reply listing what was written + transition to next phase]
```

> Campaign creation runs entirely via the `> PRIMARY` channel. The `> SECONDARY` channel is **disabled** and won't reach the player.

---

## Pre-flight: Session Initialization

```!
grep -q '"agent": "gm:gm-main"' .claude/settings.json 2>/dev/null && echo "Workspace: initialized" || echo "Workspace: not initialized"
```

- If **Workspace: initialized** — proceed to Startup.
- If **Workspace: not initialized** — invoke `/gm:init` to complete workspace setup before continuing.

## Startup

The campaign directory is `${GM_ARCANUM_ACTIVE_CAMPAIGN}` and already contains a placeholder `CLAUDE.md` with the canonical PC name. Run the startup sequence below.

1. **Compile party status.** Run:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/party-status-init.js ${CLAUDE_SESSION_ID}
   ```
   Expect **"no-status"**. If it prints **"armed"**, surface it as a warning in the greeting.

2. **Read `${GM_ARCANUM_ACTIVE_CAMPAIGN}/CLAUDE.md`** and use the `**PC name:**` value verbatim — do not derive from the folder slug.

3. **First reply — fixed template.** The opening message is fully deterministic (no player context yet), so use this template verbatim, substituting the PC name read in step 2. Do not load `meta-session` — continue following this skill.

   ```
   > PRIMARY

   >> **Session Mode: meta**
   >> **Party Sync**

   Welcome, **[PC Name]**! Let's build your campaign.

   Before the creative work begins, two quick essentials:

   **1. TTRPG System**
   - D&D 5e (2024)
   - D&D 5e (2014)

   **2. Player Experience** — how familiar are you with D&D?
   - **New to D&D** — first time or very few sessions
   - **Some experience** — played before, knows the basics
   - **Veteran** — know the system well

   Once I have these, we'll jump into shaping [PC Name]'s adventure.
   ```

   The **Player Experience** selection informs how much the model explains during creation, which gm-directives template is used, and default combat difficulty. Note the selection for use later in Phase 6 and Phase 7.

Proceed to Phase 1 once the two essentials are collected.

---

## Phase 1: Character Info

**Balance:** Collaborative — player's ideas first, model helps generate the rest.

The player has the most input here, but the model is an active creative partner — not a passive scribe. Lead the player through the following topics in order — each builds on the previous:

1. **Core info** — Start here. Race, Gender, Age, Class concept.
2. **Backstory** — Ask what ideas or background they have in mind, help draft and expand into coherent narrative prose. Ensure every significant location, person, or organization has a proper name — propose names the player hasn't provided.
3. **Appearance, Personality, and Alignment** — Ask for key ideas, help flesh out into specific, evocative descriptions. After discussing personality and reviewing the backstory, propose an alignment that fits — the player should feel it's a natural conclusion, not a cold question.
4. **Key Figures or Items (Anchors)** — Suggest anchors from the backstory, player validates. Each anchor needs a Tagline and Description & Relationship.

**Template:** Load `doc-templates/character-info.md` for structure and writing standards.

**Output:** Write `character-info.md` to `campaign-[name]/campaign-members/pc-[name]/`. Transition naturally to Phase 2: "Now let's shape the kind of adventure [Name] will have."

---

## Phase 2: Campaign Pitch

**Balance:** Collaborative — core questions asked with suggestions, details inferred from conversation.
**Template:** Load `doc-templates/campaign-pitch.md` for structure.

### Conversational Beats

Lead the player through these topics in order. Each beat is one conversational exchange — ask with concrete suggestions, incorporate the response, move to the next. Do not present all beats upfront.

**1. Genre, Tone & Inspirations**

Suggest a genre based on character-info (e.g., a Deep Gnome Artificer naturally fits certain settings). Offer examples: Classic High Fantasy, Gritty Low-Magic, Urban Intrigue, Cosmic Horror, Wilderness Exploration, Swashbuckling Adventure. Ask about desired tone alongside it — epic and heroic, dark and morally grey, lighthearted comedy, mysterious and suspenseful. Can mix. Weave in inspiration suggestions based on the emerging genre/tone (books, movies, games that capture the feel) — the player can add their own.

**2. Pillars of Play**

Explain what the three pillars are (Combat, Exploration, Social Interaction) since not all players know the concept. Ask for preference or balance. Can specify emphasis (e.g., "Balanced mix. Emphasis on Combat and Exploration.").

**3. Campaign Length**

Present the four tiers with session estimates:
- One-Shot (3-5 sessions)
- Short (8-12 sessions)
- Medium (15-25 sessions)
- Long (30+ sessions)

**4. Party Composition & Companion Recruitment**

Solo adventure or a party with companions? If companions, how many? Suggest 2 as the sweet spot for manageability, but not hard-enforced. If companions, ask how they join:
- "Present from the start" — companions are part of the opening scenario
- "Organic recruitment" — companions are recruited through gameplay
If "present from start": ask for companion preferences (the Companions Pitch). Can be specific ("a cynical healer and a cocky swordsman") or open-ended ("varied party, balanced composition").

**5. Safety Settings**

Content to Avoid (Lines & Veils). Ask directly, can be "None." This is written to `campaign-settings.md` (not campaign-pitch.md) but asked here because it should inform `world-info.md` and companion generation.

### Infer / Propose

These fields can mostly be derived from the conversation. Propose what fits and let the player adjust:

- **Scope** — from genre + length + backstory. Propose and validate.
- **Story Pacing** — infer from genre, tone, length, and backstory structure. Three options: "Slow burn", "Steady build", "Immediate." Propose whichever fits rather than forcing the player to choose explicitly. If the inference is ambiguous, present the options.
- **Core Arc** — from character-info backstory hooks. If the backstory has a natural investigative or conflict hook, propose it as the core arc. Otherwise, set to "Undefined — let it emerge through play."
- **Secondary Arcs** — from PC backstory threads and world elements that fall outside the core arc. Do NOT include companion personal growth — those become companion threads in gm-canon during Phase 7. Optional.
- **Special (Section)** — most campaigns will NOT need this. The existing document ecosystem — `world-info.md` (setting and locations), `npc-directory.md` (characters), `inventory.md` (items and economy), `gm-canon.md` (story threads and secrets), `companion-guide.md` (companion personalities and arcs), `gm-directives.md` (GM style) — fully covers standard D&D campaigns. Include the Special section only when the conversation reveals that the campaign meaningfully deviates from traditional D&D adventure structure: non-standard session rhythms (a tournament with a strict match schedule rather than open exploration), custom economies (no looting — rewards come from a different source), distinct recurring gameplay phases (off-field preparation alternating with arena combat), or mechanic-heavy subsystems central to the campaign's identity. If conversation reveals such a deviation, draft the section and propose it alongside the other inferred fields. If the campaign is a standard D&D adventure, omit this section entirely — do not ask about it.

### Coupling Validation

Apply when length + pacing are established:
- **One-Shot + Slow burn** = contradictory (no time for slow burn in 3-5 sessions). Explain, suggest alternatives.
- **One-Shot + Undefined core arc** = contradictory (too short to let one emerge). Core arc must be defined for One-Shots.
- **Immediate pacing + Undefined core arc** = contradictory (immediate toward what?).
- **Short + Slow burn** = risky. Flag but allow: "Tight but possible — the arc won't have much runway before it surfaces."
- **Short + Undefined core arc** = risky. Flag but allow: "Limited runway for one to emerge."

### Output

Write the full `campaign-pitch.md` using the template structure, then in a single reply report the key decisions — especially inferred ones like pacing and arcs — link the file, and invite review. Writing and reporting happen in one turn per the write-and-report cadence.

---

## Phase 3: World Info

**Balance:** Model-driven — "propose first, receive feedback and adjust."

This is the most aggressively model-driven phase. The system designs the world from character-info + campaign-pitch and the player adjusts.

**Template:** Load `doc-templates/world-info.md` for structure and writing standards.

### Steps

1. **Core concept/theme** — ask the player if they have a core concept for the setting, or offer to design one based on their character and campaign vision.
2. **Scope** — ask about or suggest scope (Continent, City-State, Region, Subterranean Region, Archipelago, Planar Hub, etc.). Suggest based on campaign length + genre.
3. **Name** — propose a fitting name for the setting and validate with the player.
4. **Full draft** — present a complete world-info draft:
   - Zones scaled to campaign length: Long=4-5, Medium=3, Short=2, One-Shot=1-2
   - 3-4 Points of Interest per zone (with "Other Landmarks" for lighter mentions)
   - 2-4 Key Connections (more zones = more connections)
   - Must include the campaign's starting location

### Output

Write `world-info.md` to the campaign directory. Player reviews and adjusts.

---

## Phase 4 + 5: PC Character Sheet + Companion Guides

**These phases overlap.** If companions are "present from start," fire companion guide generation in the background while building the PC's character-sheet in the foreground.

### If Companions Are "Present from Start"

#### Step A — Companion Differentiation

Before invoking companion recruitment, make differentiation decisions to prevent convergence when multiple companions are generated simultaneously:

- **If the player gave specific direction** per companion (e.g., "a cynical drow healer and a cocky halfling rogue"): each companion has a clear assignment.
- **If the player was vague** (e.g., "just 2 companions"): analyze the PC's class + campaign-pitch + world-info to assign each companion differentiated roles. Keep assignments brief — the agent's creative judgment does the real character work. Include:
  - Role direction (frontline, support, ranged, controller)
  - Personality axis or contrast (e.g., "grounded and warm" vs. "guarded and cerebral")
  - Race/culture suggestion grounded in `world-info.md`
  - Class scope or restriction if needed to prevent overlap

This is you doing the gap analysis ONCE and distributing assignments, not each agent independently running the same analysis.

#### Step B — Invoke `/gm:companion-recruit` for Each Companion

For each companion, invoke the `/gm:companion-recruit` skill following its standard workflow (Step 1 → guide agent → Step 2 → Player Card → Step 3 → approval). The differentiation assignment from Step A becomes the companion-specific context in the recruit briefing. Companion directories use the `co-[name]` naming convention (e.g., `campaign-members/co-gandalf/`).

**Two modifications during campaign creation:**
1. Include this constraint in each guide briefing: "Write ONLY to the companion directory. Do NOT modify any campaign-level documents."
2. **Skip Step 4 (Campaign Integration)** from the recruit skill — all cross-cutting document updates are deferred to Phase 7 of campaign creation, where they are batched with the other generated documents.

Fire all companion guide agents as **background** tasks.

#### Step C — PC Character Sheet (Foreground)

While companion guides generate in the background, build the PC's character-sheet collaboratively with the player. This workflow assumes D&D as system, adapt if needed.

**Template:** Load `doc-templates/character-sheet.md` for structure and writing standards.

**Reference check:** After confirming class and subclass, read `content-sources.md` in the workspace root and find the chosen class and subclass. If the Reference column links to a file, read it as the mechanical source of truth. If it says `Model Knowledge`, proceed using built-in knowledge. If the class or subclass is not listed in content-sources, inform the player: "This [class/subclass] isn't in your content sources yet. I can build from model knowledge, but edition-specific details may be less accurate. If you have reference material, you can add it to `ref/` and update `content-sources.md`." Then proceed — soft-warn, not a blocker.

1. Confirm class and subclass (may already be established from character-info)
2. **Level progression** — present popular options based on campaign length. These are suggestions, not fixed — the player can pick any combination. The starting level and level gain chosen here flow into `campaign-settings.md`.

   **One-Shot (3-5 sessions):** No level-ups. Player picks their level. Suggest Level 5 or 8-9.

   **Short (8-12 sessions):** ~4 level-ups. Popular options:
   - Start: 5, Gain 1 → 5, 6, 7, 8, 9 — "mid-tier adventure, steady climb"
   - Start: 3, Gain 2 → 3, 5, 7, 9, 11 — "zero to hero, big jumps"
   - Start: 1, Gain 2 → 1, 3, 5, 7, 9 — "classic origin story, rapid growth"

   **Medium (15-25 sessions):** ~5-6 level-ups. Popular options:
   - Start: 1, Gain 1 → 1, 2, 3, 4, 5, 6, 7 — "slow build, feels every level"
   - Start: 1, Gain 2 → 1, 3, 5, 7, 9, 11, 13 — "full arc, fast track to high-tier play"
   - Start: 3, Gain 1 → 3, 4, 5, 6, 7, 8, 9 — "skip the fragile early levels, steady climb"
   - Start: 5, Gain 1 → 5, 6, 7, 8, 9, 10, 11 — "start competent, end powerful"

   **Long (30+ sessions):** ~7-8+ level-ups. Popular options:
   - Start: 1, Gain 1 → 1 through 8-9+ — "classic epic arc, earn every level"
   - Start: 3, Gain 1 → 3 through 10-11+ — "skip the prologue, plenty of runway"
   - Start: 1, Gain 2 → 1, 3, 5, 7, 9, 11, 13, 15+ — "aggressive progression, reaches high-level play"

3. Key build decisions — present choices and suggestions for:
   - Ability score generation — suggest rolling as the default method using 4d6-drop-lowest. Offer to roll using bash:
     ```bash
     echo "=== Ability Score Rolls (4d6 drop lowest) ==="
     for i in 1 2 3 4 5 6; do
     d1=$((RANDOM % 6 + 1)); d2=$((RANDOM % 6 + 1)); d3=$((RANDOM % 6 + 1)); d4=$((RANDOM % 6 + 1))
     min=$d1; [ $d2 -lt $min ] && min=$d2; [ $d3 -lt $min ] && min=$d3; [ $d4 -lt $min ] && min=$d4
     total=$(( d1 + d2 + d3 + d4 - min ))
     echo "Roll $i: $d1, $d2, $d3, $d4 → drop $min → $total"
     done
     ```
     The player can choose standard array (15, 14, 13, 12, 10, 8) or point buy instead, or re-roll if results are poor, their choice.
   - **Ability score assignment heuristic:** When assigning scores and applying racial ASI or other bonuses, first maximize the primary stat(s) for the class — a SAD class pumps one core stat, a MAD class pumps both. Then even out remaining odd scores to even, since that's where modifier breakpoints are (a score of 14 and 15 give the same +2 modifier, so a +1 is wasted on 14→15 but valuable on 13→14).
   - Origin feat (if 2024 rules)
   - Background
   - Spell selection (if caster)
   - Equipment
4. Model builds the full sheet, player validates
5. **Map Token** — Ask the player to choose their battle map token color from the party palette: 🟢 🔵 🟣 🟡. This is a cosmetic choice for combat maps. Write the selected color into the character-sheet's General section (`Map Token` field).

Differences from companion sheet generation:
- Role: "Player Character (PC)"
- All decisions go through the player

**Output:** Write two files to `campaign-[name]/campaign-members/pc-[name]/`:
- `character-sheet.md` — the full sheet as built above
- `status.json` — the party-status tracker seed. Load `doc-templates/status-json-template.md` for the schema — this is the authoritative shape and instructions. Populate in full: identity, static fields (`race`, `level`, `proficiencyBonus`, `abilities`, `Speed`), vitals, `Spells` slot tracker, class resources (with tooltips where clear), `skillProficiencies`/`skillExpertise`, `spells[]`, `feats[]`, `weapons[]`, and `SpellDC`/`SpellAttack` for spellcasters. All data is already in context from the sheet you just built.

#### Step D — Player Cards and Approval

Follow the `/gm:companion-recruit` workflow for Steps 2-3: present Player Cards when guide agents report back, get player approval, fire sheet agents in background on approval.

If guides haven't reported by the time the PC sheet is done, fold the status into the sheet-completion reply ("PC sheet done. Companion guides still generating — continuing to Phase 6.") as part of the same single canonical response, then proceed to Phase 6.

Note each companion's name, race, class, and motivations from the approved guides — you'll need these for campaign integration in Phase 7.

### If Companions Are "Organic Recruitment"

Skip this entire companion sub-flow. Note to the player that companions will be recruited through gameplay using `/gm:companion-recruit`. Proceed directly to the PC character-sheet (Step C above), then to Phase 6.

---

## Phase 6: Campaign Settings

**Balance:** Fully assembled from prior phases — no new questions. All preferences use defaults; the player can fine-tune later during gameplay.

**Template:** Load `doc-templates/campaign-settings.md` for structure.

### Assembled Values

| Field | Source |
|---|---|
| TTRPG System | Startup |
| Level | From Phase 4 (character-sheet) |
| Level Gain | Campaign Length: Short=2, Medium=1-2, Long=1. Omit for One-Shot. |
| Members | PC from Phase 4 + companions from Phase 5 (if any) |
| Player Experience | Startup |
| Combat Difficulty | Experience-based: New to D&D → Easy, Some experience → Normal, Veteran → Hard |
| Response Verbosity | Default: Normal |
| Combat Playstyle | Default: Standard |
| Sessions Played | 0 |
| Campaign Stage | Early (omit for One-Shot) |
| Last Level-Up | 0 (omit for One-Shot) |
| Safety Settings | Phase 2 |

### Output

Write `campaign-settings.md` to the campaign directory.

---

## Phase 7: Batch Document Generation

0. Wait for all companion sheet agents to report back (if any were dispatched). 
1. Announce to the player that you have everything you and ask if they want to adjust anything else. WAIT for the player reply then proceed.
2. Create all remaining campaign infrastructure.

Per the write-and-report cadence: perform all writes first, then the **Confirmation** step produces the single canonical reply listing what was created.

### Documents to Create

First, create all static files and directories in a single bash call:

```bash
echo "# Recent Events" > "[campaign_dir]/recent-events.md"
echo "# Player Notes" > "[campaign_dir]/player-notes.md"
awk '/^```markdown$/{f=1;next} f && /^```$/{exit} f{print}' "$CLAUDE_PLUGIN_ROOT/skills/doc-templates/npc-directory.md" > "[campaign_dir]/npc-directory.md"
```

Then write each remaining document:

1. **Campaign CLAUDE.md** — load `doc-templates/campaign-manifest.md` for template. Fill in campaign-specific details (name, setting subtitle, PC name, companion entries if any).

2. `campaign-summary` — load `doc-templates/campaign-summary.md` for writing standards:
   - **The Party** paragraph: PC identity and motivation in one sentence, each companion with name/class/one-line. Written as coherent narrative prose.
   - `## Act I: [Title] (Ongoing)` — one sentence establishing the starting situation.

3. **gm-canon.md** — load `doc-templates/gm-canon.md` for template. Copy the template structure, then populate:
   - If Core Arc is defined in campaign-pitch.md: create a `(Core Arc)` thread with Direction derived from the arc description, empty Party Knows, no breadcrumbs.
   - If Secondary Arcs are defined: create `(Secondary Arc)` threads.
   - If companions were generated: create `(Companion)` threads from each `companion-guide.md` Motivations section. Thread name format: `### [Name]: [Arc Theme] (Companion)`.
   - If Core Arc is "Undefined": no Core Arc thread — leave Threads section with template comments only.

4. `inventory.md` — load `doc-templates/inventory.md` for structure. Populate Key Items from narrative-central items identified during character creation. The Items section is for party shared supplies not equipped on any character sheet — do NOT duplicate personally equipped gear from character sheets here. Add Item Descriptions for all notable items (Key Items and notable equipment from character sheets). Consumables and Materials tables start with shared party supplies (basic rations, etc.).

5. **gm-directives.md** — one bash call using the appropriate template for the player's experience level:
   - **New to D&D:**
     ```bash
     awk '/^```markdown$/{f=1;next} f && /^```$/{exit} f{print}' "$CLAUDE_PLUGIN_ROOT/skills/doc-templates/gm-directives-beginner.md" > "[campaign_dir]/gm-directives.md"
     ```
   - **Some experience / Veteran:**
     ```bash
     awk '/^```markdown$/{f=1;next} f && /^```$/{exit} f{print}' "$CLAUDE_PLUGIN_ROOT/skills/doc-templates/gm-directives-default.md" > "[campaign_dir]/gm-directives.md"
     ```

6. **Verify party status files** — each character's `status.json` is written by its sheet generator (Phase 4 for the PC, `companion-sheet-internal` for companions). This step is a safety net: for each member directory under `campaign-members/`, verify `status.json` exists. If any are missing (e.g., a sub-agent that failed), generate the missing file from the character's sheet using `doc-templates/status-json-template.md`. Note any gaps in the Confirmation output.

### Confirmation

List all created files and the campaign directory path, including each `status.json` written in step 6 (and any skipped members with the reason). Tell the player:

"Your campaign is ready. Start a new Narrative Session to begin playing."

---

## One-Shot Campaign Differences

When the player selects One-Shot (3-5 sessions), these differences apply across all phases:

- **Core Arc must be defined** — enforced in coupling validation (Phase 2). No "Undefined" option.
- **Suggest higher starting level** (5 or 8-9) since the campaign is brief.
- **No Campaign Stage progression** — omit Campaign Stage from campaign-settings or mark "N/A (One-Shot)".
- **No level-up** — omit Level Gain and Last Level-Up from campaign-settings.
- **Companion evolution opt-out** — if companions are generated, set `last-evolution: static` in `companion-guide.md` evolution frontmatter.
- **Zone count:** 1-2 in `world-info.md`.
- **Campaign summary fold** unlikely to trigger (too few sessions to accumulate).

---

## Compact Instructions

When context is compacted during campaign creation, preserve:
- Campaign name, directory path, TTRPG system, and PC name
- Which phase is in progress and its current step
- All completed documents and their content summaries (they're written to disk — re-read if needed after compaction)
- Companion agent status (dispatched, awaiting report, approved, rejected)
- Player decisions and preferences stated during the conversation
