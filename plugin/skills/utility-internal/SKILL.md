---
name: utility-internal
description: Internal skill for document maintenance procedures — inventory updates, format validation. Only for sub-agent use; the narrative GM should never invoke this skill.
user-invocable: false
effort: medium
---

# Document Maintenance Procedures

Procedures for structured document updates. Each section below covers a specific task type. Follow the procedure that matches the task in your briefing.

---

## Party Funds Update

Party funds (coin) are tracked on the **PC character sheet**.

When the briefing asks you to update party funds (add/remove coin, sell items, record a reward):

1. Read the PC `character-sheet.md` (path provided in briefing, or find under `campaign-members/pc-*/`).
2. Locate the `* **Coin:**` line in the `## General` section.
3. Update the value. Preserve the existing denomination format (e.g., `15 gp` stays flat; `10 gp 5 sp 3 cp` preserves the split).
4. Report the old and new values in your summary.

---

## Inventory Update

Update `inventory.md` with new items. Items may come from a session log's "Items Acquired" section or from a direct GM instruction listing items to add.

### Step 1 — Read Source and Target

1. If a session log path is provided, read the `## Items Acquired` section from it.
2. Read the campaign's current `inventory.md` in full.

### Step 1.5 — Equipment vs. Deep Storage Classification

Before classifying item tiers, determine whether each item belongs on a character sheet or in inventory:

**Character Sheet Items (NOT inventory):**
When a newly acquired item is a weapon, armor, shield, or equippable magic item that a specific character will use, it belongs on that character's `character-sheet.md` — not in `inventory.md`. These items go in the character sheet's Equipment section.

If the item impacts a character sheet:
1. Read the target character's `character-sheet.md`
2. If **weapon**: add to the Martial / Weapons section following the existing format (attack bonus, damage, properties)
3. If **armor or shield**: add to Equipment and update AC in the Combat Stats section with the new breakdown
4. If **magic item with stat effects**: add to Equipment and update any affected derived stats (saving throws, ability scores, resistances, attack bonuses, etc.)
5. Report the character sheet update in the Report section

**Deep Storage Items (inventory.md):**
Items that go to `inventory.md` are:
- Generic utility or consumable items not tied to a specific character
- Spare equipment not currently equipped by anyone
- Trade goods, crafting materials, reagents
- Items the party is storing but nobody is using
- Items whose owner is undetermined

**When in doubt:** If the briefing specifies who gets the item, put it on their sheet. If no owner is specified and the item is equippable, add it to inventory and flag it in the Report for the player to assign.

### Step 2 — Validate Against Existing Inventory

For each item to add, check if it already exists in `inventory.md` (name match, case-insensitive):

- **Absent:** Proceed to tier classification (Step 3).
- **Already present — standard consumable** (rations, potions and other standard consumables, ammunition, and similar fungible items with well-known effects): **Add** the source quantity to the existing quantity in the inventory. Note the update in the report.
- **Already present — everything else** (unique items, homebrew equipment, magic items, named items): **Do not modify.** Note it in the report. If the source shows a different quantity, note the discrepancy — the player or GM reconciles.

### Step 3 — Classify Tier

Determine which tier each new item belongs to:

**Tier 1 — Key Item:** Never auto-assign. Key Items are player-designated only. If an item appears to be narrative-central, add it as Tier 2 and flag it in the report for the player to promote.

**Tier 2 — Notable:** The item has a mechanical effect the GM or player needs to reference during gameplay:
- Reusable activated ability (uses/day, charges, etc.)
- Persistent passive effect (advantage on saves, resistance, etc.)
- Complex or conditional mechanics
- Active investigation item with narrative significance
- Consumable with a custom effect too complex for a table cell (more than one sentence)

**Tier 3 — Standard:** Everything else:
- Crafting components (value is in what they become)
- Trade goods (value is in selling them)
- Basic reagents (used as ingredients, no standalone mechanical effect)
- Mundane equipment
- Standard consumables with well-known or brief effects
- Specimens or curiosities

**Heuristic:** Does this item DO something the GM or player needs to look up during play? → Tier 2. Is it only sold, crafted into something, or consumed for a brief effect? → Tier 3.

### Step 4 — Place Items

Read the inventory template from the `doc-templates` skill (`inventory.md`) for the canonical format reference.

**Table formatting:** Tables use aligned columns with padded spaces (GitHub-style). When adding rows, match the existing column widths. If a new value is wider than the current column, widen the column and realign the header, separator, and all existing rows to match.

**Tier 2 placement:**
1. Add to the `## Items` bullet list under the appropriate category (Equipment, Utility Items, Investigation / Unknown — match the item's primary function).
2. Add a full description block under `## Item Descriptions`:
```markdown
### [Item Name] [(A) if attunement; (A - [restriction]) if restricted]
* **Type.** [Category]
* **Rarity.** [Rarity]
* **Description.** [Mechanical description — what it does, how it works. Brief and concise avoid padding with extra long descriptions.]
```

**Tier 3 placement — crafting, trade, reagents:**
Add a row to the `## Materials & Trade Goods` table:
`| [Item] | [Qty] | [Category] | [Value] | [Notes] |`
- Category: Crafting / Trade / Reagent / combinations (e.g., "Crafting / Trade")
- Value: gold value. **Required** — see Step 5
- Notes: one sentence max

**Tier 3 placement — consumables:**
Add a row to the `## Consumables` table:
`| [Item] | [Qty] | [Value] | [Effect] |`
- Value: purchase price if known, "—" if found/crafted with no market reference
- Effect: brief mechanical effect. "Standard" for well-known items (rations, antitoxin)

### Step 5 — Gold Value Enforcement

Every item in the Materials & Trade Goods table **must** have a gold value.

- If the source provides a value, use it.
- If not provided but estimable from context (rarity, material type, similar items in the inventory), add an estimate marked "(est.)".
- If not estimable, enter "?" and flag the item in the report.

### Step 6 — Report

```
## Added
- [Item] — Tier [N], placed in [section/table]

## Updated
- [Item] — quantity [old] → [new] (added [N] from session)

## Already Present (not modified)
- [Item] — exists in inventory [note any quantity discrepancy if applicable]

## Flags
- [Item] — missing gold value (entered "?")
- [Item] — may be a Key Item, added as Tier 2 for player review
- [any other anomalies]
```

If nothing was added (all items already present), report that clearly.

---

## Party Status Sync-Up

Propagate intra-session changes from `status.json` to `character-sheet.md` and flag unexpected drift. Runs at session-end after persist.

Both this procedure and [Sync-Down](#party-status-sync-down) read their field scope, directions, and matching rules from [`doc-templates/status-json-template.md`](../../doc-templates/status-json-template.md). Load that template before running. Do not recreate field rules here.

### Step 1 — Enumerate Members

Glob `campaign-members/pc-*/` and `campaign-members/co-*/`. For each directory:
1. Read `character-sheet.md` in full. Ignore any `<!-- narrative-break -->` marker — it is a narrator load-hint, not a section boundary for you.
2. Read `status.json`.
3. Missing `character-sheet.md` → flag "sheet missing"; skip the member. Missing `status.json` → flag similarly.

### Step 2 — Reconcile per Field Reference

For every field in the template's [Field Reference](../../doc-templates/status-json-template.md#field-reference), apply its Sync Class at the **Session-End (Sync-Up)** column of the [Direction per Sync Class](../../doc-templates/status-json-template.md#direction-per-sync-class) table:

- **`dynamic`** → write status value to sheet at the documented Sheet Location.
- **`dynamic-weapons`** → apply the [Task-1 Cross-Task Rule](../../doc-templates/status-json-template.md#task-1-cross-task-rule-sync-up-weapons-only):
  - status-has, sheet-doesn't → add to sheet
  - sheet-has, status-doesn't, **Task 1 added it this pass** → add to status
  - sheet-has, status-doesn't, **not from Task 1** → flag
- **`static` with drift** → flag (suggest sheet → status).
- **`feats[]` drift** → flag (asymmetric field — never auto-synced at session-end).
- **`runtime`, `skip`** → ignore.

Use the template's [Name Matching Rules](../../doc-templates/status-json-template.md#name-matching-rules) for resource-key normalization, `(source)` suffix handling on spells, and set comparison for arrays. Preserve status-side per-entry metadata (`tooltip`, `concentration`, `ritual`) on array entries whose name still matches.

### Step 3 — Additional Flag Cases

- **Orphan resource keys** on `status.json` not mentioned on the sheet at all (e.g., stale `BardicInspiration` for a character whose class no longer includes it) — flag, do not auto-remove.
- **Unparseable sheet fields** (malformed table, missing expected section) — leave both sides unchanged, flag.

### Step 4 — Write and Report

Write updates to `character-sheet.md` and/or `status.json` for each member with auto-sync changes. Skip writes when nothing changed.

Report **only what was synced or flagged** — no "in sync" lines per member. Format:

```
## Sync-Up

### pc-<slug>
Synced → sheet:
- skillProficiencies: added "Perception"
- spells[]: added "Identify", removed "Mage Armor"

Synced → status:
- weapons[]: added "Stormblade Falcata +1" (from Task 1)

Flagged:
- proficiencyBonus: sheet=4, status=3 (suggest: sheet → status)
- feats[]: sheet has "Alert", status does not
- weapons[]: sheet has "Rapier", status does not (no Task 1 addition)

### co-<slug> — sheet missing
Skipped (character-sheet.md not found).
```

If no members had any syncs or flags: `All party members in sync.`

---

## Party Status Sync-Down

Propagate between-session edits from `character-sheet.md` to `status.json`. Runs at narrative session-start, before `party-status-init.js` compiles canon state into the session working copy.

Same template dependency as Sync-Up — load [`doc-templates/status-json-template.md`](../../doc-templates/status-json-template.md) before running.

### Step 1 — Enumerate Members

Same as Sync-Up.

### Step 2 — Reconcile per Field Reference

For every field in the template's [Field Reference](../../doc-templates/status-json-template.md#field-reference), apply its Sync Class at the **Session-Start (Sync-Down)** column:

- **`static`, `dynamic`, `dynamic-weapons`** → write sheet value to `status.json` at the documented field. For arrays, use the template's [Name Matching Rules](../../doc-templates/status-json-template.md#name-matching-rules) — preserve status-side per-entry metadata (`tooltip`, etc.) on entries whose name matches; add new entries from the sheet; remove status entries the sheet no longer lists. For new spell entries added from the sheet, infer `level` and `castTime`/`ritual` from the sheet section per the Name Matching Rules.
- **`feats[]`** → sheet → status (between-session level-up may have added feats).
- **`runtime`, `skip`** → ignore.

### Step 3 — Flag Cases

- **Orphan resource keys** on `status.json` not mentioned on the sheet at all — flag, **do not auto-remove** (could be intentional or player oversight; player reviews).
- **Unparseable sheet fields** — leave status unchanged, flag.

### Step 4 — Write and Report

Write updates to `status.json` for each member with auto-sync changes. Do NOT write to `character-sheet.md` — this procedure is one-directional (sheet → status).

Report **only what was synced or flagged** — no "in sync" lines per member. Format:

```
## Sync-Down

### pc-<slug>
Synced → status:
- skillProficiencies: added "Perception"
- spells[]: removed "Mage Armor", added "Shield of Faith"
- weapons[]: added "Warhammer"
- currency: 120 → 100

Flagged:
- BardicInspiration: on status.json but not mentioned on sheet — review.
```

If no members had any syncs or flags: `All party members already in sync with sheets.`
