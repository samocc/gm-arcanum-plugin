---
name: doc-templates
description: Shared document templates and section-by-section writing standards for campaign documents. Provides the single source of truth for what each document type should look like — structure, length targets, content boundaries, and style rules. Load the template file relevant to your task.
user-invocable: false
---

# Document Templates

This skill provides shared writing standards and structural templates for campaign documents. Multiple agents and skills consume these references to ensure consistent document quality.

**Usage:** Read the template file relevant to your current task. Each file contains section-by-section writing standards followed by the document structure template.

| Document Type | File | When to Load |
|---|---|---|
| Companion Guide | `${CLAUDE_SKILL_DIR}/companion-guide.md` | Creating or modifying `companion-guide.md` documents |
| Character Sheet | `${CLAUDE_SKILL_DIR}/character-sheet.md` | Creating or modifying `character-sheet.md` documents |
| Campaign Summary | `${CLAUDE_SKILL_DIR}/campaign-summary.md` | Creating or modifying `campaign-summary.md` documents |
| Character Info | `${CLAUDE_SKILL_DIR}/character-info.md` | Creating or modifying `character-info.md` documents |
| Campaign Pitch | `${CLAUDE_SKILL_DIR}/campaign-pitch.md` | Creating or modifying `campaign-pitch.md` documents |
| World Info | `${CLAUDE_SKILL_DIR}/world-info.md` | Creating or modifying `world-info.md` documents |
| Campaign Settings | `${CLAUDE_SKILL_DIR}/campaign-settings.md` | Creating or modifying `campaign-settings.md` documents |
| GM Canon | `${CLAUDE_SKILL_DIR}/gm-canon.md` | Creating or modifying `gm-canon.md` documents |
| Inventory | `${CLAUDE_SKILL_DIR}/inventory.md` | Creating or modifying `inventory.md` documents |
| Campaign Manifest | `${CLAUDE_SKILL_DIR}/campaign-manifest.md` | Creating campaign CLAUDE.md (the document index) |
| NPC Directory | `${CLAUDE_SKILL_DIR}/npc-directory.md` | Creating `npc-directory.md` (starter file — copy directly) |
| GM Directives (default) | `${CLAUDE_SKILL_DIR}/gm-directives-default.md` | Creating `gm-directives.md` during campaign creation (default persona) |
| GM Directives (beginner) | `${CLAUDE_SKILL_DIR}/gm-directives-beginner.md` | Creating `gm-directives.md` during campaign creation (beginner persona — selected when player is new to D&D) |
| Status JSON | `${CLAUDE_SKILL_DIR}/status-json-template.md` | Schema, sync behavior, and creation blueprint for a character's `status.json` (party status file — HP, spell slots, class resources, conditions). Field Reference is the canonical per-field table; Creation section has the blueprint for fresh files. |
| Status Markers | `${CLAUDE_SKILL_DIR}/status-markers.md` | Mutation vocabulary for `>>` markers (HP / AC / currency / concentration / resources / conditions / rest macros / trailing notes / direct-edit escape hatch). Shared reference `@`-imported by narrative, combat, and meta session skills. |
