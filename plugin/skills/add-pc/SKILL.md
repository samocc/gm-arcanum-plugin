---
name: add-pc
description: Add a new Player Character to an existing campaign. Five-phase flow — character-info, map-token, joining context, sheet, campaign integration. MetaGM session only.
argument-hint: "[name | concept]"
---

# Add PC

Add a new Player Character to an existing campaign. Generates `character-info.md`, `character-sheet.md`, and `status.json` for the new PC, then integrates into the campaign's cross-cutting documents.

This skill runs in MetaGM context — invoke only from a meta-session, never mid-narrative or mid-combat.

`$ARGUMENTS` is free-form pre-supplied context (e.g., name, race, class, concept). Treat as canon and skip questions whose answers it already provides. If empty, the player drives the conversation from scratch.

---

## Pre-flight Reads

- [ ] Campaign `CLAUDE.md` — manifest and document locations
- [ ] `campaign-settings.json` — `ttrpg_system`, `current_level`, `members[]`, `sessions_played`. Schema reference: [`doc-templates/campaign-settings.md`](../doc-templates/campaign-settings.md).
- [ ] `campaign-pitch.md` — tone, system, party preferences, secondary arcs
- [ ] `world-info.md` — setting, geography, factions (the new PC must fit the established world)
- [ ] **All existing `campaign-members/pc-*/character-info.md`** — the differentiation source. The new PC must not duplicate an existing PC's identity, backstory beats, or core hooks.
- [ ] `doc-templates` skill — load to access template lookup (this skill references `character-info.md`, `character-sheet.md`, and `status-json-template.md`).

---

## Slug Rule

The PC's directory name is `pc-{slug}`. Derive `{slug}` from the PC's name: lowercase, ASCII, hyphenate spaces and apostrophes, drop other punctuation. Examples: `Mara` → `pc-mara`; `Mary-Ann` → `pc-mary-ann`; `D'Artagnan` → `pc-d-artagnan`.

**Collision handling.** Glob `campaign-members/pc-*` before writing. If `pc-{slug}` already exists, append a numeric suffix: `pc-{slug}-2`, `pc-{slug}-3`, etc. Confirm the resolved slug with the player before any writes.

---

## Phase A — Character-Info Conversation

**Balance:** Collaborative — player's ideas first, model helps generate the rest. Operate as an active creative partner — not a passive scribe. Lead the player through the following topics in order — each builds on the previous:

1. **Core info** — Race, Gender, Age, Class concept.

*Note: Concrete Race, Class and Subclass must be defined before exiting this step — if the player's input is at concept stage ("a healer who's cynical"), work collaboratively to land on a specific Class and Subclass before moving on.*

*Child PCs:* discouraged by default. If the player proposes a child or adolescent PC, surface the friction once — name it plainly ("child characters add narrative constraints — romance and intimacy frameworks become unavailable for this character") — and let the player choose. Do not refuse outright; do not lecture. The same applies to adult characters described with child-coded physical attributes (small stature, youthful appearance) — flag the constraint once.

**IP Validation gate (after Core info, before Backstory).** With Race / Class / Subclass now concrete, check each against the matching section in `content-sources.md` at the workspace root. For any selection **not listed** (and not marked `Model Knowledge`), emit one IP Validation intent marker per unlisted selection on its own line:

```
>> **IP Validation: kind=Race, value=<Race>**
>> **IP Validation: kind=Class, value=<Class>**
>> **IP Validation: kind=Subclass, value=<Subclass>**
```

Then **stop** — do not advance to Backstory yet. The flow resumes on the next turn.

**Resume handling:**
- *Player confirmed rights*. Add a new entry to the matching section in `content-sources.md`: `kind=Race` → Races (`- Race — Model Knowledge`), `kind=Class` → Classes (`- Class — Model Knowledge`), `kind=Subclass` → Subclasses (`- Class / Subclass — Model Knowledge`, using the PC's class). Then continue to Backstory.
- *Player asked for alternative*. Do NOT modify `content-sources.md`. Instead propose from the existing available ones and walk the player through a new selection. If the player steers it towards yet another selection not present in `content-sources.md` you must re-send the IP Validation gate and repeat the protocol until either the player's IP Validation gate reply confirms or the choices are all present in `content-sources.md`.

If everything is listed (or marked `Model Knowledge`) on first check, continue to Backstory normally.

2. **Backstory** — Player provides ideas or background; help draft and expand into coherent narrative prose. Every significant location, person, or organization gets a proper name — propose names the player hasn't provided. The new PC's backstory **must not** contradict or duplicate existing PCs' backstories already in the campaign — call out conflicts and resolve before writing.
3. **Appearance, Personality, and Alignment** — Ask for key ideas, flesh into specific evocative descriptions. After discussing personality and reviewing the backstory, propose an alignment that fits.
4. **Key Figures or Items (Anchors)** — Suggest anchors from the backstory; player validates. Each anchor needs Tagline and Description & Relationship.

**Template:** Load `doc-templates/character-info.md` for structure and writing standards.

**Output:** Write `character-info.md` to `campaign-members/pc-{slug}/`. Confirm to the player and transition to Phase B.

---

## Phase B — Map-Token Pick

Present the party palette: 🟢 🔵 🟣 🟡.

Glob existing `campaign-members/*/character-sheet.md` files and read each one's `**Map Token:**` field to determine which colors are taken. Show the player which are free.

- **Multiple free** — player picks.
- **Exactly one free** — auto-assign and inform the player.
- **Zero free (palette exhausted)** — surface to the player. Two options: share an existing color (visually ambiguous on the battle map — warn) or accept a non-palette emoji of the player's choice (the App's rendering of non-palette tokens is uncertain — flag this to the player). Palette expansion is a tracked follow-up; do not invent additional canonical colors here.

Note the chosen token; it gets written into the sheet during Phase D.

---

## Phase C — Joining Context (optional)

Ask the player "How does [Name] join the party?", two options:
1. **Organically**: The GM introduces them organically into the narration.
2. **Immediate**: The new session start with the new PC already present and part of the party, no story hook they are just there.

If the player chose **Organically**, follow-up asking if they have a particular way in mind. If so help them work it out. If not, don't push it the GM will integrate them organically.

---

## Phase D — Sheet Build

Mirrors the PC sheet build at campaign creation. Build collaboratively — every decision goes through the player.

**Template:** Load `doc-templates/character-sheet.md` for structure and writing standards.

**Reference check.** Use the links in `content-sources.md` to find the reference files for the chosen Race / Class / Subclass, read those to ground your incoming work. Entries marked `Model Knowledge` (or absent) build from built-in knowledge.

1. **Confirm class and subclass** (already established from character-info in Phase A). If the player changes their Race / Class / Subclass at this point, return to Phase A's IP Validation gate before proceeding.
2. **Starting level.** Read `current_level` from `campaign-settings.json` and propose that as the starting level — the new PC enters at the party's current level. The player can override (e.g., "start them one level lower as a fish-out-of-water").
3. **Ability scores.** Default to rolling 4d6-drop-lowest:
   ```bash
   echo "=== Ability Score Rolls (4d6 drop lowest) ==="
   for i in 1 2 3 4 5 6; do
   d1=$((RANDOM % 6 + 1)); d2=$((RANDOM % 6 + 1)); d3=$((RANDOM % 6 + 1)); d4=$((RANDOM % 6 + 1))
   min=$d1; [ $d2 -lt $min ] && min=$d2; [ $d3 -lt $min ] && min=$d3; [ $d4 -lt $min ] && min=$d4
   total=$(( d1 + d2 + d3 + d4 - min ))
   echo "Roll $i: $d1, $d2, $d3, $d4 → drop $min → $total"
   done
   ```
   Standard array (15, 14, 13, 12, 10, 8) and point-buy are also available. Re-rolls allowed.

   **Assignment heuristic.** First maximize the primary stat(s) for the class — SAD class pumps one core stat, MAD pumps both. Then even out odd scores to even (modifier breakpoints).
4. **Key build decisions** — Origin feat (if 2024 rules), Background, Spell selection (if caster), Equipment.
5. **Build the sheet** in full and present for player validation.
6. **Write Map Token** field with the color chosen in Phase B.

**Output:** Write to `campaign-members/pc-{slug}/`:
- `character-sheet.md` — the full sheet.
- `status.json` — the party-status tracker seed. Load `doc-templates/status-json-template.md` for the schema. Populate fully: identity, statics (`race`, `level`, `proficiencyBonus`, `abilities`, `Speed`), vitals, `Spells` slot tracker, class resources, `skillProficiencies`/`skillExpertise`, `spells[]`, `feats[]`, `weapons[]`, and `SpellDC`/`SpellAttack` for spellcasters.

---

## Phase E — Campaign Integration

All writes happen together at the end of the flow so the campaign lands in a consistent state. Skip the **Archive Protocol** for this to keep it agile.

**1. Update `campaign-settings.json`.**
Append the new PC to the `members` array. New entry shape:

```json
{ "name": "[Name]", "role": "PC", "race": "[Race]", "class": "[Class]" }
```

Edit pattern: locate the `]` that closes `"members": [...]`. Insert `,\n    <new object>` before the `]`, preserving indentation. The array is guaranteed non-empty at create time (the modal seeds members[0]) so an existing entry always precedes the new one. See [doc-templates/campaign-settings.md — Plugin Edit Discipline](../doc-templates/campaign-settings.md#plugin-edit-discipline) for safe array mutation.

**2. Update campaign `CLAUDE.md`.**
- Add a new line to the Auto-Loaded Documents section (one `@`-line per PC):
  ```
  @campaign-members/pc-{slug}/character-info.md
  ```
- Add a new row to the Player Characters table:
  ```
  | [Name] ([Race] [Class]) | [character-info](campaign-members/pc-{slug}/character-info.md) | [character-sheet](campaign-members/pc-{slug}/character-sheet.md) |
  ```

**3. Pending Arrival block (only if Phase C resulted in the new PC joining "Organically", skip if "Immediate").**
Update `recent-events.md`. Insert immediately after the `# Recent Events` header, before the first `## Session N` block (or at end of file if no sessions logged yet):

```
<!-- pending-arrival -->
## Pending Arrival — [Name]

*Transient. The GM weaves [Name] EARLY into the next narrative session; session-end removes this block automatically.*

**Joining context:** [Joining context, ≤1 paragraph. Use the information gathered in Phase C to draft it. It must give a strong hook for the GM so the PC is integrated early upon the next narrative session.]

**Failsafe:** If the party turns away or rejects the *Joining context* hook, proceed to introduce the new PC arriving into scene organically, describe how they look and how their presence feels then hand it off so the new PC can introduce themselves to the group.

**CRITICAL: Introducing the PC to scene is your highest priority for the session, keep focus on this until the PC is formally present with the group.**

```

**4. One-line campaign-summary append.**
Update `campaign-summary.md`. Append a single italicized line under the `## The Party` paragraph:
```
*Joined Session N: [Name], [Race] [Class].*
```
Where `N` is the current `sessions_played` value from `campaign-settings.json`. Defer the full Party-paragraph rewrite to the next campaign-summary fold.

**5. Soft-suggest a Secondary Arc.**
If the new PC's backstory has a clear story hook that fits the campaign's tone and isn't already covered, mention it to the player as a candidate Arc for `campaign-pitch.md`. **Do not auto-edit `campaign-pitch.md`** — surface the suggestion and let the player decide. Two-line nudge max. After the player confirms, insert the arc as a new secondary arc.

**6. Sync party status to the live session.**
Run:
```
node ${CLAUDE_PLUGIN_ROOT}/scripts/party-status-add-member.js ${CLAUDE_SESSION_ID}
```
Include `>> **Party Sync**` in the Confirmation reply. The new PC appears on the app immediately, without waiting for the next narrative session start.

---

## Confirmation

List all files written and edited, including the new PC's directory contents and every cross-cutting document touched. Note:
- The resolved slug (especially if a numeric suffix was applied for collision).
- The chosen Map Token color (and whether the palette is approaching exhaustion).
- Whether a Pending Arrival block was written. If yes, mention that the next narrative session will pick it up and session-end will clean it up.
- Whether a Secondary Arc was suggested for player consideration.

Close with a one-line nudge: the new PC is now part of the party — start a Narrative Session to play.

---

## Compact Instructions

When context is compacted during add-pc, preserve:
- The resolved slug and PC name.
- Which phase is in progress and its current step.
- All player decisions and preferences stated during the conversation.
- Any documents already written (they're on disk — re-read if needed after compaction).
