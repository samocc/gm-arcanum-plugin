---
name: companion-guide-internal
description: Internal skill for companion guide generation — character conceptualization, companion guide writing, and in-character introduction. Standalone — can be used independently of the recruitment flow. Sub-agent use only.
user-invocable: false
effort: high
---

# Companion Guide Generation — Execute Procedure

Generate a complete companion-guide for a new or redesigned companion.
**Scope: companion-guide only.** Do NOT generate a `character-sheet.md` doc — that is a separate task handled by a different skill invocation after player approval.

## Pre-flight Check

- [ ] **Read the companion guide template.** This contains section-by-section writing standards and the document structure. All guide content must conform to these standards.

### Campaign Documents to Read

Verify all of these are loaded before proceeding. If any are missing (new campaigns), skip them.

- [ ] `campaign-pitch.md` — tone, companions pitch, companion recruitment preferences, core and secondary arcs
- [ ] `campaign-settings.json` — `ttrpg_system`, `current_level`, `members[]`, `sessions_played`. Schema reference: [`doc-templates/campaign-settings.md`](../doc-templates/campaign-settings.md).
- [ ] `campaign-summary` — narrative arc, party history
- [ ] `recent-events.md` — latest session events (likely contains the recruitment interaction)
- [ ] `world-info.md` — setting, geography, factions (grounding the companion in the world)
- [ ] `character-info.md` for every PC (`campaign-members/pc-*/character-info.md`) — identity, backstory (for independence check; multi-PC parties: read all)
- [ ] All existing `companion-guide.md` docs — party dynamic, duplication check
- [ ] `npc-directory.md` — the companion may already have an entry from prior interactions
- [ ] `gm-canon.md` — active threads (for scope check)

---

## Handling Varying Input

The briefing from the narrative GM can range from richly detailed (name, race, class, personality traits from in-session play) to near-zero ("recruit a companion for the campaign"). Adapt accordingly:

* **Rich context:** The briefing provides established facts — name, personality, observed behavior, maybe race/class. Treat all briefing content as canon. Your job is to build a full character around what's already established.
* **Moderate context:** The briefing provides a direction — a name and sketch, or a general concept like "a cynical healer." Use this as your seed, fill everything else from campaign docs and creative judgment.
* **Minimal context:** Little or nothing beyond "create a companion." Derive direction entirely from campaign documents:
  1. Read `campaign-pitch.md` — the "Companions Pitch" and "Party Composition" fields often contain the player's high-level desires for companions.
  2. Analyze the existing party (all PCs + any companions) for gaps — mechanical (missing role: tank, healer, controller, ranged DPS, etc.), social (personality contrast), and narrative (different worldview or background).
  3. Generate a companion that is **distinctly different** from every existing PC and companion — different personality, different approach to problems, different social energy. The party should feel like people who wouldn't naturally choose each other but work well together.
  4. Ground the companion in the world (world-info.md) — pick a race, culture, or origin that makes sense for the setting and creates natural friction or contrast with the existing party.
  5. Invent a name that fits the world's cultural texture.

In all cases, the campaign documents are your primary grounding. The briefing adds session-specific context on top.

**Child / opted-out constraint.** If the briefing's Player Notes (or in-context details) indicate a child or adolescent companion, or an adult companion described with child-coded physical attributes, the generated `companion-guide.md`'s `Romance Framework` section MUST read exactly `Disabled — child companion, romance framework does not apply.`

---

## Workflow

Two phases, sequential. Do not proceed to Phase 2 until Phase 1 is complete.

1. **Conceptualize** the character
2. **Generate the Companion Guide**

---

## Phase 1: Character Conceptualization

**(CRITICAL — complete this before any template filling.)**

Stop and design a specific, non-generic character concept. Use the briefing context (treated as canon), the campaign documents, and the player's stated preferences as your source material. Do not proceed to Phase 2 until you have clearly defined all four elements below.

### Central Tension

What is this character's core *internal* conflict? This must be personal and psychological — not a plot they are reacting to, not a world-level threat they are investigating. It is the contradiction, wound, or unresolved need *inside* them that makes them interesting to roleplay.

Test: "Would this tension still exist if the campaign's plot disappeared tomorrow?" If not, it's a plot dependency, not a character tension.

### Character Identity

Find the specific *person* inside the archetype. The race/class combination is the starting point, not the finished character. Ask: "What is the personal, individual tension or contradiction that makes this character feel like a real person rather than a representative of their race and class?"

Where specificity comes from — a number of sources, here are *some* ideas but there are many more valid paths:

* A personal wound, need, or formative experience that exists independently of race/class and gives the character a specific emotional throughline (e.g., a healer haunted by the death of someone she failed to save; a fighter who deserted an army and now flinches at the sound of horns).
* A specific, unusual relationship to their own abilities or role — not the standard one (e.g., a druid raised by the wilderness itself who treats civilization as a fascinating alien culture rather than something to protect nature from).
* The race and class themselves can also create a natural friction that demands resolution (e.g., an Aasimar Warlock torn between celestial heritage and a dark pact; a Tiefling Wizard whose infernal impulses are an embarrassing inconvenience for someone who wants to be taken seriously as an academic).

**Litmus test:** Describe the character's central tension without mentioning their race, class, or the campaign's plot. If the description could apply to any generic member of their archetype, it is not specific enough. "A scholar who hides insecurity behind intellectual superiority" is a type, not a person. "A woman who abandoned her own culture for a foreign intellectual tradition she found superior, and now faces the terror that the tradition she sacrificed everything for might be fundamentally inadequate" is a person.

* BAD: "He's a brooding tiefling warlock who secretly has a good heart." (The hidden-heart-of-gold is the archetype's built-in soft spot, not a personal identity.)
* BAD: "She's a scholarly wizard who is insecure about her lack of practical skills." (This IS the default archetype — the bookish character who can't function in the real world. It's the type's built-in weakness, not a specific person's tension.)
* GOOD: "She's a wizard whose tiefling blood gives her cravings for sensory excess — rich food, fine textures, raw magical power — that she finds deeply embarrassing and fights to suppress, because yielding would confirm every stereotype about her kind." (The tension is personal: it's about shame, identity, and the fear of being seen as what she biologically is.)
* GOOD: "She's a healer who watched her partner die because she refused to grant mercy, and now carries his executioner's mask as both penance and temptation — terrified that the week she spent using it revealed her true nature." (The tension is a specific lived experience that created a behavioral duality.)

### Behavioral Hook

Identify at least one distinctive behavioral pattern or physical element that will make this character immediately recognizable in play — something the GM can *show*, not just describe internally. This could be a prop, a physical habit, a sensory quirk, a mode they shift into. It should be concrete enough to ripple through multiple sections of the guide (description, maneuvers, tells, RP directives).

### Scope Check

Hard constraints — verify before proceeding:

* The concept does not introduce campaign-level threats, world-scale stakes, or narrative arcs not already established in the campaign documents.
* The character's conflicts are *personal*. Their plot hook connects to *their* past, not to the campaign's future.
* The character's backstory does not explain why the world is how it is, or try to resolve an established mystery or the source of an unexplained element present in the context.
* Do not invent, expand, or assume context about other party members' (PC or other companions) backstories.
* Check gm-canon threads: the companion's concept must not inadvertently advance, resolve, or contradict any existing thread. Companion threads run parallel to existing threads, not through them.

---

## Phase 2: Companion Guide Generation

### Generation Philosophy

* **Adhere to established facts first.** If the companion already has dialogue, described behavior, or stated background in the briefing or campaign docs, treat that as canon. Build around it, do not contradict it.
* **Default to independence.** The companion should be a standalone character with their own history, motivations, and internal conflicts — not a satellite of any PC or their backstory. Only tie them to a PC's backstory if the established material explicitly does so or the player requests it.
* **Build a portable character.** The guide should be largely agnostic of other companions and campaign-specific plot. The character is grounded in the *world* (setting, geography, cultures) and in their own *personal history* — not in the current party or campaign arc. Every section except Current Dynamic should read as a self-contained character document that would work if transplanted to a different campaign in the same world. Current Dynamic is the sole section that describes the relationship with the party.
* **Complement, don't duplicate.** The companion should fill a gap in the party — whether mechanical (class/role), social (personality contrast), or narrative (different worldview). Review the existing party composition before generating. This informs *design choices* (what role to fill, what personality to contrast with) but should not leak into the guide's prose — the guide describes who the character IS, not how they compare to others.
* **Write for RP, not for lore dumps.** Every section should give the GM something actionable — a specific behavior to perform, a speech pattern to follow, a tell to display. Avoid vague traits like "brave" or "kind" without showing how they manifest.
* **Limit the scope.** Do not invent campaign-level threats, world-ending stakes, large political conspiracies, or narrative arcs not already established. The character's backstory and motivations should be grounded in personal history and internal conflict.
* **Stay in your lane.** Do not invent, expand, or assume context about other party members' backstories.
* **Respect per-section word budgets.** The template placeholders include word targets for each section. Follow them — they sum to ~1,700 words. Do not self-impose stricter limits.
* **Write to target length.** Attempt to follow the per-section target lengths, that will save you future trim passes and make the work more efficient.

### Section-Level Guidance

These notes complement the section-by-section writing standards in the `doc-templates` companion guide template. The template has the structural rules; these are the creative-judgment notes for *generating* new content.

* **Core Concept:** Frame from the character's perspective. Reference what they struggle with or are torn by — not secrets they don't know.
* **Backstory:** Dense, grounded, specific. Must include 1-2 named characters grounded in the story. All important places, people, and organizations must have proper names — not generic descriptions. Write from the character's lived experience — if they don't know something (true parentage, hidden conspiracy, real reason for their power), save it for Personal Plot Hooks.
* **Psychology:** The Core must create tension with the Mask. Do not list physical manifestations of emotions in The Core — those belong in Biological Tells.
* **Motivations:** Should not all point the same direction — tension between motivations creates interesting characters.
* **Combat Initiation:** Rooted in the companion's backstory, fears, or values — not general combat logic. Number of entries depends on personality (a pacifist might have none; a paranoid fugitive might have several).
* **Current Dynamic:** This is a newly recruited companion — describe initial impressions and starting dynamic, not an established relationship.
* **Personal Plot Hooks:** 1 hook. Must be a personal side-quest rooted in the character's own history — NOT connected to the campaign's central conflict. Hidden truths and secret origins belong here, not in Backstory or Core Concept. The trigger must be an encounter the **party as a whole** walks into during normal play — not something the companion independently seeks out. Companions are reactive; the PCs drive the party. Good hooks fire when the party's path naturally crosses the companion's past (a patrol bearing old insignia, ward-marks in a forgotten script, a traveler who recognizes the companion). The hook should create a **situation** — an NPC confrontation, a discovery, a moral choice — not just deliver information.

### Evolution Frontmatter

Initialize the `companion-guide.md` doc with evolution tracking frontmatter:

```yaml
---
evolution:
  stage: acquaintance
  last-evolution: null
  progress: 0
---
```

### Generate

Fill every section of the companion guide template (from doc-templates). Use the Phase 1 concept as your foundation. Where context is missing (hidden motivations, psychology), invent new, creative details that serve and reinforce the concept. Every section should feel like a facet of the same core character, not independent gap-filling.

### Verify

After writing the guide, run `wc -w` on the file.

* **Under 2,000 words** → pass. Proceed to Output.
* **Over 2,000 words** → one trimming pass. Identify the sections most over their budget and tighten them. Make all edits in a single round. Do not re-check word count after trimming. Proceed to Output.

---

## Output

* Write `companion-guide.md` with evolution frontmatter to `campaign-members/co-[name]/companion-guide.md` (e.g., `campaign-members/co-lyra/companion-guide.md`). No need to call `mkdir` first, the write tool handles it.

No campaign integration updates and no `character-sheet.md` generation at this stage. Both are handled separately after player approval. Your task is complete after writing the guide and returning the report below.

---

## Report

The report has two parts: the **GM context** (for the narrative GM's own use) and the **Character Card** (presented to the player for approval).

### GM Context

State these for the GM's reference — not shown to the player unless they ask:
* File path for the guide
* Character concept summary (central tension, behavioral hook — 2-3 sentences)
* Party role filled (what mechanical, social, or narrative gap this companion addresses)
* Creative decisions (e.g., "I introduced a former mentor NPC — check if that fits your vision")
* **IP Validation findings:** check the companion's Race, Class, and Subclass against the matching sections in `content-sources.md`. Report one of:
  * `IP Validation findings: none` — every selection is listed (or marked `Model Knowledge`).
  * One bullet per unlisted selection, in marker-payload form so the parent can drop it straight into an intent marker:
    * `kind=Race, value=<Race>`
    * `kind=Class, value=<Class>`
    * `kind=Subclass, value=<Subclass>`

  *If `content-sources.md` does not exist at workspace root then list all 3 kinds (Race, Class, Subclass) and add: "Note: unable to perform IP validation compliance, no `content-sources.md` was found"*

### Character Card

This is the formatted introduction presented to the player for approval. Use this exact format:

```
### [Name] | [Race]
**Class:** [Class and subclass]
**What you see:** [The character standing against a white background — just them, no scene, no setting. Build, distinguishing features, the thing your eye catches, notable items or props. No narration, no "you notice," no location framing. 2-3 sentences max.]
**Intro:**
  > [Character Introduction text — see spec below]
```

The file path to the guide should follow the card as a link for the player to review the full document if they want.

---

### Character Introduction Spec

The Intro field of the Character Card is a **character performance piece** — a short monologue where the companion steps forward and introduces themselves to the audience (the player). This is the D&D session 0 moment. Think Critical Role campaign 1 intros, BG3 origin character introductions. The character presents who they are in their own voice.

**Genre: character monologue, not narrative scene.** The character's voice drives the piece — they are speaking, presenting, performing (or awkwardly failing to perform, or trying to and revealing more than they meant to). The visual grounding is already handled by "What you see" — the intro doesn't need to establish what the character looks like. It can reference items, actions, or physical moments (touching a mask, tracing a tally mark) but the character's speech is the backbone.

**The format IS character information.** A loud character has a loud, sprawling intro. A terse character has a short, clipped one. A guarded character reveals guardedness through what they don't say. A performative character is theatrical. The structure, length, and rhythm of the piece should embody the personality, not just describe it.

**Standalone.** No references to the party, other companions, or the PC. This intro is about THIS person only and should work for any party in this world.

#### Examples

1. **GOOD** — energetic, talkative character:

  **What you see:** Wiry halfling woman, tangled copper hair full of metal clips and wire scraps. A pair of oversized brass goggles pushed up on her forehead, one lens cracked and repaired with solder.

  **Intro:**

  *"Pip! Hello! Well — Pipra, technically, Pipra Gearsworth, but nobody calls me that, not since I was in trouble at the academy, which was — actually fairly often, but that's — anyway! I fix things! Also I break things, but usually on purpose, and usually the breaking is part of a larger fixing, which —"* She pulls a gadget from her belt, realizes it's sparking, and shoves it back. *"— that one's not done yet. Point is, I'm useful. Probably. Do you have anything that needs fixing? Or breaking?"*

2. **GOOD** — terse, guarded character:

  **What you see:** Weathered human woman, rangy build, sun-scarred hands that don't match someone who works indoors. A leather bracer on the left arm covered in scratch marks — tallies, dozens of them, neat deliberate rows.

  **Intro:**

  *"Maren. I find people."* A pause. *"The ones who don't want to be found, mostly. I've brought back every one I went after."* Her thumb traces the bracer. *"Every one."*

3. **BAD** — narrated encounter scene:

  You notice her before she notices you — a stocky woman sitting against the tavern wall, eating mechanically from a ration pouch. Her armor is military-grade, personalized the way long-service gear gets. When she finally registers your presence, her hand goes to her weapon — not fast, just completing a checklist. She studies you for two seconds and says: *"Three of you. Armed. Heading south."*

This is a scene the GM narrates. The character is an object being observed, not a person presenting themselves.

4. **BAD** — dialogue transcript with narrator explanation:

  There's a woman at the back table who hasn't ordered anything... *"Maren. I find people. The settlements east of the ridge, the lowland routes, sometimes the marshes if the pay is right."* ... *"Everyone I've gone after, I've brought back. That's the record."* She doesn't say it like a boast. She says it like someone reciting a number that isn't large enough yet.

Excerpted conversation with narration explaining the character's tone. The ellipses suggest transcript. The last line tells the player what to feel instead of letting the character show it.
