# NPC Directory — Starter File

Copy this file directly as the campaign's `npc-directory.md`. No modifications needed — the HTML comment at the bottom of the file contains the NPC template for future entries.

**Template placement.** Keep the NPC template block at the bottom of the `## NPC List` section. Anything above a `<!-- narrative-break -->` marker gets read into context by partial-load, so placing the template at the bottom keeps it out of the way. New NPC entries are added above the template block.

## Optional: Pinning NPCs with `narrative-break`

The NPC directory can opt into partial loading via the universal `<!-- narrative-break -->` marker. Pin recurring or high-relevance NPCs at the top of the file and place the marker after them — those NPCs are fully loaded at every narrative session, while NPCs below the marker remain on-demand (discovered via `###` header roster grep). This is useful when a handful of NPCs (the party's inn-keeper contact, a recurring rival, a faction handler) keep coming up and the narrator needs their full profile in context at all times.

To apply: move the pinned NPCs to the top of `## NPC List`, add a `<!-- narrative-break -->` line after the last pinned NPC, and the partial-load behavior takes effect automatically. No further configuration required.

---

## Starter Content

```markdown
# NPC Directory

## NPC List



---

## NPC Template

<!--
### [Full name or known name]
* **Tagline:** [One-line stable identity. Role/function + location + current attitude toward the party. This is who they ARE in the world, not what they've done in the story. Keep it stable — only update if their fundamental role, location, or alignment to the party shifts. Example: "Retired guild smith, runs the anvil at the east gate forge; friendly." Story beats, evolving relationships, and recent events live in Core Context, NOT here.]
* **Race:** [Race]
* **Age:** [Use range, e.g. "Young adult", "Mature adult"]
* **Gender:** [Male / Female / Unknown / Genderless]
* **Location or base:** [Where this character 'lives' or can be found. Either a fixed location or roaming. Roaming example: 'Travels along the Silk Road from A to B']
* **Attitude towards the party:** [Enemy / Hostile / Neutral / Friendly / Ally. Update if or when relationship changes]
* **Appearance:** [2-3 sentences. Build, distinguishing features, clothing style]
* **Class:** [Class and subclass, generic concept, or creature stat block. Examples: "Wizard (Diviner)", "Civilian", "Veteran"]
* **Core Context:** [Who is this character in the world or why are they important to the party, extend or update as more is revealed or known]
-->
```
