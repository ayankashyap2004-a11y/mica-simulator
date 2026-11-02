# MICA Simulator: Game Foundation (locked)

*Decided by Ayan on 2 Nov 2026, from five rounds of questions built on `RPG_DESIGN_RESEARCH.md`. This is the base every build session works from. Change it only on Ayan's say-so.*

## One-line pitch
You arrive at MICA for induction week. Over seven days you settle into hostel life, win over seniors with ideas instead of fists, and chase a campus legend: a lost, legendary idea a MICAn supposedly created years ago.

---

## Locked decisions

| Area | Decision | Research basis |
|---|---|---|
| Player character | **Semi-custom lead.** You choose name, look, programme (PGDM-C, PGDM or CCC) and hometown. Personality comes through your choices. | A middle point between Life is Strange's fixed lead and Persona's custom one. |
| Span | **One intense week: induction week.** It starts with the existing drive-in through the gate. | Life is Strange episode scale. Gives the newcomer's point of view and the tutorial. |
| Tone | **Grounded, warm and funny.** | Night in the Woods heart with Yakuza-style side-story comedy. |
| Thread | **Campus mystery: a lost legendary idea.** Its clues are in hostel graffiti, the Chhota art wall, seniors' lore and old records. | Fits "The School of Ideas". A mystery gives the week a drive. |
| Structure | **Linear chapters, with a free-roam hub between them.** Time moves only with the story. | Keeps pacing tight for one writer. |
| Endings | **2–3 distinct endings plus many small variations** ("people remember"). | The Life is Strange model, scoped down. |
| Core challenge | **Conversation duels.** You persuade, pitch, negotiate and debate in structured showdowns, using clues and what you know about people. | Disco Elysium and Ace Attorney. "Ideas win." |
| Sessions | **Story scenes only,** with no minigames. | Keeps the build small. Classes carry story, not mechanics. |
| Relationships | **Bond levels with a small cast.** Each core character has levels that unlock personal scenes and help in the finale. | Persona confidants scaled to one week. |
| Feedback | **A journal plus subtle notes** such as "Riya will remember that". No numbers on screen. | Life is Strange. |
| Rules to push against | **Restricted areas** (locked rooms, rooftops, archives) and **seniors' expectations** (tasks and judgement). | Bully's friction. |
| Social groups | **Hostels** (Ashoka, Silver Oak, Shishya Gramah…) and **programmes** (PGDM-C, PGDM, CCC). | Bully's cliques, translated to MICA. |
| Presentation | **Mixed.** In-engine cinematic cutscenes for big moments, like the intro. In-world dialogue with portraits and subtitles for everyday talk. | Life is Strange. |
| Audio | **Text and music only,** no voice acting. | Life is Strange's music-led mood. Zero voice cost. |
| Must-have places | **Chhota at night** and **hostel life and graffiti.** | Insider culture is the main point of difference. |
| Cast | **6–8 core characters** (with bonds) plus **about 15 named** (one beat each) plus ambient students. | |
| Real people | **Characters are based on real people, in positive portrayals only.** Antagonists, suspects and unflattering roles are always fictional. | |
| Hub content | **Side stories, bond scenes and clue hunting.** | Yakuza, Persona and Life is Strange. |
| Length | **About 1 hour** for the whole week. Replay to see the other endings. | |
| Platform | **Laptop browser first** (keyboard, mouse or trackpad). Mobile later. | |

---

## Recommendations that come with these decisions

**Real people: get consent before publishing.** Positive-only portrayals reduce the risk, but the site is public. A quick OK from each person (WhatsApp is fine) protects both you and them. Also let anyone ask to be renamed or removed, and keep a `cast.json` so a rename is a one-line change.

**Fitting it into one hour.** Seven days in about 60 minutes means a chapter averages about 8 minutes. A suggested budget:

| Chapter | Length | Purpose |
|---|---|---|
| Day 1, arrival | ~6 min | The drive-in intro, then the main gate, room allotment and meeting your roommate. Teaches movement and dialogue. |
| Days 2–6 | ~8–10 min each | One story beat plus a short hub window. In each window you choose roughly one or two of: a bond scene, a side story or clue hunting. You can't do everything, which is the Persona "scarce time" idea. |
| Day 7, finale | ~8 min | The big conversation duel and the ending. |

That cast-to-length ratio is tight. If it runs long, cut named side characters before core ones.

**Bond levels for a one-week game:** three levels per core character (acquaintance, friend, confidant). Level 3 lets them back you up in the finale's duel.

**Conversation duel shape:**
- **Opening:** a short opening line from the other person.
- **Rounds:** 3–4 rounds. In each, you choose an argument, a clue from the journal, or a "read" of the person.
- **Hidden conviction:** the other person's conviction moves in response, but it is never shown as a number.
- **Failure:** losing changes the story rather than ending the game.

**Using the groups:** use hostels and programmes for identity and banter, such as who sits where at Chhota and inter-hostel teasing. Use seniors as gatekeepers to restricted areas.

**Mystery clues:** keep the count small, roughly 8–12 across the week, each tied to a place (graffiti panels, the Chhota art wall, a hostel room, an old notice). Whether you found a clue should change which ending is possible.

---

## What Ayan writes next (suggested order)
1. **The legend.** What the lost idea is, who created it, where it went, and the true answer.
2. **The protagonist frame.** What changes with programme and hometown choice (a few dialogue flavours, not new stories).
3. **The core cast (6–8).** Fill in the NPC card template in `RPG_DESIGN_RESEARCH.md`, section 6, for each.
4. **The 7-day beat sheet.** One standout moment per day, and the finale duel.
5. **Side stories (5–8)** and **clue placements (8–12)** on campus.
6. **The 2–3 endings,** and which choices, bonds and clues lead to each.

## Still open (decide later)
- The working title: "MICA Simulator: Induction Week"?
- What the protagonist's hometown and programme change in practice.
- Whether later weeks (MICANVAS, Oorja, placements) become future chapters.
