#!/usr/bin/env node

/**
 * party-status-add-member.js — sync newly added party members into the live
 * session working copy
 *
 * Called after a new party member is added on disk (a companion recruited
 * mid-narrative, a companion built during campaign creation, or a PC added
 * via /gm:add-pc) but BEFORE the next session start. Its job is to keep
 * `.sessions/{session_id}/party-status.json` in sync with the canonical
 * `status.json` files under `campaign-members/pc-<slug>/` and
 * `campaign-members/co-<slug>/` without disturbing live state for
 * already-tracked members.
 *
 * Auto-discovery — caller does not pass slugs. Compares the set of canon
 * dirnames against the working copy's top-level keys; appends any missing
 * canon entries (with the same schema-backfill compile mode applies).
 * Existing keys are preserved verbatim.
 *
 * Two paths:
 *
 *   Sync mode (working copy exists):
 *     Diff canon vs. working copy, append missing entries, write back.
 *
 *   Compile-fallback mode (working copy missing — campaign creation, etc.):
 *     Compile from scratch, identical to `party-status-init.js` compile mode.
 *
 * Usage:
 *   node party-status-add-member.js <session_id>
 *
 * Stdout signals:
 *   synced N    — sync mode: N new members appended (N >= 1)
 *   no-new      — sync mode: working copy already has every canon entry
 *   armed       — compile-fallback path: working copy was created from canon
 *   no-status   — no canon status files found (feature not yet initialized)
 *
 * Exits 0 for all of the above. Exits 1 on hard errors.
 *
 * Pairs with the `>> **Party Sync**` event marker — the calling skill should
 * emit that marker in the same response so the Stop hook re-reads the
 * working copy and pushes party_vitals to the app.
 */

const fs = require("fs");
const path = require("path");

const emit = require("./display-emit");
const {
  findCanonStatusFiles,
  readJson,
  readCampaignSystem,
  compileEntry,
} = require("./party-status-init");

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

  const canonFiles = findCanonStatusFiles(campaignPath);
  if (canonFiles.length === 0) {
    console.log("no-status");
    return;
  }

  const sessionStatusPath = path.join(
    campaignPath,
    emit.SESSIONS_DIR,
    sessionId,
    "party-status.json",
  );
  const campaignSystem = readCampaignSystem(campaignPath);

  // Compile-fallback path — no working copy yet (e.g., during campaign
  // creation, or any meta session that started with no-status).
  if (!fs.existsSync(sessionStatusPath)) {
    const statusObj = {};
    for (const { statusPath: filePath, dirName } of canonFiles) {
      statusObj[dirName] = compileEntry(filePath, dirName, campaignSystem);
    }
    emit.ensureSessionDir(campaignPath, sessionId);
    fs.writeFileSync(sessionStatusPath, JSON.stringify(statusObj, null, 2) + "\n");
    console.log("armed");
    return;
  }

  // Sync mode — diff canon vs. working copy, append missing entries.
  const workingCopy = readJson(sessionStatusPath);
  const existingSlugs = new Set(Object.keys(workingCopy));

  const missing = canonFiles.filter(({ dirName }) => !existingSlugs.has(dirName));
  if (missing.length === 0) {
    console.log("no-new");
    return;
  }

  for (const { statusPath: filePath, dirName } of missing) {
    workingCopy[dirName] = compileEntry(filePath, dirName, campaignSystem);
  }
  fs.writeFileSync(sessionStatusPath, JSON.stringify(workingCopy, null, 2) + "\n");
  console.log(`synced ${missing.length}`);
}

try {
  main();
} catch (err) {
  console.error(
    `party-status-add-member failed: ${err && err.message ? err.message : err}`,
  );
  process.exit(1);
}
