#!/usr/bin/env node

/**
 * party-status-read.js — read the current session's party-status.json to stdout
 *
 * Usage:
 *   node party-status-read.js <session_id>
 *
 * Prints the party-status.json contents (pretty-printed JSON) to stdout, or
 * "no-status" if the file does not exist. Exits 0 in both cases. Exits 1 on
 * hard errors (missing campaign, missing session_id, malformed JSON).
 */

const fs = require("fs");

const emit = require("./display-emit");

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

  const statusPath = emit.partyStatusFilePath(campaignPath, sessionId);
  if (!fs.existsSync(statusPath)) {
    console.log("no-status");
    return;
  }

  const raw = fs.readFileSync(statusPath, "utf8");
  const obj = JSON.parse(raw);
  console.log(JSON.stringify(obj, null, 2));
}

try {
  main();
} catch (err) {
  console.error(`party-status-read failed: ${err && err.message ? err.message : err}`);
  process.exit(1);
}
