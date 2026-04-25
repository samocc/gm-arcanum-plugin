/**
 * display-emit.js — shared helpers for display capture hook scripts
 *
 * Centralizes v1 schema construction, per-session file resolution, seq
 * tracking, file append, and fire-and-forget HTTP push. All four display
 * capture scripts (transcript-init, display-capture-prompt, display-capture-
 * response, display-session-marker) require this module.
 *
 * Not a hook entry point itself — does not read stdin, does not exit the
 * process. Consumers call the exported helpers.
 *
 * Schema version: v1 — see plugin/docs/app-contract.md for the full spec.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const SCHEMA_VERSION = 1;
const SESSIONS_DIR = ".sessions";
const ERROR_LOG = "/tmp/cgm-display-error.log";

/**
 * Top-level wrapper. Runs `fn` inside try/catch. On any error, writes a
 * line to the debug log and exits 0. Hooks must never break gameplay,
 * so failure modes are always silent from the GM session's perspective.
 *
 * Accepts either a sync or async function. If the function is async,
 * pass it directly — safeRun awaits it.
 */
async function safeRun(fn) {
  try {
    await fn();
    process.exit(0);
  } catch (err) {
    try {
      const line = `${new Date().toISOString()} ${err && err.stack ? err.stack : String(err)}\n`;
      fs.appendFileSync(ERROR_LOG, line);
    } catch {
      // nothing more we can do
    }
    process.exit(0);
  }
}

/**
 * Read all of stdin as a string. Cross-platform including Windows.
 * Returns a Promise resolving to the raw string (empty string if no stdin).
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

/**
 * Read and parse the hook payload from stdin. Returns null on empty or
 * malformed input so callers can gate on truthiness.
 */
async function readHookInput() {
  const raw = await readStdin();
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Get the active campaign path from env. Returns null if unset.
 */
function getActiveCampaign() {
  const v = process.env.GM_ARCANUM_ACTIVE_CAMPAIGN;
  return v && v.trim() ? v : null;
}

/**
 * Extract the campaign identifier (basename) from the campaign path.
 * E.g. "/home/user/campaigns/campaign-arjen" -> "campaign-arjen".
 */
function campaignId(campaignPath) {
  if (!campaignPath) return "";
  return path.basename(campaignPath);
}

/**
 * Compute the per-session directory path for a given session_id.
 * Lives under {campaign}/.sessions/{session_id}/
 */
function sessionDirPath(campaignPath, sessionId) {
  return path.join(campaignPath, SESSIONS_DIR, sessionId);
}

/**
 * Compute the per-session transcript JSONL file path for a given session_id.
 * Lives under {campaign}/.sessions/{session_id}/transcript.jsonl
 */
function perSessionFilePath(campaignPath, sessionId) {
  return path.join(campaignPath, SESSIONS_DIR, sessionId, "transcript.jsonl");
}

/**
 * Compute the per-session inbox file path for a given session_id.
 * Lives under {campaign}/.sessions/{session_id}/inbox.jsonl
 */
function inboxFilePath(campaignPath, sessionId) {
  return path.join(campaignPath, SESSIONS_DIR, sessionId, "inbox.jsonl");
}

/**
 * Compute the .sessions/ root directory path (handoff zone).
 * Cross-session files (combat-briefing, party-status-seed, etc.) live here.
 */
function sessionsRootPath(campaignPath) {
  return path.join(campaignPath, SESSIONS_DIR);
}

/**
 * Compute the per-session party-status.json file path.
 * Lives under {campaign}/.sessions/{session_id}/party-status.json
 */
function partyStatusFilePath(campaignPath, sessionId) {
  return path.join(campaignPath, SESSIONS_DIR, sessionId, "party-status.json");
}

/**
 * Ensure the per-session directory exists under .sessions/.
 * Creates both .sessions/ and .sessions/{session_id}/ if needed.
 * Safe to call multiple times (uses recursive: true).
 */
function ensureSessionDir(campaignPath, sessionId) {
  fs.mkdirSync(path.join(campaignPath, SESSIONS_DIR, sessionId), { recursive: true });
}

/**
 * Acquire an exclusive lock by atomically creating a sentinel file next to
 * the target. `fs.openSync(path, "wx")` succeeds for exactly one caller and
 * throws EEXIST for everyone else — the OS serializes the create call.
 *
 * Contention handling: poll every `retryMs` until the lock is ours or the
 * deadline passes. If the existing lockfile is older than `staleMs`, assume
 * the holder crashed and reclaim it. Our critical section is a sub-millisecond
 * file append, so real contention resolves on the first retry in practice;
 * the stale check only matters for crash recovery.
 *
 * Deadline is `staleMs + 1000ms` so a crashed-holder case is guaranteed
 * to be reclaimed before we give up. Throws on timeout — caller's safeRun
 * wrapper swallows it, failing closed (no write with stale seq).
 */
async function acquireLock(lockPath, { staleMs = 5000, retryMs = 10 } = {}) {
  const deadline = Date.now() + staleMs + 1000;
  while (Date.now() < deadline) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.closeSync(fd);
      return;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      try {
        const st = fs.statSync(lockPath);
        if (Date.now() - st.mtimeMs > staleMs) {
          try {
            fs.unlinkSync(lockPath);
          } catch {
            // Another process reclaimed first — fall through to retry.
          }
          continue;
        }
      } catch {
        // Lock vanished between EEXIST and stat — retry immediately.
        continue;
      }
      await new Promise((r) => setTimeout(r, retryMs));
    }
  }
  throw new Error(`acquireLock: timeout waiting for ${lockPath}`);
}

/**
 * Release a lock held via acquireLock. Errors are swallowed — if the lockfile
 * is already gone (reclaimed as stale mid-hold), there's nothing to do.
 */
function releaseLock(lockPath) {
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // lockfile already removed — fine
  }
}

/**
 * Run `fn` while holding an exclusive lock on `${transcriptFile}.lock`.
 * This is the critical section used to prevent seq collisions: two Stop hooks
 * firing concurrently would otherwise both read the same tail seq, compute
 * the same next value, and write duplicate events. The lock ensures
 * `nextSeq` + `appendEvent` is atomic from any other process's view.
 */
async function withTranscriptLock(transcriptFile, fn) {
  const lockPath = transcriptFile + ".lock";
  await acquireLock(lockPath);
  try {
    return await fn();
  } finally {
    releaseLock(lockPath);
  }
}

/**
 * Read the last non-empty line of a JSONL file, parse it, and return
 * its `seq` + 1. If the file does not exist, returns 0 (used as the
 * seq for the first event written to a file — typically transcript_start).
 *
 * For small files (< few hundred KB) we just read the whole file. This
 * is simpler than tail-seeking and fast enough for session-lifetime logs.
 */
function nextSeq(perSessionFile) {
  if (!fs.existsSync(perSessionFile)) return 0;
  try {
    const content = fs.readFileSync(perSessionFile, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) return 0;
    const last = JSON.parse(lines[lines.length - 1]);
    if (typeof last.seq === "number") return last.seq + 1;
    // Last line has no seq — file is from pre-v1, count all lines as the next seq
    return lines.length;
  } catch {
    // Unreadable or malformed — fall back to line count
    try {
      const content = fs.readFileSync(perSessionFile, "utf8");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      return lines.length;
    } catch {
      return 0;
    }
  }
}

/**
 * Assemble a v1 event. Caller provides:
 *   - type: string (e.g. "player", "gm", "transcript_start")
 *   - envelope: { seq, session_id, campaign, t? } — t defaults to now
 *   - typeSpecific: object merged into the event (e.g. { text: "..." })
 *
 * Returns a plain object ready to JSON.stringify and append.
 */
function buildEvent(type, envelope, typeSpecific) {
  const event = {
    v: SCHEMA_VERSION,
    seq: envelope.seq,
    session_id: envelope.session_id,
    campaign: envelope.campaign,
    t: envelope.t || new Date().toISOString(),
    type,
  };
  if (typeSpecific && typeof typeSpecific === "object") {
    for (const [k, v] of Object.entries(typeSpecific)) {
      if (v !== undefined && v !== null) event[k] = v;
    }
  }
  return event;
}

/**
 * Append an event to a per-session transcript file and fire HTTP push if configured.
 * Always writes a trailing newline. File-based write is canonical; HTTP push
 * is fire-and-forget and never blocks.
 *
 * Low-level primitive — does NOT acquire the transcript lock. Callers that
 * compute `seq` from the current file tail must use `appendNextEvent` instead
 * so the seq read and the append are atomic with respect to other writers.
 */
function appendEvent(perSessionFile, event) {
  fs.appendFileSync(perSessionFile, JSON.stringify(event) + "\n");
  httpPush(event);
}

/**
 * Atomic seq-allocate + append. Holds the transcript lock across nextSeq +
 * buildEvent + appendEvent so concurrent writers can't collide on seq.
 *
 * Callers pass the envelope WITHOUT `seq` — it's assigned here under the lock.
 * Returns the fully-built event (with its assigned seq) so callers can inspect
 * or further emit if needed.
 */
async function appendNextEvent(perSessionFile, type, envelope, typeSpecific) {
  return withTranscriptLock(perSessionFile, async () => {
    const event = buildEvent(
      type,
      { ...envelope, seq: nextSeq(perSessionFile) },
      typeSpecific,
    );
    fs.appendFileSync(perSessionFile, JSON.stringify(event) + "\n");
    httpPush(event);
    return event;
  });
}

/**
 * Idempotent transcript initialization. Creates the per-session directory,
 * empty inbox file, and transcript.jsonl seeded with a transcript_start event
 * (seq=0) if the transcript doesn't already exist.
 *
 * Used by transcript-init.js (SessionStart hook and /gm:monitor-sync CLI path) and
 * by display-capture-prompt.js as a self-heal on the first UserPromptSubmit
 * — covering the case where SessionStart fired before Claude Code finished
 * loading workspace settings.json env vars, causing the hook to silently
 * no-op on a missing `GM_ARCANUM_ACTIVE_CAMPAIGN`.
 *
 * Returns true if the transcript exists (already did, or was created now).
 * Returns false if no active campaign is set (caller should no-op).
 */
async function ensureTranscript(campaignPath, sessionId) {
  if (!campaignPath || !sessionId) return false;

  const transcriptFile = perSessionFilePath(campaignPath, sessionId);
  if (fs.existsSync(transcriptFile)) return true;

  ensureSessionDir(campaignPath, sessionId);

  return withTranscriptLock(transcriptFile, async () => {
    // Double-check under the lock — another process may have initialized
    // while we were waiting.
    if (fs.existsSync(transcriptFile)) return true;

    // Create empty inbox file so the consumer can write to it and the
    // Monitor can tail -F it, both before the first real event.
    const inboxPath = inboxFilePath(campaignPath, sessionId);
    fs.writeFileSync(inboxPath, "", { flag: "a" });

    const transcriptStartEvent = buildEvent(
      "transcript_start",
      {
        seq: 0,
        session_id: sessionId,
        campaign: campaignId(campaignPath),
      },
      {},
    );

    fs.writeFileSync(transcriptFile, JSON.stringify(transcriptStartEvent) + "\n");
    httpPush(transcriptStartEvent);
    return true;
  });
}

/**
 * Emit a v1 `state` display event with state_kind="party_vitals" and the given
 * statusObj as the full snapshot. Replace semantics — each event is the
 * complete current party vitals state.
 *
 * No-op if the per-session transcript file doesn't exist (feature not active
 * for this session).
 */
async function emitPartyVitalsState(campaignPath, sessionId, statusObj) {
  // Self-heal: ensure the transcript is initialized so this call works
  // even if SessionStart raced with env loading. Idempotent.
  if (!(await ensureTranscript(campaignPath, sessionId))) return;
  const transcriptFile = perSessionFilePath(campaignPath, sessionId);

  await appendNextEvent(
    transcriptFile,
    "state",
    {
      session_id: sessionId,
      campaign: campaignId(campaignPath),
    },
    {
      state_kind: "party_vitals",
      state: statusObj,
    },
  );
}

/**
 * Fire-and-forget HTTP push of a single event. No-op if
 * GM_ARCANUM_DISPLAY_URL is unset.
 *
 * Implementation: spawn a detached `curl` subprocess and unref it so this
 * process can exit immediately without waiting for the request to complete.
 * Curl is chosen over node's http module because node exits before an
 * in-process request completes unless we await, which would violate the
 * "hooks never block gameplay" invariant.
 *
 * Any curl failure (endpoint down, DNS error, wrong token) is silently
 * ignored — the canonical file is already written by this point.
 */
function httpPush(event) {
  const baseUrl = process.env.GM_ARCANUM_DISPLAY_URL;
  if (!baseUrl) return;
  let url;
  try {
    url = new URL("/events", baseUrl).href;
  } catch {
    return;
  }
  const token = process.env.GM_ARCANUM_DISPLAY_TOKEN;
  const args = [
    "-sS",
    "--max-time",
    "2",
    "-X",
    "POST",
    "-H",
    "Content-Type: application/json",
  ];
  if (token) args.push("-H", `Authorization: Bearer ${token}`);
  args.push("-d", JSON.stringify(event), url);
  try {
    const child = spawn("curl", args, {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch {
    // curl not available or spawn failed — silent
  }
}

module.exports = {
  SCHEMA_VERSION,
  SESSIONS_DIR,
  safeRun,
  readStdin,
  readHookInput,
  getActiveCampaign,
  campaignId,
  sessionDirPath,
  perSessionFilePath,
  inboxFilePath,
  sessionsRootPath,
  partyStatusFilePath,
  ensureSessionDir,
  nextSeq,
  buildEvent,
  appendEvent,
  appendNextEvent,
  acquireLock,
  releaseLock,
  withTranscriptLock,
  ensureTranscript,
  emitPartyVitalsState,
  httpPush,
};
