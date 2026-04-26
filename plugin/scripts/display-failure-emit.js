#!/usr/bin/env node

/**
 * display-failure-emit.js — failure / notification multiplex hook script
 *
 * Wired to multiple Claude Code lifecycle hooks. Reads `hook_event_name`
 * from stdin JSON, looks up the event spec in HOOK_TO_SPEC, projects the
 * configured fields from the input payload, and emits a v1 event to the
 * per-session transcript file (.sessions/{session_id}/transcript.jsonl).
 *
 * Hook → event mapping:
 *   StopFailure        → stop_failure       { error, error_details?, last_assistant_message? }
 *   Notification       → notification       { notification_type?, message? }
 *   PermissionDenied   → permission_denied  { tool_name?, tool_input? }
 *   PostToolUseFailure → tool_failure       { tool_name?, tool_input?, error?, is_interrupt?, tool_use_id? }
 *
 * Adding a new failure-class hook: add one HOOK_TO_SPEC entry + one event-type
 * section in plugin/docs/app-contract.md. No code changes beyond the table.
 *
 * Headless-mode caveat: `Notification` and `PermissionDenied` could not be
 * triggered in headless `claude -p` smoke tests (see
 * docs/research/research_failure-hook-payloads.md). They are wired anyway —
 * the cost is zero and they may fire in interactive contexts or future CC
 * versions. Consumers should treat both as informational signals only.
 *
 * `PostToolUseFailure` fires reliably but is registered as
 * `_disabled_PostToolUseFailure` in plugin/hooks/hooks.json by default
 * (the disabled-key prefix is silently ignored by the loader). Tool failures
 * are routine in normal gameplay (the model probes files, runs exploratory
 * commands); enabling by default would flood the consumer with low-signal
 * events. Rename the key in hooks.json to enable.
 *
 * Gate: if no active campaign or transcript file doesn't exist, no-op.
 * Errors are absorbed by emit.safeRun (logged to /tmp/cgm-display-error.log).
 */

const fs = require("fs");

const emit = require("./display-emit");

// hook_event_name → { type, fields }
//
// `fields` lists input keys to pass through verbatim under the same key name
// on the emitted event. Undefined / null values are dropped by buildEvent.
const HOOK_TO_SPEC = {
  StopFailure: {
    type: "stop_failure",
    fields: ["error", "error_details", "last_assistant_message"],
  },
  Notification: {
    type: "notification",
    fields: ["notification_type", "message"],
  },
  PermissionDenied: {
    type: "permission_denied",
    fields: ["tool_name", "tool_input"],
  },
  PostToolUseFailure: {
    type: "tool_failure",
    fields: ["tool_name", "tool_input", "error", "is_interrupt", "tool_use_id"],
  },
};

/**
 * Apply the failure-emit pipeline to a parsed hook payload.
 *
 * Pure function over the (input, env) pair so unit tests can drive it
 * directly without piping stdin. Returns one of:
 *   - "emitted"    — event written to the transcript
 *   - "no-campaign"   — GM_ARCANUM_ACTIVE_CAMPAIGN unset
 *   - "no-input"   — input is null/undefined
 *   - "no-session" — input has no session_id
 *   - "unknown-hook" — input.hook_event_name not in HOOK_TO_SPEC
 *   - "no-transcript" — transcript file does not exist
 *
 * Callers from the hook entry point should not interpret the return value;
 * it exists for tests. Errors propagate to caller (entry point absorbs them).
 */
async function dispatch(input) {
  const campaignPath = emit.getActiveCampaign();
  if (!campaignPath) return "no-campaign";

  if (!input) return "no-input";

  const sessionId = input.session_id;
  if (!sessionId) return "no-session";

  const spec = HOOK_TO_SPEC[input.hook_event_name];
  if (!spec) return "unknown-hook";

  const perSessionFile = emit.perSessionFilePath(campaignPath, sessionId);
  if (!fs.existsSync(perSessionFile)) return "no-transcript";

  const typeSpecific = {};
  for (const key of spec.fields) {
    if (input[key] !== undefined && input[key] !== null) {
      typeSpecific[key] = input[key];
    }
  }

  await emit.appendNextEvent(
    perSessionFile,
    spec.type,
    {
      session_id: sessionId,
      campaign: emit.campaignId(campaignPath),
    },
    typeSpecific,
  );
  return "emitted";
}

async function main() {
  const input = await emit.readHookInput();
  await dispatch(input);
}

// Run only when invoked as a script (not when require'd by tests).
if (require.main === module) {
  emit.safeRun(main);
}

module.exports = { HOOK_TO_SPEC, dispatch, main };
