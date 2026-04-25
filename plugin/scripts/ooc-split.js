#!/usr/bin/env node

/**
 * ooc-split.js — canonical grammar for splitting GM output into
 * PRIMARY/SECONDARY sections.
 *
 * Grammar:
 *   - `> PRIMARY` and `> SECONDARY` on their own lines (after trim) are the
 *     two register markers. They are symmetric — each one switches the
 *     active register to its own channel; neither is a "close" of the
 *     other and neither is a default state.
 *   - A reply has NO implicit default register. Any content before the
 *     first marker is discarded as "scratch" — the model is free to
 *     write synthesis, planning, or pre-work prose there; it will not
 *     reach the transcript or the player.
 *   - After the first marker, all subsequent content is attributed to
 *     the currently-open register until switched or EOF.
 *   - EOF implicitly closes whatever register is open.
 *   - Markers are exactly `> PRIMARY` / `> SECONDARY` after trim —
 *     lowercase or trailing content is not a marker (treated as a
 *     regular `>` line inside whatever register is open).
 *
 * Returns: ordered array of { kind: "narration" | "ooc", text }.
 *   - Marker lines are never included in any section's text.
 *   - Section text is trimmed of leading/trailing blank lines; internal
 *     formatting is preserved verbatim.
 *   - Empty or whitespace-only sections are omitted.
 *   - A reply with no marker at all yields an empty array.
 *
 * This module is the single source of truth for the PRIMARY/SECONDARY
 * register grammar. Both tts-clean.js (narration extraction for TTS) and
 * display-capture-response.js (per-section turn emission + opener
 * validation) consume it.
 */

"use strict";

const PRIMARY_MARKER = "> PRIMARY";
const SECONDARY_MARKER = "> SECONDARY";

function splitOocSections(input) {
  const lines = String(input).split("\n");
  const sections = [];
  let currentKind = null; // null == pre-opener scratch, discarded
  let buffer = [];

  const flush = () => {
    if (currentKind === null) {
      buffer = [];
      return;
    }
    const text = buffer.join("\n").replace(/^\s+|\s+$/g, "");
    if (text.length > 0) sections.push({ kind: currentKind, text });
    buffer = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed === PRIMARY_MARKER) {
      flush();
      currentKind = "narration";
      continue;
    }
    if (trimmed === SECONDARY_MARKER) {
      flush();
      currentKind = "ooc";
      continue;
    }
    buffer.push(rawLine);
  }
  flush();
  return sections;
}

module.exports = { splitOocSections, PRIMARY_MARKER, SECONDARY_MARKER };
