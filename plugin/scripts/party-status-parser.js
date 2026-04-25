/**
 * party-status-parser.js — Pure logic module for party status marker parsing
 *
 * Parses inline status markers from GM responses and applies them to a
 * party-status.json object. No file I/O, no process control — fully testable.
 *
 * Marker syntax: lines beginning with `>> **Name** operations...`
 * See plugin/docs for the full marker syntax specification.
 *
 * ---
 * Design invariant — `>>` markers are a GM authoring surface for runtime
 * mutations only. Supported targets:
 *   - HP (current / max / temp / baseMax)
 *   - AC.current
 *   - Top-level {current, max} resources (deltas and overrides on .current)
 *   - Nested {current, max} resources (Spells.N, etc.)
 *   - currency, concentration, position
 *   - Conditions (+ / - / clear)
 *   - Reserved targets: NextUp, Initiative
 *   - Rest macros (Long Rest, Short Rest)
 *
 * Deliberately NOT reachable via markers:
 *   - Static identity (name, race, level, classInfo, proficiencyBonus, token,
 *     abilities.*)
 *   - Caster-derived (SpellDC, SpellAttack)
 *   - Resource metadata (.max, .shortRest, .longRest, .tooltip)
 *   - Arrays (spells[], feats[], weapons[], skillProficiencies, skillExpertise)
 *
 * For runtime array changes (mid-session weapon pickup, prepared-spell swap
 * at Long Rest), the GM edits the session working copy directly —
 * `.sessions/<sid>/party-status.json` — per the Field Reference in
 * `doc-templates/status-json-template.md`. Persist carries the change to canon
 * at session-end; Sync-Up propagates to the sheet.
 *
 * All other non-marker mutations flow through the companion-app inbox
 * (party-status-mutate.js) or authoring touchpoints (campaign-create,
 * companion-recruit, level-up). Anything not listed above falls through to
 * "Unknown resource" by design.
 * ---
 *
 * @module party-status-parser
 */

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

/** Matches a status marker line. Group 1: character name, Group 2: remainder. */
const MARKER_RE = /^>>\s*\*\*(.+?)\*\*(.+)$/;

/** Matches a rest macro. Group 1: "Long" or "Short". */
const REST_RE = /^:\s*(long|short)\s+rest\s*$/i;

/** Matches a condition addition: +ConditionName */
const ADD_CONDITION_RE = /^\+(\S.*)$/;

/** Matches a condition removal: -ConditionName */
const REMOVE_CONDITION_RE = /^-(\S.*)$/;

/** Matches condition clear: Conditions: [] */
const CLEAR_CONDITIONS_RE = /^Conditions\s*:\s*\[\s*\]\s*$/;

/**
 * Matches a resource operation: ResourceKey: value  or  ResourceKey.sub: value
 * Group 1: full dotted key (e.g. "HP", "HP.temp", "HP.max", "Spells.3")
 * Group 2: value part (e.g. "-6", "+8", "12")
 */
const RESOURCE_OP_RE = /^([\w.]+)\s*:\s*(.+)$/;

/** Strips trailing note after ` -- ` (space-dash-dash-space). */
const TRAILING_NOTE_RE = / -- .*/;

/**
 * Matches the Initiative reserved target's bracketed list payload.
 * Group 1: comma-separated list of names (may be empty).
 *
 * Used against the `cleaned` remainder (after leading `>> **Initiative**`
 * has been stripped), so the leading `:` is expected to still be present.
 * Example match: ": [Aragorn, Frodo, Goblin A]".
 */
const INITIATIVE_LIST_RE = /^:\s*\[\s*(.*?)\s*\]\s*$/;

/**
 * Round a currency value to 2 decimal places (gp-base: integer = gp, tenths = sp, hundredths = cp).
 * @param {number} n
 * @returns {number}
 */
function roundCurrency(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a number to [min, max].
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Check whether an object looks like a { current, max } resource.
 * @param {*} obj
 * @returns {boolean}
 */
function isResource(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    typeof obj.current === "number" &&
    typeof obj.max === "number"
  );
}

/**
 * Parse a numeric value string. Returns NaN if not a valid number.
 * Accepts optional leading +/- sign.
 * @param {string} str
 * @returns {number}
 */
function parseNum(str) {
  const trimmed = str.trim();
  if (trimmed === "") return NaN;
  return Number(trimmed);
}

// ---------------------------------------------------------------------------
// Marker line parsing
// ---------------------------------------------------------------------------

/**
 * Parse a single line of GM text looking for a status marker.
 *
 * @param {string} line - A single line of text from the GM response.
 * @returns {{ name: string, remainder: string } | null}
 *   The character name and raw remainder, or null if the line is not a marker.
 */
function parseMarkerLine(line) {
  const m = line.match(MARKER_RE);
  if (!m) return null;
  return { name: m[1].trim(), remainder: m[2] };
}

/**
 * Extract all marker lines from a multi-line GM response.
 *
 * @param {string} text - Full assistant message text.
 * @returns {Array<{ name: string, remainder: string }>}
 */
function extractMarkers(text) {
  const markers = [];
  for (const line of text.split("\n")) {
    const parsed = parseMarkerLine(line.trim());
    if (parsed) markers.push(parsed);
  }
  return markers;
}

// ---------------------------------------------------------------------------
// Operation classification and application
// ---------------------------------------------------------------------------

/**
 * Apply a single parsed operation to a character's status entry.
 *
 * @param {Object} charStatus - The character's status object (mutated in place).
 * @param {string} op - A single trimmed operation string (e.g. "HP: -6", "+Poisoned").
 * @returns {{ error?: string }} Empty object on success; `{ error }` on unknown/bad op.
 */
function applyOperation(charStatus, op) {
  // --- Condition add: +ConditionName ---
  const addMatch = op.match(ADD_CONDITION_RE);
  if (addMatch) {
    const cond = addMatch[1].trim();
    if (!Array.isArray(charStatus.Conditions)) {
      charStatus.Conditions = [];
    }
    if (!charStatus.Conditions.includes(cond)) {
      charStatus.Conditions.push(cond);
    }
    return {};
  }

  // --- Condition remove: -ConditionName ---
  // Must check this BEFORE resource ops, because "-Blinded" would also match
  // a resource delta. Disambiguate: if it starts with - and the rest is NOT
  // a number, treat as condition removal.
  const removeMatch = op.match(REMOVE_CONDITION_RE);
  if (removeMatch) {
    const afterDash = removeMatch[1].trim();
    // If the part after '-' is purely numeric, this is NOT a condition removal;
    // fall through to resource handling (e.g., a bare "-6" is not valid alone
    // without a key, but we should not treat it as condition removal).
    if (isNaN(Number(afterDash))) {
      const cond = afterDash;
      if (Array.isArray(charStatus.Conditions)) {
        charStatus.Conditions = charStatus.Conditions.filter((c) => c !== cond);
      }
      return {};
    }
    // Else fall through — it's a negative number without a resource key (malformed).
  }

  // --- Condition clear: Conditions: [] ---
  if (CLEAR_CONDITIONS_RE.test(op)) {
    charStatus.Conditions = [];
    return {};
  }

  // --- Resource operations: Key: value or Key.sub: value ---
  const resMatch = op.match(RESOURCE_OP_RE);
  if (resMatch) {
    const fullKey = resMatch[1].trim();
    const valStr = resMatch[2].trim();
    return applyResourceOp(charStatus, fullKey, valStr);
  }

  // Nothing matched — unknown operation
  return { error: `Unknown operation: "${op}"` };
}

/**
 * Apply a resource operation given a dotted key and value string.
 *
 * Handles:
 * - HP: -N (temp-aware damage)
 * - HP: +N (healing)
 * - HP: N  (override)
 * - HP.temp: N (set temp, take higher)
 * - HP.max: +/-N (delta on max, adjust current if over)
 * - Spells.N: +/-M (delta on nested slot)
 * - ResourceKey: +/-N or bare N (delta or override on .current)
 *
 * @param {Object} charStatus - Character status object (mutated).
 * @param {string} fullKey - Dotted key like "HP", "HP.temp", "Spells.3", "BardicInspiration".
 * @param {string} valStr - Value string like "-6", "+8", "12".
 * @returns {{ error?: string }}
 */
function applyResourceOp(charStatus, fullKey, valStr) {
  const parts = fullKey.split(".");

  // --- HP special handling ---
  if (parts[0] === "HP") {
    return applyHPOp(charStatus, parts, valStr);
  }

  // --- AC: { current, max } resource (delta or override on .current) ---
  // AC.current may exceed AC.max temporarily (Shield spell, defensive toggles).
  // Same semantics as HP: override sets .current directly; deltas add/subtract.
  // No clamping — AC is allowed to float above max for transient buffs.
  if (parts.length === 1 && parts[0] === "AC") {
    const n = parseNum(valStr);
    if (isNaN(n)) return { error: `Invalid AC value: "${valStr}"` };
    const hasPlusOrMinus = /^[+-]/.test(valStr.trim());
    // Ensure AC is an object; migrate scalar if encountered.
    if (typeof charStatus.AC === "number") {
      charStatus.AC = { current: charStatus.AC, max: charStatus.AC };
    } else if (!charStatus.AC || typeof charStatus.AC !== "object") {
      charStatus.AC = { current: 0, max: 0 };
    }
    if (hasPlusOrMinus) {
      charStatus.AC.current = (typeof charStatus.AC.current === "number" ? charStatus.AC.current : 0) + n;
    } else {
      charStatus.AC.current = n;
    }
    return {};
  }

  // --- position: string coordinate (combat-only, override semantics) ---
  // Positions are strings like "D5", "A1", "off-map" — not numeric, no deltas.
  if (parts.length === 1 && parts[0] === "position") {
    charStatus.position = valStr.trim();
    return {};
  }

  // --- currency: flat decimal number, rounded to 2dp, clamped ≥ 0 ---
  // Decimal gp-base: integer = gp, tenths = sp, hundredths = cp.
  // Supports delta (+N, -N) and override (N) like AC.
  if (parts.length === 1 && parts[0] === "currency") {
    const n = parseNum(valStr);
    if (isNaN(n)) return { error: `Invalid currency value: "${valStr}"` };
    const hasPlusOrMinus = /^[+-]/.test(valStr.trim());
    const current = typeof charStatus.currency === "number" ? charStatus.currency : 0;
    const next = hasPlusOrMinus ? current + n : n;
    charStatus.currency = Math.max(0, roundCurrency(next));
    return {};
  }

  // --- concentration: string override, with clear keywords ---
  // Accepts "", "-", or "none" (case-insensitive) as clear sentinels → stored as "".
  // Any other value stored verbatim (trimmed) — preserves multi-word spell names.
  if (parts.length === 1 && parts[0] === "concentration") {
    const raw = valStr.trim();
    const lower = raw.toLowerCase();
    if (raw === "" || raw === "-" || lower === "none") {
      charStatus.concentration = "";
    } else {
      charStatus.concentration = raw;
    }
    return {};
  }

  // --- token updates are not in scope for >> operations; skip silently? ---
  // Per spec: token is persistent, set at character creation. If someone
  // writes `token: ...`, we treat it as unknown op (falls through to error).

  // --- Dot-notated nested resource (e.g. Spells.3) ---
  if (parts.length === 2) {
    const parentKey = parts[0];
    const childKey = parts[1];
    const parent = charStatus[parentKey];
    if (!parent || typeof parent !== "object") {
      return { error: `Unknown resource: "${fullKey}" (parent "${parentKey}" not found)` };
    }
    const resource = parent[childKey];
    if (!isResource(resource)) {
      return { error: `Unknown resource: "${fullKey}" (not a {current, max} resource)` };
    }
    return applyDelta(resource, valStr);
  }

  // --- Top-level resource key (e.g. BI, HD) ---
  if (parts.length === 1) {
    const resource = charStatus[parts[0]];
    if (!isResource(resource)) {
      return { error: `Unknown resource: "${fullKey}" (not a {current, max} resource)` };
    }
    return applyDelta(resource, valStr);
  }

  return { error: `Unsupported key depth: "${fullKey}"` };
}

/**
 * Apply an HP-specific operation. Handles temp-aware damage, healing,
 * override, temp HP setting, and max / baseMax adjustments.
 *
 * Schema: HP = { current, max, temp, baseMax }
 *   - max:     current effective max (may drift from baseMax via Aid, curses, etc.)
 *   - baseMax: stable reference max (from character sheet). Long Rest restores max to baseMax.
 *   - temp:    temporary HP absorption pool (damage hits this first)
 *
 * @param {Object} charStatus - Character status object (mutated).
 * @param {string[]} parts - Key parts, e.g. ["HP"], ["HP", "temp"], ["HP", "max"].
 * @param {string} valStr - Value string.
 * @returns {{ error?: string }}
 */
function applyHPOp(charStatus, parts, valStr) {
  const hp = charStatus.HP;
  if (!hp || typeof hp !== "object") {
    return { error: `Character has no HP resource` };
  }
  // Ensure temp field exists
  if (typeof hp.temp !== "number") hp.temp = 0;

  // --- HP.temp: N — set temp HP (take higher, don't stack) ---
  if (parts.length === 2 && parts[1] === "temp") {
    const n = parseNum(valStr);
    if (isNaN(n)) return { error: `Invalid HP.temp value: "${valStr}"` };
    hp.temp = Math.max(hp.temp, n);
    return {};
  }

  // --- HP.baseMax: +N / -N / N — PERMANENT max change ---
  // Adjusts both baseMax and max by the same delta. Used by level-up and
  // permanent magic items that change the character sheet's max HP.
  if (parts.length === 2 && parts[1] === "baseMax") {
    const n = parseNum(valStr);
    if (isNaN(n)) return { error: `Invalid HP.baseMax value: "${valStr}"` };
    const hasPlusOrMinus = /^[+-]/.test(valStr.trim());
    const currentBase = typeof hp.baseMax === "number" ? hp.baseMax : (typeof hp.max === "number" ? hp.max : 0);
    if (hasPlusOrMinus) {
      hp.baseMax = Math.max(0, currentBase + n);
      hp.max = Math.max(0, (typeof hp.max === "number" ? hp.max : currentBase) + n);
    } else {
      // Bare number — override both baseMax and max
      hp.baseMax = Math.max(0, n);
      hp.max = hp.baseMax;
    }
    // Clamp current to new max
    if (hp.current > hp.max) hp.current = hp.max;
    return {};
  }

  // --- HP.max: +N / -N / N — TEMPORARY max change ---
  // Adjusts only max. baseMax unchanged. Long Rest restores max to baseMax.
  // Used by Aid (temporary boost) and Vampire Bite / Necrotic HP reduction
  // (temporary reduction that reverts on long rest).
  if (parts.length === 2 && parts[1] === "max") {
    const n = parseNum(valStr);
    if (isNaN(n)) return { error: `Invalid HP.max value: "${valStr}"` };
    const hasPlusOrMinus = /^[+-]/.test(valStr.trim());
    if (hasPlusOrMinus) {
      hp.max = Math.max(0, (typeof hp.max === "number" ? hp.max : 0) + n);
    } else {
      // Bare number — override max (leaves baseMax untouched)
      hp.max = Math.max(0, n);
    }
    // Clamp current to new max
    if (hp.current > hp.max) hp.current = hp.max;
    return {};
  }

  // --- HP: value (base key, no sub-property) ---
  if (parts.length === 1) {
    const n = parseNum(valStr);
    if (isNaN(n)) return { error: `Invalid HP value: "${valStr}"` };
    const hasPlusOrMinus = /^[+-]/.test(valStr.trim());
    const max = typeof hp.max === "number" ? hp.max : 0;

    if (!hasPlusOrMinus) {
      // Bare positive number — override HP.current, capped at max
      hp.current = Math.min(max, n);
      return {};
    }

    if (n < 0) {
      // Damage (negative delta): deduct from temp first, then current
      let damage = Math.abs(n);
      if (hp.temp > 0) {
        const absorbed = Math.min(hp.temp, damage);
        hp.temp -= absorbed;
        damage -= absorbed;
      }
      hp.current = Math.max(0, hp.current - damage);
      return {};
    }

    // Healing (positive delta): add to current, capped at max
    hp.current = Math.min(max, hp.current + n);
    return {};
  }

  return { error: `Unsupported HP sub-key: "${parts.join(".")}"` };
}

/**
 * Apply a delta or override to a generic { current, max } resource.
 *
 * @param {Object} resource - A `{ current, max }` resource object (mutated).
 * @param {string} valStr - Value string like "+2", "-1", "5".
 * @returns {{ error?: string }}
 */
function applyDelta(resource, valStr) {
  const n = parseNum(valStr);
  if (isNaN(n)) return { error: `Invalid resource value: "${valStr}"` };
  const hasPlusOrMinus = /^[+-]/.test(valStr.trim());

  if (hasPlusOrMinus) {
    // Delta: add to current, clamp to [0, max]
    resource.current = clamp(resource.current + n, 0, resource.max);
  } else {
    // Override: set current, clamp to [0, max]
    resource.current = clamp(n, 0, resource.max);
  }
  return {};
}

// ---------------------------------------------------------------------------
// Rest macros
// ---------------------------------------------------------------------------

/**
 * Apply a Long Rest to a single character entry.
 *
 * - All { current, max } resources: if `longRest` defined, apply it; else reset to max.
 * - HP: set current=max, temp=0.
 * - Spells: iterate each level slot, reset each to max (or per longRest).
 * - Conditions: cleared.
 *
 * @param {Object} charStatus - Character status object (mutated).
 */
function applyLongRest(charStatus) {
  // Clear concentration (always — 5e concentration caps at 1 hour, well within LR).
  if ("concentration" in charStatus) charStatus.concentration = "";
  // Drop initiative and isCurrentTurn (defensive — narrative status should never carry them).
  delete charStatus.initiative;
  delete charStatus.isCurrentTurn;

  for (const [key, val] of Object.entries(charStatus)) {
    if (key === "team") continue;
    if (key === "Conditions") {
      charStatus.Conditions = [];
      continue;
    }
    if (key === "HP") {
      if (val && typeof val === "object") {
        // Restore max to baseMax first (reverts temporary max changes from
        // Aid, Heroes Feast, Vampire Bite, etc.). baseMax may be absent on
        // legacy entries — fall back to current max in that case.
        if (typeof val.baseMax === "number") {
          val.max = val.baseMax;
        }
        // Apply longRest rule if defined, else reset current to max
        if (typeof val.longRest === "string") {
          applyRestRule(val, val.longRest);
        } else {
          val.current = val.max;
        }
        val.temp = 0;
      }
      continue;
    }
    // Nested resource container (e.g. Spells with level sub-keys)
    if (val && typeof val === "object" && !Array.isArray(val) && !isResource(val)) {
      for (const [subKey, subVal] of Object.entries(val)) {
        if (isResource(subVal)) {
          if (typeof subVal.longRest === "string") {
            applyRestRule(subVal, subVal.longRest);
          } else {
            subVal.current = subVal.max;
          }
        }
      }
      continue;
    }
    // Top-level { current, max } resource (e.g. BI, HD)
    if (isResource(val)) {
      if (typeof val.longRest === "string") {
        applyRestRule(val, val.longRest);
      } else {
        val.current = val.max;
      }
      continue;
    }
  }
}

/**
 * Apply a Short Rest to a single character entry.
 *
 * - Resources with `shortRest` defined: apply the rule.
 * - Resources without `shortRest`: no change.
 * - HP and Conditions: untouched.
 *
 * @param {Object} charStatus - Character status object (mutated).
 */
function applyShortRest(charStatus) {
  // Clear concentration (5e concentration caps at 1 hour = SR duration).
  // Initiative is untouched: SR is out-of-combat anyway, and the postcombat
  // merge pipeline owns initiative cleanup.
  if ("concentration" in charStatus) charStatus.concentration = "";

  for (const [key, val] of Object.entries(charStatus)) {
    if (key === "team" || key === "Conditions" || key === "HP") continue;
    // Nested resource container (e.g. Spells)
    if (val && typeof val === "object" && !Array.isArray(val) && !isResource(val)) {
      for (const [subKey, subVal] of Object.entries(val)) {
        if (isResource(subVal) && typeof subVal.shortRest === "string") {
          applyRestRule(subVal, subVal.shortRest);
        }
      }
      continue;
    }
    // Top-level { current, max } resource
    if (isResource(val) && typeof val.shortRest === "string") {
      applyRestRule(val, val.shortRest);
    }
  }
}

/**
 * Apply a rest rule string to a { current, max } resource.
 *
 * Rules:
 * - "max" — set current to max
 * - "+N" — add N to current, capped at max
 *
 * @param {Object} resource - { current, max } resource (mutated).
 * @param {string} rule - Rest rule string, e.g. "max", "+4".
 */
function applyRestRule(resource, rule) {
  if (rule === "max") {
    resource.current = resource.max;
    return;
  }
  const plusMatch = rule.match(/^\+(\d+)$/);
  if (plusMatch) {
    const n = parseInt(plusMatch[1], 10);
    resource.current = Math.min(resource.max, resource.current + n);
    return;
  }
  // Unknown rule — no change (graceful)
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Parse all status markers from a GM response and apply them to the status object.
 *
 * This is the primary export. It mutates `statusObj` in place and returns
 * whether any changes were made, plus any errors encountered.
 *
 * @param {Object} statusObj - The parsed party-status.json object. Mutated in place.
 * @param {string} lastAssistantMessage - The full GM response text.
 * @returns {{ status: Object, changed: boolean, errors: string[] }}
 *   - `status`: the (possibly mutated) status object (same reference as input)
 *   - `changed`: true if any markers were found and processed
 *   - `errors`: array of non-fatal error messages (unknown keys, bad syntax, etc.)
 */
function parseAndApply(statusObj, lastAssistantMessage) {
  const errors = [];

  if (!statusObj || typeof statusObj !== "object") {
    return { status: statusObj, changed: false, errors };
  }
  if (!lastAssistantMessage || typeof lastAssistantMessage !== "string") {
    return { status: statusObj, changed: false, errors };
  }

  const markers = extractMarkers(lastAssistantMessage);
  if (markers.length === 0) {
    return { status: statusObj, changed: false, errors };
  }

  // Build a display-name → [slug...] index for party members (pc-* / co-* keys).
  // Array-valued to tolerate the rare PC+companion display-name collision.
  // Non-party entries (enemies, NPCs) are keyed by display name directly — they
  // never go through the name index.
  const nameIndex = buildNameIndex(statusObj);

  for (const { name, remainder } of markers) {
    // Strip trailing notes (everything after ` -- `)
    const cleaned = remainder.replace(TRAILING_NOTE_RE, "").trim();
    if (!cleaned) continue;

    // --- NextUp reserved target: `>> **NextUp**: CharName [-- optional comment]` ---
    // Sets `isCurrentTurn: true` on the named character and clears the flag
    // from all other characters. Only one character is "current" at a time.
    // The `--` comment tail (if present) is stripped before name extraction.
    // Payload may be a slug (`pc-aragorn`) or display name (`Aragorn`) — the
    // latter resolves via the party-member name index.
    if (name === "NextUp") {
      const charName = cleaned.replace(/^:\s*/, "").replace(/--.*$/, "").trim();
      if (!charName) {
        errors.push(`Invalid NextUp marker: "${cleaned}"`);
        continue;
      }
      const slugs = resolveSlugs(statusObj, nameIndex, charName);
      if (slugs.length === 0) {
        errors.push(`Unknown character in NextUp marker: "${charName}"`);
        continue;
      }
      // Clear isCurrentTurn from all characters first
      for (const cn of Object.keys(statusObj)) {
        delete statusObj[cn].isCurrentTurn;
      }
      // NextUp is single-character; if the name resolves to multiple slugs
      // (collision), set the flag on all of them — display will only ever
      // pick one but keeping behavior consistent with other broadcasts.
      for (const slug of slugs) {
        statusObj[slug].isCurrentTurn = true;
      }
      continue;
    }

    // --- Initiative reserved target: `>> **Initiative**: [NameA, NameB, ...]` ---
    // Assigns 1-indexed `.initiative` to each named character. Unknown names
    // are logged as errors but still consume their slot index (so known names
    // downstream of a typo still land at their intended list position).
    if (name === "Initiative") {
      const iMatch = cleaned.match(INITIATIVE_LIST_RE);
      if (!iMatch) {
        errors.push(`Invalid Initiative marker: "${cleaned}"`);
        continue;
      }
      const listStr = iMatch[1];
      const items = listStr.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
      items.forEach((itemName, index) => {
        const slugs = resolveSlugs(statusObj, nameIndex, itemName);
        if (slugs.length === 0) {
          errors.push(`Unknown character in initiative list: "${itemName}"`);
          return;
        }
        for (const slug of slugs) {
          statusObj[slug].initiative = index + 1;
        }
      });
      continue;
    }

    // Determine target characters
    const targets = resolveTargets(statusObj, nameIndex, name);
    if (targets.length === 0) {
      errors.push(`Unknown character: "${name}"`);
      continue;
    }

    // Check for rest macros BEFORE pipe-splitting
    const restMatch = cleaned.match(REST_RE);
    if (restMatch) {
      const restType = restMatch[1].toLowerCase();
      for (const charStatus of targets) {
        if (restType === "long") {
          applyLongRest(charStatus);
        } else {
          applyShortRest(charStatus);
        }
      }
      continue;
    }

    // Pipe-split into individual operations
    const ops = cleaned.split("|").map((s) => s.trim()).filter(Boolean);

    for (const op of ops) {
      for (const charStatus of targets) {
        const result = applyOperation(charStatus, op);
        if (result.error) {
          errors.push(`[${name}] ${result.error}`);
        }
      }
    }
  }

  return { status: statusObj, changed: true, errors };
}

/**
 * Build a display-name → [slug...] lookup for party members.
 *
 * Walks `statusObj` entries; for each key that starts with `pc-` or `co-` and
 * whose value carries a string `name`, records the mapping from the display
 * name to the slug. Array-valued so a rare display-name collision between a
 * PC and a companion still routes to both characters.
 *
 * @param {Object} statusObj
 * @returns {Object<string, string[]>}
 */
function buildNameIndex(statusObj) {
  const index = Object.create(null);
  for (const [key, entry] of Object.entries(statusObj)) {
    if (!key.startsWith("pc-") && !key.startsWith("co-")) continue;
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.name !== "string") continue;
    const display = entry.name;
    if (!index[display]) index[display] = [];
    index[display].push(key);
  }
  return index;
}

/**
 * Resolve a raw target string (from a marker) to the list of top-level keys
 * (slugs for party members, display names for non-party entries) that it
 * references. Direct-key match wins; otherwise consults the party name index.
 *
 * @param {Object} statusObj
 * @param {Object<string, string[]>} nameIndex
 * @param {string} target
 * @returns {string[]}
 */
function resolveSlugs(statusObj, nameIndex, target) {
  if (Object.prototype.hasOwnProperty.call(statusObj, target)) {
    return [target];
  }
  const slugs = nameIndex[target];
  if (slugs && slugs.length > 0) {
    return slugs.slice();
  }
  return [];
}

/**
 * Resolve a marker target name to one or more character status objects.
 *
 * - "Party" expands to all characters with `team === "party"`.
 * - A direct top-level key match (slug for party members, display name for
 *   non-party entries) wins.
 * - Otherwise consults the party-member name index to map display names to
 *   slugs.
 *
 * @param {Object} statusObj - The full status object.
 * @param {Object<string, string[]>} nameIndex - Display-name → [slug...] map.
 * @param {string} name - The target name from the marker line.
 * @returns {Object[]} Array of character status objects (may be empty).
 */
function resolveTargets(statusObj, nameIndex, name) {
  if (name === "Party") {
    return Object.values(statusObj).filter(
      (entry) => entry && entry.team === "party"
    );
  }
  const slugs = resolveSlugs(statusObj, nameIndex, name);
  return slugs.map((slug) => statusObj[slug]).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Primary API
  parseAndApply,

  // Helpers (exported for testing)
  parseMarkerLine,
  extractMarkers,
  applyOperation,
  applyResourceOp,
  applyHPOp,
  applyDelta,
  applyLongRest,
  applyShortRest,
  applyRestRule,
  resolveTargets,
  resolveSlugs,
  buildNameIndex,
  isResource,
  roundCurrency,

  // Constants (exported for testing)
  MARKER_RE,
  REST_RE,
  INITIATIVE_LIST_RE,
};
