#!/usr/bin/env node

/**
 * display-session-marker.js — SessionStart / SessionEnd / PreCompact hook
 *
 * Wired to three Claude Code lifecycle hooks. Reads `hook_event_name` from
 * stdin JSON and emits the appropriate v1 event to the per-session transcript
 * file (.sessions/{session_id}/transcript.jsonl). Gates on file existence.
 *
 * Event mapping:
 *   SessionStart → session_start { source }
 *   SessionEnd   → session_end   { reason }
 *   PreCompact   → compact       { trigger }
 *
 * Ordering: this script runs after transcript-init.js in the SessionStart
 * hook chain (see hooks.json). By the time we fire, transcript-init.js has
 * already created the per-session directory and emitted transcript_start at
 * seq=0, so the session_start event lands at seq=1.
 *
 * Gate: if no active campaign is set or transcript-init failed for any
 * reason, the transcript file won't exist — we silently no-op.
 *
 * Claude Code may fire session_start / session_end many times per session_id
 * in any order (user closes and reopens the window, VS Code restart, etc).
 * Consumers must treat these as lifecycle pings, not terminal events.
 */

const fs = require("fs");

const emit = require("./display-emit");

const HOOK_TO_TYPE = {
  SessionStart: "session_start",
  SessionEnd: "session_end",
  PreCompact: "compact",
};

async function main() {
  const campaignPath = emit.getActiveCampaign();
  if (!campaignPath) return;

  const input = await emit.readHookInput();
  if (!input) return;

  const sessionId = input.session_id;
  if (!sessionId) return;

  const eventType = HOOK_TO_TYPE[input.hook_event_name];
  if (!eventType) return;

  const perSessionFile = emit.perSessionFilePath(campaignPath, sessionId);
  if (!fs.existsSync(perSessionFile)) return;

  const typeSpecific = {};
  if (eventType === "session_start" && input.source) {
    typeSpecific.source = input.source;
  } else if (eventType === "session_end" && input.reason) {
    typeSpecific.reason = input.reason;
  } else if (eventType === "compact" && input.trigger) {
    typeSpecific.trigger = input.trigger;
  }

  await emit.appendNextEvent(
    perSessionFile,
    eventType,
    {
      session_id: sessionId,
      campaign: emit.campaignId(campaignPath),
    },
    typeSpecific,
  );
}

emit.safeRun(main);
