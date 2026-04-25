#!/bin/bash
# GM Arcanum TTS — Text-to-Speech via OpenAI API
# Called by the /tts skill's sub-agent

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve workspace root by walking up from CWD to find CLAUDE.md
WORKSPACE_ROOT="$PWD"
while [[ "$WORKSPACE_ROOT" != "/" && ! -f "$WORKSPACE_ROOT/CLAUDE.md" ]]; do
    WORKSPACE_ROOT="$(dirname "$WORKSPACE_ROOT")"
done
if [[ ! -f "$WORKSPACE_ROOT/CLAUDE.md" ]]; then
    echo "ERROR: Could not find workspace root (no CLAUDE.md found)" >&2
    exit 1
fi

TTS_CACHE="$WORKSPACE_ROOT/cache"
mkdir -p "$TTS_CACHE"

INPUT_FILE="${1:-$TTS_CACHE/tts-input.txt}"
OUTPUT_FILE="$TTS_CACHE/tts-output.mp3"

# --- Load .env ---
# Walk up from CWD looking for .env, then check ~/.claude/.env
find_env() {
    local dir="$PWD"
    while [[ "$dir" != "/" && "$dir" != "." ]]; do
        if [[ -f "$dir/.env" ]]; then
            echo "$dir/.env"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    if [[ -f "$HOME/.claude/.env" ]]; then
        echo "$HOME/.claude/.env"
        return 0
    fi
    return 1
}

ENV_FILE=$(find_env) || { echo "ERROR: No .env file found. Create one with OPENAI_API_KEY=sk-..." >&2; exit 1; }
set -a
source "$ENV_FILE"
set +a

# --- Validate ---
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    echo "ERROR: OPENAI_API_KEY not set in $ENV_FILE" >&2
    exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "ERROR: Input file not found: $INPUT_FILE" >&2
    exit 1
fi

INPUT_TEXT=$(cat "$INPUT_FILE")
CHAR_COUNT=${#INPUT_TEXT}

if [[ $CHAR_COUNT -eq 0 ]]; then
    echo "ERROR: Input file is empty" >&2
    exit 1
fi

if [[ $CHAR_COUNT -gt 4096 ]]; then
    echo "WARNING: Input is $CHAR_COUNT chars (limit 4096). Truncating." >&2
    INPUT_TEXT="${INPUT_TEXT:0:4096}"
fi

# --- Config ---
TTS_MODEL="${TTS_MODEL:-tts-1}"
TTS_VOICE="${TTS_VOICE:-coral}"

# --- API Call ---
echo "Generating audio (${#INPUT_TEXT} chars, model=$TTS_MODEL, voice=$TTS_VOICE)..."

# Build JSON payload via node to preserve UTF-8 encoding end-to-end.
# Two mingw/Git-for-Windows issues forced this approach:
#   1. node resolves /tmp/ differently than Git Bash — use cygpath -m for a mixed-mode path
#   2. curl -d with inline UTF-8 (em dashes, etc.) causes 400 parse errors — write payload
#      to a temp file and use curl -d @file instead
NODE_INPUT_PATH=$(cygpath -m "$INPUT_FILE" 2>/dev/null || echo "$INPUT_FILE")
PAYLOAD_FILE="${INPUT_FILE}.json"
NODE_PAYLOAD_PATH=$(cygpath -m "$PAYLOAD_FILE" 2>/dev/null || echo "$PAYLOAD_FILE")
node -e "
const fs = require('fs');
const input = fs.readFileSync('$NODE_INPUT_PATH', 'utf8');
const payload = JSON.stringify({model: '$TTS_MODEL', input: input, voice: '$TTS_VOICE', response_format: 'mp3'});
fs.writeFileSync('$NODE_PAYLOAD_PATH', payload);
"

# Note: curl -w "%{http_code}" causes exit code 43 on Git for Windows curl (8.8.0 mingw32).
# Instead, check curl exit code directly and validate the output file.
if ! curl -s -o "$OUTPUT_FILE" \
    "https://api.openai.com/v1/audio/speech" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$PAYLOAD_FILE"; then
    echo "ERROR: curl request failed" >&2
    rm -f "$OUTPUT_FILE" "$PAYLOAD_FILE"
    exit 1
fi
rm -f "$PAYLOAD_FILE"

if [[ ! -f "$OUTPUT_FILE" ]]; then
    echo "ERROR: No output file produced" >&2
    exit 1
fi

FILE_SIZE=$(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE" 2>/dev/null || echo "0")

# API error responses are small JSON; valid audio is always larger
if [[ "$FILE_SIZE" -lt 1000 ]]; then
    if head -c 1 "$OUTPUT_FILE" | grep -q '{'; then
        echo "ERROR: API returned an error:" >&2
        cat "$OUTPUT_FILE" >&2
        rm -f "$OUTPUT_FILE"
        exit 1
    fi
fi

if [[ "$FILE_SIZE" -lt 100 ]]; then
    echo "ERROR: Output file too small ($FILE_SIZE bytes)" >&2
    rm -f "$OUTPUT_FILE"
    exit 1
fi

echo "Audio generated ($FILE_SIZE bytes). Playing..."

# --- Playback (cross-platform) ---
# shellcheck source=play.sh
source "$SCRIPT_DIR/play.sh"
play_audio "$OUTPUT_FILE"

echo "Playback complete."

# --- Cleanup ---
rm -f "$INPUT_FILE"
