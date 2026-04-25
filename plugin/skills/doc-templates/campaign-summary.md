# Campaign Summary — Writing Standards & Template

Writing standards for campaign-summary.md documents. This document is cold storage — the high-level narrative arc of the entire campaign, compressed aggressively. Think of it as the recap at the start of a new TV season: a reader should understand the story arc in under two minutes. This mindset should guide every writing decision — what to include, what to cut, how much detail to preserve.

The summary is NOT a journal, chronicle, or session log.

---

## Compression Rules

### Per-Fold Compression

When integrating `recent-events.md` into the summary, the new narrative content added should be roughly **15-20% of the `recent-events.md` word count**. Example: 1,000 words of `recent-events.md` should produce ~150-200 words of narrative in the summary.

The Party section is structural — exclude it from compression math.

### Hard Floor

For most campaigns, the narrative body of the summary should not exceed the `recent-events.md` word count being integrated. The exception is very long campaigns (50+ sessions) where the accumulated summary of many compressed arcs may legitimately exceed a single `recent-events.md` batch — but even then, each individual fold should be a net compression of the new material.

### Growth Over Time

Total summary length grows sub-linearly across folds:
- New content is added at the 15-20% compression ratio.
- Completed story arcs in the existing summary compress further with each fold.
- Long-running campaigns (50+ sessions, 4+ story arcs) will have summaries longer than any single `recent-events.md` batch. This is correct — the sub-linear growth is working as intended.

---

## Writing Rules

### What Lives Elsewhere

The summary does not need to preserve information maintained in other campaign documents:
- **NPC details** — `npc-directory.md` and `companion-guide.md` docs track character specifics.
- **Thread tracking** — gm-canon tracks active threads, breadcrumbs, and arc labels.
- **Event details** — Session logs hold the full record.
- **Companion development** — `companion-guide.md` docs track relationship and personality evolution.

The summary's job is the narrative arc — the shape of the story, not the details.

### NPC Names

Name NPCs only when they are directly plot-critical — recurring allies, antagonists, key information sources whose identity matters to the arc. Incidental merchants, quest-givers, one-time combat opponents, and minor settlement NPCs do not need naming in the summary.

### Arc Structure

Organize by narrative arc — what the story is about, what happened, where it stands. Do NOT organize by geographic location or session-by-session chronology. A summary structured as a sequence of place names the party visited is a travelogue, not a story summary.

### Combat

Summarize by outcome and story significance only: "The party cleared the lower passage of predators" — not tactics, damage, creature counts, or blow-by-blow.

### Integration

This is an integrative rewrite, not an append operation. When folding new events, update existing descriptions to reflect the new state. If the old summary said "the party is searching for the artifact" and `recent-events.md` describes them finding it, the summary should say "the party recovered the artifact" — replacing the old state, not listing both.

### Compression Priority

- **Completed arcs compress aggressively.** A resolved quest becomes one sentence. A whole act of a long campaign can be a short paragraph.
- **Open threads preserve detail.** An active investigation keeps its key specifics — what the party knows, what they're pursuing, why it matters. These are the threads the GM needs to pick up.
- **Key discoveries and turning points survive.** Moments that changed the direction of the campaign or revealed critical information should be preserved even in compressed arcs.

### The Party Section

A single dense paragraph: PC identity and core motivation, each companion with name + class + one-line characterization, and travel context (how long together, where they met). Not per-character breakdowns — one paragraph.

---

## Template

```markdown
# Campaign Summary

## The Party

[Single paragraph: PC identity and motivation, companions with name/class/one-line, travel context]

---

## Act I: [Title] (Ongoing)

[Narrative summary — major plot points, key discoveries, significant decisions. Arc-based, not location-based. Mark the current/latest act with "(Ongoing)" in the heading.]
```
