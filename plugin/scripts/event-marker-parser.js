/**
 * event-marker-parser.js — parse GM `>>` event markers
 *
 * Sibling of party-status-parser.js. Handles the **event register** of the
 * `>>` marker system — lines where the whole payload is inside the bold
 * delimiters and the line has no trailing content after them.
 *
 * Shape:
 *   >> **EventName**              (no argument)
 *   >> **EventName: value**        (with argument)
 *
 * Contrast with mutation markers, which always carry content AFTER the
 * bold: `>> **Aragon** HP: -6`. The two registers are regex-distinct:
 *   - Mutation regex requires `(.+)$` after `**`
 *   - Event regex requires `\s*$` after `**`
 * so the same line never ambiguously satisfies both.
 *
 * Registry-driven: only markers whose EventName appears in KNOWN_EVENTS
 * are returned. Anything else is ignored — not an error, not a warning —
 * because it may be a mutation marker the other parser handles, or a
 * user-typed line the platform doesn't own.
 *
 * @module event-marker-parser
 */

const MARKER_RE = /^>>\s*\*\*([^*]+?)\*\*\s*$/;

/**
 * Registry of known event types. Maps event name → optional value schema.
 *
 * - `values: null` means the event takes no argument. `>> **Foo**` matches.
 * - `values: Set<string>` means the event requires a value from the set.
 *   `>> **Foo: bar**` only matches if `bar` ∈ values.
 * - `values: "any"` would allow any string as value (not used today).
 */
const KNOWN_EVENTS = {
  "Session Mode": { values: new Set(["narrative", "combat", "meta", "test"]) },
  "Party Sync": { values: null },
  "Display Sync": { values: null },
  "Session Start": { values: null },
  "Monitor Ready": { values: null },
  "Roll Initiative": { values: null },
};

/**
 * Parse a single bold-content string into `{type, value}`.
 * Returns null if the content doesn't split cleanly.
 *
 * Examples:
 *   "Session Mode: narrative" → { type: "Session Mode", value: "narrative" }
 *   "Party Sync"              → { type: "Party Sync", value: null }
 */
function splitTypeValue(boldContent) {
  const trimmed = boldContent.trim();
  const colonIdx = trimmed.indexOf(":");
  if (colonIdx === -1) {
    return { type: trimmed, value: null };
  }
  const type = trimmed.slice(0, colonIdx).trim();
  const value = trimmed.slice(colonIdx + 1).trim();
  return { type, value: value || null };
}

/**
 * Validate a parsed `{type, value}` against the registry. Returns a
 * normalized event object or null if invalid (unknown type, or value
 * doesn't match expected schema).
 */
function validate(parsed) {
  const spec = KNOWN_EVENTS[parsed.type];
  if (!spec) return null;

  if (spec.values === null) {
    // No-arg event. Value present is a soft mismatch — ignore value.
    return { type: parsed.type };
  }

  if (spec.values instanceof Set) {
    if (!parsed.value || !spec.values.has(parsed.value)) return null;
    return { type: parsed.type, value: parsed.value };
  }

  // Future: spec.values === "any"
  return { type: parsed.type, value: parsed.value };
}

/**
 * Scan GM text for event markers. Returns an array of `{type, value?}`
 * objects in order of appearance. Duplicates are preserved (caller
 * decides what to do with multiple of the same event in one message).
 *
 * @param {string} text - the GM's message text
 * @returns {Array<{type: string, value?: string}>}
 */
function parseEventMarkers(text) {
  if (typeof text !== "string" || !text) return [];

  const out = [];
  for (const rawLine of text.split("\n")) {
    const match = rawLine.match(MARKER_RE);
    if (!match) continue;
    const parsed = splitTypeValue(match[1]);
    const valid = validate(parsed);
    if (valid) out.push(valid);
  }
  return out;
}

module.exports = {
  parseEventMarkers,
  KNOWN_EVENTS,
};
