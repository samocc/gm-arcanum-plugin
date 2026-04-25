# Status JSON — Schema, Sync Behavior & Creation

Structural reference for `status.json` — the per-character party status file at `campaign-members/{pc|co}-{name}/status.json`. Mirrors a subset of `character-sheet.md` in structured JSON plus carries live runtime state (HP current, conditions, resource pools).

**Four consumers touch this file:**
- **Creation** (campaign-create, companion-recruit via companion-sheet-internal) — writes a fresh file from the character sheet. Use the [Creation](#creation) section.
- **Level-up** (level-up / level-up-internal) — updates static fields when the character levels. Dual-writes with the sheet.
- **Mutations** (runtime via companion app inbox or GM `>>` markers) — writes runtime fields during play.
- **Sync** (sync-down at narrative session start; sync-up at session end via `utility-internal`) — reconciles static and dynamic fields with the sheet. Drives from the [Field Reference](#field-reference) + [Sync Behavior](#sync-behavior) below.

Canonical wire-format spec: [design_comms-protocol.md §8](../../../docs/design/design_comms-protocol.md).

---

## Field Reference

Every field's Sync Class governs how it behaves at session boundaries. See [Sync Behavior](#sync-behavior) for what each class does.

### Identity

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `name` | string | General → Name | skip | from sheet | Stable identity |
| `system` | string | `campaign-settings.md` → TTRPG System | skip | canonicalized ID | All party members share one value. See [System ID Canonicalization](#system-id-canonicalization). |
| `team` | string | — | skip | `"party"` | For PCs and companions |
| `role` | string | — | skip | `"pc"` or `"co"` | Set at creation; never changes |
| `token` | string (emoji) | General → Map Token | static | from sheet | |
| `race` | string | General → Race | static | from sheet | |
| `classInfo` | string | General → Class line | static | formatted string, e.g., `"Bard 8 (College of Lore)"` or `"Fighter 3 / Rogue 2"` | Updated only on level-up |
| `level` | integer | General → Class (sum of class levels) | static | total across all classes | |
| `proficiencyBonus` | integer | General → Proficiency Bonus | static | from sheet | |

### Abilities

For each of `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`:

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `abilities.<ABIL>.score` | integer | Abilities → Ability Scores table, Score column | static | from sheet | Raw ability score |
| `abilities.<ABIL>.mod` | integer | Abilities → Ability Scores table, Mod column | static | from sheet | Ability modifier |
| `abilities.<ABIL>.save` | integer | Abilities → Ability Scores table, Save column | static | from sheet | Includes PB if proficient |

### Skills

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `skillProficiencies` | array of strings | Abilities → Skills marked proficient | dynamic | from sheet | Order-insensitive set |
| `skillExpertise` | array of strings | Abilities → Skills marked expertise | dynamic | from sheet | Subset of proficiencies |

### Combat Stats

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `HP.current` | integer | — | runtime | `= baseMax` | Live HP |
| `HP.max` | integer | — | runtime | `= baseMax` | Effective max; may fluctuate via Aid etc. Long rest restores to `baseMax`. |
| `HP.baseMax` | integer | Combat → Stats → HP total | static | from sheet | Stable baseline |
| `HP.temp` | integer | — | runtime | `0` | |
| `AC.current` | integer | — | runtime | `= max` | May exceed `max` temporarily (Shield, etc.) |
| `AC.max` | integer | Combat → Stats → AC (flat first number before any parenthetical) | static | from sheet | |
| `HD.current` | integer | — | runtime | `= level` | |
| `HD.max` | integer | — (derived from `level`) | static | `= level` | One die per character level |
| `Speed.current` | integer | — | runtime | `= max` | |
| `Speed.max` | integer | Combat → Stats → Speed | static | from sheet | Walking speed in feet |

### Caster-Derived (spellcasters only; omit for non-casters)

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `SpellDC` | integer | Combat → Stats → Spell Save DC | static | from sheet | |
| `SpellAttack` | integer | Combat → Stats → Spell Attack | static | from sheet | |

### Spell Slots & Class Resources

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `Spells.<N>.current` | integer | — | runtime | `= max` | `N` is spell level as string (`"1"` — `"9"`) |
| `Spells.<N>.max` | integer | Spellcasting → Spell Slots (pipe-separated; first = level 1) | static | from sheet | Caster only. Omit levels with no slots |
| `<ResourceKey>.current` | integer | — | runtime | `= max` | See [Common Class Resources](#common-class-resources-reference) |
| `<ResourceKey>.max` | integer | Features list / dedicated combat subsection | static | from sheet | |
| `<ResourceKey>.shortRest` | string | — | static | see [Rest-Rule Syntax](#rest-rule-syntax) | Optional |
| `<ResourceKey>.longRest` | string | — | static | see [Rest-Rule Syntax](#rest-rule-syntax) | Optional |
| `<ResourceKey>.tooltip` | string | — | static | optional | Short rule reference |

### Arrays (reconcile by `name`; see [Name Matching Rules](#name-matching-rules))

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `spells[]` | array of objects | Spellcasting (all sections: Cantrips, Action, Bonus, Reaction, Ritual) | dynamic | from sheet | See [Array Schemas](#array-schemas) |
| `feats[]` | array of objects | Feats section | **asymmetric** | from sheet | Sync-down: sheet → status (between-session level-ups may add). Sync-up: flag drift (narrative play doesn't grant feats). |
| `weapons[]` | array of objects | Combat → Martial → Weapons | dynamic-weapons | from sheet | Task-1 cross-task rule at session-end. See [Array Schemas](#array-schemas) |

### Economy / Status

| Field | Type | Sheet Location | Sync Class | Initial | Notes |
|---|---|---|---|---|---|
| `currency` | number | General → Coin (decimal gp encoding) | dynamic | from sheet | Integer part = gp, tenths = sp, hundredths = cp. `24.56` = 24gp 5sp 6cp |
| `concentration` | string | — | runtime | `""` | Name of spell currently concentrated on |
| `Conditions` | array of strings | — | runtime | `[]` | Condition names during play |

### Combat-Only Transient

Present during combat sessions; stripped from the postcombat snapshot.

| Field | Type | Sync Class | Notes |
|---|---|---|---|
| `position` | string | runtime | Grid coordinate (e.g., `"D5"`) |
| `initiative` | integer | runtime | 1-indexed turn order |
| `isCurrentTurn` | boolean | runtime | Present on the entity whose turn is active |

---

## Sync Class Legend

| Class | Meaning |
|---|---|
| **`static`** | Authored at creation / level-up. Should not drift in narrative play. |
| **`dynamic`** | Can change in play via mutations, or via between-session sheet edits. |
| **`dynamic-weapons`** | Like `dynamic`, but session-end has Task-1 cross-task logic (see Sync Behavior). |
| **`runtime`** | Pure runtime state (lives only in status, never on the sheet). Never synced. |
| **`skip`** | Identity. Does not drift; not synced. |

**Asymmetric field:** `feats[]` is `dynamic` at sync-down but flagged at sync-up. Callout on the field row in the table above.

---

## Sync Behavior

Two sync procedures run at session boundaries, both implemented in `utility-internal/SKILL.md`:

- **[Party Status Sync-Down](../../utility-internal/SKILL.md#party-status-sync-down)** — runs at narrative session-start. Propagates between-session sheet edits into `status.json`. Direction: sheet → status.
- **[Party Status Sync-Up](../../utility-internal/SKILL.md#party-status-sync-up)** — runs at session-end after persist. Propagates intra-session runtime changes back to the sheet; flags unexpected drift. Direction: status → sheet (for dynamic fields) or flag (for static).

### Direction per Sync Class

| Sync Class | Session-Start (Sync-Down) | Session-End (Sync-Up) |
|---|---|---|
| `static` | sheet → status (silent) | **flag** drift (suggest: sheet → status) |
| `dynamic` | sheet → status | status → sheet |
| `dynamic-weapons` | sheet → status | **conditional** — status-has-not-sheet: add to sheet. sheet-has-not-status + Task-1 addition: add to status. sheet-has-not-status + no Task-1 addition: flag. |
| `runtime` | — (never synced) | — |
| `skip` | — | — |
| `feats[]` (asymmetric) | sheet → status | **flag** drift |

### Flag Cases (both boundaries)

- **Orphan resource keys** on `status.json` not mentioned on the sheet at all (e.g., stale `BardicInspiration` for a character whose class no longer includes it). Flag; do not auto-remove.
- **Unparseable sheet fields** (malformed table, missing expected section). Leave status unchanged; flag.

### Task-1 Cross-Task Rule (Sync-Up weapons only)

Helper B at session-end can run **Task 1 (Inventory Update)** and **Task 2 (Sync-Up)** in the same invocation. When Task 1 adds a weapon to the sheet from that session's Items Acquired, Task 2 must recognize it and propagate the addition to `status.json` rather than flagging it as ambiguous drift.

---

## Name Matching Rules

Used by both sync procedures when comparing fields between sheet and status.

**Resource keys** (e.g., `BardicInspiration`, `Rage`). Normalize for name-matching: strip spaces and punctuation when matching a sheet reference to a status key.
- Sheet `"Bardic Inspiration (5/SR)"` matches status key `BardicInspiration`.
- Sheet `"Lay on Hands (40 HP pool)"` matches status key `LayOnHands`.

**`spells[]` names with source tags.** Sheet entries may carry a `(source)` suffix tag marking their origin (e.g., `"Burning Hands (Domain)"`, `"Fire Bolt (Racial)"`). When comparing by name, strip the trailing parenthetical before matching. At sync-down, drop the suffix from the name stored in status. At sync-up, preserve the sheet's tag on entries whose bare name matches status.

**`spells[]` section → field inference** (used at sync-down when adding a new entry to status from the sheet):
- Cantrips section → `level: 0`
- Action section → `castTime: "action"` (or omit, default)
- Bonus Action section → `castTime: "bonus"`
- Reaction section → `castTime: "reaction"`
- Ritual section → `ritual: true`
- Longer cast times in free-form strings (e.g., `"10 minutes"`) inferred from sheet annotation when present

**Arrays in general:** `spells[]`, `feats[]`, `weapons[]` — treat as sets keyed by `name` (order-insensitive). Preserve status-side per-entry metadata (`tooltip`, `concentration`, `ritual`, etc.) when the name matches.

**Strings:** normalize whitespace and case for comparison; preserve original casing in writes.

---

## Array Schemas

### `spells[]` — prepared spells and cantrips

The character's prepared list. Separate from the `Spells` object (slot counts per level).

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Spell name |
| `level` | integer | yes | Base level (cantrips = `0`). Base level, not slot-cast level — `Healing Word` stays `1` even when upcast. |
| `castTime` | string | optional | Short forms: `"action"`, `"bonus"`, `"reaction"`. Longer cast times free-form. Omit when the value would be `"action"` (default). |
| `ritual` | boolean | optional | Defaults to `false`. Orthogonal to `castTime`. |
| `concentration` | boolean | optional | Defaults to `false`. Pairs with top-level `concentration` (currently-active concentration spell name). |
| `tooltip` | string | optional | Reference text for the spell. See [Tooltips](#tooltips). |

### `feats[]` — character feats

Short rule reference only — long descriptive features (subclass features, racial traits) stay on the sheet and are NOT duplicated here.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Feat name |
| `tooltip` | string | optional | Reference text for the feat. See [Tooltips](#tooltips). |

### `weapons[]` — equipped weapon loadout

Lean mechanical summary per weapon. The character sheet remains source of truth for full weapon descriptions, lore, and attunement notes.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Weapon name |
| `hit` | integer | yes | Total attack bonus (ability mod + PB + weapon enhancement) |
| `damage` | string | yes | Damage expression including type, e.g., `"1d8 + 6 slashing"` |
| `properties` | array of strings | optional | Flat bag: weapon properties, masteries, hand assignment, thrown ranges, magical markers. Example: `["Magical", "Finesse", "Light", "Main-hand", "Vex"]` |
| `bonuses` | array of `{name?, text}` | optional | Weapon-specific special effects. `name` optional. |
| `count` | integer | optional | For stackable weapons (thrown daggers, etc.). Omit when 1. |

Weapon-scoped charges (e.g., `Lightning surge 1/SR`) are tracked as a top-level resource (`{current, max, shortRest}`) — not nested under the weapon. The weapon's `bonuses` text describes the effect; the top-level resource tracks the live count. Redundant by intent.

---

## Rest-Rule Syntax

`shortRest` and `longRest` values describe recharge behavior on class resources:

| Value | Meaning |
|---|---|
| `"max"` | Refill `current` to `max` on that rest. |
| `"+N"` | Add `N` to `current`, capped at `max`. |
| omitted | Use default behavior. |

**Default rest behavior (when keys are omitted):**
- **Long Rest:** `current = max` (full recovery).
- **Short Rest:** no change.

**Rule of thumb:**
- **Omit both keys** when the resource follows the defaults — recovers fully on long rest, no change on short rest. Common case (Rage, Lay on Hands, Sorcery Points, Action Surge, etc.).
- **Add `shortRest`** only when the resource also recharges on short rest (Bardic Inspiration, Ki, Superiority Dice, Channel Divinity, Wild Shape, Second Wind, etc.). Long rest still refills via the default.
- **Add `longRest`** only when long-rest recovery is non-default (e.g., homebrew resource that recovers partially: `longRest: "+N"`).

Avoid redundant `longRest: "max"` — it's the default.

---

## System ID Canonicalization

The `system` field is a hierarchical dotted lowercase ID. Canonicalize the `TTRPG System` line from `campaign-settings.md` to one of:

| Source text | Canonical `system` value |
|---|---|
| `D&D 5e (2024)` | `dnd.5e.2024` |
| `D&D 5e (2014)` | `dnd.5e.2014` |
| `Pathfinder 2e` | `pf.2e` |
| Anything else | lowercase-hyphen slug of the source name |

All party members share the same `system` value — it comes from the campaign, not the character.

---

## Common Class Resources Reference

Include the row's `<Resource Key>` as a top-level object when the character has the feature. Only include resources the character actually possesses at their current level.

| Class | Resource Key | Max (typical) | Rest Rule |
|---|---|---|---|
| Bard | `BardicInspiration` | CHA mod (min 1); 5 uses at College of Lore 3rd+ | `shortRest: "max"` |
| Monk | `Ki` | Monk level | `shortRest: "max"` |
| Barbarian | `Rage` | Level-scaled (2 at 1st, 3 at 3rd, etc.) | *(none — default)* |
| Paladin | `LayOnHands` | 5 × Paladin level | *(none — default)* |
| Fighter (Battle Master) | `SuperiorityDice` | 4–6 based on level | `shortRest: "max"` |
| Cleric | `ChannelDivinity` | 1–3 based on level | `shortRest: "max"` |
| Druid | `WildShape` | 2 | `shortRest: "max"` |
| Fighter | `ActionSurge` | 1–2 based on level | `shortRest: "max"` |
| Fighter | `SecondWind` | 1 (6 at 20th) | `shortRest: "max"` |
| Sorcerer | `SorceryPoints` | Sorcerer level | *(none — default)* |
| Warlock | `PactSlots` | Level-scaled | `shortRest: "max"` |

**Naming convention:** Use CamelCase full names (`BardicInspiration`, `LayOnHands`, etc.). Keep abbreviations only for truly universal two-letter terms (`HP`, `AC`, `HD`) and already-short canonical names (`Ki`, `Rage`). Keeps status JSON self-documenting.

Other limited-use features (Wizard Arcane Recovery, Monk Stunning Strike pool, racial once-per-rest traits, etc.) use the same `{current, max, shortRest?, longRest?}` shape with a clear CamelCase name.

Class resources may carry an optional `tooltip` alongside the standard keys.

---

## Tooltips

Short, authoritative rule references attached to named elements — spells, feats, class resources. Two purposes:

- **UI:** companion app renders on hover or expand.
- **Authoring backstop:** rule text inline with the data reduces reliance on model memory for frequently-referenced items during play.

### Where they apply

| Location | Example |
|---|---|
| `spells[n].tooltip` | `"Heal 2d4 + CHA, 60 ft range."` |
| `feats[n].tooltip` | `"+1 AC while wielding two melee weapons. Draw/stow two one-handed weapons in one action."` |
| `<Resource>.tooltip` | `"Bonus action: grant one ally within 60 ft. a d8 Bardic Inspiration die."` |

Weapon `bonuses[n]` already carry rule text as `text` — no separate tooltip field.

### Authoring rules

- **Populated at the same authoring touchpoints as every other field** — creation, recruit, level-up. Not authored opportunistically during live play.
- **State what the element IS — not what it isn't.** A tooltip is standalone reference text. Do not phrase as "no longer requires concentration" or "used to do X, now Y."
- **Keep them short.** A sentence or two. Longer rules live in the character sheet.
- **Absence is valid.** An element without a tooltip is fine.

---

## Creation

Use this section when generating a fresh `status.json` from a character sheet — at character creation (campaign-create PC, companion-recruit / companion-sheet-internal), or as a safety-net when the file is missing.

For updates (level-up, mutations, sync), use the [Field Reference](#field-reference) directly — don't start from this blueprint.

### Blueprint

```json
{
  "name": "[Name]",
  "system": "[TTRPG System ID, e.g. \"dnd.5e.2024\"]",
  "team": "party",
  "role": "[pc | co, matching character type]",
  "classInfo": "[Class Subclass Level — e.g., 'Bard 8 (College of Lore)' or 'Fighter 3 / Rogue 2']",
  "token": "[Map Token]",
  "race": "[Race — e.g., 'Halfling', 'Human', 'Half-Orc']",
  "level": [Total character level],
  "proficiencyBonus": [PB],
  "abilities": {
    "STR": { "score": [N], "mod": [N], "save": [N] },
    "DEX": { "score": [N], "mod": [N], "save": [N] },
    "CON": { "score": [N], "mod": [N], "save": [N] },
    "INT": { "score": [N], "mod": [N], "save": [N] },
    "WIS": { "score": [N], "mod": [N], "save": [N] },
    "CHA": { "score": [N], "mod": [N], "save": [N] }
  },
  "AC": { "current": [AC, set at max], "max": [AC flat total — first number before any parenthetical breakdown] },
  "HP": { "current": [HP, set at max], "max": [Total HP], "temp": 0, "baseMax": [Same as max at creation] },
  "HD": { "current": [Based on level], "max": [Based on level] },
  "Speed": { "current": [Walking speed in feet], "max": [Same at creation] },
  "SpellDC": [Spell save DC — spellcasters only; omit otherwise],
  "SpellAttack": [Spell attack mod — spellcasters only; omit otherwise],
  "skillProficiencies": ["[Skill1]", "[Skill2]"],
  "skillExpertise": ["[SubsetOfProficiencies]"],
  "Spells": {
    "1": { "current": [N], "max": [N] },
    "2": { "current": [M], "max": [M] }
  },
  [Add class-specific or custom resources as needed. Example: "BardicInspiration": { "current": 5, "max": 5, "shortRest": "max", "tooltip": "Bonus action: grant one ally within 60 ft. a d8 Bardic Inspiration die." }]
  "spells": [
    { "name": "[Spell]", "level": [N], "castTime": "action|bonus|reaction|<longer>", "concentration": [bool], "ritual": [bool], "tooltip": "[short rule ref]" }
  ],
  "feats": [
    { "name": "[Feat]", "tooltip": "[short rule ref]" }
  ],
  "weapons": [
    { "name": "[Weapon]", "hit": [mod], "damage": "[NdM + X type]", "properties": ["[Prop]"], "bonuses": [{"name": "[EffectName]", "text": "[Effect description]"}], "count": [N, omit when 1] }
  ],
  "currency": [Decimal gp encoding — e.g., 15.56 = 15gp 5sp 6cp],
  "concentration": "",
  "Conditions": []
}
```

### Creation Defaults

- Runtime-class fields are initialized from their paired static field: `HP.current = HP.max = HP.baseMax`, `AC.current = AC.max`, `HD.current = HD.max`, `Speed.current = Speed.max`, resource `.current = .max`, `Spells.<N>.current = .max`, `HP.temp = 0`.
- `concentration` = `""`.
- `Conditions` = `[]`.
- `system` canonicalized from campaign-settings per [System ID Canonicalization](#system-id-canonicalization).

### Optional / Conditional Fields

- **Omit resource objects the character doesn't have.** Don't emit empty placeholders (`BardicInspiration: null`, `Rage: {current:0, max:0}`). Absence means the character does not have that resource.
- **`Spells` object.** Omit entirely for non-casters rather than writing `"Spells": {}`.
- **`spells[]`, `feats[]`, `weapons[]`** arrays. Omit when empty rather than writing `[]`.
- **`SpellDC` / `SpellAttack`.** Omit for non-casters.
- **`skillProficiencies` / `skillExpertise`.** Optional. `skillExpertise` may be `[]` even when proficiencies is populated (character has proficiencies but no expertise).
- **Tooltip fields** are always optional.
- **Spell level keys are strings.** JSON object keys are strings by spec — write `"1"`, not `1`.
- **Rest-rule keys** are optional per resource.

---

## Example: Filled Status

Level 8 Half-Elf Bard (College of Lore) PC, AC 15, HP 52, CHA mod +4, DEX mod +3, Map Token 🟣:

```json
{
  "name": "Sylvane Quickfoot",
  "system": "dnd.5e.2024",
  "team": "party",
  "role": "pc",
  "classInfo": "Bard 8 (College of Lore)",
  "token": "🟣",
  "race": "Half-Elf",
  "level": 8,
  "proficiencyBonus": 3,
  "abilities": {
    "STR": { "score": 10, "mod":  0, "save": 0 },
    "DEX": { "score": 16, "mod":  3, "save": 6 },
    "CON": { "score": 14, "mod":  2, "save": 2 },
    "INT": { "score": 12, "mod":  1, "save": 1 },
    "WIS": { "score": 10, "mod":  0, "save": 0 },
    "CHA": { "score": 18, "mod":  4, "save": 7 }
  },
  "AC":    { "current": 15, "max": 15 },
  "HP":    { "current": 52, "max": 52, "temp": 0, "baseMax": 52 },
  "HD":    { "current": 8, "max": 8 },
  "Speed": { "current": 30, "max": 30 },
  "SpellDC": 15,
  "SpellAttack": 7,
  "skillProficiencies": ["Deception", "Insight", "Performance", "Persuasion", "Stealth"],
  "skillExpertise": ["Performance", "Persuasion"],
  "Spells": {
    "1": { "current": 4, "max": 4 },
    "2": { "current": 3, "max": 3 },
    "3": { "current": 3, "max": 3 },
    "4": { "current": 2, "max": 2 }
  },
  "BardicInspiration": {
    "current": 5, "max": 5, "shortRest": "max",
    "tooltip": "Bonus action: grant one ally within 60 ft. a d8 Bardic Inspiration die."
  },
  "spells": [
    { "name": "Minor Illusion",   "level": 0 },
    { "name": "Vicious Mockery",  "level": 0, "tooltip": "WIS save; 1d4 psychic + disadvantage on next attack." },
    { "name": "Healing Word",     "level": 1, "castTime": "bonus", "tooltip": "Heal 2d4 + CHA, 60 ft range." },
    { "name": "Dissonant Whispers","level": 1 },
    { "name": "Suggestion",       "level": 2, "concentration": true },
    { "name": "Mirror Image",     "level": 2 },
    { "name": "Hypnotic Pattern", "level": 3, "concentration": true },
    { "name": "Dimension Door",   "level": 4 }
  ],
  "feats": [
    { "name": "Lucky", "tooltip": "3 luck points / LR. Spend to add a d20 to an attack, check, or save; choose which d20 to use after seeing the roll." }
  ],
  "weapons": [
    {
      "name": "Rapier",
      "hit": 6,
      "damage": "1d8 + 3 piercing",
      "properties": ["Finesse", "Main-hand"]
    },
    {
      "name": "Dagger",
      "hit": 6,
      "damage": "1d4 + 3 piercing",
      "properties": ["Finesse", "Light", "Thrown 20/60"],
      "count": 3
    }
  ],
  "currency": 20,
  "concentration": "",
  "Conditions": []
}
```

Level 5 Mountain Dwarf Barbarian Companion, AC 16, HP 55, Map Token 🔵 (non-caster):

```json
{
  "name": "Grum Ironbeard",
  "system": "dnd.5e.2024",
  "team": "party",
  "role": "co",
  "classInfo": "Barbarian 5 (Path of the Berserker)",
  "token": "🔵",
  "race": "Mountain Dwarf",
  "level": 5,
  "proficiencyBonus": 3,
  "abilities": {
    "STR": { "score": 18, "mod":  4, "save": 7 },
    "DEX": { "score": 12, "mod":  1, "save": 1 },
    "CON": { "score": 16, "mod":  3, "save": 6 },
    "INT": { "score":  8, "mod": -1, "save": -1 },
    "WIS": { "score": 10, "mod":  0, "save": 0 },
    "CHA": { "score":  8, "mod": -1, "save": -1 }
  },
  "AC":    { "current": 16, "max": 16 },
  "HP":    { "current": 55, "max": 55, "temp": 0, "baseMax": 55 },
  "HD":    { "current": 5, "max": 5 },
  "Speed": { "current": 25, "max": 25 },
  "skillProficiencies": ["Athletics", "Intimidation", "Perception", "Survival"],
  "skillExpertise": [],
  "Rage": {
    "current": 3, "max": 3,
    "tooltip": "Bonus action: resistance to physical damage, +2 damage on melee STR attacks, advantage on STR checks and saves. 1 minute or until knocked unconscious."
  },
  "feats": [
    { "name": "Tough", "tooltip": "+2 HP per character level." }
  ],
  "weapons": [
    {
      "name": "Greataxe",
      "hit": 7,
      "damage": "1d12 + 4 slashing",
      "properties": ["Heavy", "Two-handed", "Cleave"]
    },
    {
      "name": "Handaxe",
      "hit": 7,
      "damage": "1d6 + 4 slashing",
      "properties": ["Light", "Thrown 20/60"],
      "count": 2
    }
  ],
  "currency": 0,
  "concentration": "",
  "Conditions": []
}
```

---

## Backwards Compatibility

- **Unknown keys are preserved.** Consumers should tolerate additional top-level keys (future resources, homebrew) without erroring — the tracker reads by key, not by fixed schema position.
- **Homebrew partial recovery.** If a homebrew resource recovers only partially on a long rest (e.g., `+2` per night), use `longRest: "+N"`. Standard 5e resources don't need this. Random or variable recovery like 1d4 per LR is not supported; use a static value.
