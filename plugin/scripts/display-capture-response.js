#!/usr/bin/env node

/**
 * display-capture-response.js — Stop hook script
 *
 * Fires after every main-agent turn. If the session transcript is active
 * (per-session transcript.jsonl exists under .sessions/{session_id}/),
 * drains pending remote_input entries from the session inbox, applies any
 * ride-along mutations to party-status.json, then appends a v1 gm event
 * with the GM's last_assistant_message.
 *
 * The GM's text is split into PRIMARY/SECONDARY sections via ooc-split.js
 * before emission — each section becomes its own entry in the event's
 * `turns` array, with `kind: "ooc"` on SECONDARY turns (PRIMARY is the
 * default). Consumers (e.g. the companion app) can route SECONDARY turns to a
 * dedicated panel without parsing markers themselves.
 *
 * Why payload, not transcript file for GM response: Claude Code fires Stop
 * *before* it persists the assistant message to the session JSONL. The
 * transcript at hook time contains the player's message and bookkeeping but
 * NOT the assistant's response. The hook payload's `last_assistant_message`
 * field contains the GM's reply text directly. No race, no walk, no parsing.
 *
 * Limitation: `last_assistant_message` is the final text block of the
 * turn, not every text block. A turn that interleaves text with tool calls
 * will only capture the last text block. Acceptable for v1.
 */

const fs = require("fs");

const emit = require("./display-emit");
const { applyMutations } = require("./party-status-mutate");
const { splitOocSections } = require("./ooc-split");

/**
 * Validate that the GM reply opens with an explicit register marker
 * (`> PRIMARY` or `> SECONDARY`). Replies with no opener discard all their
 * content as pre-opener scratch — effectively silent — and are blocked
 * so the model retries with a proper opener.
 *
 * Pure event-marker replies (e.g. `>> **Session Start**` with no other
 * prose) are valid: they carry signal without any player-facing body.
 *
 * Returns { valid: boolean, reason?: string }. The reason is fed back
 * to the model via the Stop hook's `decision: "block"` mechanism.
 */
function validateReply(text) {
  const sections = splitOocSections(text);
  if (sections.length > 0) return { valid: true };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { valid: true };

  const allEventMarkers = lines.every((l) => l.startsWith(">>"));
  if (allEventMarkers) return { valid: true };

  return {
    valid: false,
    reason:
      "Your reply must open with `> PRIMARY` or `> SECONDARY` on its own line " +
      "before any player-facing prose. Anything before the first opener is " +
      "discarded as scratch space — safe to use for synthesis or planning, " +
      "but the actual reply must start with one of the two openers. Retry " +
      "with the correct structure.",
  };
}

/**
 * Drain pending remote_input entries from the session inbox into the display
 * transcript. Applies ride-along mutations to party-status.json and emits a
 * state/party_vitals event per inbox entry that carried mutations.
 *
 * Must be called BEFORE the GM event is written so seq ordering is correct —
 * remote_input events appear before the GM response that answered them.
 *
 * Deduplication: the inbox event's original `t` is preserved as the display
 * event's `t`. If a remote_input event with that `t` already exists in
 * transcript.jsonl, the inbox entry is skipped. No state file needed.
 *
 * Schema gating (per design §5.1): an inbox entry must carry at least one
 * turn or one skill to be captured. Mutation-only entries are rejected.
 *
 * All errors are swallowed — a failure here must not prevent the GM event
 * from being written.
 */
async function captureInboxInputs(perSessionFile, campaignPath, sessionId) {
  try {
    const inboxPath = emit.inboxFilePath(campaignPath, sessionId);
    if (!fs.existsSync(inboxPath)) return;

    // Collect t-values of remote_input events already in transcript.jsonl.
    const capturedTs = new Set();
    try {
      const displayContent = fs.readFileSync(perSessionFile, "utf8");
      for (const line of displayContent.split("\n")) {
        if (!line.trim()) continue;
        try {
          const ev = JSON.parse(line);
          if (ev.type === "remote_input" && ev.t) capturedTs.add(ev.t);
        } catch {
          // skip malformed lines
        }
      }
    } catch {
      return; // display file unreadable — skip capture, not fatal
    }

    // Parse inbox, filter to valid remote_input entries not yet captured.
    let inboxContent;
    try {
      inboxContent = fs.readFileSync(inboxPath, "utf8");
    } catch {
      return;
    }

    const pendingInputs = [];
    for (const line of inboxContent.split("\n")) {
      if (!line.trim()) continue;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      if (typeof entry.t !== "string" || !entry.t) continue;

      const hasTurns = Array.isArray(entry.turns) && entry.turns.length >= 1;
      const hasSkills = Array.isArray(entry.skills) && entry.skills.length >= 1;
      if (!hasTurns && !hasSkills) continue;

      if (capturedTs.has(entry.t)) continue;

      pendingInputs.push(entry);
    }

    if (pendingInputs.length === 0) return;

    // Sort ascending by t so temporal order is preserved.
    pendingInputs.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));

    const campaign = emit.campaignId(campaignPath);
    for (const inputObj of pendingInputs) {
      try {
        const typeSpecific = { turns: inputObj.turns };
        if (Array.isArray(inputObj.skills) && inputObj.skills.length >= 1) {
          typeSpecific.skills = inputObj.skills;
        }
        if (inputObj.mutations && typeof inputObj.mutations === "object") {
          typeSpecific.mutations = inputObj.mutations;
        }

        await emit.appendNextEvent(
          perSessionFile,
          "remote_input",
          {
            session_id: sessionId,
            campaign,
            t: inputObj.t,
          },
          typeSpecific,
        );

        // Apply ride-along mutations to party-status.json if present.
        if (
          inputObj.mutations &&
          typeof inputObj.mutations === "object" &&
          !Array.isArray(inputObj.mutations)
        ) {
          const statusFile = emit.partyStatusFilePath(campaignPath, sessionId);
          if (!fs.existsSync(statusFile)) continue;

          let statusObj;
          try {
            statusObj = JSON.parse(fs.readFileSync(statusFile, "utf8"));
          } catch {
            continue;
          }
          const { changed } = applyMutations(statusObj, inputObj.mutations);
          if (!changed) continue;

          try {
            fs.writeFileSync(statusFile, JSON.stringify(statusObj, null, 2) + "\n");
          } catch {
            continue;
          }
          await emit.emitPartyVitalsState(campaignPath, sessionId, statusObj);
        }
      } catch {
        // Per-entry failure is non-fatal; continue with next input.
      }
    }
  } catch {
    // Non-fatal — GM response capture proceeds regardless.
  }
}

async function main() {
  const campaignPath = emit.getActiveCampaign();
  if (!campaignPath) return;

  const input = await emit.readHookInput();
  if (!input) return;

  const sessionId = input.session_id;
  if (!sessionId) return;

  const text = (input.last_assistant_message || "").trim();
  if (!text) return;

  // Opener validation. A reply with narrative prose but no `> PRIMARY`
  // or `> SECONDARY` opener would land as empty after sectioning — the model's
  // body would silently vanish. Block the stop so the model retries with
  // a proper opener. See ooc-split.js for the grammar.
  //
  // Known limitation: party-status-update.js is a sibling Stop hook and
  // still runs on the rejected reply. Any `>>` mutations in the invalid
  // body apply, and may re-apply when the retry repeats them. Accepted
  // edge case — fix by manual party-status edit if it bites.
  const validation = validateReply(text);
  if (!validation.valid) {
    process.stdout.write(
      JSON.stringify({ decision: "block", reason: validation.reason }) + "\n",
    );
    return;
  }

  // Self-heal: if the SessionStart hook fired before the workspace env was
  // loaded, the transcript was never initialized. Covers the case where the
  // very first turn of a session is a Monitor fire (no preceding
  // UserPromptSubmit to self-heal earlier). Idempotent.
  await emit.ensureTranscript(campaignPath, sessionId);

  const perSessionFile = emit.perSessionFilePath(campaignPath, sessionId);

  // Drain pending inbox inputs first, then append gm event.
  await captureInboxInputs(perSessionFile, campaignPath, sessionId);

  // Split GM output into ordered PRIMARY/SECONDARY sections; one turn per
  // section. PRIMARY turns omit `kind` (the wire-format default); SECONDARY
  // turns carry `kind: "ooc"`. This mirrors the inbox schema (comms-protocol
  // §5.2) so both directions of the wire use the same turn shape.
  // The fallback single-turn array is only reached for empty replies and
  // pure event-marker replies — both of which validateReply() lets through
  // unmarked. Unmarked player-facing prose is blocked upstream and never
  // reaches this point.
  const sections = splitOocSections(text);
  const turns =
    sections.length > 0
      ? sections.map((s) =>
          s.kind === "ooc"
            ? { speaker: "GM", kind: "ooc", text: s.text }
            : { speaker: "GM", text: s.text },
        )
      : [{ speaker: "GM", text }];

  await emit.appendNextEvent(
    perSessionFile,
    "gm",
    {
      session_id: sessionId,
      campaign: emit.campaignId(campaignPath),
    },
    { turns },
  );
}

emit.safeRun(main);
