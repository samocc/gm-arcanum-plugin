---
name: test-env
description: Diagnostic skill for testing variable expansion, shell preprocessing, and environment variable access. Never invoke this skill outside of testing session
allowed-tools: Bash
user-invocable: false
---

# Test Env Skill

When invoked, work through **every** test section below and produce a structured report at the end. Do not skip any test.

---

## Section 1: CLAUDE_SKILL_DIR Expansion

For each labeled test line, report **exactly and verbatim** what you see — copy the text character-for-character. This tests whether `${CLAUDE_SKILL_DIR}` was expanded to a real path or left as a literal string.

### Test 1A — Raw inline, no formatting

TEST-1A: The skill directory is ${CLAUDE_SKILL_DIR}

### Test 1B — Inside single backticks

TEST-1B: The skill directory is `${CLAUDE_SKILL_DIR}`

### Test 1C — Inside a fenced code block

~~~
TEST-1C: ${CLAUDE_SKILL_DIR}
~~~

### Test 1D — With trailing path, raw inline

TEST-1D: ${CLAUDE_SKILL_DIR}/template-alpha.md

### Test 1E — With trailing path, inside backticks

TEST-1E: `${CLAUDE_SKILL_DIR}/template-alpha.md`

### Test 1F — No braces, raw inline

TEST-1F: The skill directory is $CLAUDE_SKILL_DIR

### Test 1G — Inside a bash instruction

TEST-1G: Run `ls $CLAUDE_SKILL_DIR` to list the skill's files.

### Test 1H — Double-quoted

TEST-1H: "${CLAUDE_SKILL_DIR}"

### Test 1I — No braces, with trailing path

TEST-1I: $CLAUDE_SKILL_DIR/template-alpha.md

---

## Section 2: CLAUDE_PLUGIN_ROOT & CLAUDE_PLUGIN_DATA

Same rules — report verbatim what you see.

### Test 2A — CLAUDE_PLUGIN_ROOT raw inline

TEST-2A: The plugin root is ${CLAUDE_PLUGIN_ROOT}

### Test 2B — CLAUDE_PLUGIN_ROOT inside backticks

TEST-2B: The plugin root is `${CLAUDE_PLUGIN_ROOT}`

### Test 2C — CLAUDE_PLUGIN_ROOT no braces, raw inline

TEST-2C: The plugin root is $CLAUDE_PLUGIN_ROOT

### Test 2D — CLAUDE_PLUGIN_ROOT with path, in backticks

TEST-2D: `${CLAUDE_PLUGIN_ROOT}/skills/doc-templates/companion-guide.md`

### Test 2E — CLAUDE_PLUGIN_DATA raw inline

TEST-2E: The plugin data directory is ${CLAUDE_PLUGIN_DATA}

### Test 2F — CLAUDE_PLUGIN_DATA inside backticks

TEST-2F: The plugin data directory is `${CLAUDE_PLUGIN_DATA}`

### Test 2G — CLAUDE_PLUGIN_DATA no braces, raw inline

TEST-2G: The plugin data directory is $CLAUDE_PLUGIN_DATA

---

## Section 3: Non-Plugin Variables

Test whether system or workspace env vars are expanded by the template engine.

### Test 3A — $PWD raw inline

TEST-3A: The current directory is $PWD

### Test 3B — ${PWD} with braces, raw inline

TEST-3B: The current directory is ${PWD}

### Test 3C — $HOME raw inline

TEST-3C: The home directory is $HOME

### Test 3D — ${HOME} with braces, raw inline

TEST-3D: The home directory is ${HOME}

---

## Section 4: Workspace-Defined Environment Variables

Workspaces can define custom env vars in `.claude/settings.json` under the `"env"` key. Test whether these are expanded by the template engine.

**Prerequisite:** The workspace should have in `.claude/settings.json`:
```json
"env": {
  "GM_ARCANUM_DEBUG": "1",
  "TEST_CUSTOM_VAR": "hello-from-settings"
}
```

### Test 4A — GM_ARCANUM_DEBUG with braces

TEST-4A: Debug mode is ${GM_ARCANUM_DEBUG}

### Test 4B — GM_ARCANUM_DEBUG no braces

TEST-4B: Debug mode is $GM_ARCANUM_DEBUG

### Test 4C — TEST_CUSTOM_VAR with braces

TEST-4C: Custom var is ${TEST_CUSTOM_VAR}

### Test 4D — TEST_CUSTOM_VAR no braces

TEST-4D: Custom var is $TEST_CUSTOM_VAR

---

## Section 5: Shell Preprocessing

Skills support a shell preprocessing syntax that runs commands at load time and injects stdout into the content before Claude sees it. Report verbatim what you see on each test line — if preprocessing worked, you will see the command output as plain text; if not, you may see the raw preprocessing directive.

### Test 5A — pwd

TEST-5A: The working directory is !`pwd`

### Test 5B — Workspace CLAUDE.md content

TEST-5B: The workspace CLAUDE.md says !`cat CLAUDE.md`

### Test 5C — CLAUDE_SKILL_DIR in shell (braces — template expands first)

TEST-5C: Shell sees CLAUDE_SKILL_DIR as !`echo ${CLAUDE_SKILL_DIR}`

### Test 5D — CLAUDE_PLUGIN_ROOT in shell (braces — template expands first)

TEST-5D: Shell sees CLAUDE_PLUGIN_ROOT as !`echo ${CLAUDE_PLUGIN_ROOT}`

### Test 5E — CLAUDE_PLUGIN_DATA in shell (braces — template expands first)

TEST-5E: Shell sees CLAUDE_PLUGIN_DATA as !`echo ${CLAUDE_PLUGIN_DATA}`

### Test 5F — GM_ARCANUM_DEBUG in shell (workspace env var)

TEST-5F: Shell sees GM_ARCANUM_DEBUG as !`echo ${GM_ARCANUM_DEBUG}`

### Test 5G — TEST_CUSTOM_VAR in shell (workspace env var)

TEST-5G: Shell sees TEST_CUSTOM_VAR as !`echo ${TEST_CUSTOM_VAR}`

### Test 5H — ls skill directory

TEST-5H: Skill directory contains !`ls ${CLAUDE_SKILL_DIR}`

### Test 5I — Combining preprocessing with variable expansion

TEST-5I: pwd=!`pwd` skilldir=${CLAUDE_SKILL_DIR}

---

## Report Format

Present all results in two tables.

**Table 1 — Variable Expansion**

| Test | Context | Verbatim Text Seen |
|---|---|---|
| 1A | SKILL_DIR raw | (exact text) |
| 1B | SKILL_DIR backticks | (exact text) |
| 1C | SKILL_DIR code block | (exact text) |
| 1D | SKILL_DIR raw + path | (exact text) |
| 1E | SKILL_DIR backticks + path | (exact text) |
| 1F | SKILL_DIR no braces | (exact text) |
| 1G | SKILL_DIR bash instr | (exact text) |
| 1H | SKILL_DIR double-quoted | (exact text) |
| 1I | SKILL_DIR no braces + path | (exact text) |
| 2A | PLUGIN_ROOT raw | (exact text) |
| 2B | PLUGIN_ROOT backticks | (exact text) |
| 2C | PLUGIN_ROOT no braces | (exact text) |
| 2D | PLUGIN_ROOT backticks + path | (exact text) |
| 2E | PLUGIN_DATA raw | (exact text) |
| 2F | PLUGIN_DATA backticks | (exact text) |
| 2G | PLUGIN_DATA no braces | (exact text) |
| 3A | $PWD no braces | (exact text) |
| 3B | ${PWD} braces | (exact text) |
| 3C | $HOME no braces | (exact text) |
| 3D | ${HOME} braces | (exact text) |
| 4A | GM_DEBUG braces | (exact text) |
| 4B | GM_DEBUG no braces | (exact text) |
| 4C | CUSTOM_VAR braces | (exact text) |
| 4D | CUSTOM_VAR no braces | (exact text) |

**Table 2 — Shell Preprocessing**

| Test | Command | Verbatim Text Seen |
|---|---|---|
| 5A | pwd | (exact text) |
| 5B | cat CLAUDE.md | (exact text) |
| 5C | echo CLAUDE_SKILL_DIR | (exact text) |
| 5D | echo CLAUDE_PLUGIN_ROOT | (exact text) |
| 5E | echo CLAUDE_PLUGIN_DATA | (exact text) |
| 5F | echo GM_ARCANUM_DEBUG | (exact text) |
| 5G | echo TEST_CUSTOM_VAR | (exact text) |
| 5H | ls skill dir | (exact text) |
| 5I | pwd + SKILL_DIR combo | (exact text) |

After both tables, add a **Summary** section noting any surprises or patterns observed.

---

## Output

After producing the full report (tables + summary), **write it to a file**:

1. Determine the workspace root (the directory containing `CLAUDE.md`).
2. Create the `debug/` directory if it doesn't exist: `mkdir -p [workspace-root]/debug`
3. Write the complete report as markdown to `[workspace-root]/debug/test-env-report.md`.
4. Confirm the file was written and its path.
