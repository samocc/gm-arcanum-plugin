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
 * Registry of known event types. Maps event name → schema.
 *
 * Three schema shapes are supported:
 *
 * - `values: null` — no argument. `>> **Foo**` matches.
 * - `values: Set<string>` — single value from a fixed set.
 *   `>> **Foo: bar**` only matches if `bar` ∈ values.
 * - `payload: { keyName: { required, values? }, ... }` — multi-field key=value
 *   payload. `>> **Foo: k1=v1, k2=v2**` matches if every required key is
 *   present and every key with a `values` set has a value in that set.
 *   Extra keys not in the schema reject the marker.
 *
 * Intent namespace (`intent/*` wire types):
 *   The producer/consumer contract for `intent/*` events lives in
 *   `plugin/docs/app-contract.md` ("Intents" section). Adding a new intent
 *   here implies updating the dispatcher in `party-status-update.js` to map
 *   the human-readable name to its `intent/<name>` wire event.
 */
const KNOWN_EVENTS = {
  // Status / sync — consumer reacts; no user decision gates the event.
  "Session Mode": { values: new Set(["narrative", "combat", "meta", "test"]) },
  "Party Sync": { values: null },
  "Display Sync": { values: null },
  "Session Start": { values: null },
  "Monitor Ready": { values: null },

  // Intents — GM-proposed actions awaiting consumer confirmation.
  // Producer rule: emit, stop, do not invoke the implied skill.
  "Roll Initiative": { values: null },
  "Session End": { values: null },
  "IP Validation": {
    payload: {
      kind: { required: true, values: new Set(["Race", "Class", "Subclass"]) },
      value: { required: true },
    },
  },
  "Start Session": {
    payload: {
      mode: { required: true, values: new Set(["combat", "meta"]) },
    },
  },
  "Resume Session": { values: null },
};

/**
 * Parse a single bold-content string into `{type, value}`.
 * Returns null if the content doesn't split cleanly.
 *
 * Examples:
 *   "Session Mode: narrative" → { type: "Session Mode", value: "narrative" }
 *   "Party Sync"              → { type: "Party Sync", value: null }
 *
 * For payload-carrying intents the `value` side is a key=value list — that
 * second-level parsing happens in `validate()`, not here.
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
 * Parse a key=value list (`"k1=v1, k2=v2"`) into a flat object.
 * Returns null if the input is malformed (missing `=`, empty key/value,
 * duplicate key). Tolerant of whitespace around `=` and `,`.
 */
function parseKeyValuePairs(s) {
  if (!s) return null;
  const out = {};
  for (const rawPair of s.split(",")) {
    const pair = rawPair.trim();
    if (!pair) return null;
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) return null;
    const k = pair.slice(0, eqIdx).trim();
    const v = pair.slice(eqIdx + 1).trim();
    if (!k || !v) return null;
    if (Object.prototype.hasOwnProperty.call(out, k)) return null;
    out[k] = v;
  }
  return out;
}

/**
 * Validate a parsed `{type, value}` against the registry. Returns a
 * normalized event object (`{type}`, `{type, value}`, or `{type, payload}`)
 * or null if invalid.
 */
function validate(parsed) {
  const spec = KNOWN_EVENTS[parsed.type];
  if (!spec) return null;

  // No-arg event. Value present is a soft mismatch — ignore value.
  if (spec.values === null) {
    return { type: parsed.type };
  }

  // Single-value event.
  if (spec.values instanceof Set) {
    if (!parsed.value || !spec.values.has(parsed.value)) return null;
    return { type: parsed.type, value: parsed.value };
  }

  // Multi-key payload event.
  if (spec.payload) {
    if (!parsed.value) return null;
    const payload = parseKeyValuePairs(parsed.value);
    if (!payload) return null;

    // Every payload key must be in the schema.
    for (const k of Object.keys(payload)) {
      if (!Object.prototype.hasOwnProperty.call(spec.payload, k)) return null;
    }
    // Every required key must be present; every key with a values set must
    // carry an allowed value.
    for (const [k, schema] of Object.entries(spec.payload)) {
      const v = payload[k];
      if (schema.required && (v === undefined || v === "")) return null;
      if (v !== undefined && schema.values instanceof Set && !schema.values.has(v)) return null;
    }
    return { type: parsed.type, payload };
  }

  return null;
}

/**
 * Scan GM text for event markers. Returns an array of normalized event
 * objects in order of appearance. Each entry is one of:
 *   - `{type}`                   — no-arg event
 *   - `{type, value}`            — single-value event
 *   - `{type, payload: {...}}`   — multi-key payload event (intents w/ payload)
 *
 * Duplicates are preserved (caller decides what to do with multiple of the
 * same event in one message).
 *
 * @param {string} text - the GM's message text
 * @returns {Array<{type: string, value?: string, payload?: Object}>}
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
