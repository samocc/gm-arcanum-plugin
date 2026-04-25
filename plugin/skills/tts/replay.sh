#!/bin/bash
# GM Arcanum TTS — Replay last audio
# Plays the most recently generated TTS audio without making an API call.

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
OUTPUT_FILE="$TTS_CACHE/tts-output.mp3"

if [[ ! -f "$OUTPUT_FILE" ]]; then
    echo "ERROR: No audio file found. Run /tts first to generate audio." >&2
    exit 1
fi

FILE_SIZE=$(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE" 2>/dev/null || echo "0")

if [[ "$FILE_SIZE" -lt 100 ]]; then
    echo "ERROR: Audio file too small ($FILE_SIZE bytes) — may be corrupted." >&2
    exit 1
fi

echo "Replaying audio ($FILE_SIZE bytes)..."

# --- Playback (cross-platform) ---
# shellcheck source=play.sh
source "$SCRIPT_DIR/play.sh"
play_audio "$OUTPUT_FILE"

echo "Playback complete."
