# Status Markers — Mutation Vocabulary

Shared reference for `>>` mutation markers — the wire-level contract between the GM and the companion app for party state updates (HP, resources, conditions, currency, concentration, etc.).

---

## The `>>` Register

A Stop hook reads `>>` mutation markers in the GM's responses, updates `party-status.json`, and pushes live state to the companion app. Emit a marker **every time** a tracked value changes — damage, healing, spell casting, rest recovery, conditions applied or removed, resource spending.

`>>` lines in GM output come in two shapes, distinguished by content after the closing `**`:

- **Mutation register** — `>> **Name** Operation | ...` — content after closing `**`. Documented below.
- **Event register** — `>> **EventType**` or `>> **EventType: value**` — no content after closing `**`. Session-level signals (Session Mode, Party Sync, etc.).

---

## Format

```
>> **CharacterName** Operation | Operation | ...
```

- **Character name** is bold-wrapped (`**Name**`) — serves as parser anchor.
  - Use the **display name** — the `name` property inside each character object in `party-status.json` (e.g. `"El Brody"`, `"Hugol"`, `"Gandalf"`). Preserve spaces and capitalization verbatim.
  - **Do NOT use the outer slug key** (`pc-el-brody`, `co-hugol`) — those are folder slugs for machine routing, not valid marker names.
  - Enemies and non-party entries (combat-only) use their display name as the outer key.
- **One character per line.** Multiple operations on the same character use `|` separators.
- **`**Party**`** as the name broadcasts to all party members.

---

## Operations

| Operation | Meaning | Example |
|-----------|---------|---------|
| `HP: -N` | Damage (deducts from temp HP first, then current) | `>> **Aragon** HP: -6` |
| `HP: +N` | Healing (capped at max) | `>> **Aragon** HP: +10` |
| `HP.temp: N` | Grant temp HP (only applied if N > current temp) | `>> **Frodo** HP.temp: 8` |
| `HP.max: +N` / `-N` | Temporary max HP change (Aid: +5, Vampire Bite: -N). Reverted by Long Rest. | `>> **Party** HP.max: +5` |
| `HP.baseMax: +N` / `-N` | Permanent max HP change (level-up, Tome of Leadership). Persists through rest. | `>> **Frodo** HP.baseMax: +8` |
| `AC: +N` / `-N` | Delta on AC (Shield spell, Bladesinger Extra) | `>> **Mage** AC: +5` |
| `AC: N` | Override AC value | `>> **Mage** AC: 22` |
| `currency: +N` / `-N` | Currency delta. Decimal gp-base encoding (integer = gp, tenths = sp, hundredths = cp; e.g., `24.56` = 24gp 5sp 6cp). Clamped ≥ 0. | `>> **Aragon** currency: +125.50` |
| `currency: N` | Override currency value (bare decimal number). | `>> **Aragon** currency: 200` |
| `concentration: <spell>` | Set concentration to the named spell (replaces any prior value). | `>> **Gandalf** concentration: Hold Person` |
| `concentration: none` | Clear concentration. Also accepts `-` or empty string. | `>> **Gandalf** concentration: none` |
| `Spells.N: -1` / `+1` | Spend/restore spell slot at level N | `>> **Gandalf** Spells.3: -1` |
| `Resource: -N` / `+N` | Delta on any class resource | `>> **Bard** BardicInspiration: -1` |
| `Resource: N` | Override resource current value (bare number) | `>> **Frodo** BardicInspiration: 0` |
| `+Condition` | Add condition | `>> **Aragon** +Poisoned` |
| `-Condition` | Remove condition | `>> **Aragon** -Poisoned` |
| `Conditions: []` | Clear all conditions | `>> **Aragon** Conditions: []` |

> **Reserved target:** `**Party**` — broadcasts to all party members.

> **Concentration is a field, not a condition.** Use `concentration: <spell>` / `concentration: none` — never add it as a `+Condition` tag.

> **Combat-only operations** (`position`, `Initiative`, `NextUp`) are documented in `combat-session`.

---

## Rest Macros

```
>> **Party**: Long Rest
>> **Party**: Short Rest
```

- **Long Rest** — resets resources to max (or per-resource `longRest` rule), clears temp HP, **restores `HP.max` to `HP.baseMax`**, clears conditions. Also clears `concentration`.
- **Short Rest** — resets only resources that recharge on short rest (per character schema). Temporary HP.max changes persist. Also clears `concentration`.

> **HP.max vs HP.baseMax:** `HP.max` is the **current** max HP — it fluctuates (Aid raises, Vampire Bite lowers). `HP.baseMax` is the stable reference from the character sheet.

---

## Trailing Notes (Cosmetic)

Everything after ` -- ` (space-dash-dash-space) on a marker line is ignored by the parser. The companion app filters `>>` lines into a side log — away from the player's view. Use the tail **only** for ultra-compact log detail or GM-facing reference:

- **Resulting HP** — `[current/max HP]`. Anchors the GM's between-turn view of the fight.
- **Spell or action name** — e.g. `Fireball`, `Detect Magic`, `Aid`. Terse context for what produced the mutation.

Never narrative description — narration goes in the prose flow above or below the marker.

```
>> **Aragon** HP: -6 -- [39/45 HP]
>> **Gandalf** Spells.3: -1 -- Fireball
>> **Party** HP.max: +5 -- Aid
```

---

## Direct Edits to Party Status

`>>` markers cover runtime scalars and resource deltas. Anything they don't cover — arrays, tooltips, resource metadata, static identity — can be authored by editing the session working copy directly at `.sessions/${CLAUDE_SESSION_ID}/party-status.json`. Use this when there is a compelling reason and no marker fits.

Common cases:

- **Weapon pickup or change** — add / swap an entry in a character's `weapons[]`.
- **Mid-combat weapon addition** — weapon missed in pre-combat setup; add it now.
- **Prepared-spell swap at Long Rest** — edit `spells[]` for prepared casters (Wizard / Cleric / Druid / Paladin).
- **Tooltip correction** — the player flags a wrong rule reference on a spell, feat, or class resource; fix the `tooltip` inline.

Follow the Array Schemas and Field Reference in `${CLAUDE_PLUGIN_ROOT}/skills/doc-templates/status-json-template.md` for the target field's shape if edit is needed.

Changes persist at session-end (narrative) and Sync-Up propagates dynamic fields back to the character sheet. Combat inherits from narrative and writes back automatically. No other action needed.

> **Display refresh note.** A direct-edit-only turn refreshes the companion app on the *next* marker-bearing turn. If no other edit is incoming, trigger a refresh with any harmless `>>` update (e.g., setting a current value to the number it already has, or healing a character at max HP).
