---
name: rolls-config
description: Draft or update a campaign's rolls.json macro file. Use during MetaGM sessions to set up roll macros, update them on level-up, or revise after equipment changes.
user-invocable: false
---

# Roll Macros — Drafting & Maintenance

Roll macros are an **opt-in** feature. Most campaigns don't have a `rolls.json` file, and that's fine. This skill helps the player set one up, update it, or refine it when the character changes.

A macro is a shortcut that expands a single `>>` line into a whole chain of rolls. The player types `>> full attack`, the hook expands it into the pre-defined lines (attacks, damage, secondary effects), and `roll.sh` resolves each one. The goal is to remove repetitive typing for **truly recurring turn patterns** — not to encode every possible roll.

---

# Roll Syntax & Keyword Reference

@${CLAUDE_SKILL_DIR}/reference.md

*The imported content above is the authoritative reference for macro line syntax — dice notation, `(a)`/`(d)`, reroll, named checks, free-form labels, conditional keyword vocabulary, and a sanity-check list. Consult it when drafting each line.*

---

## Pre-flight

Read these before drafting:

- [ ] **Campaign `CLAUDE.md`** — active campaign and document manifest
- [ ] **`campaign-settings.md`** — system, level, party composition
- [ ] **PC `character-sheet.md`** — attack bonuses, damage dice, features, class/subclass
- [ ] **Existing `rolls.json`** if one is already present in the campaign directory (for update work)

For macros that cover companion rolls as well, read the relevant companion sheets too. In practice, macros are almost always PC-focused — the player runs their own rolls, companions are GM-handled.

---

## The Core Judgment Call — Recurring vs Volatile

**This is the most important part of drafting.** Macros only pay off when they bundle rolls the player makes *almost every turn*. Over-bundling creates rigid macros the player fights against; under-bundling leaves the feature unused.

### Recurring (good macro candidates)

- A martial character's full attack action: multiple attack + damage rolls that happen every turn they're in melee.
- A caster's signature cantrip: same attack and damage pattern every turn when not casting something else.
- A ranged character's standard volley: consistent shots and damage.
- Common skill checks tied to the character's identity (Perception for a ranger, Persuasion for a bard). Skill checks can work via natural rolls — `>> perception` outputs `perception: d20 → 14`, but the script is unaware of modifiers. A macro can make `perception` expand to a roll that bakes the modifier in.

### Volatile (leave out — type manually)

- Bonus action flourishes that vary turn to turn (Battle Master manoeuver selection, Paladin Smite selection).
- Situational abilities that only trigger in specific conditions.
- One-off spells the player casts based on the encounter.
- Reactions (opportunity attacks, Shield, Counterspell) — usually unpredictable.

**Rule of thumb:** if you can't confidently predict the roll will happen on 80%+ of turns the character is active, leave it out of the base macro. Extra rolls can always be typed as additional `>>` lines alongside the macro.

### Worked example — Swashbuckler / College of Swords Bard (dual light weapons)

- **Bundle into `full attack`:** First attack + damage, second attack + damage, Nick attack + damage. These happen every turn in melee (Extra Attack + Nick mastery = 3 attacks per attack action).
- **Leave out:** Bardic Inspiration flourishes (Defensive, Mobile, Slashing) — the player picks one situationally or skips. Suggest they type as `>> Mobile flourish: d8` on the turn they use it right after the macro call.
- **Conditional or separate:** Sneak Attack — only applies when advantage or a finesse weapon with an allied flanker. Could be its own macro (`>> sneak attack`) or left manual. For a Swashbuckler in particular it might be ok to include since the subclass makes the condition much more reliable.

---

## Data-Gathering Technique — "Walk Me Through a Typical Turn"

If the player isn't sure what to bundle, ask them to describe a typical combat turn for their character. Prompt with:

> Imagine you're attacking on an average combat round — what do you actually roll? Walk me through the attacks and damage in order, including any riders or secondary effects you always apply.

Listen for patterns:
- What happens **every** time? → macro candidate
- What happens **sometimes**? → volatile, leave manual
- What requires a **condition** (hit, crit, advantage)? → conditional roll (use the keyword vocabulary in the reference)

If the player gives you a walkthrough with 6 rolls where 4 are consistent and 2 vary, the 4 become the macro and the 2 stay manual.

---

## Drafting Guidelines

1. **One macro per recurring rotation**, not per individual roll. The unit of value is the chain, not the single die.
2. **Bake modifiers directly into dice expressions.** Write `d20+9`, not `d20 + attack bonus`. The whole point is to eliminate arithmetic mid-turn.
3. **Prefer the canonical keyword vocabulary** (see reference) for conditional and alternate rolls. Free-form conditionals are acceptable when keywords don't fit — the GM reads label text and interprets intent regardless.
4. **Parens = conditions, em dash suffix = consequences.** Use parens `()` in a label for **conditions** that gate whether the roll counts — canonical keywords (`(conditional)`, `(if advantage)`, `(if crit)`) or short free-form equivalents (`(if first hits)`, `(if marked)`, `(if hex'd)`). Use an **em dash suffix** for **consequences** — effects that trigger as a result of the roll landing, like `— applies Sap on hit` or `— marks the target`. The mental model: parens answer *"when does this roll count?"*, suffix answers *"what else happens because of it?"*. Example: `"Longsword main-hand: d20+10 to hit — applies Sap on hit"` — Sap is a consequence of hitting, not a gate. The form `"Longsword main-hand (Sap): d20+10"` is wrong because Sap doesn't determine whether the roll applies.
5. **Trust the character sheet for trigger details.** When using `(conditional)`, don't spell out the full rule — the sheet already has it. `"Sneak Attack (conditional): 2d6"` is enough; the GM reads the sheet when it matters. Only put the condition in the label when the sheet doesn't cover it; if verbose, prefer adding it to the sheet.
6. **Label text is free-form and passes through.** Anything in a label gets resolved and preserved in output. Damage types (`slashing`, `radiant`), targeting hints, flavor, contextual notes — all fine as plain inline text. Follow rule 4 for placement of conditions (parens) and consequences (em dash); everything else is free plain text.
7. **Keep modifiers character-specific.** Don't try to encode weapon swaps or spell slot scaling unless the player is explicit about it or genuinely uses multiple weapons consistently. Otherwise just update the macro when the character changes weapons.
8. **Generally a character shouldn't need more than a couple of macros.** If many more are happening, consider whether the player is overlooking what the default rolling engine via regular `>>` tag already supports.

---

## File Format

`rolls.json` is a flat JSON object. Keys are macro names (case-insensitive at lookup time). Values are **arrays of strings**, where each string is a `>>` line body (no `>>` prefix needed — the hook adds it during expansion).

**Minimal example:**

```json
{
  "full attack": [
    "First attack: d20+9 to hit",
    "Damage: d6+6",
    "Second attack: d20+9",
    "Damage: d6+6"
  ],
  "perception": [
    "Perception check: d20+7 (a) total"
  ]
}
```

Single-roll macros still use an array with one entry — keeps the format consistent and parsing simple.

---

## Location

Write `rolls.json` to the **active campaign directory**: `${GM_ARCANUM_ACTIVE_CAMPAIGN}/rolls.json`.

The hook checks the env var first and silently skips macro expansion if it's unset — the player (or a future automated setup) needs to configure it in `.claude/settings.json` for macros to take effect.

---

## Procedure

### Step 1 — Gather Intent

Determine whether this is a **new draft** or an **update**:
- **New:** No `rolls.json` exists. Go to Step 2.
- **Update:** `rolls.json` exists. Read it. Ask what the player wants changed — refreshing modifiers after level-up, adding a macro, removing one, revising an existing rotation.

### Step 2 — Analyze the Character

Read the PC's character sheet. Identify:
- Class, subclass, level
- Main attack routine (melee, ranged, cantrip, etc.)
- Attack bonuses and damage dice for each attack
- Features that trigger on-hit or on-crit (Sneak Attack, Brutal Critical, Divine Smite variants)
- Common skill check modifiers worth bundling

### Step 3 — Propose Macros

Draft a `rolls.json` in your response (not yet written to disk). For each macro:
- Explain why it's a recurring pattern worth bundling
- Explain what was left out (volatile pieces) and why
- Note any conditional/keyword usage

If you're uncertain about the player's turn patterns, **stop and ask them to walk through a typical turn** before finalizing the draft.

### Step 4 — Player Review

Present the draft in a code block. Ask for:
- Approval to write as-is
- Edits (add/remove/rename macros, tune modifiers)
- Clarification on any conditional or keyword usage

Iterate until the player approves.

### Step 5 — Archive (if updating)

If an existing `rolls.json` is being replaced, follow MetaGM's standard archive protocol before overwriting. See `meta-gm.md` → Archive Protocol for the procedure (`rolls-s[NNN].json` format).

### Step 6 — Write

Write the approved JSON to the active campaign directory. Confirm the file path and give the player a one-line reminder of how to use it:

> `rolls.json` written to `[path]`. Use `>> [macro name]` during gameplay to expand the macro.

### Step 7 — Env Var Check (first-time setup only)

If this is the first `rolls.json` for the workspace, check whether `GM_ARCANUM_ACTIVE_CAMPAIGN` is set in `.claude/settings.json`:

```bash
grep -l GM_ARCANUM_ACTIVE_CAMPAIGN .claude/settings.json
```

If the env var is missing, tell the player:

> For the macros to load, add this to your workspace's `.claude/settings.json` `env` block:
>
> ```json
> "env": {
>   "GM_ARCANUM_ACTIVE_CAMPAIGN": "[absolute path to active campaign dir]"
> }
> ```
>
> Restart the Claude Code session to pick up the new environment variable. Without this, macros won't expand — but raw `>>` dice rolls will still work.

---

## Edge Cases

- **Player changes weapons mid-campaign.** Old macro modifiers are stale. Re-invoke this skill to refresh. The level-up skill flags this automatically on level-ups; weapon changes need player initiation.
- **Player doesn't want modifiers baked in.** Some players prefer to see the raw dice and add modifiers mentally. Macros still help by bundling the chain — use bare dice (`d20`, `d6`) and let the GM apply modifiers when reading the results. Less efficient but valid.
- **Macro name collides with dice notation.** Avoid naming macros in ways that look like dice notation (`d20`, `2d6`). The hook checks macro keys before falling through to `roll.sh`, but player confusion is worth avoiding.
- **Macro name collides with regular phrases.** Pick names unlikely to collide with natural roll-line text. Text outside a `>>` block is ignored so narration is safe. Prefer chain-style names if needed: `attack-sequence`, `pc-full-attack`, `lyra-attack-sequence`.
