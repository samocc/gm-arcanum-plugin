---
name: test-session
description: Dev testing session, only invoke on explicit request.
allowed-tools: Bash
user-invocable: false
---

1. **Compile party status.** Run:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/party-status-init.js ${CLAUDE_SESSION_ID}
   ```
   Compiles per-character status files into the session working copy (same compile behavior as narrative).
   * If the script prints **"armed"**: the compiled status file is available at `.sessions/${CLAUDE_SESSION_ID}/party-status.json`.
   * If the script prints **"no-status"**: party status tracking is not initialized; continue normally.

2. **Respond with session init markers and confirmation:**

   ```
   > PRIMARY

   >> **Session Mode: test**
   >> **Party Sync**

   Test session online. Awaiting command.
   ```

   The two `>>` markers are event markers (see gm-main's Status Markers — Event Register). The Stop hook catches them and dispatches the corresponding display events (session_mode + party_vitals state) from unsandboxed context. Include them verbatim in your first response; don't elaborate or add narration around them.

**Response shape:** Test-session replies are single canonical responses per gm-main's Response Protocol — every reply opens with `> PRIMARY`, then event markers (first turn only), then a short confirmation or result line. Pre-opener text is discarded scratch space. Do not segment. Tool calls happen before any text.
