---
name: tts-replay
description: Replay the last TTS audio
disable-model-invocation: true
allowed-tools: Bash
---

# Replay Last Audio

When the player invokes `/gm:tts-replay`, do the following:

1. Run the replay script:
   ```
   bash ${CLAUDE_PLUGIN_ROOT}/skills/tts/replay.sh
   ```

2. Briefly confirm: "Audio replayed." or report any error. Nothing more.
