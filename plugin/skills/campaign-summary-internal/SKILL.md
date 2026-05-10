---
name: campaign-summary-internal
description: Internal skill for campaign summary fold execution — integrative rewrite of campaign-summary.md from recent-events.md, thread label promotion, recent-events clearing. Only for sub-agent use; the narrative GM should never invoke this skill.
user-invocable: false
effort: high
---

# Campaign Summary Fold — Execute Procedure

Fold `recent-events.md` content into `campaign-summary.md` — an integrative update that produces a coherent, aggressively compressed narrative overview of the entire campaign so far.

## Pre-flight Check

- [ ] Archive `campaign-summary.md` (see Archive Protocol in agent instructions)
- [ ] Archive `recent-events.md` (see Archive Protocol in agent instructions)
- [ ] **Read the campaign summary template** from the `doc-templates` skill (`campaign-summary.md`). This contains compression rules, writing standards, and the document structure. The summary you produce must conform to these standards.

### Documents to Read

Verify all of these are loaded before proceeding. If any are missing, read them now.

- [ ] `campaign-summary.md` — current state (may be minimal or stale)
- [ ] `recent-events.md` — the session events to integrate
- [ ] `campaign-pitch.md` — Core Arc, Secondary Arcs, Story Pacing (needed for thread promotion and narrative framing)
- [ ] `campaign-settings.json` — `campaign_length` (also needed for thread promotion and narrative framing). Schema reference: [`doc-templates/campaign-settings.md`](../doc-templates/campaign-settings.md).
- [ ] **gm-canon.md** — thread labels and current state (needed for thread promotion decisions)

## Procedure

**Step 1 — Integrative Rewrite.**
This is NOT an append operation. Rewrite the `campaign-summary.md` contents to incorporate all events from `recent-events.md` into a coherent narrative overview. Follow the compression rules and writing standards from the campaign summary template reference (loaded in pre-flight). Key points:

- **Compress aggressively.** The new narrative content should be roughly 15-20% of the `recent-events.md` word count. If you're writing more, you're preserving too much detail.
- **Update, don't append.** If the summary already describes a situation that has since evolved, update the description to reflect the new state — don't list both the old and new states.
- **Check for further compression.** When adding new content, review the existing summary for arcs that have since completed and can be compressed further.
- **Honor briefing notes.** If the briefing includes a Notes section with player requirements or emphasis, respect those directions when deciding what to foreground.
- **Follow the template structure.** Use the Party / Act / Current Situation structure from the template reference.

**Step 2 — Thread Label Promotion.**
Review gm-canon threads against campaign-pitch.md:

- If **no Core Arc was declared** at campaign creation (Core Arc field is empty, "Undefined," or "Let it emerge") AND an emergent (unlabeled) thread in gm-canon has clearly become the central campaign arc through play → promote it to `(Core Arc)` in gm-canon.
- If Core Arc was declared at creation, do NOT promote additional threads to Core Arc — there is only one.
- Secondary Arc labels are player-declared only — do not promote emergent threads to Secondary Arc.
- Update both gm-canon (add the label to the thread) and `campaign-summary.md` (reflect the arc status in the narrative) if a Core Arc promotion occurs.

**Step 3 — Clear recent-events.**
After the fold:
- If ALL sessions in `recent-events.md` were fully integrated into the summary, overwrite the file contents with just the `# Recent Events` header followed by an empty line. Do not delete the file.
- If the most recent session's events were only partially integrated (e.g., the fold happened mid-session), keep that session's entry and clear everything before it.

## Report

State:
- Number of sessions folded
- Whether any thread labels were promoted (and which)
- File paths modified
- Archive file path
