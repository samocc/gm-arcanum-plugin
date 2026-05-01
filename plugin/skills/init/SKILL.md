---
name: init
description: Initialize a new GM Arcanum workspace — creates foundational files (README.md, directories, settings). Invoked by campaign-create as a pre-flight step.
user-invocable: true
disable-model-invocation: true
allowed-tools: Bash
---

The workspace root is: !`pwd`

# Initialize GM Arcanum Workspace

Ensure the current working directory has the foundational files needed for GM Arcanum gameplay. All files below are created in the current working directory — **not** the git repo root or the plugin source directory.

## Pre-flight Check

1. The workspace root has been resolved above — use that as the workspace to initialize.
2. Check if `.claude/settings.json` already exists and contains `"agent": "gm:gm-main"`.
   - If yes: workspace is already initialized. **Stop — no action needed.**

## Explain and Confirm

If the pre-flight check did not find an initialized workspace, explain to the player what will happen before proceeding:

```
**Welcome to GM Arcanum!** I'll set up your campaign workspace. Here's what I need to do:

> 1. **Configure permissions** — I'll configure workspace permissions — setting the permission mode and allowing the GM's background agents to read and write campaign files. You may see a few permission prompts during this setup — that's expected.
> 2. **Create workspace files** — A few starter files and directories for campaign management (`README.md`, `ref/`, `archive/`, etc.).

Everything stays local to this folder. Ready to proceed?
```

Wait for player confirmation before continuing.

## Configure Workspace Settings

Set up `.claude/settings.json` in the workspace so future sessions run smoothly. Read the file first if it exists, then merge the required settings without overwriting any existing configuration.

**Required settings:**
```json
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit(./**)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(echo *)",
      "Bash(node *)",
      "Bash(awk *)",
      "Bash(bash *)"
    ]
  },
  "agent": "gm:gm-main"
}
```

- **If `.claude/settings.json` does not exist:** create it with the settings above.
- **If `.claude/settings.json` already exists:** read it and merge:
  - Add the `permissions.defaultMode` field if not already present.
  - Merge `permissions.allow` entries from the required list into any existing `allow` array without duplicating entries that are already present. If no `allow` array exists, add the full list.
  - Do not remove or overwrite existing settings — merge only.

## Create Workspace Files

Create the following files in the current working directory. For each file, check whether it already exists and follow the conflict handling noted below.

### 1. `README.md`

Load `${CLAUDE_SKILL_DIR}/readme-template.md` for the starter content.

- **If `README.md` does not exist:** copy the starter content directly as `README.md`.
- **If `README.md` already exists:** skip — do not modify it.

### 2. Directories

```bash
mkdir -p ref archive
```

### 3. `.gitignore`

- **If `.gitignore` does not exist:** create it with the content below.
- **If `.gitignore` already exists:** ensure the entries below are present without duplicating existing lines.

```
.env
*.mp3
*.jsonl
**/.sessions/
cache/
debug/
```

### 4. `.env.example`

- **If `.env.example` does not exist:** create it with the content below.
- **If `.env.example` already exists:** skip — do not modify it.

```
# OpenAI API key for text-to-speech (optional — only needed for /gm:tts). Does not propagate to companion app, you must set the .env file in the companion app for that.
OPENAI_API_KEY=sk-your-key-here

# Optional: TTS model (tts-1 for speed, tts-1-hd for quality)
TTS_MODEL=tts-1-hd

# Optional: Voice (alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer)
TTS_VOICE=coral
```

### 5. `content-sources.md`

Load `${CLAUDE_SKILL_DIR}/content-sources.md` for the starter content.

- **If `content-sources.md` does not exist:** copy the starter content directly as `content-sources.md`.
- **If `content-sources.md` already exists:** skip — do not modify it.

## Confirmation

After processing all files, briefly confirm to the player what was done:

> **Workspace initialized.** Permissions configured. Created: [list files/dirs created]. Skipped (already existed): [list files skipped].
>
> Run `/gm:campaign-create` to start your first campaign.
