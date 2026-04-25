#!/usr/bin/env node

/**
 * transcript-init.js — session transcript initialization
 *
 * Dual-mode script: runs as a SessionStart hook (stdin-fed) and also as a
 * CLI utility (called from /gm:monitor-sync for manual re-arm / debug).
 *
 * Creates a per-session directory under {campaign}/.sessions/{session_id}/
 * containing the transcript (with a transcript_start event at seq=0) and an
 * empty inbox file for companion remote input.
 *
 * --- Hook mode (no argv) ---
 *   Claude Code fires this on SessionStart. Reads the hook payload JSON from
 *   stdin, takes session_id, and initializes the transcript. Silent on any
 *   failure (no campaign set, malformed input, etc.) — hooks must never
 *   block gameplay.
 *
 * --- CLI mode (argv given) ---
 *   Usage: node transcript-init.js <session_id>
 *   Called by /gm:monitor-sync as a safety-net re-arm. Errors are printed to stderr
 *   and the process exits 1. On success prints "armed".
 *
 * --- Session mode ---
 *   This script does NOT record the session's mode (narrative/combat/meta/
 *   test). That's the job of session-mode-emit.js, called from each
 *   session-type skill after routing decides. transcript_start carries only
 *   the universal envelope fields.
 *
 * --- Idempotency ---
 *   If the transcript file already exists (session resumed, hook already
 *   fired this session, etc.), the script skips setup. In CLI mode it still
 *   prints "armed" so callers know the transcript is ready.
 */

const emit = require("./display-emit");

async function runCli(sessionId) {
  const campaignPath = emit.getActiveCampaign();
  if (!campaignPath) {
    console.error(
      "no active campaign — set GM_ARCANUM_ACTIVE_CAMPAIGN before running this script",
    );
    process.exit(1);
  }

  await emit.ensureTranscript(campaignPath, sessionId);
  console.log("armed");
}

async function runHook(sessionId) {
  const campaignPath = emit.getActiveCampaign();
  // Silent no-op if no campaign yet — display-capture-prompt.js will
  // self-heal on first UserPromptSubmit once the env is loaded.
  if (!campaignPath) return;

  await emit.ensureTranscript(campaignPath, sessionId);
}

async function main() {
  const argvSessionId = process.argv[2];

  if (argvSessionId) {
    // CLI mode — explicit error output
    await runCli(argvSessionId);
    return;
  }

  // Hook mode — read stdin for the Claude Code hook payload
  const hookInput = await emit.readHookInput();
  if (!hookInput || !hookInput.session_id) return;
  await runHook(hookInput.session_id);
}

// safeRun swallows unexpected exceptions silently with exit 0 — correct for
// hook mode. CLI mode paths exit 1 explicitly before reaching this wrapper on
// their known error cases; unexpected crashes in CLI mode will also exit 0
// silently, which is acceptable (the "armed" signal's absence tells the
// caller setup didn't complete).
emit.safeRun(main);
