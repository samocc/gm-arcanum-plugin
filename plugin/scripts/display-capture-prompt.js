#!/usr/bin/env node

/**
 * display-capture-prompt.js — UserPromptSubmit hook script
 *
 * Fires on every player message. Gates on whether the session transcript is
 * active (per-session transcript.jsonl exists under .sessions/{session_id}/);
 * if so, appends a v1 player event to the transcript and fires HTTP push.
 *
 * Runs in parallel with resolve-rolls.sh on the same UserPromptSubmit
 * event. The two scripts do not interact: this one writes to a file,
 * resolve-rolls returns additionalContext to Claude.
 *
 * Captured text is the raw pre-resolution prompt with IDE-injected tags
 * stripped. `>>` dice markers stay visible so the renderer can style them.
 */

const emit = require("./display-emit");

// Regex to strip IDE/system-injected context blocks. Claude Code concatenates
// these sibling content blocks into the prompt field, but they're not part of
// what the player actually typed and shouldn't appear in the display log.
const IDE_TAG_PATTERN =
  /<(ide_opened_file|ide_selection|system-reminder|command-name|command-message|command-args)>[\s\S]*?<\/\1>\n?/g;

async function main() {
  const campaignPath = emit.getActiveCampaign();
  if (!campaignPath) return;

  const input = await emit.readHookInput();
  if (!input) return;

  const sessionId = input.session_id;
  if (!sessionId) return;

  // Self-heal: if the SessionStart hook's transcript-init fired before the
  // workspace env was loaded, the transcript file was never created and
  // this session has no capture active. By UserPromptSubmit time the env
  // is loaded (we got campaignPath above), so initialize now. Idempotent —
  // returns quickly if the transcript already exists.
  await emit.ensureTranscript(campaignPath, sessionId);

  const perSessionFile = emit.perSessionFilePath(campaignPath, sessionId);

  let prompt = input.prompt || "";
  if (!prompt) return;

  // Strip IDE/system-injected blocks
  prompt = prompt.replace(IDE_TAG_PATTERN, "").trim();
  if (!prompt) return;

  // Skip Monitor notifications — they fire UserPromptSubmit but are not
  // player input. The Stop hook captures them as remote_input events instead.
  if (/^\s*<task-notification>/.test(prompt)) return;

  await emit.appendNextEvent(
    perSessionFile,
    "player",
    {
      session_id: sessionId,
      campaign: emit.campaignId(campaignPath),
    },
    { text: prompt },
  );
}

emit.safeRun(main);
