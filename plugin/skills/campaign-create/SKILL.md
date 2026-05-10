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

**Conversation cadence (most of Phases 1–4):**
```
> PRIMARY
[Conversational paragraph incorporating or responding to the player's last response]
[One question, or a tight cluster of closely related questions including your own suggestions and guidance. Propose, this is not a Q&A]
```

**Write-and-report cadence (Phase 2 output, Phase 3 output, Phase 5):**
```
[All tool calls — Read templates, Write files, Bash — happen first]
> PRIMARY
[Single summary reply listing what was written + transition to next phase]
```

> Campaign creation runs entirely on the `> PRIMARY` channel.

---

## Startup

0. Invoke the `gm:doc-templates` skill to acquire the links to all relevant templates for this process.

1. **Read `campaign-settings.json`.** In the active campaign directory. Note these fields for use across phases:
   - `display_name` — the human-readable campaign name.
   - `members[0]` — `{name, role: "PC", race, class}` for the starting PC (some might be missing or not set at the start).
   - `ttrpg_system` — `"D&D 5e (2024)"` or `"D&D 5e (2014)"`.
   - `player_experience` — `"New"` / `"Some"` / `"Veteran"`. Informs how much you explain mechanics during creation.
   - `campaign_length` — `"One-Shot"` / `"Short"` / `"Medium"` / `"Long"`.
   - `current_level`, `level_gain`.
   - `content_to_avoid` — Must adhere to this and avoid topics surfaced there.
   - `world_preset_slug` — when non-null, the App pre-scaffolded `world-info.md` from a bundled preset; Phase 3 branches on file existence (canonical check).

2. **First reply.** The opening message is mostly deterministic — substitute settings values verbatim. Do not load `meta-session` — continue following this skill.

   ```
   > PRIMARY

   >> **Session Mode: meta**
   >> **Party Sync**

   Welcome **[members[0].name]**! Let's build your adventure.

   Here's where we stand:
   - **System:** [ttrpg_system]
   - **Campaign length:** [campaign_length]
   - **Player character (PC):** [members[0].name] — starting at level [current_level], gaining [level_gain] per level-up
   - **Experience:** [player_experience]

   We'll move through it together: Character Info → Campaign Pitch → World → Sheet → Final assembly. Remember nothing we set here is set in store, your settings are fully editable in the future so don't worry about getting it perfect.
   ```

Proceed to Phase 1.

---

## Phase 1: Character Info

**Balance:** The player has the most input here but the model should still operate as an active creative partner — not a passive scribe. Lead the player through the following topics in order — each builds on the previous.

### Pre-flight

Load `doc-templates/character-info.md` for structure and writing standards.

### Step 1. Core info & IP Validation

Walk the player towards defining the core concept of their character. Concretely this step completion requires: Race, Gender, Age, Class and Subclass to be set; But any additional info provided for concept here is should be used to inform future steps.

*Note: Concrete Race, Class and Subclass must be defined before exiting this step — if the player's input is at concept stage ("a healer who's cynical"), work collaboratively to land on a specific Class and Subclass before moving on.*

*Child PCs:* discouraged by default. If the player proposes a child or adolescent PC, surface the friction once — name it plainly ("child characters add narrative constraints — romance and intimacy frameworks become unavailable for this character") — and let the player choose. Do not refuse outright; do not lecture. The same applies to adult characters described with child-coded physical attributes.

**IP Validation gate (after Core info, before Backstory).** With Race / Class / Subclass now concrete, check each against the matching section in `content-sources.md` at the workspace root. 

- **Path A.** If all of Race, Class and Subclass are listed (or marked `Model Knowledge`) on first check, proceed to *Step 2*.

- **Path B.** For any selection **not listed** (and not marked `Model Knowledge`), emit one IP Validation intent marker per unlisted selection on its own line:

```
>> **IP Validation: kind=Race, value=<Race>**
>> **IP Validation: kind=Class, value=<Class>**
>> **IP Validation: kind=Subclass, value=<Subclass>**
```
Then **stop** — do not advance to Backstory yet. The flow resumes on the next turn.

**Resume handling:**

- *Player confirmed rights*. Add a new entry to the matching section in `content-sources.md`: `kind=Race` → Races (`- Race — Model Knowledge`), `kind=Class` → Classes (`- Class — Model Knowledge`), `kind=Subclass` → Subclasses (`- Class / Subclass — Model Knowledge`, using the PC's class). Then continue to Backstory.

- *Player asked for alternative*. Do NOT modify `content-sources.md`. Instead propose from the existing available ones and walk the player through a new selection. If the player steers it towards yet another selection not present in `content-sources.md` you must re-send the IP Validation gate and repeat the protocol until either the player's IP Validation gate reply confirms or the choices are all present in `content-sources.md`.

### Step 2. Backstory

Ask what ideas or background they have in mind, help draft and expand into coherent narrative prose. Ensure every significant location, person, or organization has a proper name — propose names the player hasn't provided.

**World-info grounding rule:** 
- If `world-info.md` already exists in the campaign directory (the App scaffolded a preset world per `world_preset_slug` or player freely added one), you must load it now so you can ground the backstory, named places, or other facts into the provided world.
- If `world-info.md` does not yet exist, follow the current model-driven path — Phase 3 will generate the world *from* the named places in this backstory.

### Step 3. Appearance, Personality, and Alignment

Ask for key ideas, help flesh out into specific, evocative descriptions. After discussing personality and reviewing the backstory, propose an alignment that fits — the player should feel it's a natural conclusion, not a cold question.

### Step 4. Key Figures or Items (Anchors)

Suggest anchors from the backstory, player validates. Each anchor needs a Tagline and Description & Relationship.

### Output

Read the template from `doc-templates/campaign-settings.json` to inform the following deliverables:

1. Write `character-info.md` to `campaign-members/pc-{slug}/` (slug derived from `members[0].name` per `doc-templates/campaign-settings.json#member-slug-derivation`).
2. Update `campaign-settings.json` to add the selected Race and Class for the character.

Transition naturally to Phase 2: "Now let's shape the kind of adventure [Name] will have."

---

## Phase 2: Campaign Pitch

**Balance:** Collaborative — core questions asked with suggestions, details inferred from conversation.
**Template:** Load `doc-templates/campaign-pitch.md` for structure.

### Conversational Beats

Lead the player through these topics in order. Each beat is one conversational exchange — ask with concrete suggestions, incorporate the response, move to the next. Do not present all beats upfront.

### 1. Genre, Tone & Inspirations

Suggest a genre based on character-info (e.g., a Deep Gnome Artificer naturally fits certain settings). Offer examples: Classic High Fantasy, Gritty Low-Magic, Urban Intrigue, Cosmic Horror, Wilderness Exploration, Swashbuckling Adventure. Ask about desired tone alongside it — epic and heroic, dark and morally grey, lighthearted comedy, mysterious and suspenseful. Can mix. Weave in inspiration suggestions based on the emerging genre/tone (books, movies, games that capture the feel) — the player can add their own.

### 2. Pillars of Play

Explain what the three pillars are (Combat, Exploration, Social Interaction) since not all players know the concept. Ask for preference or balance. Can specify emphasis (e.g., "Balanced mix. Emphasis on Combat and Exploration.").

### 3. Party Composition

Solo adventure or a party with companions? If companions, how many? Suggest 2 as the sweet spot for manageability, but not hard-enforced. If companions, ask how they join:
- "Present from the start" — companions are part of the opening scenario
- "Organic recruitment" — companions are recruited through gameplay
If "present from start": ask for companion preferences (the Companions Pitch). Can be specific ("a cynical healer and a cocky swordsman") or open-ended ("varied party, balanced composition").

**Path A.** If the player chose **Organic recruitment** (or "no companions") AND no extra PCs are requested, that's the end of conversational beats — proceed to inferred fields below.

**Path B.** If the player chose **Present from the start** or inquired or mentioned wanting to add more Player Characters, briefly explain:
   *Campaigns are created with a single player character to start, extra Player Characters or Companions can be added once campaign-creation is finished. This runs as a separate dedicated session after campaign creation.*
   
   Then re-assure: *I'll set it up for you when we finish here*.

Do not invoke `/gm:companion-recruit` or `/gm:add-pc` during this skill.

### Infer / Propose

These fields can mostly be derived from the conversation. Propose what fits and let the player adjust:

- **Scope** — from genre + `campaign_length` + backstory. Propose and validate.
- **Story Pacing** — infer from genre, tone, `campaign_length`, and backstory structure. Three options: "Slow burn", "Steady build", "Immediate." Propose whichever fits rather than forcing the player to choose explicitly. If the inference is ambiguous, present the options.
- **Core Arc** — from character-info backstory hooks. If the backstory has a natural investigative or conflict hook, propose it as the core arc. Otherwise, set to "Undefined — let it emerge through play."
- **Secondary Arcs** — from PC backstory threads and world elements that fall outside the core arc. Do NOT include companion personal growth — those become companion threads in gm-canon during Phase 5. Optional.
- **Special (Section)** — most campaigns will NOT need this. The existing document ecosystem — `world-info.md` (setting and locations), `npc-directory.md` (characters), `inventory.md` (items and economy), `gm-canon.md` (story threads and secrets), `companion-guide.md` (companion personalities and arcs), `gm-directives.md` (GM style) — fully covers standard D&D campaigns. Include the Special section only when the conversation reveals that the campaign meaningfully deviates from traditional D&D adventure structure: non-standard session rhythms (a tournament with a strict match schedule rather than open exploration), custom economies (no looting — rewards come from a different source), distinct recurring gameplay phases (off-field preparation alternating with arena combat), or mechanic-heavy subsystems central to the campaign's identity. If conversation reveals such a deviation, draft the section and propose it alongside the other inferred fields. If the campaign is a standard D&D adventure, omit this section entirely — do not ask about it.

### Coupling Validation

Apply once Story Pacing and Core Arc are settled. `campaign_length` comes from settings:
- **`"One-Shot"` + Slow burn** = contradictory (no time for slow burn in 3-5 sessions). Explain, suggest alternatives.
- **`"One-Shot"` + Undefined core arc** = contradictory (too short to let one emerge). Core arc must be defined for One-Shots.
- **Immediate pacing + Undefined core arc** = contradictory (immediate toward what?).
- **`"Short"` + Slow burn** = risky. Flag but allow: "Tight but possible — the arc won't have much runway before it surfaces."
- **`"Short"` + Undefined core arc** = risky. Flag but allow: "Limited runway for one to emerge."

### Output

Write the full `campaign-pitch.md` using the template structure, then in a single reply report the key decisions — especially inferred ones like pacing and arcs — link the file, and invite review. Writing and reporting happen in one turn per the write-and-report cadence.

---

## Phase 3: World Info

**Branch on whether `world-info.md` already exists in the campaign directory.** This should already be known based on Phase 1 Step 2 but if for any reason that was skipped, now is the time to to verify if a `world-info.md` file exists in the campaign directory. Read it now if it exists and has not been loaded before.

### Path A — Preset world already exists

The App pre-scaffolded `world-info.md` from a bundled preset. Skip generation entirely.

1. Surface a brief summary to the player — name, scope, zones, intended starting location — and ask if they want any adjustments before proceeding.
2. If the player wants edits, make targeted changes to `world-info.md`. Do not re-author the document wholesale.
3. If the player is satisfied as-is, proceed to Phase 4.

This path runs lean — most preset worlds need no adjustments.

### Path B — No preset, generate from scratch

**Balance:** Model-driven — "propose first, receive feedback and adjust." This is the most aggressively model-driven phase when active. The system designs the world from character-info + campaign-pitch and the player adjusts.

**Template:** Load `doc-templates/world-info.md` for structure and writing standards.

#### Steps

1. **Core concept/theme** — ask the player if they have a core concept for the setting, or offer to design one based on their character and campaign vision.
2. **Scope** — ask about or suggest scope (Continent, City-State, Region, Subterranean Region, Archipelago, Planar Hub, etc.). Suggest based on `campaign_length` + genre.
3. **Name** — propose a fitting name for the setting and validate with the player.
4. **Full draft** — present a complete world-info draft:
   - Zones scaled to `campaign_length`: `"Long"`=4-5, `"Medium"`=3, `"Short"`=2, `"One-Shot"`=1-2
   - 3-4 Points of Interest per zone (with "Other Landmarks" for lighter mentions)
   - 2-4 Key Connections (more zones = more connections)
   - Must include the campaign's starting location

#### Output

Write `world-info.md` to the campaign directory. Player reviews and adjusts.

---

## Phase 4: PC Character Sheet

Build the PC's character-sheet. This workflow assumes D&D as system, adapt if needed.

**Template:** Load `doc-templates/character-sheet.md` for structure and writing standards.

**Reference check.** Use the links in `content-sources.md` to find the reference files for the chosen Race / Class / Subclass, read those to ground your incoming work. Entries marked `Model Knowledge` (or absent) build from built-in knowledge.

1. Confirm class and subclass (already established from character-info in Phase 1). If the player changes their Race / Class / Subclass at this point, return to Phase 1's IP Validation gate before proceeding — and update `members[0]` in `campaign-settings.json` to match.

2. Key build decisions — present choices and suggestions for:
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
4. **Map Token** — Ask the player to choose their battle map token color from the party palette: 🟢 🔵 🟣 🟡. This is a cosmetic choice for combat maps and a few other App visuals. Write the selected color into the character-sheet's General section (`Map Token` field).
5. Model builds the full sheet, player validates

**Output:** Write two files to `campaign-members/pc-{slug}/`
- `character-sheet.md` — the full sheet as built above
- `status.json` — the party-status tracker seed. Load `doc-templates/status-json-template.md` for the schema — this is the authoritative shape and instructions. Populate in full: identity, static fields (`race`, `level`, `proficiencyBonus`, `abilities`, `Speed`), vitals, `Spells` slot tracker, class resources (with tooltips where clear), `skillProficiencies`/`skillExpertise`, `spells[]`, `feats[]`, `weapons[]`, and `SpellDC`/`SpellAttack` for spellcasters. All data is already in context from the sheet you just built.

After the files are written, sync the PC into the live session:
```
node ${CLAUDE_PLUGIN_ROOT}/scripts/party-status-add-member.js ${CLAUDE_SESSION_ID}
```
Include `>> **Party Sync**` in the response that confirms the PC sheet is complete — the PC appears on the companion app immediately.

---

## Phase 5: Batch Document Generation

1. Announce to the player that you have everything you need and ask if they want to adjust anything else. WAIT for the player reply then proceed.
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

1. **Campaign CLAUDE.md** — load `doc-templates/campaign-manifest.md` for template. Fill in campaign-specific details: use `display_name` as the campaign name, `members[0].name` (and additional members entries if any) for the PC table rows, and a setting subtitle drawn from the world-info Overview.

2. `campaign-summary` — load `doc-templates/campaign-summary.md` for writing standards:
   - **The Party** paragraph: PC identity and motivation in one sentence. Written as coherent narrative prose.
   - `## Act I: [Title] (Ongoing)` — one sentence establishing the starting situation.

3. **gm-canon.md** — load `doc-templates/gm-canon.md` for template. Copy the template structure, then populate:
   - If Core Arc is defined in campaign-pitch.md: create a `(Core Arc)` thread with Direction derived from the arc description, empty Party Knows, no breadcrumbs.
   - If Secondary Arcs are defined: create `(Secondary Arc)` threads.
   - If Core Arc is "Undefined": no Core Arc thread — leave Threads section with template comments only.

4. `inventory.md` — load `doc-templates/inventory.md` for structure. Populate Key Items from narrative-central items identified during character creation. The Items section is for party shared supplies not equipped on any character sheet — do NOT duplicate personally equipped gear from character sheets here. Add Item Descriptions for all notable items (Key Items and notable equipment from character sheets). Consumables and Materials tables start with shared party supplies (basic rations, etc.).

5. **gm-directives.md** — one bash call using the appropriate template based on `player_experience` from settings:
   - **`"New"`:**
     ```bash
     awk '/^```markdown$/{f=1;next} f && /^```$/{exit} f{print}' "$CLAUDE_PLUGIN_ROOT/skills/doc-templates/gm-directives-beginner.md" > "[campaign_dir]/gm-directives.md"
     ```
   - **`"Some"` / `"Veteran"`:**
     ```bash
     awk '/^```markdown$/{f=1;next} f && /^```$/{exit} f{print}' "$CLAUDE_PLUGIN_ROOT/skills/doc-templates/gm-directives-default.md" > "[campaign_dir]/gm-directives.md"
     ```

### Confirmation

List all created files and the campaign directory path then close with the existing prose terminus:

  "Your campaign is ready. Start a new Narrative Session to begin playing."

If the user expressed interest in extra PC or set companions to be "Present from the Start" you must also include the marker at the end of your reply:

```
>> **Start Session: mode=meta**
```
This is an event marker so you must produce an exact match, no trailing content.

---

## One-Shot Campaign Differences

When `campaign_length` is `"One-Shot"` (the modal value), these differences apply across all phases:

- **Core Arc must be defined** — enforced in coupling validation (Phase 2). No "Undefined" option.
- **Higher starting level expected** — the modal typically pre-sets `current_level` to 5 or 8-9 for One-Shots. If the value looks low, raise the question with the player and Edit settings as needed.
- **No level-up cadence** — `level_gain` and `last_level_up` carry inert values for One-Shots; Phase 4's progression confirmation collapses to "starting level only."
- **No Campaign Stage progression** — `campaign_stage` stays `"Early"` for the campaign's lifetime; consumers branch on `campaign_length === "One-Shot"`.
- **Zone count:** 1-2 in `world-info.md` (Path B only — preset worlds are scaled by the App).
- **Campaign summary fold** unlikely to trigger (too few sessions to accumulate).

