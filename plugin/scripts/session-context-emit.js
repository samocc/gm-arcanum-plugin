#!/usr/bin/env node

/**
 * session-context-emit.js — SessionStart hook, injects context for gm-main
 *
 * Agent files (unlike skill files) don't execute `!`cmd`` inline, so
 * gm-main.md can't resolve the active campaign path or session_id at load
 * time. This hook plugs that gap by emitting `additionalContext` on stdout,
 * which Claude Code merges into the session context before the first model
 * turn. The GM then sees the resolved values in its context without having
 * to run bash each turn.
 *
 * Output shape (JSON on stdout):
 *
 *   {
 *     "hookSpecificOutput": {
 *       "hookEventName": "SessionStart",
 *       "additionalContext": "..."
 *     }
 *   }
 *
 * If the active campaign isn't set, a short context line is still emitted
 * so the GM can route to `/gm:campaign-create` instead of silently assuming
 * a campaign exists.
 *
 * Runs in the SessionStart hook chain after transcript-init.js and after
 * display-session-marker.js — ordering doesn't matter for this output since
 * it doesn't depend on or affect any file.
 */

const emit = require("./display-emit");

async function main() {
  const hookInput = await emit.readHookInput();
  if (!hookInput) return;

  const sessionId = hookInput.session_id || "";
  const campaignPath = emit.getActiveCampaign();

  let contextBody;
  if (campaignPath) {
    contextBody =
      `**Active campaign directory:** ${campaignPath}\n` +
      `**Claude Code session id:** ${sessionId}`;
  } else {
    contextBody =
      "**No active campaign.** `GM_ARCANUM_ACTIVE_CAMPAIGN` is unset — " +
      "suggest `/gm:campaign-create` per routing rule 1.";
  }

  const payload = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: contextBody,
    },
  };

  process.stdout.write(JSON.stringify(payload));
}

emit.safeRun(main);
