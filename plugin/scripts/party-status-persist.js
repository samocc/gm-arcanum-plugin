#!/usr/bin/env node

/**
 * party-status-persist.js — write session party status back to persistent storage
 *
 * Called at session end (or on demand) to push the in-session working copy of
 * party-status.json back to the canonical per-character files, or to create a
 * combat handoff snapshot.
 *
 * Two modes:
 *
 *   Writeback mode (default):
 *     Reads .sessions/{session_id}/party-status.json and for each entry whose
 *     team is "party", finds the matching canon file under campaign-members/
 *     (pc-* or co-*) by comparing the 'name' field, then full-copies the
 *     session character to canon — minus combat-only transients (position,
 *     initiative, isCurrentTurn). Canon is the snapshot at last session-end of
 *     the session working copy. Downstream Sync-Up (utility-internal) reconciles
 *     canon against the character sheet per the Field Reference in the
 *     status-JSON template.
 *
 *   Postcombat snapshot mode (--postcombat):
 *     Reads .sessions/{session_id}/party-status.json, filters to entries where
 *     team === "party", strips combat-only transients, and writes the filtered
 *     object to .sessions/party-status-postcombat.json for pickup by the
 *     narrative session via party-status-merge.js.
 *
 * Usage:
 *   node party-status-persist.js <session_id>               (writeback mode)
 *   node party-status-persist.js <session_id> --postcombat  (snapshot mode)
 *
 * Stdout signals:
 *   persisted    — writeback mode success
 *   snapshot     — postcombat snapshot mode success
 *   no-status    — session party-status.json not found; not an error
 *
 * Exits 0 for all of the above. Exits 1 on hard errors.
 */

const fs = require("fs");
const path = require("path");

const emit = require("./display-emit");

/**
 * Read and parse a JSON file. Returns parsed object or throws.
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * Fields stripped from canon writeback. Combat-only transients: they exist
 * only during combat encounters and have no meaning on the persistent canon
 * file. Both writeback and postcombat-snapshot modes strip the same set so the
 * two paths can't drift.
 */
const COMBAT_TRANSIENT_KEYS = ["position", "initiative", "isCurrentTurn"];

/**
 * Produce a canon-ready copy of a session character object: shallow clone, drop
 * combat-only transients. Everything else (runtime state, static fields, arrays,
 * resource metadata) is copied through as-is. Canon is the snapshot at last
 * session-end of the session working copy.
 */
function sessionToCanon(sessionChar) {
  const clean = { ...sessionChar };
  for (const key of COMBAT_TRANSIENT_KEYS) delete clean[key];
  return clean;
}

/**
 * Scan campaign-members/ for pc-* and co-* directories. For each that contains
 * a status.json, return an entry with { memberDir, statusPath, name }.
 * Builds a lookup map keyed by character name.
 */
function buildCanonIndex(campaignPath) {
  const membersDir = path.join(campaignPath, "campaign-members");
  if (!fs.existsSync(membersDir)) return {};

  let entries;
  try {
    entries = fs.readdirSync(membersDir, { withFileTypes: true });
  } catch {
    return {};
  }

  const index = {};
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith("pc-") && !entry.name.startsWith("co-")) continue;
    const statusPath = path.join(membersDir, entry.name, "status.json");
    if (!fs.existsSync(statusPath)) continue;
    try {
      const data = readJson(statusPath);
      if (data.name) {
        index[data.name] = { statusPath, data };
      }
    } catch {
      // skip unreadable canon files
    }
  }
  return index;
}

function main() {
  const campaignPath = emit.getActiveCampaign();
  if (!campaignPath) {
    console.error(
      "no active campaign — set GM_ARCANUM_ACTIVE_CAMPAIGN before running this script",
    );
    process.exit(1);
  }

  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error("session_id argument required");
    process.exit(1);
  }

  const postcombatMode = process.argv[3] === "--postcombat";

  const sessionStatusPath = path.join(
    campaignPath,
    emit.SESSIONS_DIR,
    sessionId,
    "party-status.json",
  );
  if (!fs.existsSync(sessionStatusPath)) {
    console.log("no-status");
    return;
  }

  const sessionStatus = readJson(sessionStatusPath);

  if (postcombatMode) {
    // --- Postcombat snapshot mode ---
    // Filter to party members only, strip combat-only transients, write to
    // handoff zone. Outer key is the party-member slug; the snapshot is
    // consumed by party-status-merge.js.
    const partyOnly = {};
    for (const [slug, charData] of Object.entries(sessionStatus)) {
      if (charData.team === "party") {
        partyOnly[slug] = sessionToCanon(charData);
      }
    }

    const postcombatPath = path.join(
      campaignPath,
      emit.SESSIONS_DIR,
      "party-status-postcombat.json",
    );
    // Ensure .sessions/ dir exists (session dir may not have been created for combat)
    fs.mkdirSync(path.join(campaignPath, emit.SESSIONS_DIR), { recursive: true });
    fs.writeFileSync(postcombatPath, JSON.stringify(partyOnly, null, 2) + "\n");

    console.log("snapshot");
  } else {
    // --- Writeback mode ---
    // Canon is the snapshot at last session-end of the session working copy.
    // Full-copy per party member (minus combat-only transients). All runtime
    // and static fields flow through — Sync-Up downstream reconciles status
    // against the sheet per the Field Reference in the status-JSON template.
    //
    // Session is slug-keyed; canon index is keyed by display `name`. Look up
    // canon via `sessionChar.name` (the explicit name property on the session
    // character object), not the outer slug key.
    const canonIndex = buildCanonIndex(campaignPath);

    for (const [, sessionChar] of Object.entries(sessionStatus)) {
      if (sessionChar.team !== "party") continue;

      const displayName = typeof sessionChar.name === "string" ? sessionChar.name : null;
      if (!displayName) continue;

      const canonEntry = canonIndex[displayName];
      if (!canonEntry) {
        // No matching canon file found — skip this character
        continue;
      }

      fs.writeFileSync(
        canonEntry.statusPath,
        JSON.stringify(sessionToCanon(sessionChar), null, 2) + "\n",
      );
    }

    console.log("persisted");
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(
      `party-status-persist failed: ${err && err.message ? err.message : err}`,
    );
    process.exit(1);
  }
}

module.exports = {
  sessionToCanon,
  buildCanonIndex,
  COMBAT_TRANSIENT_KEYS,
};
