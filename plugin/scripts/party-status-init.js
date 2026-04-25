#!/usr/bin/env node

/**
 * party-status-init.js — party status session initialization script
 *
 * Called by narrative-session and combat-session skills at session load to
 * initialize the per-session party-status.json working copy.
 *
 * Two modes:
 *
 *   Compile mode (default):
 *     Scans campaign-members/ for pc-* and co-* subdirectories, reads each
 *     status.json, and compiles them into a single object keyed by character
 *     name. Writes the compiled object to .sessions/{session_id}/party-status.json.
 *
 *   Seed copy mode (--seed):
 *     Copies .sessions/party-status-seed.json (the combat handoff seed) into
 *     .sessions/{session_id}/party-status.json. Used by combat sessions to
 *     inherit the party state prepared by the narrative session.
 *
 * Usage:
 *   node party-status-init.js <session_id>           (compile mode)
 *   node party-status-init.js <session_id> --seed    (seed copy mode)
 *
 * Idempotent: if party-status.json already exists in the session dir, prints
 * "armed" and exits immediately without touching existing files.
 *
 * Stdout signals:
 *   armed       — success (status file ready)
 *   no-status   — compile mode: no canon status files found (feature not yet
 *                 initialized for this campaign); not an error
 *   no-seed     — seed mode: seed file not found in handoff zone; not an error
 *
 * Exits 0 for all of the above. Exits 1 on hard errors (missing campaign,
 * missing session_id, unreadable files).
 */

const fs = require("fs");
const path = require("path");

const emit = require("./display-emit");

/**
 * Scan campaign-members/ for dirs beginning with "pc-" or "co-" that contain
 * a status.json. Returns an array of { statusPath, dirName } records so callers
 * can infer role from the directory prefix when backfilling.
 */
function findCanonStatusFiles(campaignPath) {
  const membersDir = path.join(campaignPath, "campaign-members");
  if (!fs.existsSync(membersDir)) return [];

  let entries;
  try {
    entries = fs.readdirSync(membersDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith("pc-") && !entry.name.startsWith("co-")) continue;
    const statusPath = path.join(membersDir, entry.name, "status.json");
    if (fs.existsSync(statusPath)) {
      files.push({ statusPath, dirName: entry.name });
    }
  }
  return files;
}

/**
 * Read and parse a JSON file. Returns parsed object or throws.
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * Canonicalize a TTRPG system name into the dotted lowercase ID used in
 * status.json's `system` field. Known variants get the fixed canonical form;
 * anything else becomes a lowercase-hyphen slug of the source name.
 */
function canonicalizeSystem(raw) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (normalized === "d&d 5e (2024)") return "dnd.5e.2024";
  if (normalized === "d&d 5e (2014)") return "dnd.5e.2014";
  if (normalized === "pathfinder 2e") return "pf.2e";
  // Fallback: lowercase-hyphen slug
  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Read the campaign's TTRPG System line from campaign-settings.md, canonicalize
 * it, and return the ID. Returns "" if the file or line cannot be read.
 */
function readCampaignSystem(campaignPath) {
  const settingsPath = path.join(campaignPath, "campaign-settings.md");
  if (!fs.existsSync(settingsPath)) return "";
  let text;
  try {
    text = fs.readFileSync(settingsPath, "utf8");
  } catch {
    return "";
  }
  const m = text.match(/\*\*TTRPG System:\*\*\s*(.+)/);
  if (!m) return "";
  return canonicalizeSystem(m[1]);
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

  const seedMode = process.argv[3] === "--seed";

  // Idempotency check — if working copy already exists, nothing to do
  const sessionStatusPath = path.join(
    campaignPath,
    emit.SESSIONS_DIR,
    sessionId,
    "party-status.json",
  );
  if (fs.existsSync(sessionStatusPath)) {
    console.log("armed");
    return;
  }

  if (seedMode) {
    // --- Seed copy mode ---
    const seedPath = path.join(campaignPath, emit.SESSIONS_DIR, "party-status-seed.json");
    if (!fs.existsSync(seedPath)) {
      console.log("no-seed");
      return;
    }

    const statusObj = readJson(seedPath);

    emit.ensureSessionDir(campaignPath, sessionId);
    fs.writeFileSync(sessionStatusPath, JSON.stringify(statusObj, null, 2) + "\n");
    // State event emission moved to the `>> **Party Sync**` event marker
    // (handled by the Stop hook, outside the sandbox). The skill invoking
    // this script should include the marker in its first GM response.

    console.log("armed");
  } else {
    // --- Compile mode ---
    const canonFiles = findCanonStatusFiles(campaignPath);
    if (canonFiles.length === 0) {
      console.log("no-status");
      return;
    }

    // Cache the campaign's canonical TTRPG system ID once for system backfill.
    const campaignSystem = readCampaignSystem(campaignPath);

    // Compile all canon files into one object keyed by folder slug
    const statusObj = {};
    for (const { statusPath: filePath, dirName } of canonFiles) {
      const data = readJson(filePath);
      const name = data.name;
      if (!name) {
        console.error(`status.json missing 'name' field: ${filePath}`);
        process.exit(1);
      }

      // Safeguard backfill for canon files missing fields added after creation.
      // New characters get these populated at creation time (campaign-create,
      // companion-sheet-internal); this branch keeps pre-existing canon files
      // in sync with the current schema.
      let mutated = false;
      if (typeof data.role !== "string") {
        if (dirName.startsWith("pc-")) data.role = "pc";
        else if (dirName.startsWith("co-")) data.role = "co";
        mutated = true;
      }
      if (typeof data.classInfo !== "string") {
        data.classInfo = "";
        mutated = true;
      }
      if (typeof data.currency !== "number") {
        data.currency = 0;
        mutated = true;
      }
      if (typeof data.concentration !== "string") {
        data.concentration = "";
        mutated = true;
      }
      if (typeof data.system !== "string") {
        data.system = campaignSystem || "TODO";
        mutated = true;
      }
      if (typeof data.AC === "number") {
        data.AC = { current: data.AC, max: data.AC };
        mutated = true;
      }
      if (mutated) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
        } catch (err) {
          // Canon could theoretically be read-only; log and continue.
          console.error(
            `warning: failed to backfill ${filePath}: ${err && err.message ? err.message : err}`,
          );
        }
      }

      // Key by folder slug; keep `name` inside the object as an explicit field.
      statusObj[dirName] = data;
    }

    emit.ensureSessionDir(campaignPath, sessionId);
    fs.writeFileSync(sessionStatusPath, JSON.stringify(statusObj, null, 2) + "\n");
    // State event emission moved to the `>> **Party Sync**` event marker
    // (handled by the Stop hook, outside the sandbox). The skill invoking
    // this script should include the marker in its first GM response.

    console.log("armed");
  }
}

try {
  main();
} catch (err) {
  console.error(
    `party-status-init failed: ${err && err.message ? err.message : err}`,
  );
  process.exit(1);
}
