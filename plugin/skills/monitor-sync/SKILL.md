---
name: monitor-sync
description: Arm the companion app input Monitor for the current session. Invoked by the companion app on reconnect; also available as a manual recovery path.
user-invocable: true
allowed-tools: Bash, Monitor
---

# Arm Companion Input Monitor

When this skill is invoked:

1. Ensure the transcript exists (idempotent):
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/transcript-init.js ${CLAUDE_SESSION_ID}
   ```

2. Arm a persistent Monitor on the inbox (`persistent: true`):
   ```
   n=0; tail -n 0 -F "${GM_ARCANUM_ACTIVE_CAMPAIGN}/.sessions/${CLAUDE_SESSION_ID}/inbox.jsonl" | while IFS= read -r line; do n=$((n+1)); if [ ${#line} -gt 495 ]; then printf '[new event on line %d of inbox.jsonl — read for full payload]\n' "$n"; else printf '%s\n' "$line"; fi; done
   ```
   `-n 0` is intentional — mid-session re-arm should not replay already-processed events.

3. End your turn with the event marker (no other text needed):
   >> **Monitor Ready**
