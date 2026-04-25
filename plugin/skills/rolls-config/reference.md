# Roll Macro Reference — Syntax & Vocabulary

Reference for drafting `rolls.json` macro lines. Each string in a macro's array becomes a literal `>>` line that the dice engine resolves, so every line must conform to the supported syntax below.

---

## Conditional Keyword Vocabulary

Canonical keywords used in the label portion of a macro line to gate whether a roll applies:

| Keyword | Interpretation |
|---|---|
| `(conditional)` | Only apply if the condition described in the label triggers in the fiction. Discard otherwise. Catch-all for conditional cases not covered by the more specific keywords. |
| `(if advantage)` | Alternate roll paired with a baseline. If advantage applies in the fiction, use the higher of the two rolls; otherwise discard this one. |
| `(if crit)` | Bonus dice that only apply on a critical hit (e.g., Brutal Critical). Discard otherwise. |

There is no dedicated "bonus" keyword for riders like Sneak Attack, Hunter's Mark, or Hex. Those are governed by the default rule that damage rolls only apply if the paired attack hit, plus whatever additional condition the rider requires. Use `(conditional)` and trust the character sheet for the trigger: `"Sneak Attack (conditional): 2d6"` is usually enough. Spell the condition out only when it's non-obvious or a house rule: `"Sneak Attack (conditional): 2d6 — Rakish Audacity active, no ally needed if isolated"`.

Example use inside a macro:

```json
{
  "full attack": [
    "First attack: d20+9 to hit — applies Vex on hit",
    "Damage: d6+6",
    "Second attack: d20+9",
    "Second attack (if advantage): d20+9",
    "Damage: d6+6"
  ]
}
```

The `(if advantage)` line gives the GM a pre-rolled alternate to use if the fiction triggered advantage on the second attack. If advantage doesn't apply, the GM discards that line and uses the baseline.

---

## Dice Notation

| Form | Meaning | Example |
|---|---|---|
| `NdM` | Roll N M-sided dice, sum them | `2d6`, `4d8`, `3d10` |
| `dM` | Shorthand for `1dM` (single die) | `d20`, `d8`, `d100` |
| `NdM+B` | Roll NdM, add integer bonus B | `d20+9`, `2d6+4` |
| `NdM-B` | Roll NdM, subtract integer bonus B | `d4-1`, `d20-2` |

Regex the script uses: `^([0-9]*)d([0-9]+)([+-][0-9]+)?$` (with optional surrounding text when inside a `>>` line).

**No whitespace inside the dice expression.** `d20+5` works; `d20 + 5` does NOT — the engine parses it as `d20` and drops ` + 5` into the surrounding label text, so the bonus is lost. Always write bonuses tight against the operator.

**One dice expression per line.** A `>>` line can only contain one dice notation — the engine finds the first match and rolls it. You cannot write `>> d6 + d8` expecting two separate rolls. Use multiple macro entries instead.

---

## Modifiers — Advantage & Disadvantage

| Modifier | Meaning | Constraint |
|---|---|---|
| `(a)` | Advantage — roll 2d20, take the higher | Only applies to single d20 rolls. Silently ignored on any other notation. |
| `(d)` | Disadvantage — roll 2d20, take the lower | Same constraint: single d20 only. |

`(a)` / `(d)` can appear anywhere in the line (before, after, or embedded in the label) — the engine extracts them. On non-d20 rolls they're discarded without warning.

---

## Reroll — `NdMrX`

`NdMrX` — roll NdM, and if any die rolls ≤ X, reroll that die once and use the new value. Non-recursive (the reroll happens once even if the new value is also ≤ X). The `rX` goes **tight against the dice**, between the sides and any bonus.

| Input | Meaning | Use case |
|---|---|---|
| `d20r1` | d20, reroll exact 1 | Halfling Lucky racial |
| `2d6r2` | 2d6, reroll any 1s or 2s | Great Weapon Fighting with a greatsword (2d6 base) |
| `d8r2+4` | d8, reroll 1s/2s, add 4 | GWF attack damage with a d8 weapon + ability mod |
| `d20r1+7 (a)` | d20, reroll 1s, with advantage, +7 | Halfling with advantage |

Reroll interacts with `(a)` / `(d)` **per-die**: each of the two d20s is checked against the threshold independently before the keep-higher (or keep-lower) step.

**Output format.** When a reroll fires, the display shows arrow notation `[original → new]`:

| Input | Example output |
|---|---|
| `d20r1` (no reroll) | `1d20r1 → 15` |
| `d20r1` (reroll triggered) | `1d20r1 → [1 → 11] = 11` |
| `2d6r2+5` (one die rerolled) | `2d6r2 + 5 → [5, 1 → 3] + 5 = 13` |
| `d20r1+7 (a)` (second d20 rerolled & kept) | `d20r1 (advantage) + 7 → [15 \| 1 → **20**] + 7 → 27` |

If no reroll is triggered, the output looks identical to a normal roll (except for the `rN` in the dice string). The arrow only appears when the reroll actually happens.

---

## Named Checks (No Dice Notation)

If a line has no dice notation at all, the engine treats it as a **labeled d20 check**:

| Input | Output |
|---|---|
| `>> perception` | `perception: 1d20 → 14` |
| `>> stealth (a)` | `stealth: 1d20 (advantage) → [**18** \| 7] → 18` |
| `>> investigation check` | `investigation check: 1d20 → 9` |

The engine does not know ability modifiers — it just rolls a raw d20 with the label. The GM adds the character's modifier when narrating. For macros where you want the modifier baked in, use explicit dice notation: `Perception: d20+7 total` instead of `perception`.

---

## Free-Form Label Text

Any text around the dice notation is preserved in the output. Use it for flavor, notes, or conditional keywords.

| Input | Output |
|---|---|
| `>> First attack: d20+9 — applies Vex on hit` | `First attack: 1d20 + 9 → 14 + 9 = 23 — applies Vex on hit` |
| `>> Smite damage (use if crit): 2d8` | `Smite damage (use if crit): 2d8 → [4, 6] = 10` |
| `>> Damage d6+6 slashing` | `Damage 1d6 + 6 → 3 + 6 = 9 slashing` |

The label can appear before the dice, after the dice, or both. A colon after a leading label is conventional but optional.

---

## What Is NOT Supported

- **Multiple dice expressions on one line** — each `>>` line is one roll.
- **Arithmetic between dice** — `d6+d4` does not work. Use two entries.
- **Floating-point bonuses** — bonuses must be integers.
- **Keep/drop mechanics** — `4d6kh3` (keep highest 3 of 4) is not implemented. Use a direct bash roll for stat generation.
- **Exploding dice** — `d10!` (roll again on max) is not implemented. Not a standard D&D mechanic.
- **Recursive reroll** — `rX` only rerolls once, even if the new result is also ≤ X. This matches RAW for Great Weapon Fighting and Halfling Lucky. There is no `ro` (reroll once-or-more) form.
- **Conditional logic inside the engine** — the engine always rolls. The GM interprets labels and picks which results to apply.

For anything beyond the supported syntax, the player types manually using the supported primitives, or the GM narrates the resolution in prose without a hook roll.

---

## Quick Sanity Check

Before finalizing a draft, mentally walk each macro line and confirm:

- [ ] It contains exactly one dice expression (or no dice expression if it's a named check).
- [ ] If `(a)` or `(d)` is used, the expression is a single d20 or a named check with no dice notation.
- [ ] Bonuses are integers with `+` or `-`, **tight against the dice** (`d20+5`, not `d20 + 5`).
- [ ] Any keyword or note is in the label text, not inside the dice expression.
