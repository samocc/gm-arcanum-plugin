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
- [ ] `campaign-settings.json` — for `sessions_played` (needed for frontmatter update). Schema reference: [`doc-templates/campaign-settings.md`](../doc-templates/campaign-settings.md).
- [ ] `character-info.md` for every PC (`campaign-members/pc-*/character-info.md`) — PC identity and backstory. Grounds the relationship dynamic — understanding who the companion is building trust with. Multi-PC parties: read all.
- [ ] **Other `companion-guide.md` docs** — if the party has multiple companions, read their guides for group dynamic context. Companion-to-companion relationships influence how each evolves.

## Procedure

**Step 1 — Determine Target Stage.**
Based on the companion's current stage and progress, identify the next stage from the lifecycle model (see agent instructions). Only advance one stage at a time (even if progress exceeds a further threshold).

**Step 2 — Update Frontmatter.**
Set `stage` to the new stage and `last-evolution` to the current `sessions_played` value (from `campaign-settings.json`).

**Step 3 — Rewrite Designated Sections.**
Apply the section-specific rules for the transition being performed (see Section Evolution Rules below). Only modify the sections designated for this transition. Leave all other sections exactly as they are — same text, same formatting, same structure.

**Step 3b — Clear the Session Beats section.**
After the designated sections have been rewritten, clear the `## Session Beats` section (below the `<!-- narrative-break -->` marker). Leave the `## Session Beats` header and the placeholder HTML comment in place; remove the accumulated `### Session N` entries. 

**Step 4 — Writing Guidelines.**

> Session Beats as evidence: the `## Session Beats` entries since `last-evolution` are your primary source of behavioral evidence. Every evolution claim (voice softens, boundary modulates, proximity increases) should trace back to a specific beat or pattern across beats. Treat beats as the lived history between evolutions.

- **Respect section standards.** Every section has length and content constraints defined in the companion guide template reference (loaded in pre-flight). Do not exceed the length targets. Do not add psychology, justification, or reasoning to sections that call for observable behavior. Do not expand one-liner fields (e.g., Motivations) into paragraphs. When the template says "1-2 sentences" or "one line each," that is the ceiling, not a suggestion.
- **Match the existing guide's voice and format.** The evolved sections should read as if they were always part of the guide — same writing style, same level of detail, same structural patterns.
- **Ground changes in session evidence.** Every evolution should be traceable to specific moments from the session logs and `recent-events.md`. Don't invent relationship progress that didn't happen. But session events are the *source* you derive patterns from, not the *content* you write — describe the behavioral pattern an event established, not the event itself.
- **Personal growth, not external support.** Evolution must be framed around the character's own qualities or changes, describe what the character now *is*, *believes*, or *can do* — not just who they have around them. The failure mode: writing entries that describe the party's presence around the companion ("they have stood with it", "the party has been in the room", "now has a support circle") without the companion themselves having changed. Test each evolution claim: does the fear, capability, or self-perception have a *past tense* now? Has the *default* shifted, or is the same default just being witnessed by others? Even relationship-anchored sections should trace each observable change to an internal shift — what the companion has become through the experience, not what the experience provides them. When the session evidence is rich (mechanical milestones reached, repeated tested moments, deliberate choices made under pressure), the evolution should land the internal shift those beats earned, not stop at "now has people who saw it".
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

This section is the highest-risk surface for the *external support* failure mode (see Step 4 — *Personal growth, not external support*). Even when describing the relationship explicitly, anchor each change to what the companion now does, recognizes, or trusts that they didn't before — not to what the party provides them. "Trusts [party member] with the weight of difficult moments without diluting them" (changed recognition) lands; "the party has stood with him while it cracked" (party presence around an unchanged state) does not.

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
- Romance Framework — **Hard short-circuit:** if the section reads `Disabled` (child companion, or explicit opt-out), do not evolve this field. Skip silently. Otherwise: should only evolve IF there are clear romantic *Beats* from the Player Character towards this companion and there's evidence of positive reaction from the companion. Minor tweak IF a PC has shown clear patterns that match the existing romance framework of this companion, those should trigger a subtle romantic interest towards the PC. For evolution on this field you MUST be certain, not all emotional moments are romance driven, do not change if unsure.

### Teammate → Bonded

The core theme: **working team becoming chosen family.** Where Acquaintance → Teammate softened defenses and built party-specific behavioral patterns, Bonded reaches into identity. The companion's psychology begins to shift, party-specific exemptions deepen, and shared rituals appear. The companion still has their core self — what changes is how much of that self the party gets to see, and how the party has been folded into the companion's coping and meaning-making.

**Sections to update:**

#### Current Dynamic (full rewrite)
This is the second full rewrite of this section — the relationship at bonded is qualitatively different from teammate, not a deeper version of the same thing. Working trust becomes attachment; established patterns become rituals; reduced defensiveness becomes genuine vulnerability with these specific people. Anchor each change to what the companion now does, recognizes, or trusts that they didn't before — not to what the party provides them. The teammate-stage cap was 3 paragraphs; bonded may expand up to ~160 words to accommodate richer relationship nuance, but only when session evidence justifies it. This section is the highest-risk surface for the *external support* failure mode (see Step 4 — *Personal growth, not external support*) and the risk increases at bonded — the temptation to write "the party has held him through this" instead of "he no longer hides this from the party" is sharper. Trace each line back to a behavioral or internal shift in the companion themselves.

#### Psychology > The Mask (soften; party-specific exemptions)
The Mask is who the companion projects to the world — at bonded, party members are partially or fully exempt. The Mask doesn't disappear; it gets selectively dropped around bonded party members. Add language like "with [party member(s)] specifically, the [archetype] persona drops to..." or "around the party, this projection no longer activates." The Mask is still active for strangers, NPCs, and adversaries — only specific people see beneath it now. Do not rewrite the Mask itself; add the party-specific exemption.

#### Psychology > The Core (party as coping presence)
The Core is the wound or fear beneath the Mask. At bonded, the party has become part of how the companion lives with that wound — not by fixing it, but by being a witnessed presence the companion no longer has to perform around. Reframe one or two clauses to reflect this: the same Core fear, now contextualized by the party knowing it. Use phrasing like "though [party member] has seen this and stayed" or "the wound is no less present, but it is no longer hidden from the people who matter." Do not resolve the Core — it doesn't go away, it just stops being secret.

#### Speech & Voice > Habits (relaxed register with the party)
Name usage evolves — titles become given names, formal address relaxes, nicknames may emerge. Conversational registers used with the party drop to a private mode that strangers don't get. Append to existing Habits: "with party members, the formal register drops; names rather than titles; sentence fragments and shorthand replace explained reasoning." Do not rewrite the base Habits — add the party-private register as an additional pattern. Keep the example dialogue field unchanged unless evolution evidence shows a shift in the companion's broader voice.

#### Social Maneuvers (add bond-specific maneuvers, optional)
Existing maneuvers stay unchanged. The companion may gain 1-2 new maneuvers that exist *only* in the context of party trust — a coordinated move with a specific party member, a gesture that signals to the party without including outsiders, a shorthand that reads as banter to strangers but carries real meaning to the party. Only add if the session evidence shows the companion deploying something with this shape. Each follows the standard Maneuver format: Name, Description (observable behavior), Intent (effect on the social situation).

#### Behavioral Quirks (soften for familiar people)
Quirks involving threshold or aversion patterns soften for specific bonded party members. The most common shape: a contact aversion (flinching when handed objects, recoiling from physical proximity) that no longer fires for the party but still fires for strangers. Append the exemption to the affected quirk: "with [party member(s)], this no longer fires" or "the threshold is markedly higher with the party." Do not rewrite the base quirk — it remains the companion's pattern with everyone else. Quirks rooted in trauma or core identity (compulsive scanning, ritualistic checks, persistent verbal tics) generally don't soften — they're not relationship-modulated.

#### Downtime > Likes / Routine (incorporate shared rituals)
**Likes** may gain entries that appear only in party contexts — "the sound of [companion]'s arguments at the campfire," "the particular weight of the watch shared with [party member]." Keep these tendencies (not specific events). **Routine** may evolve to include a small repeated party-anchored habit if one has emerged — checking in with a specific party member each morning, taking a particular position during travel, a brief shared moment at end of day. Keep Routine to one sentence; this isn't a montage, it's a single texture-line. **Settling In** generally doesn't need another update at this stage — it was already adjusted at teammate. **Idle** and **Dislikes** typically stay as-is unless session evidence specifically shows change.

**Sections that may receive incremental refinement (not full rewrite):**

- **Vulnerability Response** — already softened-for-party at teammate. At bonded, the threshold may drop further for *specific* party members — the companion may allow the Mask to slip in their presence rather than redeploying it. Append a clause if evidence supports; otherwise leave teammate-stage update in place.
- **Role-playing Directives** — may gain additional party-specific bullets where the bonded relationship creates new actionable behavior. Add only when session evidence shows distinct new patterns; do not invent.
- **Personal Plot Hooks** — continue to update status and current state if the party has engaged further with the hook. Same rules as teammate-stage.
- **Motivations > Personal** — refine only if the party has continued to engage with the personal motivation through gameplay since the last evolution.

**Sections that do NOT change at this stage:**

- Core Information — static facts
- Description — appearance doesn't shift
- Backstory — immutable history
- Motivations > Primary, Secondary — arc-level motivations, not relationship-level
- Problem Solving — slow-changing behavioral pattern (exception: very extreme problem-solving tendencies might soften based on trust)
- Combat Initiation — mechanical triggers, unchanged by relationship level
- Biological Tells — innate physiological responses
- Speech & Voice > Pacing, Vocabulary, Example — base voice profile stays; only Habits gain the party-private register
- Romance Framework — **Hard short-circuit:** if the section reads `Disabled` (child companion, or explicit opt-out), do not evolve this field. Skip silently. Otherwise: bonded is the natural threshold for romance evolution if a PC has shown sustained romantic interest and the framework's barriers have been meaningfully addressed. Apply the same evidence standard as the teammate-stage rule — clear romantic Beats from the PC, evidence of positive reaction from the companion. If the romance has been platonic-by-choice across the entire arc, bonded does not force a romantic shift; the framework can describe a deepened-but-platonic version of the same dynamic.
