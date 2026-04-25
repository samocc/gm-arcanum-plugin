---
name: test-access
description: Diagnostic skill for testing file access patterns — @ imports, backtick references, and tool permissions across skill directory, cross-skill directory, and workspace. Never invoke this skill outside of testing session
user-invocable: false
---

# Test Access Task

When invoked, work through **every** test section below and produce a structured report at the end. Do not skip any test.

For each test, report one of these outcomes:

- **pre-loaded** — the file's content was already present in your context when this skill was invoked (no tool call needed). Quote the identifier line or first heading to prove it.
- **loaded on attempt N** — you had to issue a tool call to get the content. N is the total number of attempts, counting any that returned errors (wrong path, permission denied, file not found, etc.) before succeeding. Attempt 1 means it worked on the first try.
- **unable to load after N attempts** — you tried N times and could not retrieve the content. Describe the error(s) verbatim.
- **success** / **denied** / **error** — for write and tool-specific tests.

---

## Section 1: @ Import (Pre-Loading)

Test whether `@` import syntax auto-loads file content into context.

### Test 1A — Internal file via @ import

@${CLAUDE_SKILL_DIR}/template-preload.md

Report whether template-preload.md content (identifier: PRELOAD-ACCESS-4M7) is already present in your context.

### Test 1B — Cross-skill file via @ import (relative path)

@${CLAUDE_SKILL_DIR}/../doc-templates/character-sheet.md

Report whether character-sheet.md content from the doc-templates skill is already present in your context.

---

## Section 2: Backtick Reference (On-Demand Read)

Test whether backtick-referenced files can be read via tool calls.

### Test 2A — Internal file via backtick reference

Read the file at `${CLAUDE_SKILL_DIR}/template-ondemand.md` and report its loading status.

### Test 2B — Cross-skill file via backtick reference (relative path)

Read the file at `${CLAUDE_SKILL_DIR}/../doc-templates/companion-guide.md` and report its loading status.

---

## Section 3: Read Tool — By Directory

Test Read tool access across different directory scopes.

### Test 3A — Read own skill file

Use the Read tool to read `${CLAUDE_SKILL_DIR}/template-ondemand.md`. Report outcome.

### Test 3B — Read cross-skill file

Use the Read tool to read `${CLAUDE_SKILL_DIR}/../doc-templates/inventory.md`. Report outcome.

### Test 3C — Read plugin root file

Use the Read tool to read `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`. Report outcome.

### Test 3D — Read workspace file

Use the Read tool to read `content-sources.md` from the workspace root. Report outcome.

---

## Section 4: Bash Tool — By Directory

Test Bash tool (cat) access across different directory scopes.

**IMPORTANT: Run these tests ONE AT A TIME, sequentially.** Do NOT run them in parallel. A denial on one test must not cancel or affect the others — each test must execute independently so we get clean results for every directory scope.

### Test 4A — Bash cat own skill file

Run `cat ${CLAUDE_SKILL_DIR}/template-ondemand.md` via Bash. Report outcome. **Wait for this result before proceeding to 4B.**

### Test 4B — Bash cat cross-skill file

Run `cat ${CLAUDE_SKILL_DIR}/../doc-templates/inventory.md` via Bash. Report outcome. **Wait for this result before proceeding to 4C.**

### Test 4C — Bash cat plugin root file

Run `cat ${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` via Bash. Report outcome. **Wait for this result before proceeding to 4D.**

### Test 4D — Bash cat workspace file

Run `cat CLAUDE.md` via Bash. Report outcome.

---

## Section 5: Glob Tool — By Directory

Test Glob tool access across different directory scopes.

### Test 5A — Glob own skill directory

Use Glob to list files matching `${CLAUDE_SKILL_DIR}/*.md`. Report outcome (list files found or error).

### Test 5B — Glob cross-skill directory

Use Glob to list files matching `${CLAUDE_SKILL_DIR}/../doc-templates/*.md`. Report outcome.

### Test 5C — Glob plugin skills directory

Use Glob to list directories matching `${CLAUDE_PLUGIN_ROOT}/skills/*/`. Report outcome.

### Test 5D — Glob workspace directory

Use Glob to list files matching `*.md` in the workspace root. Report outcome.

---

## Section 6: Grep Tool — By Directory

Test Grep tool access across different directory scopes.

### Test 6A — Grep own skill directory

Use Grep to search for `ONDEMAND-ACCESS` in `${CLAUDE_SKILL_DIR}/`. Report outcome (match found or error).

### Test 6B — Grep cross-skill directory

Use Grep to search for `companion` in `${CLAUDE_SKILL_DIR}/../doc-templates/`. Report outcome.

### Test 6C — Grep plugin root

Use Grep to search for `gm` in `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/`. Report outcome.

### Test 6D — Grep workspace directory

Use Grep to search for `Campaign` in the workspace root. Report outcome.

---

## Section 7: Write Tool — By Directory

Test Write tool access. Write a small test file, then clean it up.

### Test 7A — Write to workspace directory

Write a file `debug/test-access-probe.txt` in the workspace root with content "access test probe". Report outcome (success or error). If successful, delete it afterwards.

### Test 7B — Write to plugin directory

Attempt to write a file `${CLAUDE_SKILL_DIR}/test-probe.txt` with content "access test probe". Report outcome (success or error). If successful, delete it afterwards.

---

## Report Format

Present results in a summary table.

**Table 1 — Pre-Loading & On-Demand**

| Test | Description | Outcome | Detail |
|---|---|---|---|
| 1A | @ import — own skill | (pre-loaded / not pre-loaded) | identifier or absence |
| 1B | @ import — cross-skill | (pre-loaded / not pre-loaded) | heading or absence |
| 2A | backtick ref — own skill | (loaded on N / unable after N) | identifier or error |
| 2B | backtick ref — cross-skill | (loaded on N / unable after N) | heading or error |

**Table 2 — Tool Access by Directory**

| Test | Tool | Target | Outcome |
|---|---|---|---|
| 3A | Read | own skill dir | (loaded on N / unable) |
| 3B | Read | cross-skill dir | (loaded on N / unable) |
| 3C | Read | plugin root | (loaded on N / unable) |
| 3D | Read | workspace | (loaded on N / unable) |
| 4A | Bash | own skill dir | (success / denied) |
| 4B | Bash | cross-skill dir | (success / denied) |
| 4C | Bash | plugin root | (success / denied) |
| 4D | Bash | workspace | (success / denied) |
| 5A | Glob | own skill dir | (N files / denied) |
| 5B | Glob | cross-skill dir | (N files / denied) |
| 5C | Glob | plugin skills | (N dirs / denied) |
| 5D | Glob | workspace | (N files / denied) |
| 6A | Grep | own skill dir | (match / denied) |
| 6B | Grep | cross-skill dir | (match / denied) |
| 6C | Grep | plugin root | (match / denied) |
| 6D | Grep | workspace | (match / denied) |
| 7A | Write | workspace | (success / denied) |
| 7B | Write | plugin dir | (success / denied) |

After both tables, add a **Summary** section with an access matrix showing which tool + directory combinations are allowed vs denied.

---

## Output

After producing the full report (tables + summary), **write it to a file**:

1. Determine the workspace root (the directory containing `CLAUDE.md`).
2. Create the `debug/` directory if it doesn't exist: `mkdir -p [workspace-root]/debug`
3. Write the complete report as markdown to `[workspace-root]/debug/test-access-report.md`.
4. Confirm the file was written and its path.
