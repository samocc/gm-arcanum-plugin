# Campaign Settings — Template

Structural template for `campaign-settings.md` documents. This is a mechanical/configuration document — no creative writing standards needed. Fields are filled from campaign creation conversation and updated automatically by system workflows (level-up, session end, etc.).

---

## Field Reference

### System
* **TTRPG System:** The game system and edition (e.g., "D&D 5e (2024)", "D&D 5e (2014)", "Pathfinder 2e").

### Party
* **Level:** Current party level. Updated by `/gm:level-up`.
* **Level Gain:** How many levels the party gains per level-up event. Suggested by campaign length: Short=2, Medium=1-2, Long=1. Omit for One-Shot campaigns (no level-up).
* **Members:** List of all party members with role and race/class. Format: `[Name] (PC/Companion) - [Race] [Class].`

### Preferences
* **Player Experience:** New to D&D / Some experience / Veteran. Informs how much the GM explains during gameplay and default difficulty.
* **Combat Difficulty:** Easy / Normal / Hard. Affects encounter calibration.
* **Response Verbosity:** Normal / Detailed / Concise. Controls narrative response density AND multi-beat pacing (when to fracture content across turns) — see narrative-session for tier definitions. Default: Normal.
* **Combat Playstyle:** Auto-roll / Standard / Leader / Commander / Full Control. Determines who declares and rolls for whom during combat.

### Session Tracking
* **Sessions Played:** Incremented by `/gm:session-end`. Starts at 0.
* **Campaign Stage:** Early / Mid / Late. Auto-updated based on fixed session thresholds relative to Campaign Length. Omit for One-Shot campaigns.
* **Last Level-Up:** Session number of last level-up. Used by evolution system to check level-up readiness. Starts at 0. Omit for One-Shot campaigns.

### Safety Settings
* **Content to Avoid (Lines & Veils):** Player-specified content boundaries. Can be "None."

---

## Template

```markdown
# Campaign Settings

## System
* **TTRPG System:** [System and edition]

## Party
* **Level:** [N]
* **Level Gain:** [N]
* **Members:**
  * [Name] (PC) - [Race] [Class].
  * [Name] (Companion) - [Race] [Class].

## Preferences
* **Player Experience:** [New to D&D / Some experience / Veteran]
* **Combat Difficulty:** [Easy / Normal / Hard]
* **Response Verbosity:** [Normal / Detailed / Concise]
* **Combat Playstyle:** [Auto-roll / Standard / Leader / Commander / Full Control]

## Session Tracking
* **Sessions Played:** 0
* **Campaign Stage:** Early
* **Last Level-Up:** 0

## Safety Settings
* **Content to Avoid (Lines & Veils):** [Content boundaries or "None."]
```
