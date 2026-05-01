---
name: session-end
description: Narrative session only. Requires user EXPLICIT request not implied not ambiguous. End the current session — save log, update events, update NPCs, increment session counter. Use --partial for a lightweight checkpoint.
argument-hint: "--partial"
---

# End Session

When the player invokes `/gm:session-end` (or says "let's stop here", "end session", or similar), check `$ARGUMENTS` for flags:

- **`--partial`** → Follow the **Partial Session Save** path below.
- **No arguments** → Follow the **Full Session End** steps below.

---

## Partial Session Save

A partial save checkpoints the current state so the player can start a fresh conversation without using up a full session number. It writes a lightweight log — no bookkeeping, no counter increment, no document updates. All of that is deferred to the eventual full session end.

### P1. Determine session number
Read `campaign-settings.md` and find the `Sessions Played` count. The session in progress = count + 1.

### P2. Determine part letter
Glob for existing `session-NNN-*.md` files in `session-logs/` (where NNN is the session in progress, zero-padded to 3 digits). Exclude the main session log file itself (`session-NNN.md` with no letter suffix). If no partial files exist, use `A`. If `A` exists, use `B`. Continue alphabetically.

### P3. Write partial session log
Read the partial template from `${CLAUDE_SKILL_DIR}/partial-session-template.md`. Write the completed log to `session-logs/session-NNN-X.md` (e.g., `session-004-A.md`). Set the `session_id` frontmatter field to `${CLAUDE_SESSION_ID}`.

No Companion Progress section.

### P4. Persist party status
Run:
```
node ${CLAUDE_PLUGIN_ROOT}/scripts/party-status-persist.js ${CLAUDE_SESSION_ID}
```
Expect `persisted` or `no-status` — both are fine; mention any other output in the confirm step.

Sync-Up does NOT run on partial — it belongs to the full session-end flow (session log written, sheet updated from canon). Partial writes canon only; the next full session-end propagates canon changes to the sheet.

### P5. Confirm to player
1. State what was saved and the file path.
2. Suggest the player start a new Claude Code conversation to continue the session.

**Stop here.** Do not proceed to the full session end steps.

---

## Full Session End

---

### 1. Determine session number
Read `campaign-settings.md` and find the `Sessions Played` count. The new session log number is that count + 1.

### 2. Check for partial session files
Glob for `session-NNN-*.md` files in `session-logs/` (where NNN matches the session being logged, zero-padded to 3 digits).

If partial files exist:
- Read them all in alphabetical order (A, B, C...).
- Note their Events sections — these represent the earlier portions of the session.
- When writing the session log in step 4, incorporate partial Events chronologically before the current segment's events.
- All subsequent steps (recent-events, npc-directory, gm-canon, etc.) should reflect the **entire session** across all segments, not just the current segment.

If no partial files exist, proceed normally.

### 3. Spawn Helper A — session-end synthesis (background)
Spawn the `gm-evolution` agent in the background with a session-end-synth briefing.

**Briefing reference:**

```markdown
# Session-End Synthesis

## Mode
Execute — session-end-synth-internal skill.

## Campaign
Active campaign at `[campaign path]`.

## Session
- Session number: [NNN — the new number, count + 1]
- Session ID: ${CLAUDE_SESSION_ID}
- Transcript: `.sessions/${CLAUDE_SESSION_ID}/transcript.jsonl`
- Partial session files folded in (if any): [list paths, or "none"]

## Tasks
- Write `### Session NNN` beats block to each companion-guide's `## Session Beats` section
- Update each companion-guide's `evolution.progress` frontmatter value with the graded delta
- Update `npc-directory.md` — additions, Core Context updates, tagline adjustments per the rules in the skill

Report back when all writes are complete.
```

Continue immediately to step 4 — do not wait.

### 4. Write session log
Read the session log template from `${CLAUDE_SKILL_DIR}/session-log-template.md`. Write the completed log to `session-logs/session-NNN.md` (zero-padded to 3 digits, e.g., `session-004.md`). Set the `session_id` field in the YAML header to `${CLAUDE_SESSION_ID}`.

The Pickup Point section is critical: copy the full verbatim text of your last narrative response so the next session can resume naturally.

**If partial files were found in step 2:** The Events section should include events from all partial segments (in chronological order) followed by the current segment's events. Rewrite and integrate partial events as needed to maintain narrative flow and consistent level of detail — don't just paste them in verbatim. The Overview should cover the entire session.

### 5. Persist party status
Run:
```
node ${CLAUDE_PLUGIN_ROOT}/scripts/party-status-persist.js ${CLAUDE_SESSION_ID}
```
Capture the result:
- `persisted` → canon `status.json` files under `campaign-members/` were merged with session state. The drift-check sub-task in step 6 will run.
- `no-status` → party status tracking wasn't active this session (e.g., narrative-only with no combat, or tracking was off). The drift-check sub-task in step 6 will be skipped.

### 6. Spawn Helper B — unified post-persist (background)
Two optional sub-tasks:
- **Inventory Update** — applies if the session log has an `## Items Acquired` section.
- **Party Status Sync-Up** — applies if step 5 persist returned `persisted`.

If neither applies, skip the spawn (note "Helper B: no work" for convergence). Otherwise spawn `gm-utility` in the background with:
```
## Instruction
You are tasked as helper agent for the session-end workflow, you'll work in the background to perform the tasks described and only those, do not modify files that are not part of the task execution and do not execute tasks beyond the scope.
- Campaign: [path to active campaign directory]
- Session log: [path to the session-log file you just authored]
- Tasks:
  1. Inventory Update based on the session log provided.
  2. Party Status Sync-Up.
- Compose your response based on the accumulated reports for each task.
```
Continue immediately to step 7 — do not wait.

### 7. Update recent-events.md
Read the summarization rules from `${CLAUDE_SKILL_DIR}/recent-events-rules.md`. Append a new session entry following those rules exactly.

Use the session log you just wrote as your direct source — do not re-synthesize from scratch.

If partials were folded in, the `recent-events.md` entry should cover the entire session across all segments. For each partial found you are allowed to ADD up to one paragraph on the length limit for the `recent-events.md` entry (only do so if needed to be able to cover the session scope).

**Pending Arrival cleanup.** Read `recent-events.md` first. If it contains a `<!-- pending-arrival -->` HTML comment, remove the entire Pending Arrival block — from the comment line through the line immediately before the next `## Session ` heading (or EOF if no further sections).

### 8. Increment session counter
In `campaign-settings.md`:
* Update `Sessions Played`, incrementing it by 1.
* If an `Experimental` section exists in campaign-settings with in-file instructions, follow those as well.

> Companion progress is handled by Helper A — do not update companion-guide frontmatter here.

### 9. Update Campaign Stage
Read **Campaign Stage** from campaign-settings.
- **If sticky** (e.g., `Early (sticky)`): Skip — no calculation, no changes, no mention.
- **If One-Shot** (from campaign-pitch Campaign Length): Skip.
- **If not sticky and not One-Shot:**
  - Read **Campaign Length** from campaign-pitch and the just-incremented **Sessions Played**.
  - Look up the fixed session thresholds for stage transitions:

    | Campaign Length | Early → Mid | Mid → Late |
    |---|---|---|
    | Short | 2 | 8 |
    | Medium | 4 | 16 |
    | Long | 6 | 34 |

  - If Sessions Played ≥ the Late threshold and current stage is not Late, update to Late.
  - If Sessions Played ≥ the Mid threshold and current stage is Early, update to Mid.
  - If a stage transition occurs, update the Campaign Stage field in campaign-settings and note the change in the confirmation step.
  - If no threshold crossed, leave as-is.

### 10. Update GM Canon
If `gm-canon.md` exists, update it based on what happened this session:

> CRITICAL: The `gm-canon.md` file has in-file guidance on what is or isn't a thread and how to fill it, you must read the file to understand and adhere to those before proceeding.

- **Thread updates:** Add new breadcrumbs to existing threads (session-tagged, one sentence each). Update Direction if the thread's trajectory changed or more things have been designed or advanced about it. Update "Party knows" based on what was revealed or discovered. This applies to all thread types.
- **New threads:** If a new multi-module thread emerged this session, add it **unlabeled** with Direction, Party Knows, and initial breadcrumbs. Apply the inclusion/exclusion criteria in the file's header comments before adding. Do not assign labels (Core Arc, Secondary Arc, Companion).
- **Resolved threads:** If an **unlabeled** (emergent) thread fully resolved this session, remove it from the file entirely. **Labeled threads** (Core Arc, Secondary Arc, Companion) are never removed. If a labeled thread resolves, update its breadcrumbs to reflect the resolution but keep the entry.
- **World truths:** If a genuinely orphaned fact was established that doesn't fit in any other document (not npc-directory, not world-info, not companion-guide, not a thread breadcrumb, not player-known events), add as a one-liner. This should be rare.

Keep entries compact — this file is for the prep agent not human read, no fluff;

If `gm-canon.md` does not exist, skip this step.

If partials were folded in, cover the entire session across all segments.

### 11. Update GM Prep module statuses
If the campaign CLAUDE.md has a GM Prep manifest table, review each module's Status and update based on this session's events:

- Ready → Active if the party entered or began engaging with the module's content this session.
- Ready / Active → Completed if the party has moved past the module's scope and its content is exhausted or no longer relevant.
- Ready / Active → Suspended if the party left the module's area mid-way without completing it and moved on to something else.
- Active stays Active if the party is still in the module's scope and content remains.
- Ready stays Ready if the module has not loaded yet.
- Ready → Skipped if the party didn't engage with the module (e.g., took an alternative that avoided it entirely) and has seemingly moved on past its scope. Flag uncertain cases for the player.
- Leave Completed, Skipped, and Suspended statuses unchanged unless otherwise directed.

If the campaign has no GM Prep manifest, skip this step.

### 12. Converge with helpers
Wait for any background helpers spawned earlier to report back.

- **Helper A (`gm-evolution` session-end-synth)** — always spawned. Should report companion-guides updated (beats + progress) and `npc-directory.md` additions/updates.
- **Helper B (`gm-utility` post-persist pass)** — spawned in step 6 when there was work. Should report inventory updates (if Task 1 ran) and drift findings per party member (if Task 2 ran). If step 6 marked Helper B as "no work", skip waiting for it.
- If a helper reports a failure or a section it couldn't complete, note it — you'll relay this to the player.
- Do not proceed to cleanup or confirm until all spawned helpers have reported. If convergence takes unusually long, note the delay but continue to cleanup to avoid leaving partial files on disk.

### 13. Clean up partial files
If partial session files were found in step 2, **delete them**.

If no partials existed, skip this step.

### 14. Confirm to the player
1. State what was saved and list the file paths of all documents that were created or updated — session log, `recent-events.md`, `gm-canon.md`, `campaign-settings.md`, GM Prep manifest (if changed), plus what the helpers reported (Helper A: companion-guides, `npc-directory.md`; Helper B: `inventory.md` if Task 1 ran, drift findings if Task 2 ran). If partial files were folded in and deleted, mention this.
2. If Campaign Stage transitioned, mention the transition.
3. If a helper flagged anything for player review (unclear companion grading, etc.) or if any GM Prep module status was flagged as uncertain, surface those questions clearly.
4. **If Helper B's drift check produced any output** (synced changes or flags), relay it grouped by character. Syncs are informational (already applied). Flags are for player review — state them plainly; do not prompt for action.
5. Suggest the player start a new Claude Code conversation for the next session.
