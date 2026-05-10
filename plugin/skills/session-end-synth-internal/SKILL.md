---
name: session-end-synth-internal
description: Internal skill for per-session synthesis at session-end — write companion beats, update companion progress, and update npc-directory. Reads the session transcript directly; runs in parallel with the main agent writing the session log. Sub-agent use only.
user-invocable: false
effort: medium
---

# Session-End Synthesis — Execute Procedure

Runs at session-end as a parallel helper. The narrative GM spawns this sub-agent at the start of session-end, before the session log is written. The agent reads the full chat via transcript, synthesizes per-companion beats, updates companion progress, and updates the NPC directory.

**Does NOT do:**
- Write the session log (main agent)
- Update `recent-events.md` (main agent — derives from the just-written log)
- Update `gm-canon.md` (main agent — requires the GM's private reasoning)
- Increment session counter, campaign stage (main agent)
- Update `inventory.md`, module statuses, party-status script.
- Update any file that is not explicitly mentioned in the tasks.

---

## Pre-flight

### Inputs from briefing

The briefing provides:
- **Active campaign directory** — all relative paths below resolve from here
- **Session ID** — needed to locate the transcript
- **Session number (N)** — the session being ended, used for `### Session N` headers
- **Partial session files (optional)** — if the briefing lists partial session files that were folded into this session, read them too (their Events sections contain earlier segments)

### Documents to read

- [ ] **Session transcript** at `.sessions/[session-id]/transcript.jsonl`. JSONL format, one event per line. Relevant event types:
  - `type: "player"` with `text` field — player messages typed in the Claude Code terminal
  - `type: "remote_input"` with `turns[]` array — player messages from the companion app. Each turn is `{speaker, kind?, text}`. `speaker` is a folder slug (`pc-*`/`co-*`); `kind: "ooc"` indicates out-of-character, otherwise narration. May also carry `skills[]` (invoked GM skills) and `mutations` (player-edited resources) — usually skip for narrative reconstruction.
  - `type: "gm"` with `turns[]` array — GM responses. Each turn is `{speaker, text}`; currently always a single `speaker: "GM"` entry.
  - `type: "transcript_start"` — skip, just metadata
  - Other event types — ignore
  Read the file in full. Reconstruct the chat chronologically.
- [ ] **All `campaign-members/*/companion-guide.md` docs** — read each in full. Needed to understand established voice/personality for each companion before writing beats and grading progress.
- [ ] `character-info.md` — PC identity (who the companions are relating to), if multiple PC (rare) you must read them all.
- [ ] `npc-directory.md` — existing NPC roster, for delta updates
- [ ] Any **partial session logs** listed in the briefing — read for the earlier segments' events

---

## Work

### 1. Companion beats (write one per companion)

For each companion, append a new `### Session N` block to the companion-guide's `## Session Beats` section.

**If the companion-guide does not yet have a `## Session Beats` section or a `narrative-break` marker**, add them to the guide: marker first, then a `## Session Beats` header, then the session block. Place the marker **after** Personal Plot Hooks and **before** Session Beats. If a marker is present respect it's location and place `## Session Beats` at the end of the document. 

**Per-session block format:**
```
### Session N

[1-2 compact paragraphs, ~100-150 words. Focus: what the companion did (notable actions, restraint, engagement with challenges), exchanges with PC and other companions (trust beats, tension, alignment shifts), and any new voice or character nuances. Not a scene recap — filter to beats specific to this companion.]
```

**Writing rules:**
- Not a session recap. Skip moments the companion didn't meaningfully participate in.
- Describe the behavioral pattern a moment established, not the moment verbatim.
- Ground in transcript evidence. Do not invent actions or dialog that didn't happen.
- Match the companion's existing voice and the guide's tone.
- Target 100-150 words per companion per session. Hard ceiling ~200 words.

### 2. Companion progress grading (update frontmatter)

**Skip companions at `stage: bonded`.** Bonded is the final stage in the lifecycle model — there is no further evolution to track progress toward. Do not grade and do not update `evolution.progress` for these companions. Beats writing in step 1 still happens; only the progress accumulator is frozen.

For each remaining companion, evaluate each PC's interactions with them through the session and assign a progress grade. In multi-PC parties, sum across all PC interactions — a companion who bonded with one PC and clashed with another lands somewhere between the two extremes; weigh accordingly.

| Grade | Progress | When |
|---|---|---|
| Very positive (rare) | +8 | Substantial trust-building, emotional vulnerability, or a defining relationship beat |
| Positive | +5 | Solid positive interaction; PC engaged with the companion meaningfully |
| Neutral | +2 | Baseline — they traveled together, no significant positive or negative moments |
| Poor | 0 | Neglect, dismissive behavior, or minor friction that didn't resolve well |
| Very Negative | -5 | Active harm to the relationship — PC broke trust or acted against the companion's core values |

In-between values allowed (e.g., +6 for "positive, slightly above", +3 for "neutral, leaning positive").

Factor in:
- The interactions themselves (frequency + quality)
- The companion's personality (a stoic companion may show trust subtly; a warm one shows it openly — grade against the companion's baseline)

**Update** the companion-guide's YAML frontmatter: `evolution.progress` field, add the delta (cumulative, can't fall below 0). Also update any guide-specific progress-tracking conventions the file uses.

Do NOT change `evolution.stage` or `evolution.last-evolution` — stage transitions are a separate (player-triggered) operation.

### 3. NPC directory updates

Update `npc-directory.md` based on the session:

- **New recurring or significant NPCs** encountered — add entries using the template format at the bottom of the file. **Always populate the `Tagline` bullet** — first line after the header, no blank line between. Captures stable identity: role/function + location + current attitude toward the party. Distill from what the NPC *is* in the world, not from this session's events.
- **Updates to existing NPCs** — if new information was learned (allegiance revealed, status changed, location moved), append to Core Context. The `Tagline` bullet should rarely change — only if the NPC's fundamental role, location, or attitude has shifted.
- **Skip** minor one-off NPCs (unnamed guards, shopkeepers with no plot relevance, etc).

New entries go inside `## NPC List` above the NPC template HTML comment at the bottom of the file.

If partials were folded in, include NPCs from all segments.

---

## Report

After all writes, report to the narrative GM:

```
## Session-end synthesis complete

**Companion beats written:**
- [Companion Name]: [N] words, [brief one-line note on what the beats covered]
- ...

**Progress updates:**
- [Companion Name]: +[N] ([grade, e.g., "Positive"]) — now at [total] progress

**NPC directory:**
- Added: [Name] — [one-line reason]
- Updated: [Name] — [what changed]
- (or "No changes" if nothing happened)
```

Keep the report compact. The narrative GM will relay summary info to the player at the session-end confirmation step.

---

## Notes

- **You do not archive companion-guides.** Routine beats-section appends are not evolution — no archive required. The `companion-evolve-internal` skill handles archiving during stage transitions.
- **Transcript may be long.** Reconstruct the chat by concatenating `type: "player"`, `type: "remote_input"` and `type: "gm"` events in `seq` order. You don't need to retain verbatim — extract the evidence you need for beats and NPC updates, then write.
- **If the transcript is missing or empty**, fall back to the partial session logs (if provided) and proceed with best-effort synthesis based on those. Report error if no partial session log nor current session transcript were available do not attempt to use other sessions transcripts.
