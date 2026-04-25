# README — Starter File

Copy the starter content as the workspace's `README.md`. No modifications needed.

> ⚠️ **LEGACY BLOCK** — Content in the `## Starter Content` section below was written pre-companion app
> and has not been reviewed for the current release. Review and update before shipping.
> Content below the `---` divider inside the markdown block is current.

---

## Starter Content

```markdown
# GM Plugin

An AI Game Master for tabletop RPGs, built as a [Claude Code](https://claude.com/claude-code) plugin.

GM Arcanum runs full tabletop RPG campaigns — narrative exploration, NPC interaction, skill checks, turn-based combat, companion management, and campaign progression — entirely through Claude Code's native capabilities.

## How It Works

Instead of a traditional web application, GM Arcanum uses Claude Code as its runtime:

- **Campaign state** is stored as local markdown files — campaign settings, character sheets, companion guides, session logs, and more
- **The GM** runs as a Claude Code agent with specialized skills for gameplay, combat, session management, and campaign maintenance
- **The UI** is very portable, only requires a combination of any markdown viewer/editor and a Claude Code chat interface. Some examples of these can be:
  - *(Best for devs)* VS Code + Claude Code plugin for VS Code.
  - *(Best for non-devs)* Obsidian + Claude Code desktop app.
- **Dice rolls** use bash for genuine randomness (transparent and verifiable)

## Getting Started

### Prerequisites

- [Claude Code](https://claude.com/claude-code) installed

### Installation

1. Create a local directory for your ttrpg adventures
2. Open a Claude Code session on directory then Install the `gm` plugin:
   ```
   /plugin install gm
   ```
3. Create your first campaign:
   ```
   /gm:campaign-create
   ```

### Playing

Start a new Claude Code conversation in your workspace and ask to start a new narrative session or continue a session. The GM loads automatically and greets you with a session recap. Type your character's actions and the story unfolds.

**Session types:**
- **Narrative** — Exploration, roleplay, NPC interaction
- **Combat** — Turn-based encounter execution (runs in a separate session to protect narrative context)
- **MetaGM** — Between-sessions maintenance (level-ups, campaign configuration)

## Features

- Full narrative gameplay with skill checks, NPC dialog, and companion management
- Turn-based combat with multiple playstyles supported
- Module prep system for GM-quality content generation
- Session management with partial saves and session logs
- Campaign evolution — companion RP growth, campaign summary folding, level-ups
- Companion recruitment with two-step approval flow
- Text-to-speech for narrative immersion (requires OpenAI API key)
- Customizable GM style via `gm-directives.md`

---

## Workspace Permissions

When you run `/gm:init`, the following tool permissions are configured in your workspace's `.claude/settings.json`. Here's what each one does and why the GM needs it:

| Permission | Purpose |
|---|---|
| `Read`, `Glob`, `Grep` | Read campaign files, search session logs, find character sheets |
| `Edit(./**)` | Write campaign files — scoped to your workspace only, plugin directory is protected |
| `Bash(cat *)`, `Bash(ls *)` | Read file contents, list directories |
| `Bash(mkdir *)` | Create campaign and session directories |
| `Bash(echo *)` | Pipe data between commands |
| `Bash(node *)` | Run the GM's built-in scripts for session transcript tracking, party status updates, and companion app sync |
| `Bash(awk *)` | Generate the combat dice pool for fair, genuine randomness |
| `Bash(bash *)` | Run dice resolution when processing rolls from the companion app |

All tool calls are visible in the Claude Code interface — these permissions remove the confirmation prompt, they don't hide what the GM is doing.

## License

(Pending)
```
