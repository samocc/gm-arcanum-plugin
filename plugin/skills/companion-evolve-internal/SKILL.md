---
name: companion-evolve-internal
description: Internal skill for companion RP evolution execution — section-by-section update rules per lifecycle transition, writing guidelines. Only for sub-agent use; the narrative GM should never invoke this skill.
user-invocable: false
effort: medium
---

# Companion RP Evolution — Execute Procedure

Update a companion-guide to reflect how a companion's relationship with the party has evolved past a lifecycle milestone.

## Pre-flight Check

- [ ] Archive the existing companion-guide (see Archive Protocol in agent instructions)
- [ ] **Read the companion guide template.** This contains section-by-section writing standards — length targets, content boundaries, and style rules. All updates must conform to these standards.

### Documents to Read

Verify all of these are loaded before proceeding. If any are missing, read them now.

- [ ] **The `companion-guide.md`** being evolved — read in full, every section, including the `## Session Beats` section below the `<!-- narrative-break -->` marker (the accumulated per-session record written by session-end synthesis since `last-evolution`)
- [ ] `recent-events.md` — for specific events and interactions that demonstrate the relationship evolution
- [ ] **gm-canon.md** — for the companion's arc thread (Direction and breadcrumbs provide context for how the companion should be developing)
- [ ] `campaign-settings.md` — for `Sessions Played` (needed for frontmatter update)
- [ ] `character-info.md` — the PC's identity and backstory. Grounds the relationship dynamic — understanding who the companion is building trust with.
- [ ] **Other `companion-guide.md` docs** — if the party has multiple companions, read their guides for group dynamic context. Companion-to-companion relationships influence how each evolves.

## Procedure

**Step 1 — Determine Target Stage.**
Based on the companion's current stage and progress, identify the next stage from the lifecycle model (see agent instructions). Only advance one stage at a time (even if progress exceeds a further threshold).

**Step 2 — Update Frontmatter.**
Set `stage` to the new stage and `last-evolution` to the current `Sessions Played` value.

**Step 3 — Rewrite Designated Sections.**
Apply the section-specific rules for the transition being performed (see Section Evolution Rules below). Only modify the sections designated for this transition. Leave all other sections exactly as they are — same text, same formatting, same structure.

**Step 3b — Clear the Session Beats section.**
After the designated sections have been rewritten, clear the `## Session Beats` section (below the `<!-- narrative-break -->` marker). Leave the `## Session Beats` header and the placeholder HTML comment in place; remove the accumulated `### Session N` entries. 

**Step 4 — Writing Guidelines.**

> Session Beats as evidence: the `## Session Beats` entries since `last-evolution` are your primary source of behavioral evidence. Every evolution claim (voice softens, boundary modulates, proximity increases) should trace back to a specific beat or pattern across beats. Treat beats as the lived history between evolutions.

- **Respect section standards.** Every section has length and content constraints defined in the companion guide template reference (loaded in pre-flight). Do not exceed the length targets. Do not add psychology, justification, or reasoning to sections that call for observable behavior. Do not expand one-liner fields (e.g., Motivations) into paragraphs. When the template says "1-2 sentences" or "one line each," that is the ceiling, not a suggestion.
- **Match the existing guide's voice and format.** The evolved sections should read as if they were always part of the guide — same writing style, same level of detail, same structural patterns.
- **Ground changes in session evidence.** Every evolution should be traceable to specific moments from the session logs and `recent-events.md`. Don't invent relationship progress that didn't happen. But session events are the *source* you derive patterns from, not the *content* you write — describe the behavioral pattern an event established, not the event itself.
- **Preserve the core character.** Evolution softens or contextualizes existing traits — it doesn't replace the character's fundamental identity. The changes are in *degree* and *scope* (toward the party specifically), not in kind.
- **Don't over-evolve.** The companion should feel like they've grown, not like they've been replaced. If in doubt, make a smaller change. A single well-placed qualifier ("with the party, this has softened to...") is often more effective than rewriting an entire section.
- **Maintain structural integrity.** Don't add new sections, remove existing sections, or change section headers. Work within the existing document structure.
- **Honor briefing notes.** If the briefing includes a Notes section with player requirements or emphasis, respect those directions. They take priority over your own judgment about what to emphasize.
- **Length budgets are flexible during evolution.** The template's per-section word budgets apply to initial generation. During evolution, sections that need updating can expand up to ~20% beyond their template budget if the session evidence justifies it — do not pad. Current Dynamic specifically can expand to ~160 words to accommodate multiple party members and richer relationship nuance.

## Report

State:
- Companion name and transition performed (e.g., "Xalyth: acquaintance → teammate")
- Summary of key changes per section (1-2 sentences each)
- Any sections where the evidence was ambiguous and you made a judgment call — flag for player review
- Archive file path

---

## Section Evolution Rules

### Acquaintance → Teammate

The core theme: **guarded strangers becoming a working team.** Changes reflect established patterns, reduced defensiveness, and emergent trust — specifically toward the party. The companion's general personality and behavior toward the outside world remains unchanged.

**Sections to update:**

#### Current Dynamic (full rewrite)
This section is the most outdated by definition — it was written at recruitment when the companion had no relationship with the party. Rewrite to reflect the actual current dynamic based on accumulated session evidence. Reference specific patterns that have developed (collaborative habits, communication norms, trust markers). The template baseline is 1 paragraph; evolution may expand up to 3 paragraphs maximum as the relationship develops, but only if the session evidence justifies it. Do not expand for the sake of expanding.

#### Vulnerability Response (soften for party)
The core defense mechanism remains — this is who the companion is under stress. But add a qualifier for how this manifests differently with current party members specifically. The companion doesn't stop being defensive; the threshold for deploying full-intensity defenses against people they've traveled with is higher. Use phrasing like "with current party members, this has modulated to..." or "the threshold for deploying [behavior] against the party is noticeably higher."

#### Downtime > Settling In (update proximity)
Physical proximity patterns change as trust builds. Update to reflect observed changes from session evidence (sitting closer, choosing adjacent positions, shared routines). Keep the companion's fundamental comfort preferences — just adjust the social distance.

#### Role-playing Directives (add party nuance)
Where a directive describes behavior that now differs between party members and strangers, add the distinction. Don't rewrite the directive — append the party-specific nuance. Example: if a directive says "when someone attempts to heal her, she steps back" — add that with party members she may still flinch but no longer fully retreats.

#### Personal Plot Hooks (status update)
If any hook's trigger conditions have been partially met, or groundwork has been laid through play, update the status and add a brief note about current state. Don't change the hook's design — just reflect where it stands (i.e. evolve it slightly).

#### Motivations > Personal (refine if engaged)
Only update if the party has directly engaged with the companion's personal motivation through gameplay. If so, refine to reflect the current state of that pursuit. If the party hasn't engaged with it, leave it unchanged.

**Sections that do NOT change at this stage:**

- Core Information — static facts
- Description — appearance doesn't shift at this stage
- Backstory — immutable history
- Psychology > The Mask — deep identity layer, softens later (bonded)
- Psychology > The Core — deep identity layer, contextualizes later (bonded)
- Motivations > Primary, Secondary — arc-level motivations, not relationship-level
- Speech & Voice — takes longer to shift meaningfully
- Problem Solving — behavioral pattern, slow to change
- Combat Initiation — mechanical triggers, unchanged by relationship level
- Social Maneuvers — existing maneuvers stay; new ones may appear at bonded
- Behavioral Quirks — slow to soften, changes at bonded
- Biological Tells — innate responses, don't change
- Romance Framework — Should only evolve IF there are clear romantic *Beats* from the Player Character towards this companion and there's evidence of positive reaction from the companion. Minor tweak IF a PC has shown clear patterns that match the existing romance framework of this companion, those should trigger a subtle romantic interest towards the PC. For evolution on this field you MUST be certain, not all emotional moments are romance driven, do not change if unsure.

### Teammate → Bonded (Tentative — revisit in detail later)

Additional sections that evolve beyond the teammate set. These are design direction, not finalized rules:

- **Psychology > The Mask** — softens; party members are partially or fully exempt from the projected persona
- **Psychology > The Core** — the party has become part of the coping mechanism or healing process; contextualize accordingly
- **Speech & Voice > Habits** — name usage evolves (e.g., titles → given names); conversational registers may relax
- **Social Maneuvers** — may gain new maneuvers that exist only in the context of party trust
- **Behavioral Quirks** — soften for familiar people (e.g., contact aversion reduces for specific party members)
- **Downtime > Likes/Routine** — incorporate party activities and shared rituals
