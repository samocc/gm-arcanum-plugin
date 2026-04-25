#!/usr/bin/env node

/**
 * party-status-merge.js — merge postcombat state back into narrative session
 *
 * Called after a combat session ends to apply combat outcomes (HP changes,
 * resource expenditures, conditions) back into the active narrative session's
 * working copy of party-status.json.
 *
 * Reads .sessions/party-status-postcombat.json (written by combat session via
 * party-status-persist.js --postcombat) and merges current values for each
 * party member into the narrative session's .sessions/{session_id}/party-status.json.
 *
 * Only characters that exist in BOTH files are merged. Characters present only
 * in the postcombat file are ignored (they were enemies/neutrals in the combat
 * encounter, not party members tracked by the narrative session).
 *
 * Merge logic per character:
 *   - HP.current, HP.temp        — taken from postcombat
 *   - AC.current                 — taken from postcombat
 *   - Spells.N.current, etc.     — .current taken from postcombat per resource key
 *   - Conditions                 — taken from postcombat
 *   - HP.max, AC.max             — preserved from narrative
 *   - *.max, *.shortRest,
 *     *.longRest                 — preserved from narrative per resource key
 *   - name, system, team         — preserved from narrative (authoritative)
 *
 * Usage:
 *   node party-status-merge.js <session_id>
 *
 * Stdout signals:
 *   merged           — success; postcombat data was applied
 *   no-postcombat    — postcombat handoff file not found; not an error
 *   no-status        — narrative session status file not found; not an error
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
 * Merge one character's postcombat state into their narrative state.
 *
 * Rules:
 *   - HP.current and HP.temp come from postcombat; HP.max stays from narrative.
 *   - Conditions comes from postcombat.
 *   - team stays from narrative.
 *   - For every other key that is an object (resource pools like Spells, BI,
 *     Ki, HD, etc.): copy .current from postcombat; preserve .max, .shortRest,
 *     .longRest from narrative.
 *   - Scalar resource keys from postcombat that don't exist in narrative are
 *     ignored (no new resource types are introduced during merge).
 */
function mergeCharacter(narrativeChar, postcombatChar) {
  const result = { ...narrativeChar };

  // Defensive: narrative state never carries initiative or isCurrentTurn (combat-only
  // fields). If stray values slipped through the postcombat snapshot strip, ensure
  // they don't survive into the merged narrative copy either.
  delete result.initiative;
  delete result.isCurrentTurn;

  // HP
  if (postcombatChar.HP && result.HP) {
    result.HP = {
      ...result.HP,
      current: postcombatChar.HP.current ?? result.HP.current,
      temp: postcombatChar.HP.temp ?? result.HP.temp,
    };
  }

  // AC — `{current, max}`. Take `.current` from postcombat (combat buffs like
  // Shield may have dropped off by session end, but the live value wins);
  // preserve `.max` from narrative.
  if (postcombatChar.AC && typeof postcombatChar.AC === "object" && result.AC && typeof result.AC === "object") {
    result.AC = {
      ...result.AC,
      current: typeof postcombatChar.AC.current === "number" ? postcombatChar.AC.current : result.AC.current,
    };
  }

  // Conditions
  if (Array.isArray(postcombatChar.Conditions)) {
    result.Conditions = postcombatChar.Conditions;
  }

  // Currency and concentration — take postcombat values if present.
  // (name/system/role are NOT merged: narrative is authoritative and falls
  // through via the initial spread of narrativeChar into result.)
  if (typeof postcombatChar.currency === "number") {
    result.currency = postcombatChar.currency;
  }
  if (typeof postcombatChar.concentration === "string") {
    result.concentration = postcombatChar.concentration;
  }

  // Resource pools — any key that is an object in both copies, excluding HP/AC
  for (const key of Object.keys(narrativeChar)) {
    if (
      key === "HP" ||
      key === "AC" ||
      key === "Conditions" ||
      key === "name" ||
      key === "system" ||
      key === "team" ||
      key === "role" ||
      key === "classInfo" ||
      key === "currency" ||
      key === "concentration" ||
      key === "initiative" ||
      key === "isCurrentTurn" ||
      key === "position"
    ) {
      continue;
    }
    const narrRes = narrativeChar[key];
    const postRes = postcombatChar[key];
    if (
      narrRes &&
      typeof narrRes === "object" &&
      !Array.isArray(narrRes) &&
      postRes &&
      typeof postRes === "object" &&
      !Array.isArray(postRes)
    ) {
      // Simple flat resource (BI, Ki, etc.)
      if (typeof narrRes.current !== "undefined" || typeof postRes.current !== "undefined") {
        result[key] = {
          ...narrRes,
          current: postRes.current ?? narrRes.current,
        };
      } else {
        // Nested resource (Spells: { "1": { current, max }, ... })
        const merged = { ...narrRes };
        for (const slot of Object.keys(narrRes)) {
          const narrSlot = narrRes[slot];
          const postSlot = postRes[slot];
          if (
            narrSlot &&
            typeof narrSlot === "object" &&
            postSlot &&
            typeof postSlot === "object" &&
            typeof narrSlot.current !== "undefined"
          ) {
            merged[slot] = {
              ...narrSlot,
              current: postSlot.current ?? narrSlot.current,
            };
          }
        }
        result[key] = merged;
      }
    }
  }

  return result;
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

  const postcombatPath = path.join(
    campaignPath,
    emit.SESSIONS_DIR,
    "party-status-postcombat.json",
  );
  if (!fs.existsSync(postcombatPath)) {
    console.log("no-postcombat");
    return;
  }

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

  const postcombatStatus = readJson(postcombatPath);
  const narrativeStatus = readJson(sessionStatusPath);

  // Merge: only update characters that exist in both files. Keys are slugs
  // for party members on both sides; Object.keys iteration is unchanged.
  const updated = { ...narrativeStatus };
  for (const slug of Object.keys(postcombatStatus)) {
    if (Object.prototype.hasOwnProperty.call(narrativeStatus, slug)) {
      updated[slug] = mergeCharacter(narrativeStatus[slug], postcombatStatus[slug]);
    }
    // else: character not in narrative status — skip (enemy/neutral)
  }

  fs.writeFileSync(sessionStatusPath, JSON.stringify(updated, null, 2) + "\n");
  // State event emission moved to the `>> **Party Sync**` event marker
  // (handled by the Stop hook, outside the sandbox). Narrative-session's
  // combat-return flow should include the marker after calling this.

  console.log("merged");
}

try {
  main();
} catch (err) {
  console.error(
    `party-status-merge failed: ${err && err.message ? err.message : err}`,
  );
  process.exit(1);
}
