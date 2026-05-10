# Campaign Settings JSON

Per-campaign config at `<campaignDir>/campaign-settings.json`. Versioned, schema-validated.

**Plugin writes only:** `sessions_played`, `campaign_stage`, `campaign_stage_locked`, `last_level_up`, `current_level`, `members[]`. Everything else is App-set and read-only from the plugin.

## Fields

| Field | Type | Owner | Notes |
|---|---|---|---|
| `version` | int | App | Schema envelope. Always `1`. Preserve on writes. |
| `display_name` | string | App | Human-readable campaign name. Empty = fall back to folder slug. |
| `ttrpg_system` | enum | App | `"D&D 5e (2024)"` \| `"D&D 5e (2014)"`. |
| `player_experience` | enum | App | `"New"` \| `"Some"` \| `"Veteran"`. Drives `gm-directives` variant + default difficulty. |
| `combat_difficulty` | enum | App | `"Easy"` \| `"Normal"` \| `"Hard"`. |
| `combat_playstyle` | enum | App | `"Auto-roll"` \| `"Standard"` \| `"Leader"` \| `"Commander"` \| `"Full Control"`. |
| `response_verbosity` | enum | App | `"Concise"` \| `"Normal"` \| `"Detailed"`. |
| `campaign_length` | enum | App | `"One-Shot"` \| `"Short"` \| `"Medium"` \| `"Long"`. Drives stage thresholds and level-up suggestions. |
| `current_level` | int 1-20 | App init / plugin | Modal-set; `level-up` updates. |
| `level_gain` | enum | App | `"1 level"` \| `"2 levels"`. Inert for One-Shot. |
| `content_to_avoid` | string | App | Lines & Veils, free-form prose. |
| `world_preset_slug` | string \| null | App | Non-null ⇒ preset world; `world-info.md` already exists at create. |
| `sessions_played` | int | plugin | `session-end` increments by 1. |
| `campaign_stage` | enum | plugin | `"Early"` \| `"Mid"` \| `"Late"`. `session-end` auto-transitions by threshold. Inert for One-Shot. |
| `campaign_stage_locked` | bool | App / plugin | `true` skips automatic stage transitions. |
| `last_level_up` | int | plugin | `sessions_played` value at last level-up. `0` = never. Inert for One-Shot. |
| `members` | array | App init / plugin | Roster. App seeds `members[0]` for the PC. `add-pc` / `companion-recruit` append; companion-departure removes. |

### `members[]` entry

```json
{ "name": "Mara", "role": "PC", "race": "Half-Elf", "class": "Bard" }
```

`role` is `"PC"` or `"Companion"`. `race` and `class` may be empty strings on the modal-seeded `members[0]` — `campaign-create` Phase 1 fills them in conversationally, then Edits the entry.

### Member slug derivation

`members[]` carries no slug. Derive on demand: lowercase, ASCII-fold, replace spaces and apostrophes with `-`, drop other punctuation. Prefix `pc-` (PC) or `co-` (Companion).

Slug authority for new entries: [`add-pc/SKILL.md`](../add-pc/SKILL.md) (handles collisions). Other skills locate folders by listing `campaign-members/` and matching the derived slug.

## Plugin Edit Discipline

Edit the JSON file in place. Preserve trailing commas and quote balance.

- **Counter increment** (`sessions_played`): match `"sessions_played": <N>,` → replace with `"sessions_played": <N+1>,`.
- **String enum** (`campaign_stage`, etc.): match `"<key>": "<old>",` → replace `<old>` with `<new>`.
- **`members[]` append**: locate the `]` closing the array, insert `,\n    <new-object>` before it (preserve indentation).
- **`members[]` remove**: match the full `{...}` entry by `"name"`, remove the object plus its surrounding comma (leading if mid-array, trailing if first element).
- **`members[i]` field update**: same as string-enum — match `"<key>": "<old>"` within the target object's body and replace `<old>` with `<new>`.

## One-Shot

When `campaign_length === "One-Shot"`, `campaign_stage` stays `"Early"`, `last_level_up` stays `0`, and `level_gain` is set but inert. Consumers branch on `campaign_length`, not on stage or last-level-up.
