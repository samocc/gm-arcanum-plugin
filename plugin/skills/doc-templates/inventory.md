# Inventory — Template

Structural template for `inventory.md` documents. The inventory tracks party-level resources — shared supplies, deep storage, and reference descriptions for notable items.

**Relationship to character sheets:** Items personally equipped on a character (armor, weapons, tools in active use) live on that character's sheet in the Equipment section. The inventory's Items section is for party shared supplies — things stored but not personally equipped. Key Items can appear in both places (inventory serves as the central reference). Item Descriptions live here for ALL notable items regardless of where they are equipped.

**Party funds are NOT tracked here.** Coin is tracked on the PC's character sheet in the General section (`* **Coin:** N gp`).

**Optional: Partial loading via `narrative-break`.** Inventory is on-demand by default in narrative sessions. If a small set of items keeps coming up in scenes (a Bag of Holding whose contents matter, a key plot item, a persistent reference the narrator should always know about), the inventory can opt into partial loading via the universal `<!-- narrative-break -->` marker. Pin the critical items at the top of the file — typically inside `## Key Items` with their description blocks — and place the marker after them. Those items load automatically at session start; everything below the marker stays on-demand.

Item tiers:
- **Key Items (Tier 1):** Narrative-central or player-designated "Key items". Listed in Key Items section with full description blocks.
- **Notable Items (Tier 2):** Items with mechanical effects the GM or player can reference during play. Listed in Items section with full Item Description blocks.
- **Standard equipment or utility (Tier 2):** Items that fall under the Equipment or Utility types but are standard and well-known should be included in the Items section but don't need an Item Description entry.
- **Tier 3 (Standard):** Crafting, trade, reagents, mundane, consumables. Listed in tables only — no description blocks.

---

## Template

```markdown
# Inventory

## Key Items
<!-- Tier 1: Narrative central or player designated "Key" items. Links to full description blocks below -->

  * [Item Name (Owner)](#item-name)

## Items
<!-- Tier 2: Party shared supplies and deep storage — items NOT personally equipped on any character sheet. Notable items also get description blocks under Item Descriptions -->

[Add verbatim: "Items not currently equipped on any character. Equipped items (armor, weapons, shields, tools in active use) live on individual character sheets. Items here are spare, stored, or shared — not immediately available for combat use."]

* **Equipment.** [Item, ...]
* **Utility Items.** [Item, Item, ...]
* **Investigation / Unknown.** [Item, ...]

## Consumables
<!-- Tier 3: Consumables that get used up. "Standard" for well-known effects (rations, antitoxin) -->

| Item | Qty | Value | Effect |
|---|---|---|---|
| Rations | 10 | — | Standard |

## Materials & Trade Goods
<!-- Tier 3: Crafting components, trade goods, alchemical reagents. Include approximate Gold value if known. Use "?" if unknown -->

| Item | Qty | Category | Value | Notes |
|---|---|---|---|---|
| Example Hide | 1 | Crafting | 50-75 gp | Protective item (DC 14, leatherworker tools). Preserved |

## Item Descriptions
<!-- Full description blocks for Tier 1 (Key Items) and Tier 2 (Notable Items) ONLY. Tier 3 items live in the tables above — they do NOT get description blocks
  Tier 1: Narrative-central, evolving, player-designated. Flavor text encouraged
  Tier 2: Items with mechanical effects the GM or player references during play
  Tier 3: Include entry ONLY if the effect is too complex to be captured in the tables -->

### [Item Name] [(A) if attunement; (A - [restriction]) if restricted]
* **Type.** [Category — e.g. "Weapon", "Wondrous Item", "Utility Item", "Key Item", "Investigation Material". Combine as needed]
* **Rarity.** [Common (Mundane) / Common / Uncommon / Rare / Very Rare / Legendary / Unknown]
* **Description.** [*Flavor text.* (Optional — most items won't have it)] [What it does or what's known about it. For items with mechanical effects, describe those in plain text or sub-sections below the description. Keep concise — exception: Key Items can have more detail and flavor]
```
