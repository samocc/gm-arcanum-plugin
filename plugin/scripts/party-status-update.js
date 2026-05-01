#!/usr/bin/env node

/**
 * party-status-update.js — Stop hook script
 *
 * Fires after every GM turn. Scans the assistant's last message for inline
 * status markers (>> **Name** operations), parses them, and applies the
 * resulting deltas to the session's party-status.json file.
 *
 * If any changes were made, writes the updated status back and emits a
 * `state` event (state_kind: "party_vitals") to the session transcript
 * so the companion display pipeline can reflect current party vitals.
 *
 * Gate: the hook no-ops silently if:
 * - No active campaign is set
 * - No session_id in the hook payload
 * - No last_assistant_message in the payload
 * - No party-status.json exists for this session (feature not active)
 * - No >> marker lines found in the GM's response
 *
 * Follows the safeRun pattern: always exits 0, never blocks gameplay.
 * Parse errors for individual operations are logged but do not abort
 * processing of remaining markers.
 */

const fs = require("fs");
const path = require("path");

const emit = require("./display-emit");
const { parseAndApply } = require("./party-status-parser");
const { parseEventMarkers } = require("./event-marker-parser");
const { syncFullState } = require("./display-sync");

/**
 * Append a non-fatal warning to the shared error log.
 */
function logWarning(tag, sessionId, message) {
  try {
    fs.appendFileSync(
      "/tmp/cgm-display-error.log",
      `${new Date().toISOString()} [${tag}] (${sessionId}): ${message}\n`,
    );
  } catch {
    // Logging failure is non-fatal
  }
}

/**
 * Read party-status.json for this session. Returns the parsed object, or
 * null if the file is missing or malformed.
 */
function readStatus(campaignPath, sessionId) {
  const statusFile = path.join(
    campaignPath,
    emit.SESSIONS_DIR,
    sessionId,
    "party-status.json",
  );
  if (!fs.existsSync(statusFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(statusFile, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Apply mutation markers from the GM text against the session's
 * party-status.json. Writes updated status to disk and emits a state
 * event if anything changed. Silent no-op if the status file is absent.
 */
async function runMutationPass(campaignPath, sessionId, text) {
  const statusObj = readStatus(campaignPath, sessionId);
  if (statusObj === null) return;

  const { status, changed, errors } = parseAndApply(statusObj, text);

  if (errors && errors.length > 0) {
    logWarning("party-status-update", sessionId, `Parse warnings: ${errors.join("; ")}`);
  }

  if (!changed) return;

  const statusFile = path.join(
    campaignPath,
    emit.SESSIONS_DIR,
    sessionId,
    "party-status.json",
  );
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2) + "\n");

  await emit.emitPartyVitalsState(campaignPath, sessionId, status);
}

/**
 * Dispatch each parsed event marker. Runs from hook context (unsandboxed),
 * so network calls go through.
 */
async function runEventPass(campaignPath, sessionId, text) {
  const events = parseEventMarkers(text);
  if (events.length === 0) return;

  const transcriptFile = emit.perSessionFilePath(campaignPath, sessionId);
  const envelope = {
    session_id: sessionId,
    campaign: emit.campaignId(campaignPath),
  };

  for (const event of events) {
    try {
      switch (event.type) {
        case "Session Mode": {
          await emit.appendNextEvent(transcriptFile, "session_mode", envelope, {
            mode: event.value,
          });
          break;
        }
        case "Party Sync": {
          const statusObj = readStatus(campaignPath, sessionId);
          if (statusObj === null) {
            logWarning("event-marker", sessionId, "Party Sync skipped: party-status.json missing");
            break;
          }
          await emit.emitPartyVitalsState(campaignPath, sessionId, statusObj);
          break;
        }
        case "Display Sync": {
          const result = syncFullState(campaignPath, sessionId);
          if (!result.ok) {
            logWarning("event-marker", sessionId, `Display Sync failed: ${result.message || result.reason}`);
          }
          break;
        }
        case "Session Start": {
          // Reserved no-op — see event-marker-parser.js KNOWN_EVENTS.
          break;
        }
        case "Monitor Ready": {
          await emit.appendNextEvent(transcriptFile, "monitor_ready", envelope, {});
          break;
        }
        case "Roll Initiative": {
          await emit.appendNextEvent(transcriptFile, "intent/roll_initiative", envelope, {});
          break;
        }
        case "Session End": {
          await emit.appendNextEvent(transcriptFile, "intent/session_end", envelope, {});
          break;
        }
        case "IP Validation": {
          await emit.appendNextEvent(transcriptFile, "intent/ip_validation", envelope, {
            kind: event.payload.kind,
            value: event.payload.value,
          });
          break;
        }
        case "Start Session": {
          // originating_session_id is auto-filled from the emitting session —
          // it's always the same value, so the GM doesn't carry it in the marker.
          await emit.appendNextEvent(transcriptFile, "intent/start_session", envelope, {
            mode: event.payload.mode,
            originating_session_id: sessionId,
          });
          break;
        }
        case "Resume Session": {
          // target_session_id is auto-filled from the env var passed at session
          // spawn (GM_ARCANUM_ORIGINATING_SESSION_ID). If absent, this combat /
          // meta session was launched standalone and Resume has no target —
          // skip emission and warn so the producer-side guard catches it.
          const targetId = process.env.GM_ARCANUM_ORIGINATING_SESSION_ID;
          if (!targetId) {
            logWarning(
              "event-marker",
              sessionId,
              "Resume Session skipped: GM_ARCANUM_ORIGINATING_SESSION_ID not set",
            );
            break;
          }
          await emit.appendNextEvent(transcriptFile, "intent/resume_session", envelope, {
            target_session_id: targetId,
          });
          break;
        }
        default:
          // Unknown type shouldn't reach here (parser filters), but be defensive.
          logWarning("event-marker", sessionId, `Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      logWarning(
        "event-marker",
        sessionId,
        `${event.type} dispatch error: ${err && err.message ? err.message : String(err)}`,
      );
    }
  }
}

async function main() {
  const campaignPath = emit.getActiveCampaign();
  if (!campaignPath) return;

  const input = await emit.readHookInput();
  if (!input) return;

  const sessionId = input.session_id;
  if (!sessionId) return;

  const text = (input.last_assistant_message || "").trim();
  if (!text) return;

  // Two passes over the same GM text, each handling its own `>>` register.
  // Mutations first so disk state is up-to-date before any event dispatch
  // (e.g. Party Sync reads the freshly-written status).
  await runMutationPass(campaignPath, sessionId, text);
  await runEventPass(campaignPath, sessionId, text);
}

emit.safeRun(main);
