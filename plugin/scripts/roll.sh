#!/bin/bash
# GM Arcanum — Dice Roller
#
# Single-roll:  roll.sh d20+5 (a)
# Multi-roll:   echo ">> Attack: d20+5 (a) to hit\n>> Damage: 2d6+4" | roll.sh
#
# Dice notation: NdM, NdM+B, NdM-B, dM (shorthand for 1dM)
# Reroll:        NdMrX = reroll any die ≤ X once, keep new value (GWF: d6r2, Halfling Lucky: d20r1)
#                Non-recursive — reroll happens once even if new value is also ≤ threshold.
# Named input:   anything else defaults to d20 with a label
# Modifiers:     (a) = advantage, (d) = disadvantage (d20 only)

set -euo pipefail

# ============================================================
# Core: roll dice and format result
# Args: num sides bonus_val adv label reroll_threshold
#   reroll_threshold: integer ≥ 0. If > 0, any die rolling ≤ threshold
#   is rerolled once (non-recursive). 0 = no reroll.
# ============================================================
roll_and_format() {
  local num="$1" sides="$2" bonus_val="$3" adv="$4" label="$5" reroll="${6:-0}"

  local prefix=""
  [[ -n "$label" ]] && prefix="${label}: "

  local bonus_str=""
  if [[ $bonus_val -ne 0 ]]; then
    if [[ $bonus_val -gt 0 ]]; then
      bonus_str=" + ${bonus_val}"
    else
      bonus_str=" - $(( -bonus_val ))"
    fi
  fi

  # Notation suffix for the reroll (e.g., "r2"); empty if no reroll
  local reroll_str=""
  [[ "$reroll" -gt 0 ]] && reroll_str="r${reroll}"

  # --- Advantage / Disadvantage (single d20 only) ---
  if [[ -n "$adv" && "$num" -eq 1 && "$sides" -eq 20 ]]; then
    local r1=$((RANDOM % 20 + 1))
    local r2=$((RANDOM % 20 + 1))
    local r1_display="$r1"
    local r2_display="$r2"

    # Apply reroll per d20 individually (before the keep-higher/lower step)
    if [[ "$reroll" -gt 0 ]]; then
      if [[ $r1 -le $reroll ]]; then
        local new_r1=$((RANDOM % 20 + 1))
        r1_display="${r1} → ${new_r1}"
        r1=$new_r1
      fi
      if [[ $r2 -le $reroll ]]; then
        local new_r2=$((RANDOM % 20 + 1))
        r2_display="${r2} → ${new_r2}"
        r2=$new_r2
      fi
    fi

    local kept dice_display

    # Determine which die was kept based on advantage/disadvantage
    local kept_is_r1
    if [[ "$adv" == "advantage" ]]; then
      [[ $r1 -ge $r2 ]] && kept_is_r1=1 || kept_is_r1=0
    else
      [[ $r1 -le $r2 ]] && kept_is_r1=1 || kept_is_r1=0
    fi

    # Build the display — bold the kept die's final value
    # (if the kept die was rerolled, bold the post-arrow value)
    if [[ $kept_is_r1 -eq 1 ]]; then
      kept=$r1
      if [[ "$r1_display" == *" → "* ]]; then
        dice_display="[${r1_display/ → / → **}** | ${r2_display}]"
      else
        dice_display="[**${r1_display}** | ${r2_display}]"
      fi
    else
      kept=$r2
      if [[ "$r2_display" == *" → "* ]]; then
        dice_display="[${r1_display} | ${r2_display/ → / → **}**]"
      else
        dice_display="[${r1_display} | **${r2_display}**]"
      fi
    fi

    local total=$((kept + bonus_val))
    echo "${prefix}d20${reroll_str} (${adv})${bonus_str} → ${dice_display}${bonus_str} → ${total}"
    return
  fi

  # --- Standard roll: NdM+B, possibly with reroll ---
  local rolls=()
  local rolls_display=()
  local sum=0
  local any_reroll=false
  for (( i=0; i<num; i++ )); do
    local r=$((RANDOM % sides + 1))
    local display="$r"
    if [[ "$reroll" -gt 0 && $r -le $reroll ]]; then
      local new_r=$((RANDOM % sides + 1))
      display="${r} → ${new_r}"
      r=$new_r
      any_reroll=true
    fi
    rolls+=("$r")
    rolls_display+=("$display")
    sum=$((sum + r))
  done

  local total=$((sum + bonus_val))
  local dice_str="${num}d${sides}${reroll_str}"

  if [[ "$num" -eq 1 ]]; then
    if $any_reroll; then
      # Single die with reroll triggered → show bracket with arrow notation
      echo "${prefix}${dice_str}${bonus_str} → [${rolls_display[0]}]${bonus_str} = ${total}"
    elif [[ $bonus_val -ne 0 ]]; then
      echo "${prefix}${dice_str}${bonus_str} → ${rolls[0]}${bonus_str} = ${total}"
    else
      echo "${prefix}${dice_str} → ${total}"
    fi
  else
    local rolls_display_str
    rolls_display_str=$(printf '%s, ' "${rolls_display[@]}")
    rolls_display_str="${rolls_display_str%, }"
    echo "${prefix}${dice_str}${bonus_str} → [${rolls_display_str}]${bonus_str} = ${total}"
  fi
}

# ============================================================
# Parse a dice expression string and roll
# Input: "d20+5 (a)" or "2d6+4" or "perception (a)"
# ============================================================
parse_and_roll() {
  local expr="$1"

  # Extract (a)/(d) modifier
  local adv=""
  if [[ "$expr" == *"(a)"* ]]; then
    adv="advantage"
    expr="${expr//(a)/}"
  elif [[ "$expr" == *"(d)"* ]]; then
    adv="disadvantage"
    expr="${expr//(d)/}"
  fi
  # Trim whitespace
  expr="$(echo "$expr" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  # Try to match dice notation (with optional reroll threshold)
  if [[ "$expr" =~ ^([0-9]*)d([0-9]+)(r[0-9]+)?([+-][0-9]+)?$ ]]; then
    local num="${BASH_REMATCH[1]:-1}"
    num="${num:-1}"
    local sides="${BASH_REMATCH[2]}"
    local reroll_raw="${BASH_REMATCH[3]:-}"
    local bonus="${BASH_REMATCH[4]:-}"
    local reroll=0
    if [[ -n "$reroll_raw" ]]; then
      reroll="${reroll_raw#r}"
    fi
    local bonus_val=0
    if [[ -n "$bonus" ]]; then
      bonus_val="${bonus//+/}"
      bonus_val=$((bonus_val))
    fi
    roll_and_format "$num" "$sides" "$bonus_val" "$adv" "" "$reroll"
  else
    # Named check — roll d20
    roll_and_format 1 20 0 "$adv" "$expr" 0
  fi
}

# ============================================================
# Process a >> roll line (inline dice within text)
# Input: ">> First attack: d20+5 (a) to hit"
# Output: "First attack: d20 (advantage) + 5 → [**17** | 8] + 5 → 22 to hit"
# ============================================================
process_roll_line() {
  local line="$1"

  # Strip >> prefix
  line="${line#>>}"
  line="${line# }"

  # Extract (a)/(d) modifier from anywhere in the line
  local adv=""
  if [[ "$line" == *"(a)"* ]]; then
    adv="advantage"
    line="${line//(a)/}"
  elif [[ "$line" == *"(d)"* ]]; then
    adv="disadvantage"
    line="${line//(d)/}"
  fi

  # Try to find dice notation within the line
  # Regex: optional_prefix + dice_notation + optional_reroll + optional_bonus + optional_suffix
  if [[ "$line" =~ ^(.*[^0-9])?([0-9]*d[0-9]+)(r[0-9]+)?([+-][0-9]+)?(.*)?$ ]]; then
    local prefix="${BASH_REMATCH[1]:-}"
    local dice="${BASH_REMATCH[2]}"
    local reroll_raw="${BASH_REMATCH[3]:-}"
    local bonus="${BASH_REMATCH[4]:-}"
    local suffix="${BASH_REMATCH[5]:-}"

    # Trim trailing space from prefix, leading space from suffix
    suffix="$(echo "$suffix" | sed 's/^[[:space:]]*//')"
    [[ -n "$suffix" ]] && suffix=" ${suffix}"

    # Parse dice (extract num and sides — now using a separate regex since
    # the first match already consumed BASH_REMATCH)
    [[ "$dice" =~ ^([0-9]*)d([0-9]+)$ ]]
    local num="${BASH_REMATCH[1]:-1}"
    num="${num:-1}"
    local sides="${BASH_REMATCH[2]}"

    local reroll=0
    if [[ -n "$reroll_raw" ]]; then
      reroll="${reroll_raw#r}"
    fi

    local bonus_val=0
    if [[ -n "$bonus" ]]; then
      bonus_val="${bonus//+/}"
      bonus_val=$((bonus_val))
    fi

    # Roll and format (no label — prefix serves as label)
    local result
    result=$(roll_and_format "$num" "$sides" "$bonus_val" "$adv" "" "$reroll")

    echo "${prefix}${result}${suffix}"
  else
    # No dice notation found — treat whole line as named check
    local clean_line
    clean_line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    roll_and_format 1 20 0 "$adv" "$clean_line" 0
  fi
}

# ============================================================
# Main — determine input mode and dispatch
# ============================================================

# Read input: from args (single-line) or stdin (multi-line)
if [[ $# -gt 0 ]]; then
  INPUT="$*"
elif [[ ! -t 0 ]]; then
  INPUT="$(cat)"
else
  INPUT=""
fi

# Empty input → default d20
if [[ -z "$INPUT" ]]; then
  roll_and_format 1 20 0 "" ""
  exit 0
fi

# Macro expansion (opt-in). If GM_ARCANUM_ACTIVE_CAMPAIGN is set and a
# rolls.json exists in that campaign, expand matching macro keys into
# their constituent >> lines before resolving dice. Any error or missing
# piece falls through silently — raw >> dice always work.
if echo "$INPUT" | grep -q '^>>' && \
   [[ -n "${GM_ARCANUM_ACTIVE_CAMPAIGN:-}" ]] && \
   [[ -f "${GM_ARCANUM_ACTIVE_CAMPAIGN}/rolls.json" ]]; then
  EXPANDED="$(node -e "
    const fs = require('fs');
    const prompt = process.argv[1];
    const macrosPath = process.argv[2];
    let macros = {};
    try {
      macros = JSON.parse(fs.readFileSync(macrosPath, 'utf8'));
    } catch (e) {
      process.stdout.write(prompt);
      process.exit(0);
    }
    const lookup = {};
    for (const key of Object.keys(macros)) {
      lookup[key.toLowerCase()] = macros[key];
    }
    const lines = prompt.split('\n');
    const result = [];
    for (const line of lines) {
      if (line.startsWith('>>')) {
        const text = line.substring(2).trim();
        const key = text.toLowerCase();
        const macro = lookup[key];
        if (macro && Array.isArray(macro)) {
          for (const entry of macro) {
            result.push('>> ' + entry);
          }
          continue;
        }
      }
      result.push(line);
    }
    process.stdout.write(result.join('\n'));
  " "$INPUT" "${GM_ARCANUM_ACTIVE_CAMPAIGN}/rolls.json" 2>/dev/null)" || EXPANDED="$INPUT"
  INPUT="$EXPANDED"
fi

# Check for >> lines → multi-roll mode
if echo "$INPUT" | grep -q '^>>'; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ ^'>>' ]]; then
      process_roll_line "$line"
    fi
    # Non-roll lines are silently dropped — Claude sees them
    # in $ARGUMENTS and handles them as conversation
  done <<< "$INPUT"
else
  # Single-roll mode
  parse_and_roll "$INPUT"
fi
