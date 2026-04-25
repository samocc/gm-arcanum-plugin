/**
 * display-sync.js — full-state sync to companion app
 *
 * Reads the current session's transcript.jsonl and party-status.json,
 * bundles them into a single payload, and POSTs to the companion app's
 * /sync endpoint. The companion app replaces its state entirely from
 * this payload — idempotent by design.
 *
 * Usage: node display-sync.js [session-id]
 *   - If session-id is omitted, auto-detects the latest session under
 *     {campaign}/.sessions/ by most recent transcript.jsonl mtime.
 *
 * Requires env:
 *   GM_ARCANUM_ACTIVE_CAMPAIGN — absolute path to campaign directory
 *   GM_ARCANUM_DISPLAY_URL     — companion app base URL (e.g. http://localhost:8765)
 *   GM_ARCANUM_DISPLAY_TOKEN   — (optional) bearer token for auth
 *
 * Exit codes:
 *   0 — success (or graceful failure with message on stdout)
 *   Non-zero — unexpected crash only
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const emit = require("./display-emit");

/**
 * Build the /sync URL from the configured base URL.
 * e.g. http://localhost:8765 -> http://localhost:8765/sync
 */
function syncUrl() {
  const baseUrl = process.env.GM_ARCANUM_DISPLAY_URL;
  if (!baseUrl) return null;
  try {
    return new URL("/sync", baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Find the latest session directory by most recent transcript.jsonl mtime.
 * Returns the session ID (directory name) or null if none found.
 */
function findLatestSession(campaignPath) {
  const sessionsRoot = emit.sessionsRootPath(campaignPath);
  if (!fs.existsSync(sessionsRoot)) return null;

  let latest = null;
  let latestMtime = 0;

  const entries = fs.readdirSync(sessionsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const transcriptPath = path.join(sessionsRoot, entry.name, "transcript.jsonl");
    try {
      const stat = fs.statSync(transcriptPath);
      if (stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latest = entry.name;
      }
    } catch {
      // No transcript in this dir — skip
    }
  }
  return latest;
}

/**
 * Read transcript.jsonl and parse into an array of event objects.
 * Returns empty array if file is missing or empty.
 */
function readTranscript(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Read party-status.json. Returns the parsed object or null if missing.
 */
function readPartyStatus(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * POST the sync payload to the companion app. Synchronous — returns
 * { ok, status, body } so we can report the result.
 */
function postSync(url, payload) {
  const token = process.env.GM_ARCANUM_DISPLAY_TOKEN;
  const args = [
    "-sS",
    "--max-time", "10",
    "-X", "POST",
    "-H", "Content-Type: application/json",
    "-w", "\n%{http_code}",
  ];
  if (token) args.push("-H", `Authorization: Bearer ${token}`);
  args.push("-d", JSON.stringify(payload), url);

  const result = spawnSync("curl", args, {
    encoding: "utf8",
    timeout: 15000,
  });

  if (result.error) {
    return { ok: false, status: 0, body: `curl error: ${result.error.message}` };
  }

  const output = (result.stdout || "").trim();
  const lines = output.split("\n");
  const httpCode = parseInt(lines[lines.length - 1], 10) || 0;
  const body = lines.slice(0, -1).join("\n");

  return {
    ok: httpCode >= 200 && httpCode < 300,
    status: httpCode,
    body,
  };
}

/**
 * Run the full-state sync for a given campaign and session. Returns a
 * structured result object so callers can decide how to report.
 *
 * Exported for reuse by the Stop hook's event-marker dispatcher
 * (`>> **Display Sync**` → this function). The CLI `main()` wraps it
 * with env/argv resolution and stdout reporting.
 *
 * @returns {object} one of:
 *   { ok: true, status, events, haveStatus }
 *   { ok: false, reason, message, status? }
 */
function syncFullState(campaignPath, sessionId) {
  if (!campaignPath) {
    return { ok: false, reason: "no-campaign", message: "GM_ARCANUM_ACTIVE_CAMPAIGN is not set." };
  }

  const url = syncUrl();
  if (!url) {
    return { ok: false, reason: "no-url", message: "GM_ARCANUM_DISPLAY_URL is not set or invalid." };
  }

  if (!sessionId) {
    return { ok: false, reason: "no-session", message: "No session provided and no session found." };
  }

  const transcriptPath = emit.perSessionFilePath(campaignPath, sessionId);
  const partyStatusPath = emit.partyStatusFilePath(campaignPath, sessionId);

  const transcript = readTranscript(transcriptPath);
  const partyStatus = readPartyStatus(partyStatusPath);

  if (transcript.length === 0) {
    return { ok: false, reason: "no-transcript", message: `No transcript events found for session ${sessionId}.` };
  }

  const payload = {
    session_id: sessionId,
    campaign: emit.campaignId(campaignPath),
    transcript,
    party_status: partyStatus,
  };

  const result = postSync(url, payload);

  if (result.ok) {
    return { ok: true, status: result.status, events: transcript.length, haveStatus: Boolean(partyStatus), url };
  }
  return { ok: false, reason: "http-fail", status: result.status, message: result.body, url };
}

// --- CLI Main ---

async function main() {
  const campaignPath = emit.getActiveCampaign();
  const sessionId = process.argv[2] || (campaignPath ? findLatestSession(campaignPath) : null);

  const result = syncFullState(campaignPath, sessionId);

  if (result.ok) {
    const statusNote = result.haveStatus ? "transcript + party status" : "transcript only (no party status for this session)";
    console.log(`OK: Synced ${result.events} events (${statusNote}) to ${result.url} [HTTP ${result.status}]`);
  } else if (result.reason === "http-fail") {
    console.log(`FAILED: HTTP ${result.status} from ${result.url}. ${result.message}`);
  } else {
    console.log(`ERROR: ${result.message}`);
  }
}

// Only run main() when invoked as a CLI (skip when require()d as a module).
if (require.main === module) {
  emit.safeRun(main);
}

module.exports = {
  syncFullState,
  findLatestSession,
};
