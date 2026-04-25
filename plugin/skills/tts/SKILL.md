---
name: tts
description: Read the last GM narrative aloud using text-to-speech
disable-model-invocation: true
allowed-tools: Bash
---

The workspace root is: !`pwd`

# Text-to-Speech — Read Last Narrative Aloud

When the player invokes `/gm:tts`, do the following:

1. **Identify your most recent narrative response** in the conversation above this message.

2. **Write the raw response verbatim** to `[workspace-root]/cache/tts-raw.txt` using a bash heredoc. Use a single-quoted delimiter to prevent shell expansion:
   ```bash
   mkdir -p [workspace-root]/cache
   cat << 'TTSEOF' > [workspace-root]/cache/tts-raw.txt
   <paste full last narrative response here verbatim>
   TTSEOF
   ```

3. **Clean and play** in a single bash call:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/tts-clean.js < [workspace-root]/cache/tts-raw.txt > [workspace-root]/cache/tts-input.txt && bash ${CLAUDE_PLUGIN_ROOT}/skills/tts/tts.sh [workspace-root]/cache/tts-input.txt
   ```
   (`tts-raw.txt` can be left behind — `tts.sh` cleans up `tts-input.txt` on success.)

4. **Report briefly** — "Audio played." or the error. Nothing more.
