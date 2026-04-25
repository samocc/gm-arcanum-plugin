#!/bin/bash
# GM Arcanum — Hook: Resolve >> roll lines in player messages
# Fires on UserPromptSubmit. Reads prompt from stdin JSON,
# checks for >> roll markers, resolves dice, injects results
# as additionalContext. Exits cleanly with no output if no rolls found.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLL_SCRIPT="${SCRIPT_DIR}/roll.sh"

# Read hook input from stdin
INPUT="$(cat)"

# Extract prompt from JSON using node (jq not always available)
PROMPT="$(node -e "
  const input = JSON.parse(process.argv[1]);
  process.stdout.write(input.prompt || '');
" "$INPUT" 2>/dev/null)" || exit 0

# Quick exit if no >> lines — minimal overhead on normal messages
if ! echo "$PROMPT" | grep -q '^>>'; then
  exit 0
fi

# Resolve rolls using the roll script (handles macro expansion internally)
# multi-roll mode
RESULTS="$(echo "$PROMPT" | bash "$ROLL_SCRIPT" 2>/dev/null)" || true

# If no results, exit cleanly
if [[ -z "$RESULTS" ]]; then
  exit 0
fi

# Inject resolved rolls: additionalContext for Claude, systemMessage for the player
node -e "
  const results = process.argv[1];
  const output = {
    systemMessage: '\\n' + results,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: results
    }
  };
  process.stdout.write(JSON.stringify(output));
" "$RESULTS"
