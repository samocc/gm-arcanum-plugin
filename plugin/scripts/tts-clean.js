#!/usr/bin/env node

/**
 * tts-clean.js — deterministic narration cleaner for TTS
 *
 * Reads raw GM output from stdin, strips non-narration content, writes
 * narration-only text to stdout suitable for a text-to-speech API.
 *
 * OOC section grammar is defined in ooc-split.js — `> SECONDARY` / `> PRIMARY`
 * markers on their own lines bracket OOC content. This script delegates
 * that grammar to the splitter, keeps only narration sections, and applies
 * line-level cleanup to what remains:
 *
 *   - Drop single-`>` lines (mechanics / system markers like `> Roll d20`
 *     or `>> **Aragon** HP: -6`).
 *   - Strip markdown (bold, italic, list markers, headings).
 *   - Drop whole-line bracketed notes (`[pause]`).
 *   - Strip emoji pictographs, variation selectors, ZWJ sequences.
 *   - Collapse runs of 2+ blank lines to a single blank line.
 *
 * Exit codes:
 *   0 — non-empty cleaned output written to stdout
 *   1 — cleaned output is empty
 */

"use strict";

const { splitOocSections } = require("./ooc-split");

function cleanText(input) {
  // Extract narration sections via the shared OOC grammar. Adjacent
  // narration sections (interrupted by OOC blocks) rejoin with a single
  // newline — OOC removal does not insert blank-line separation.
  const narrationText = splitOocSections(input)
    .filter((s) => s.kind === "narration")
    .map((s) => s.text)
    .join("\n");

  const lines = narrationText.split("\n");
  const out = [];

  for (const rawLine of lines) {
    const leftTrimmed = rawLine.replace(/^\s+/, "");
    if (leftTrimmed.startsWith(">")) {
      continue;
    }
    out.push(cleanMarkdownLine(rawLine));
  }

  // Drop `null` entries (whole-line bracketed notes mapped to null).
  const filtered = out.filter((l) => l !== null);

  // Collapse runs of 2+ blank lines into a single blank line.
  const collapsed = [];
  let blankStreak = 0;
  for (const line of filtered) {
    const isBlank = line.trim() === "";
    if (isBlank) {
      blankStreak++;
      if (blankStreak <= 1) {
        collapsed.push("");
      }
    } else {
      blankStreak = 0;
      collapsed.push(line);
    }
  }

  return collapsed.join("\n").replace(/^\s+|\s+$/g, "");
}

function cleanMarkdownLine(line) {
  // Whole-line bracketed note? Drop.
  if (/^\s*\[.*\]\s*$/.test(line)) {
    return null;
  }

  let s = line;

  // Strip leading heading markers (`# `, `## `, etc.).
  s = s.replace(/^(\s*)#+\s+/, "$1");

  // Strip leading list markers (`- `, `* `, `1. `).
  s = s.replace(/^(\s*)(?:-|\*|\d+\.)\s+/, "$1");

  // Strip `**bold**` → `bold` (non-greedy, global).
  s = s.replace(/\*\*(.+?)\*\*/g, "$1");

  // Strip `*italic*` → `italic` (non-greedy, global). Done AFTER `**`.
  s = s.replace(/\*(.+?)\*/g, "$1");

  // Strip emoji pictographs (🎯 ⚔️ 🟣 💥 etc.) so TTS engines don't read them
  // aloud as "purple circle" / "crossed swords". Also strip orphan variation
  // selectors (U+FE0F) and zero-width joiners (U+200D) left behind by
  // multi-codepoint emojis (❤️, 👨‍👩‍👧, etc.).
  s = s.replace(/\p{Extended_Pictographic}/gu, "");
  s = s.replace(/[\uFE0F\u200D]/g, "");

  // Collapse runs of spaces created by stripped emojis; trim any leading
  // whitespace if the emoji was at the start of the line.
  s = s.replace(/ {2,}/g, " ").replace(/^ +/, "");

  return s;
}

function main() {
  const chunks = [];
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("end", () => {
    const input = Buffer.concat(chunks).toString("utf8");
    const cleaned = cleanText(input);
    if (cleaned.length === 0) {
      process.exit(1);
    }
    process.stdout.write(cleaned + "\n");
    process.exit(0);
  });
}

if (require.main === module) {
  main();
}

module.exports = { cleanText, cleanMarkdownLine };
