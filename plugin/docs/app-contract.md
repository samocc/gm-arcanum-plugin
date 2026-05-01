# GM Arcanum Plugin — App Contract

> The wire contract between the GM Arcanum plugin and any display consumer: event schema, transport guarantees, inbox format, party-status shape, HTTP endpoints, and the `>>` marker grammar surface.

Related: [app-integration.md](../../docs/domains/app-integration.md)

## Overview

The plugin communicates with display consumers over two surfaces: an append-only JSONL transcript file (the canonical source of truth) and an optional HTTP push channel. Events flow one direction — plugin to consumer. The inbox file flows the opposite direction — consumer to plugin — and carries player input, skill invocations, and resource mutations.

All per-session files live under `{campaign}/.sessions/{session_id}/` on the plugin's local filesystem. `session_id` is the Claude Code session UUID. HTTP push is fire-and-forget; the file is always written first and is the recovery path for any missed events.

This document is the single authoritative reference for what crosses the plugin/consumer boundary. It does not describe how the plugin populates events — that lives in [app-integration.md](../../docs/domains/app-integration.md).

---

## Transport

### File-based (canonical)

Per-session artifacts are located at:

```
{GM_ARCANUM_ACTIVE_CAMPAIGN}/.sessions/{session_id}/
  transcript.jsonl       — append-only display event log
  inbox.jsonl            — consumer-written player input
  party-status.json      — live party vitals (replace-semantics snapshot)
```

`transcript.jsonl` is JSONL: one JSON object per line, terminated with `\n`. Events are append-only and never rewritten. A consumer may tail this file using ordinary filesystem watch APIs.

### HTTP push (optional)

If `GM_ARCANUM_DISPLAY_URL` is set, each event written to the transcript file is also POSTed to `{GM_ARCANUM_DISPLAY_URL}/events`:

| Attribute | Value |
|---|---|
| Method | `POST` |
| Content-Type | `application/json` |
| Body | Single event object (not a JSONL stream) |
| Auth | `Authorization: Bearer ${GM_ARCANUM_DISPLAY_TOKEN}` if set |
| Timeout | 2 seconds |
| Retries | None |

The plugin never reads HTTP responses. HTTP push is best-effort only; the JSONL file is the recovery path. One POST per event.

### Environment variables

| Variable | Purpose |
|---|---|
| `GM_ARCANUM_ACTIVE_CAMPAIGN` | Absolute path to the active campaign directory |
| `GM_ARCANUM_DISPLAY_URL` | Base URL for HTTP push (e.g. `http://localhost:8765`). Unset = HTTP disabled. |
| `GM_ARCANUM_DISPLAY_TOKEN` | Optional bearer token. Set = `Authorization` header added to every request. |
| `GM_ARCANUM_WORKSPACE_DIR` | Workspace root used by the consumer to resolve inbox write paths. |

---

## Envelope (v1)

Every event — regardless of type — carries these fields:

| Field | Type | Description |
|---|---|---|
| `v` | integer | Schema version. `1` for all v1 events. Check before branching on `type`. |
| `seq` | integer | Monotonic per-session counter. Starts at `0` for `transcript_start`; increments by 1 per event within the same `session_id`. |
| `session_id` | string | Claude Code session UUID. Equal to the `.sessions/{session_id}/` directory name. |
| `campaign` | string | Campaign identifier — basename of the active campaign directory (e.g. `"campaign-arjen"`). Primary grouping key for multi-session timelines. |
| `t` | string | ISO 8601 timestamp of event emission. Use for display ordering. |
| `type` | string | Event type discriminator. See event types below. |

Type-specific fields appear alongside the envelope fields. Consumers must ignore unknown top-level fields (additive evolution, no version bump required).

---

## Event types

### `transcript_start`

Marks the beginning of the per-session transcript file. Exactly one per file, always at `seq=0`. Written before any other event in the session.

No type-specific fields. The session mode is not recorded here — it arrives separately in a `session_mode` event once the session-type skill runs.

```json
{"v":1,"seq":0,"session_id":"79e71829-98f1-4eaf-b199-6466363de0ee","campaign":"campaign-arjen","t":"2026-04-11T18:42:10.000Z","type":"transcript_start"}
```

---

### `session_mode`

Declares the operating mode for the session. Arrives after `transcript_start` once the session-type skill runs. A session may emit multiple `session_mode` events (e.g., a meta session transitioning to narrative). The most recent event is authoritative.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `mode` | string | yes | One of `"narrative"`, `"combat"`, `"meta"`, `"test"`. |

```json
{"v":1,"seq":2,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T18:42:12.000Z","type":"session_mode","mode":"narrative"}
```

---

### `session_start`

Claude Code SessionStart hook passthrough. Fires on every session start, resume, clear, or compact event within the same `session_id`. May occur any number of times per session. This is a lifecycle ping — not the beginning of the transcript (that is `transcript_start`).

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `source` | string | no | Passed through from Claude Code. Known values: `"startup"`, `"resume"`, `"clear"`, `"compact"`. Unknown values are opaque. |

```json
{"v":1,"seq":15,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T19:15:40.891Z","type":"session_start","source":"resume"}
```

---

### `session_end`

Claude Code SessionEnd hook passthrough. Fires when the session ends from Claude Code's perspective. May occur any number of times per `session_id`. Does not mean the display session is terminated — a `session_start` on the same `session_id` may follow.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | no | Passed through from Claude Code. Known values: `"clear"`, `"logout"`, `"prompt_input_exit"`, `"other"`. Unknown values are opaque. |

```json
{"v":1,"seq":14,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T19:15:33.012Z","type":"session_end","reason":"other"}
```

---

### `compact`

Claude Code PreCompact hook passthrough. Fires when the session context is about to be compacted. Rare.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `trigger` | string | no | Passed through from Claude Code if present. Known values: `"manual"`, `"auto"`. |

```json
{"v":1,"seq":80,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T20:30:15.000Z","type":"compact","trigger":"auto"}
```

---

### `stop_failure`

Claude Code StopFailure hook passthrough. Fires when the model errors out before reaching a clean `Stop`. The session may continue with subsequent prompts; this is a per-turn failure, not session termination.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `error` | string | no | Passed through from Claude Code. Observed values: `"invalid_request"`. Likely values per Claude Code error model: `"rate_limit"`, `"server_error"`, `"max_output_tokens"`, `"authentication_failed"`, `"billing_error"`, `"unknown"`. Unknown values are opaque. |
| `error_details` | string | no | Raw API error payload when the failure originates upstream (e.g. a 400 response from the Anthropic API including a `request_id`). Absent when the error is detected client-side. |
| `last_assistant_message` | string | no | User-visible error message, ready to display verbatim. |

```json
{"v":1,"seq":17,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-25T18:42:30.000Z","type":"stop_failure","error":"invalid_request","error_details":"400 {\"type\":\"error\",\"error\":{\"type\":\"invalid_request_error\",\"message\":\"prompt is too long: 5023717 tokens > 1000000 maximum\"},\"request_id\":\"req_011CaRHkqsmfcZ2rwpWy7vyW\"}","last_assistant_message":"Prompt is too long"}
```

---

### `notification`

Claude Code Notification hook passthrough. Fires when the session is parked waiting on user attention — permission prompts, idle timeouts. The model is not actively producing output until the notification clears.

**Headless caveat:** This hook was not observed firing in headless `claude -p` smoke tests against the conditions tried (`AskUserQuestion`, `default` permission mode, unallowed Bash). It is wired regardless — if it fires under conditions not tested or in interactive contexts, the consumer receives the event. Treat as informational signal only; do not depend on it for liveness.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `notification_type` | string | no | Passed through from Claude Code. Field name and values not verified by smoke test; treat as opaque. |
| `message` | string | no | User-visible notification text if present. |

```json
{"v":1,"seq":18,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-25T18:42:35.000Z","type":"notification","notification_type":"permission_request","message":"Allow Bash command?"}
```

---

### `permission_denied`

Claude Code PermissionDenied hook passthrough. Fires when a tool call is blocked by the permission classifier before invocation. The model continues the turn; this is informational signal only.

**Headless caveat:** This hook was not observed firing under settings.json `permissions.deny` rules in headless smoke tests — denials surface to the model as a tool result without a dedicated hook event. It is wired regardless for the case of MCP-driven or classifier auto-deny paths that may behave differently. Treat as informational signal only.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tool_name` | string | no | The tool that was denied (e.g. `"Bash"`, `"Write"`). |
| `tool_input` | object | no | The proposed tool input. May be large or carry sensitive material — see Sharp edges. |

```json
{"v":1,"seq":19,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-25T18:42:40.000Z","type":"permission_denied","tool_name":"Bash","tool_input":{"command":"rm -rf /"}}
```

---

### `tool_failure`

Claude Code PostToolUseFailure hook passthrough. Fires when a tool errored or was interrupted; the model continues the turn. Distinct from `permission_denied` (pre-invocation block) — `tool_failure` is post-invocation.

**Status:** Code path supported by [display-failure-emit.js](../scripts/display-failure-emit.js) but the hook is registered as `_disabled_PostToolUseFailure` in [hooks.json](../hooks/hooks.json) by default. Tool failures are routine in normal gameplay (the model probes files, runs exploratory commands); enabling by default would flood the consumer with low-signal events. Rename the key in `hooks.json` to enable. Consumers should accept this event when present but not depend on it.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tool_name` | string | no | The tool that failed. |
| `tool_input` | object | no | The tool input that produced the error. Same size/sensitivity caveat as `permission_denied`. |
| `error` | string | no | Error text passed through from Claude Code. |
| `is_interrupt` | boolean | no | True if the tool was interrupted (vs. errored on its own). |
| `tool_use_id` | string | no | Claude Code tool-use identifier. Pairs with the prior `PreToolUse` for the same call. |

```json
{"v":1,"seq":20,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-25T18:42:45.000Z","type":"tool_failure","tool_name":"Read","tool_input":{"file_path":"/tmp/missing.txt"},"error":"File does not exist.","is_interrupt":false,"tool_use_id":"toolu_015mwrEZfWXaVvG8y5ztKAL4"}
```

---

### `player`

A player message from the Claude Code terminal (UserPromptSubmit hook). Contains the player's raw text with IDE-injected tags stripped; `>>` dice markers are preserved.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | yes | The player's message text. |

```json
{"v":1,"seq":2,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T18:42:15.456Z","type":"player","text":"I approach the merchant"}
```

Monitor-triggered notification payloads (inbox events) are not captured as `player` events — they become `remote_input` events instead.

---

### `remote_input`

A player message received via the inbox. Originates from a consumer writing to `inbox.jsonl`. Each inbox entry is captured into the transcript as a `remote_input` event, appearing before the `gm` event that responded to it.

The `t` field preserves the originating timestamp set by the consumer (not the processing time), enabling consumers to match optimistic-display entries by `t`.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `turns` | array | yes (if no `skills`) | Speaker-tagged input segments. Each entry: `speaker` (folder slug — `pc-*` or `co-*`), `text` (non-empty string), optional `kind` (`"ooc"`; default is narration, omit when narration). |
| `skills` | array | yes (if no `turns`) | Skill invocation requests. Each entry: `name` (skill name without `gm:` prefix), optional `args` (string). |
| `mutations` | object | no | Diff-shaped party-status changes. Keys are character folder slugs; values are partial character objects. Deep-merge semantics: objects recurse, arrays replace. See inbox schema for constraint on mutations-only messages. |

```json
{"v":1,"seq":3,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-17T10:15:00.000Z","type":"remote_input","turns":[{"speaker":"pc-arjen","text":"I take the short rest."}],"mutations":{"pc-arjen":{"HP":{"current":57}}}}
```

---

### `gm`

The GM's response. The final text block of the assistant turn is split into primary and secondary sections using the `> PRIMARY` / `> SECONDARY` marker grammar; each section becomes one entry in the `turns` array, preserving emission order.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `turns` | array | yes | Speaker-tagged output segments. Each entry: `speaker` (currently always `"GM"`), `text` (non-empty string), optional `kind` (`"ooc"`; default is narration, omit when narration). Same shape as `remote_input.turns`. |

Pure narration (common case):
```json
{"v":1,"seq":3,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T18:42:22.789Z","type":"gm","turns":[{"speaker":"GM","text":"The merchant looks up from her wares..."}]}
```

Narration with an OOC aside:
```json
{"v":1,"seq":4,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T18:43:10.000Z","type":"gm","turns":[{"speaker":"GM","text":"The merchant's eyes narrow."},{"speaker":"GM","kind":"ooc","text":"Insight check would help here."},{"speaker":"GM","text":"She waits for your response."}]}
```

Known limitation: only the final text block of a GM turn is captured. If the turn interleaves text with tool calls (text → tool → text → tool → text), only the last text segment appears. This is a v1 trade-off.

---

### `state`

Replace-semantics state snapshot. State events replace the consumer's prior understanding of a particular state kind — they are complete snapshots, not deltas.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `state_kind` | string | yes | Identifier for the state kind. Active values: `"party_vitals"`. Future kinds: `"combat_status"`, `"battle_map"`. |
| `state` | object | yes | Full state payload for the named `state_kind`. Replace semantics — each event is the complete current state. |

For `state_kind: "party_vitals"`, the `state` payload is the full party-status object (see [Party-status schema](#party-status-schema) below).

```json
{"v":1,"seq":42,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-13T18:42:15.456Z","type":"state","state_kind":"party_vitals","state":{"pc-arjen":{"name":"Arjen","system":"dnd.5e.2024","team":"party","role":"pc","HP":{"current":39,"max":45,"temp":0,"baseMax":45},"Conditions":[]}}}
```

If `state_kind` is unknown, ignore the event (forward compatibility).

---

### `monitor_ready`

Signals that the inbox Monitor is armed for this session. Emitted once after `/gm:monitor-sync` runs and the Monitor is watching `inbox.jsonl`. Consumers may use this to confirm the input channel is live.

No type-specific fields beyond the universal envelope.

```json
{"v":1,"seq":5,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T18:42:18.000Z","type":"monitor_ready"}
```

---

### Intents (`intent/*`)

The `intent/*` namespace is reserved for **GM-proposed actions awaiting consumer confirmation**. Three rules define the namespace:

1. **Producer.** The plugin emits the marker, then stops. The GM does not invoke the implied skill on the same turn — invocation only happens on a subsequent turn after the consumer signals confirmation.
2. **Consumer.** A consumer is expected to gate the implied skill behind a user-facing confirmation surface. Acting on the implied skill without confirmation is a contract violation but the plugin doesn't police it.
3. **Confirmation channel.** Confirmation arrives as a `skills: [{name: "<implied-skill>"}]` entry in `inbox.jsonl`; refusal arrives as a regular `turns[]` entry expressing decline in natural language. The plugin Monitor handles both transparently.

Other event types (status / sync — `monitor_ready`, `session_mode`, `state`, etc.) are NOT intents. They carry no consumer-confirmation expectation; the consumer reacts or doesn't, but no user decision gates them.

Unknown `intent/*` types should be ignored (forward compatibility — same rule as unknown `state_kind`).

---

### `intent/roll_initiative`

Signals that the GM has called for initiative — combat is about to begin. Emitted when `>> **Roll Initiative**` appears in the GM's response. Implied skill: `combat-start`. No fields beyond the universal envelope.

```json
{"v":1,"seq":6,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T18:44:00.000Z","type":"intent/roll_initiative"}
```

---

### `intent/session_end`

Signals that the GM has detected player intent to wrap up the session but is not certain enough to invoke `/gm:session-end` directly. Emitted when `>> **Session End**` appears in the GM's response. Implied skill: `session-end`. No fields beyond the universal envelope.

The GM must NEVER auto-invoke `/gm:session-end` from contextual interpretation alone — the only paths to invocation are (a) the consumer sending `skills: [{name: "session-end"}]` after a confirmation surface, or (b) the user typing `/gm:session-end` directly in the terminal.

```json
{"v":1,"seq":11,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T22:15:00.000Z","type":"intent/session_end"}
```

---

### `intent/ip_validation`

Signals that a character-build flow (companion-recruit, add-pc, campaign-create, level-up) has selected a Race / Class / Subclass that is not declared in the workspace's `content-sources.md`. Emitted when `>> **IP Validation: kind=K, value=V**` appears in the GM's response. No single implied skill — the consumer presents a rights-confirmation surface and the user either confirms (the in-flight build resumes) or chooses an alternative (sent as a `turns[]` entry; the build resumes from that turn).

A single GM turn may emit multiple `intent/ip_validation` events when more than one selection is unlisted (e.g. non-SRD Race AND non-SRD Subclass on the same companion). Each gets a separate event in `seq` order; consumers should be prepared to render multiple confirmation surfaces or batch them per their UX choice.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `kind` | string | yes | One of `"Race"`, `"Class"`, `"Subclass"`. Matches a section of `content-sources.md`. |
| `value` | string | yes | The selection name as the GM has it (e.g. `"Tortle"`, `"Artificer"`, `"College of Lore"`). |

```json
{"v":1,"seq":21,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T19:08:00.000Z","type":"intent/ip_validation","kind":"Race","value":"Tortle"}
```

---

### `intent/start_session`

Signals that the GM proposes spawning a new Claude Code session of a given mode. Emitted when `>> **Start Session: mode=M**` appears in the GM's response. No implied skill — the consumer's response is to spawn a fresh session via the standard fresh-launch protocol (`/gm:<mode>-session`), passing `originating_session_id` to the child as the `GM_ARCANUM_ORIGINATING_SESSION_ID` env var so the child can echo back on resume.

**Fire-and-forget.** No ack is written back to the originating session — the consumer either spawns the new session and routes host + mobile to it, or dismisses (local hide on this device, no inbox write). The intent stays unresolved on the originating transcript on disk; if the user views it again, the card re-renders and pressing the action re-spawns or no-ops.

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `mode` | string | yes | One of `"combat"`, `"meta"`. Determines which session-type skill the spawned session loads. Carried in the marker payload. |
| `originating_session_id` | string | yes | Source session id. **Hook-injected** — the plugin's Stop hook fills this from the emitting session's id automatically; the GM does not carry it in the marker. Passed to the spawned child as `GM_ARCANUM_ORIGINATING_SESSION_ID` env var so the child can later emit `intent/resume_session` with the right id. |

```json
{"v":1,"seq":31,"session_id":"79e71829-...","campaign":"campaign-arjen","t":"2026-04-11T19:30:00.000Z","type":"intent/start_session","mode":"combat","originating_session_id":"79e71829-..."}
```

---

### `intent/resume_session`

Signals that the GM proposes routing the user back to a prior session — typically the originating session that spawned the current one. Emitted when `>> **Resume Session**` appears in the GM's response (no payload — see hook-injection note below). No implied skill — the consumer's response is to switch host + mobile to the named session and, if its agent is offline, resume the agent first; the consumer is also expected to write a generic OOC wake-up turn (e.g. `"Combat ended."`) into the resumed session's inbox so the receiving GM continues the narrative.

**Combat / meta session shutdown is out of scope.** The resume action does NOT kill the originating-of-this-emit session. v1: that session keeps running after the user accepts resume; the user can manually shut it via the sidebar dot. A follow-up "session done" signal can drive auto-shutdown later, separately from this intent.

**Fire-and-forget.** Same dismiss / unresolved-on-disk behavior as `intent/start_session`. On dismiss, the composer of the emitting session unlocks so the user can continue interacting with it (read the report, ask follow-ups).

**Type-specific fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `target_session_id` | string | yes | The Claude Code session id to route to. **Hook-injected** — the plugin's Stop hook fills this from the `GM_ARCANUM_ORIGINATING_SESSION_ID` env var (passed at session spawn time); the GM does not carry it in the marker. If the env var is unset (the emitting session was launched standalone, not spawned from an originating session), the hook logs a warning and skips emission entirely — the wire event is never produced. The GM emits the marker unconditionally; env-var presence is purely the hook's concern. Field is named `target_session_id` (not `session_id`) to avoid collision with the universal envelope's `session_id`, which always identifies the emitting session. |

```json
{"v":1,"seq":42,"session_id":"a1b2c3d4-...","campaign":"campaign-arjen","t":"2026-04-11T20:15:00.000Z","type":"intent/resume_session","target_session_id":"79e71829-..."}
```

---

## Party-status schema

`party-status.json` is the live per-session party vitals file. It is also carried as the `state` payload in `state_kind: "party_vitals"` events.

**Key convention:** party members (PCs and companions) are keyed by folder slug — `pc-*` or `co-*` — matching the `campaign-members/{slug}/` directory. Non-party entries (enemies, neutral NPCs tracked during combat) are keyed by display name or other stable ID.

### Required fields per party member

| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name. The key is a slug, so `name` is the only source for the human-readable name. |
| `system` | string | TTRPG system in hierarchical dotted lowercase: `"dnd.5e.2024"`, `"dnd.5e.2014"`, `"pf.2e"`. All party members share the same value. |
| `team` | string | `"party"` for PCs and companions. Non-party: `"enemy"` or `"neutral"`. Determines `**Party**` broadcast scope in the mutation grammar. |
| `role` | string | `"pc"` or `"co"`. Party members only. Distinguishes player character from companion. |
| `token` | string | Visual marker (emoji or symbol) for UI display. |
| `race` | string | Character race. |
| `classInfo` | string | Human-readable class/subclass/level summary, e.g. `"Bard 8 (College of Lore)"`. Static — updated only on level-up. |
| `level` | integer | Total character level. |
| `proficiencyBonus` | integer | Proficiency bonus. |
| `abilities` | object | Keyed by ability abbreviation (STR/DEX/CON/INT/WIS/CHA). Each: `{score, mod, save}`. |
| `AC` | `{current, max}` | Armor class. `current` may exceed `max` under transient buffs (Shield spell etc.). |
| `HP` | `{current, max, temp, baseMax}` | See HP sub-schema below. |
| `HD` | `{current, max}` | Hit dice. |
| `Speed` | `{current, max}` | Walking speed in feet. |
| `Conditions` | array of strings | Active condition names. Empty `[]` when none. |

### Optional fields per party member

| Field | Type | Notes |
|---|---|---|
| `SpellDC` | integer | Spellcasters only. |
| `SpellAttack` | integer | Spellcasters only. |
| `Spells` | object | Slot tracker. Keys are level strings (`"1"`–`"9"`); values are `{current, max}`. |
| `skillProficiencies` | array of strings | Skills where the character is proficient. |
| `skillExpertise` | array of strings | Skills where the character has expertise. |
| `spells` | array | Prepared spells and cantrips. See spells schema below. |
| `feats` | array | Character feats. See feats schema below. |
| `weapons` | array | Equipped weapon loadout. See weapons schema below. |
| `concentration` | string | Name of the spell currently being concentrated on. Empty string `""` when not concentrating. Never `null`. |
| `currency` | number | Liquid currency in decimal gp-base encoding: integer part = gp, tenths = sp, hundredths = cp. `24.56` = 24gp 5sp 6cp. |

Class and race resources (`BardicInspiration`, `Ki`, `Rage`, `LayOnHands`, `ActionSurge`, `SecondWind`, `SuperiorityDice`, `ChannelDivinity`, `WildShape`, `SorceryPoints`, `PactSlots`, etc.) appear as top-level fields, each `{current, max}`, with optional `shortRest`, `longRest`, and `tooltip` fields. Open schema — any `{current, max}` field is a displayable resource counter.

### HP sub-schema

```json
"HP": { "current": 39, "max": 45, "temp": 0, "baseMax": 45 }
```

| Field | Meaning |
|---|---|
| `current` | Current HP. |
| `max` | Current effective max. May temporarily drift above `baseMax` (Aid spell) or below it (Vampire Bite necrotic reduction). Reverts to `baseMax` on Long Rest. Use as the HP bar ceiling. |
| `temp` | Temporary HP pool. Damage deducts from this first, then `current`. |
| `baseMax` | Stable reference max from the character sheet. Changes only on level-up or permanent magic. |

### Combat-only fields

These fields are present only during combat sessions. They are stripped from narrative-session snapshots and removed from postcombat merge output.

| Field | Type | Notes |
|---|---|---|
| `position` | string | Grid coordinate, e.g. `"H5"`. |
| `initiative` | integer | 1-indexed turn order. |
| `isCurrentTurn` | boolean | `true` on the character whose turn is active. Absent on all others — never stored as `false`. |

### Spells schema (`spells[]`)

Prepared spells and cantrips. Distinct from `Spells` (the slot tracker).

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Spell name. |
| `level` | integer | yes | Base spell level. Cantrips are `0`. |
| `castTime` | string | no | `"action"`, `"bonus"`, `"reaction"`, or free-form (e.g. `"1 minute"`). Defaults to `"action"`. |
| `ritual` | boolean | no | True if castable as a ritual. Defaults to `false`. |
| `concentration` | boolean | no | True if the spell requires concentration. Defaults to `false`. |
| `tooltip` | string | no | Reference text for hover/expand UI. Static. |

### Feats schema (`feats[]`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Feat name. |
| `tooltip` | string | no | Reference text. Static. |

### Weapons schema (`weapons[]`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Weapon name. |
| `hit` | integer | yes | Attack bonus. |
| `damage` | string | yes | Damage expression including type, e.g. `"1d8 + 6 slashing"`. |
| `properties` | array of strings | no | Weapon properties, masteries, hand assignment, etc. |
| `bonuses` | array | no | Special effects. Each entry: `{name?, text}`. |
| `count` | integer | no | For stackable weapons (thrown daggers, etc.). Omitted when 1. |

### Non-party entries

Enemies and neutral NPCs tracked during combat carry a minimal shape: typically `name` (when keyed by display name, may omit), `team`, `token`, `HP`, `Conditions`. Combat-only fields (`position`, `initiative`, `isCurrentTurn`) apply. They are not valid mutation targets.

### Full example

```json
{
  "pc-arjen": {
    "name": "Arjen",
    "system": "dnd.5e.2024",
    "team": "party",
    "role": "pc",
    "token": "🟣",
    "race": "Halfling",
    "classInfo": "Rogue 3 · Swashbuckler / Bard 6 · College of Swords",
    "level": 9,
    "proficiencyBonus": 4,
    "abilities": {
      "STR": {"score": 10, "mod": 0, "save": 0},
      "DEX": {"score": 20, "mod": 5, "save": 9},
      "CON": {"score": 12, "mod": 1, "save": 1},
      "INT": {"score": 10, "mod": 0, "save": 4},
      "WIS": {"score": 11, "mod": 0, "save": 0},
      "CHA": {"score": 20, "mod": 5, "save": 5}
    },
    "skillProficiencies": ["Acrobatics", "Perception", "Performance", "Stealth"],
    "skillExpertise": ["Acrobatics", "Perception"],
    "AC": {"current": 17, "max": 17},
    "HP": {"current": 42, "max": 62, "temp": 10, "baseMax": 57},
    "HD": {"current": 9, "max": 9},
    "Speed": {"current": 35, "max": 35},
    "SpellDC": 17,
    "SpellAttack": 9,
    "Spells": {
      "1": {"current": 3, "max": 4},
      "2": {"current": 2, "max": 3}
    },
    "BardicInspiration": {
      "current": 3,
      "max": 5,
      "shortRest": "max",
      "tooltip": "Bonus action: grant one ally within 60 ft. a d8 Bardic Inspiration die."
    },
    "spells": [
      {"name": "Minor Illusion", "level": 0},
      {"name": "Healing Word", "level": 1, "castTime": "bonus", "tooltip": "Heal 2d4 + CHA, 60 ft range."},
      {"name": "Suggestion", "level": 2, "concentration": true}
    ],
    "feats": [
      {"name": "Alert"},
      {"name": "Dual Wielder", "tooltip": "+1 AC while wielding melee weapons in both hands."}
    ],
    "weapons": [
      {
        "name": "Cutlass +1",
        "hit": 9,
        "damage": "1d6 + 6 piercing",
        "properties": ["Finesse", "Light", "Main-hand"]
      }
    ],
    "Conditions": [],
    "concentration": "",
    "currency": 125.5
  }
}
```

---

## Inbox schema

The consumer appends one JSON object per line to `{campaign}/.sessions/{session_id}/inbox.jsonl`. Each line is a complete message. The plugin Monitor reads this file.

### Slim inbox format

Inbox events omit the full envelope (`v`, `type`, `campaign`, `session_id`) — those values are implicit from the file path. The written format is:

| Field | Type | Required | Notes |
|---|---|---|---|
| `t` | string | yes | ISO 8601 send-timestamp. Used for event ordering and optimistic-display deduplication in the consumer. |
| `turns` | array | yes (if no `skills`) | Speaker-tagged input segments. See `turns[]` schema below. |
| `skills` | array | yes (if no `turns`) | Skill invocations. See `skills[]` schema below. |
| `mutations` | object | no | Party-status diff. Must ride alongside at least one turn or skill — mutation-only messages are invalid. |

**Constraint:** a message must carry at least one turn or at least one skill. Mutation-only messages are rejected by the plugin.

### `turns[]` schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `speaker` | string | yes | Folder slug of the character (`pc-*` or `co-*`). Never a display name. |
| `text` | string | yes | Non-empty message text. |
| `kind` | string | no | `"ooc"` for out-of-character turns. Narration is the default; omit entirely rather than writing `"narration"`. |

### `skills[]` schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Skill name without the `gm:` prefix, e.g. `"session-end"`, `"prep"`. |
| `args` | string | no | Argument string passed to the skill. |

### `mutations` schema

Diff-shaped object matching the live `party-status.json` structure. Keys are character folder slugs; values are partial character objects with only the fields being changed.

Merge semantics: objects deep-merge (new keys add, existing scalars replace); arrays full-replace (the consumer computes the new full list and sends it entire).

Mutations target session state only. They do not write to canon character files — that happens at session-end.

### Examples

Single narration turn:
```json
{"t":"2026-04-17T10:15:00.000Z","turns":[{"speaker":"pc-arjen","text":"I flash the grin and step into the ring."}]}
```

Multi-speaker batch:
```json
{"t":"2026-04-17T10:15:00.000Z","turns":[{"speaker":"pc-arjen","text":"I slip behind the anchor."},{"speaker":"co-marshal","text":"Marshal sets the pike."}]}
```

OOC turn:
```json
{"t":"2026-04-17T10:15:00.000Z","turns":[{"speaker":"pc-arjen","kind":"ooc","text":"Quick question — is Cunning Action available?"}]}
```

Turn with mutation ride-along:
```json
{"t":"2026-04-17T10:15:00.000Z","turns":[{"speaker":"pc-arjen","text":"I take the short rest."}],"mutations":{"pc-arjen":{"HP":{"current":57},"BardicInspiration":{"current":5}}}}
```

Skill invocation alongside a turn:
```json
{"t":"2026-04-17T10:15:00.000Z","turns":[{"speaker":"pc-arjen","text":"Good stopping point."}],"skills":[{"name":"session-end"}]}
```

Skill with args:
```json
{"t":"2026-04-17T10:15:00.000Z","turns":[{"speaker":"pc-arjen","kind":"ooc","text":"Let's prep the semifinal."}],"skills":[{"name":"prep","args":"semifinal vs Kaiserheim"}]}
```

---

## HTTP endpoints

### `POST /events` — live push

One event per request. The plugin fires this for every event written to `transcript.jsonl`. Body is a single event object (not a JSONL stream). See [Envelope (v1)](#envelope-v1) and [Event types](#event-types) for the shape.

The consumer groups events by `session_id` to reconstruct per-session streams. Multiple `session_id` values may interleave if multiple Claude Code sessions are active against the same campaign.

### `POST /sync` — full resync

Triggered by the `/gm:display-sync` skill. Sends the complete current session state in one payload. The consumer replaces its view from this payload — idempotent.

**Request:**

```
POST /sync
Content-Type: application/json
Authorization: Bearer <token>   (same token as /events)
```

```json
{
  "session_id": "3b3b1632-5e8f-4099-8bb9-a786bcf4b318",
  "campaign": "campaign-arjen",
  "transcript": [
    {"v":1,"seq":0,"session_id":"...","campaign":"...","t":"...","type":"transcript_start"},
    {"v":1,"seq":1,"...":"...","type":"gm","turns":[{"speaker":"GM","text":"..."}]},
    {"v":1,"seq":2,"...":"...","type":"player","text":"..."}
  ],
  "party_status": {
    "pc-arjen": { "...": "..." }
  }
}
```

**Request fields:**

| Field | Type | Notes |
|---|---|---|
| `session_id` | string | Session UUID being synced. |
| `campaign` | string | Campaign identifier. |
| `transcript` | array | All events from `transcript.jsonl` ordered by `seq`. Same event shape as `POST /events`. |
| `party_status` | object or null | Full party-status snapshot. `null` when no party-status exists for this session (e.g. meta sessions). Same shape as the `state` field in `state_kind: "party_vitals"` events. |

**Expected consumer behavior:**

1. Clear existing state for `session_id`.
2. Replay `transcript` array in order — rebuild the chat log, state panels, etc., as if each event arrived individually via `/events`.
3. Apply `party_status` as the current party vitals (this is the latest on-disk state, which may be more recent than the last `state` event in the transcript if the session is still active).
4. Return success.

**Response:**

```json
{ "ok": true, "events_processed": 22 }
```

On error, return an appropriate HTTP status code with a body the plugin can relay to the user. `/sync` is synchronous — the plugin waits up to 10 seconds.

---

## Mutation / event markers (surface)

GM responses may contain `>>` marker lines. These lines are part of the `gm` event's raw `text` within each turn and are visible to consumers. The plugin parses them after capture; consumers may optionally parse or highlight them.

### Two registers — same sigil, different syntax

The `>>` sigil serves two distinct registers, regex-distinct:

**Mutation markers** — carry content after the bold-wrapped name:
```
>> **CharacterName** Resource: value
>> **Party** HP: -6
>> **Initiative**: [Name1, Name2, Name3]
>> **NextUp**: CharacterName
>> **Party**: Long Rest
>> **Party**: Short Rest
```

**Event markers** — the entire payload is inside the bold delimiters; nothing follows:
```
>> **Monitor Ready**
>> **Display Sync**
>> **Roll Initiative**
>> **Session End**
>> **Session Mode: narrative**
>> **IP Validation: kind=Race, value=Tortle**
>> **Start Session: mode=combat**
>> **Resume Session**
>> **Party Sync**
>> **Session Start**
```

A line never satisfies both registers simultaneously — mutation markers require content after `**`, event markers require `\s*$` after `**`.

**Event-marker payload forms.** Inside the bold delimiters, an event marker may carry either:
- nothing (no-arg, e.g. `>> **Roll Initiative**`),
- a single value after a colon (e.g. `>> **Session Mode: narrative**`), or
- a key=value list after a colon (e.g. `>> **IP Validation: kind=Race, value=Tortle**`). Pairs are comma-separated; whitespace around `=` and `,` is tolerated. Unknown keys, missing required keys, and duplicate keys reject the marker.

### Mutation marker grammar

```
>> **Target** Operation [| Operation ...] [-- cosmetic note]
```

- **Target** is a character display name, folder slug, `Party` (all party members), `Initiative`, or `NextUp`.
- **Operation** is one of:
  - `ResourceKey: +N` / `ResourceKey: -N` — numeric delta to `current`
  - `ResourceKey: N` — override `current`
  - `HP: -N` — damage (deducts from `temp` first, then `current`)
  - `HP: +N` — healing (capped at `max`)
  - `HP.temp: N` — set temp HP (takes higher value; temp HP does not stack)
  - `HP.max: +/-N` — temporary max HP change (reverts on Long Rest)
  - `HP.baseMax: +/-N` — permanent max HP change (persists through rests)
  - `AC: +/-N` or `AC: N` — delta or override on AC
  - `Spells.N: -1` — consume one slot at level N
  - `position: coord` — set grid position string
  - `currency: +/-N` or `currency: N` — delta or override on currency (decimal gp-base, rounded to 2dp, clamped ≥ 0)
  - `concentration: SpellName` — set concentration; `concentration: none` (or `-` or empty) clears
  - `+ConditionName` — add a condition
  - `-ConditionName` — remove a condition
  - `Conditions: []` — clear all conditions
- **Pipe `|`** separates multiple operations on the same character.
- **`--` tail** (everything after ` -- `) is cosmetic and ignored by the parser.

Special targets:
- `**Party**` — expands to all characters with `team: "party"`.
- `**Party**: Long Rest` / `**Party**: Short Rest` — rest macros; apply schema-defined rest rules to all party members.
- `**Initiative**: [Name1, Name2, ...]` — assigns 1-indexed `initiative` to each named character in list order.
- `**NextUp**: CharacterName` — sets `isCurrentTurn: true` on that character, clears it from all others.

### Event markers (registered)

Status / sync markers — consumer reacts; no user decision gates them:

| Marker | Emitted event type | Notes |
|---|---|---|
| `>> **Monitor Ready**` | `monitor_ready` | Monitor is armed. |
| `>> **Session Mode: narrative**` | `session_mode` with `mode: "narrative"` | Mode declaration. |
| `>> **Session Mode: combat**` | `session_mode` with `mode: "combat"` | |
| `>> **Session Mode: meta**` | `session_mode` with `mode: "meta"` | |
| `>> **Session Mode: test**` | `session_mode` with `mode: "test"` | |
| `>> **Party Sync**` | `state` / `party_vitals` | Emits the current party-status snapshot. |
| `>> **Display Sync**` | (triggers `/sync` HTTP call) | Initiates a full-state resync. No transcript event. |
| `>> **Session Start**` | (no-op) | Reserved; no event emitted. |

Intent markers — GM-proposed actions awaiting consumer confirmation. See [Intents (`intent/*`)](#intents-intent) for the namespace contract:

| Marker | Emitted event type | Implied skill | Notes |
|---|---|---|---|
| `>> **Roll Initiative**` | `intent/roll_initiative` | `combat-start` | Combat initiation signal. |
| `>> **Session End**` | `intent/session_end` | `session-end` | Player-intent-to-wrap signal. |
| `>> **IP Validation: kind=K, value=V**` | `intent/ip_validation` (with `kind`, `value`) | none — consumer routes confirm vs. alternative | Non-SRD content rights check. `kind` ∈ `{Race, Class, Subclass}`. Multiple per turn allowed. |
| `>> **Start Session: mode=M**` | `intent/start_session` (with `mode`, hook-injected `originating_session_id`) | none — consumer spawns a fresh session via fresh-launch protocol | Session spawn signal. `mode` ∈ `{combat, meta}`. The plugin Stop hook auto-fills `originating_session_id` from the emitting session id; the GM does not carry it in the marker. Spawned child receives that id as `GM_ARCANUM_ORIGINATING_SESSION_ID` env var. |
| `>> **Resume Session**` | `intent/resume_session` (with hook-injected `target_session_id`) | none — consumer routes host + mobile to the named session | Return-to-prior-session signal. The plugin Stop hook auto-fills `target_session_id` from `GM_ARCANUM_ORIGINATING_SESSION_ID`; if the env var is unset the hook logs a warning and skips emission entirely. The marker is fully no-arg. Field is `target_session_id` (not `session_id`) to avoid envelope collision. Consumer also writes a generic OOC wake-up turn into the resumed session's inbox. |

Unknown event markers (not in the registered list) are silently ignored.

### TTS cleaning

The `gm` event text carries `>>` lines. Consumers applying TTS should strip them, along with any `>` lines (mechanics, OOC section markers). The canonical stripping rules:

- Lines starting with `>` are dropped.
- Lines starting with `>>` are dropped (a `>>` line also starts with `>`).
- Markdown (`**bold**`, `*italic*`, list markers, headings) is stripped from surviving lines.
- Whole-line bracketed notes (`[pause]`) are dropped.
- Emoji pictographs are stripped.

See [app-integration.md](../../docs/domains/app-integration.md) for the reference implementation.

---

## Invariants

- `session_id` equals the Claude Code session UUID. It is stable across window close/reopen within the same conversation.
- Every per-session transcript begins with exactly one `transcript_start` event at `seq=0`.
- `seq` is monotonically increasing per `session_id`. Gaps indicate missed events. `(session_id, seq)` is the deduplication key.
- Transcript events are append-only and never rewritten. The JSONL file is the single source of truth.
- HTTP push is best-effort. The plugin never reads HTTP responses. Failures are silent; the JSONL file is the recovery path.
- `session_start` and `session_end` may occur any number of times per `session_id` in any order. Neither signals session termination.
- State events (`type: "state"`) use replace semantics — each is the complete current state for that `state_kind`, not a delta.
- The most recent `session_mode` event is the authoritative mode declaration.
- Inbox mutations target session state only; they never write to canon character files.
- Party members are keyed by folder slug (`pc-*`, `co-*`). Non-party entries are keyed by display name.
- `t` on `remote_input` events preserves the consumer's send-timestamp, not the processing time.

---

## Sharp edges

- **Mid-stream join via HTTP.** A consumer that starts receiving HTTP events after a session is already active will miss `transcript_start` and any events before it joined. Operate in degraded mode or call `/gm:display-sync` (which triggers `POST /sync`) to recover full state.
- **Monitor not armed.** If the Monitor is not watching `inbox.jsonl` (e.g., the session started before the plugin was installed), inbox events are lost until `/gm:monitor-sync` is invoked and a `monitor_ready` event is emitted.
- **Mutation-only inbox messages are rejected.** An inbox entry with `mutations` but no `turns` or `skills` is a schema violation and is silently skipped by the plugin. Mutations must ride alongside at least one turn or skill.
- **Mutation grammar errors are silent.** An unknown resource key or malformed operation in a `>>` marker is logged to `/tmp/cgm-display-error.log` but does not abort processing of remaining markers and does not surface to the GM or consumer.
- **Unknown event markers are ignored.** A `>> **UnknownEvent**` line in the GM's response is a no-op. No error, no event emitted.
- **Unknown inbox slug keys are silently ignored.** A mutation targeting a slug not present in `party-status.json` does nothing — the plugin does not create new characters from malformed mutation payloads.
- **`HP.max !== HP.baseMax` is informational.** `max > baseMax` means a temporary buff is active (e.g., Aid); `max < baseMax` means a temporary debuff. Both revert on Long Rest. The consumer can optionally display this difference; it carries no invariant meaning beyond that.
- **`currency` is clamped and rounded.** Every currency write is rounded to 2 decimal places and clamped to `≥ 0`. A mutation that would produce negative currency results in `0`.
- **`concentration` is a string, never `null`.** Empty string `""` means not concentrating.
- **`isCurrentTurn` is absent, never `false`.** Only the active character carries `isCurrentTurn: true`; the field is deleted from all others rather than set to `false`.
- **Unknown `v`.** A consumer receiving an event with an unknown `v` should warn and skip rather than attempting to parse it.
- **`POST /sync` is synchronous (10s timeout).** It blocks until the HTTP call completes. `POST /events` is async (2s timeout, detached process).
- **`tool_input` may carry secrets.** `permission_denied` and `tool_failure` events surface the raw `tool_input` object, which may include API keys, file contents, or other sensitive material. Consumers should not display `tool_input` raw in user-facing UI; treat as opaque and pretty-print only the tool name with a short summary.
- **`notification` and `permission_denied` may not fire in headless mode.** Both hooks are wired but were not observed firing in headless `claude -p` smoke tests (see [research_failure-hook-payloads.md](../../docs/research/research_failure-hook-payloads.md)). Consumers must not depend on either as a liveness signal.

---

## Related modules

- [app-integration.md](../../docs/domains/app-integration.md) — plugin-side implementation of this contract
- [display-sync-endpoint.md](../../docs/handoff/display-sync-endpoint.md) — handoff: app-side `/sync` implementation guidance
- [gm-arcanum-companion-input.md](../../docs/handoff/gm-arcanum-companion-input.md) — handoff: cross-repo wiring (`POST /input`, env vars, browser UI)
