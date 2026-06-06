---
title: "PRD: Josh Brandt Portfolio Site"
status: final
created: 2026-06-02
updated: 2026-06-04
---

# PRD: Josh Brandt Portfolio Site
*Working title — confirm.*

## 0. Document Purpose

This PRD is the decision-ready specification for the **Josh Brandt Portfolio Site** (`joshuabrandt.abacusai.cloud`). Its readers are Josh (as PM/builder) and the downstream BMAD workflows it feeds: **`bmad-ux`** (scene arc, Architect's Studio system, agent UX, accessibility), **`bmad-create-architecture`** (frontend stack, static build + grounded-agent backend), and **`bmad-create-epics-and-stories`** (the implementable backlog).

It is structured as: vocabulary anchored in a **Glossary** (§4) that downstream artifacts must use verbatim; capabilities grouped into **Features** (§7) with globally-numbered Functional Requirements (**FR-N**) carrying stage tags and *testable* consequences; cross-cutting **NFRs** (§8), **Guardrails** (§9), and **Platform** constraints (§10); and **MVP Scope** (§12), **Success Metrics** (§13), and surfaced **Open Questions**/**Assumptions** (§14–15). Inferences I made without confirmation are tagged inline `[ASSUMPTION: …]` and indexed in §15.

Per Josh's direction, **all three delivery stages are specified at full FR depth** — Stage 1 (Credible Hub) is the MVP; Stages 2 (The Magic) and 3 (Full Richness) are specified now so downstream work avoids Stage-1 decisions that would block the later magic. This PRD **builds on and does not duplicate** its upstream inputs:

- `brief.md` (`status: final`) and `addendum.md` — `…/planning-artifacts/briefs/brief-portfolio-2026-06-02/`
- `brainstorming-session-2026-06-02-1723.md` (47 ideas) — `_bmad-output/brainstorming/`
- `portfolio-pre-brief-research-2026-06-02.md` — `_bmad-output/research/`

Idea numbers (e.g. `#39`) and proper nouns are carried from those sources for traceability.

## 1. Vision

`joshuabrandt.abacusai.cloud` is a personal portfolio that doesn't *describe* Josh Brandt's work — it **demonstrates** it. Josh is a software engineer with 30 years of shipping experience who has gone deep on agentic engineering, but that work is scattered and invisible across GitHub, conference talks, YouTube, and Suno. The site is the **remarkable center of gravity** that makes the substance undeniable and shareable: a clean, confident experience navigated by a grounded **Guide**, built and maintained *as a public BMAD project* so the site itself is Exhibit A (`#2`). The medium is the message.

What a visitor gets depends on who they are. A practitioner can talk to the Guide, open the **Glass Box** to walk the site's own real BMAD artifacts, and scrub the **Master Timeline** to watch the site build itself — a recursive "whoa" they want to share. A conference organizer can ignore all of that and reach a **Speaker Surface** — reel, talk topics, and a frictionless **Invite-Me** path — in seconds. A content wanderer can sample the creative work and follow. Every rich, agentic, cinematic path has a **Lean Static Fallback** so nothing is ever hidden behind the magic.

This matters because reputation in agentic engineering compounds through *proof*, not claims, and Josh has the rare combination of a 30-year track record **and** cutting-edge practice. The site's honest job is to be a craft artifact remarkable enough that peers **share** it (building reputation) and a credible hub that **converts** attention into speaking invitations and audience — explicitly *not* a cold-traffic lead-gen funnel. There is no defensible *technology* moat; the advantage is **authenticity + novelty + a real track record**, costly to imitate because it requires actually being Josh and actually doing the work — so the real risk is **execution and taste, not competitors**.

The positioning that resolves the whole site is **"Seasoned, building at the frontier"** — refined during UX design (2026-06-04) from the original `#1` line *"Seasoned, Not Stuck"*; same thesis, asserted positively rather than as a defensive "not-X": a 30-year veteran *and* a cutting-edge agentic practitioner at once, neither pole alone. The 2–3-year north star is for this to become the **canonical example** of a portfolio built as a public agentic-engineering project — a repeatable pattern others adopt.

## 2. Why Now

Timing is load-bearing. Agentic engineering is the differentiator of the moment, Josh is doing standout work in it, and the most convincing way to prove that is to **build the proof in public** — a site that is itself a living agentic-engineering project, extended on its own timeline via `/bmad-correct-course`. The authentic public build history (`#39`) is the one thing a competitor cannot retrofit. Research confirms the broader concept is validated by 2026 best practice (scroll-driven 3D "camera-take" sites; agent-as-guide as a recognized trend, not a fringe gimmick), so the window is open and the bar is rising — shipping a credible cut **soon** (self-imposed ~end-of-June-2026 target) is itself part of the thesis: a credible site that actually ships, not a perpetual WIP. Note the asymmetry: the cinematic/agent-orchestrated *form* is already a recognized trend, so **that novelty has a clock** — but the durable advantage underneath (the authentic 30-year track record + the public build history) does not depreciate. Another reason to ship now.

## 3. Target Users & Journeys

### 3.1 Jobs To Be Done

- **Practitioner / peer (the amplifier) —** *"Show me something that earns my respect and is worth sharing with my network."* Wants depth, surprise, and credibility-among-peers (the Glass Box, the Master Timeline, the meta-recursion). Their sharing is the engine that compounds Josh's reputation. **Primary design target — the default experience is tuned for them.**
- **Conference organizer / program-committee member (the converter) —** *"Quickly confirm this person can deliver a great talk, and let me invite them without friction."* Busy, mildly skeptical, may not want to chat. **Primary conversion target — served by a guaranteed fast-credible path.**
- **Content wanderer —** *"I liked a video/track; give me more to enjoy and an easy way to follow."* Came for delight, not evaluation. Feeds the audience goal.
- **Josh, the builder —** *"Let me add a new project as a normal BMAD epic and have it appear on the site's own timeline, with no CMS."* The maintenance model *is* part of the product story.

**Priority order:** practitioner amplification is the *upstream engine* — peer shares build the awareness that *causes* organizer conversions and audience growth. The default experience funds that engine first (the practitioner); the organizer path stays fast and frictionless but is *fed* by the reputation practitioners create.

### 3.2 Non-Users (v1)

- **Hiring managers / recruiters / clients** — explicitly *not* a current target (`#44`). The site must not repel them and is architected to support a future "open to work" mode, but no job-seeking surface is built in v1.
- **Cold, unqualified traffic** — the site is not a lead-gen funnel; success is qualified peer shares and organizer conversions, not raw visit volume.

### 3.3 Key User Journeys

*Named protagonists; numbered UJ-1…UJ-4. FRs reference these by ID. `[ASSUMPTION]` on all protagonist names — substitute real archetypes freely; the beats matter more than the names.*

- **UJ-1. Devon, the practitioner, finds the recursion irresistible and shares it.** `[ASSUMPTION: name]`
  - **Persona + context:** A fellow agentic-engineering builder who clicked a link from a community channel (Discord/X/Slack). Curious, a little skeptical of "AI portfolio" hype.
  - **Entry state:** Unauthenticated, desktop, arriving cold at the hero from a shared URL.
  - **Path:** Reads the calm "Seasoned, building at the frontier" hero → types a question into the **Guide** ("is this site actually built with BMAD?") → the agent answers with **citations** and routes them into the **Glass Box** → they open the **real** brief/brainstorm/retros and scrub the **Master Timeline** teaser.
  - **Climax:** The realization that the site they're touring *is the project on the timeline they're scrubbing* — proof-as-process, hard to fake.
  - **Resolution:** They **share** the link and **follow** Josh. Realizes the reputation engine (SM-2) and audience goal (SM-3).
  - **Edge case:** With JS/motion disabled, the **Lean Static Fallback** still exposes the same artifacts as crawlable pages, so the "whoa" survives degraded.

- **UJ-2. Mara, the organizer, confirms and invites in under two minutes.** `[ASSUMPTION: name]`
  - **Persona + context:** A program-committee member who heard Josh's name (a referral, or the buzz from UJ-1). Busy; does not want to chat with a bot.
  - **Entry state:** Unauthenticated, likely mobile, arriving at the hero or a deep link to **Speaker Surface**.
  - **Path:** Skips the Guide → reaches **Speaker Surface** (the **READY 2026** reel front and center, signature talk topics, copy-paste bios, social proof) → reads one abstract → taps **Invite-Me**.
  - **Climax:** A frictionless contact form confirms her inquiry was received with a stated response expectation.
  - **Resolution:** The inquiry is **persisted and emailed** to Josh; Josh follows up. Realizes the speaking outcome (SM-1).
  - **Edge case:** She arrives Googling Josh first — the **Static Mirror** (SSG + JSON-LD) means the speaker facts and talk abstracts are indexable and credible *before* she clicks.

- **UJ-3. Sam, the wanderer, came for a song and leaves a follower.** `[ASSUMPTION: name]`
  - **Persona + context:** Found a Josh YouTube video or Suno track; here for delight, not evaluation.
  - **Entry state:** Unauthenticated, mobile, low intent.
  - **Path:** Lands near the **Creative** content → samples an embedded track / a playable project → drifts the calm gallery.
  - **Climax:** A genuinely enjoyable moment (a playable embed or a track), not a sales pitch.
  - **Resolution:** Taps a **follow/subscribe** CTA. Feeds SM-3.
  - **Edge case:** Heavy creative embeds lazy-load; on a slow connection the static gallery + links still work.

- **UJ-4. Josh extends the site, and it appears on its own timeline.**
  - **Persona + context:** Josh has a new project to add. No CMS exists by design (`#34`).
  - **Entry state:** Local repo, BMAD toolchain.
  - **Path:** Runs **`/bmad-correct-course`** to add a new epic/stories → runs the normal dev cycle → curated artifacts + media land in the **single git repo** → build regenerates the **Static Mirror** and **Knowledge Base** index, and refreshes the **Master Timeline** (hand-curated Dots in Stage 1, automated harvest from Stage 2 onward).
  - **Climax:** The new project shows up as a **BMAD Dot** on the Master Timeline and is reachable by the Guide — the site grew by being engineered, not edited.
  - **Resolution:** Deploy; the loop closes. Realizes the living-artifact vision and never-stale promise.
  - **Edge case:** A project with no artifacts/screenshots still imports via the **Project Import** workflow with curated substitutes (e.g. playable embed instead of screenshots).

## 4. Glossary

*Downstream workflows and readers must use these terms exactly. Introducing a synonym anywhere is a discipline violation.*

- **The Guide** (the grounded conversational agent; renamed from *Advocate Agent* during UX design, 2026-06-04) — The site's primary navigation/curation interface (`#7`, `#22`, `#36`). Answers only from the **Knowledge Base**, cites sources, holds a fixed confident-advocate persona, and routes visitors to **Static Mirror** pages (router, not silo). Runs as a small live backend; everything else is static.
- **Knowledge Base (KB)** — The curated markdown in the git repo that the Guide retrieves from. Indexed at build time. The *only* substance the agent may speak from.
- **Lean Static Fallback** — The non-agentic, fully browsable path to *all* content. Guarantees "complete access, curated surface — nothing hidden, nothing overwhelming" (`#24`). Default for reduced-motion / no-JS / non-chat visitors.
- **Static Mirror** — The SSG-prerendered, crawlable HTML for every key route in which all agent-revealed facts (bio, talk titles/abstracts, project descriptions, FAQ) exist as real headings/paragraphs/links, independent of JS or the agent. Underwrites SEO/GEO.
- **Glass Box** — The navigable, curated, read-only view of the site's **real** BMAD Artifacts proving the site builds itself (`#4`, `#5`). "Polished glass, not raw guts."
- **BMAD Artifact** — A real document the BMAD process produces and ships in the repo (`_bmad-output/`): brief, PRD, UX, architecture, epics, stories, retrospectives, brainstorm, research.
- **Master Timeline** — The single continuous, zoomable timeline of Josh's journey (`#12`, `#13`). Semantic zoom: out → projects as career milestones; in → a project's **BMAD Dots**. Ships in Stage 1 as a hand-curated *seed* (FR-16); the zoomable, automatically-harvested form is Stage 2 (FR-17).
- **BMAD Dot** — A point on the Master Timeline representing a planning workflow, a completed epic, a course-correction, or a retrospective; drillable into its underlying BMAD Artifact.
- **Speaker Surface** — The dedicated speaker scene: **Speaker Reel**, signature talk topics/abstracts, bios, social proof, and the **Invite-Me** path (`#46`).
- **Speaker Reel** — The 60–120s video reel plus full-talk links, READY 2026 front and center.
- **Invite-Me** — The frictionless speaker-contact path. An accessible contact form whose submissions are **persisted to Postgres and emailed** to Josh.
- **Wing** — A top-level content domain: the **Technical Wing**, the **Creative Wing**, the **Agentic Wing** (`#21`). Distinct and self-navigable by default; the Guide re-curates/blends across them on demand.
- **Creative Lab** — The tonal-shift movement/scene where the Architect's Studio briefly becomes a creative space; Suno, generative art, and playable work take center stage (`#42`). Skippable.
- **Architect's Studio** — The dominant visual language: spare, confident, generous whitespace, strong typography, restrained palette (`#15`). Default register: "serious, and I have taste."
- **Continuous Canvas** — The single navigable space (no page reloads) the site is moved through, with graphic transitions between **Scenes** (`#32`).
- **Scene** — A distinct stop on the Continuous Canvas (Hero, Master Timeline, Speaker Surface, etc.). The ordered set is the **Scene Arc**.
- **Scene Arc** — The default guided cinematic sequence; the Guide can reorder/deepen/skip Scenes per visitor (`#41`).
- **Thesis (Scene)** — The early Scene that states the site's core claim: *the site itself is Exhibit A*, built as a public BMAD project (`#2`). Establishes Proof-as-Process before the deeper Scenes.
- **Depth Dial** — A visitor-operated control for how deep the experience goes: 30-second skim → overview → deep technical/process dive (`#23`).
- **Demonstrator** — A curated, pre-recorded/replayable demonstration of real agentic work (`#8`, `#35`). Never live arbitrary public execution.
- **Adaptive Soundtrack** — Original Suno instrumentals (no lyrics) scoring the site by Scene; auto-ducks under video (`#29`, `#31`).
- **Video-Synced Repo** — A talk/demo video that highlights and jumps to the exact code being discussed as it plays (`#30`).
- **Project Import** — The deliberate workflow that brings a new project's curated artifacts, timeline data, media, and write-up into the repo and wires it into Timeline, Wings, and KB (`#38`).
- **Proof-as-Process** — The site's core principle: demonstrate skill by exposing the real, disciplined process that produced the work, rather than asserting it.

## 5. Aesthetic & Tone

*Load-bearing for `bmad-ux`. Captured here so the FR structure doesn't silently drop the feel.*

- **Quality priorities (make *exceptional* vs merely correct)** — orthogonal to staging: the **Guide and Proof-as-Process are the soul**; cinematic polish and content are the **body**; maintainability is the **skeleton** that keeps it alive (`#16` + the brainstorm prioritization). When effort is scarce, protect the soul first. The **Glass Box** is the designated day-one *remarkable* element (brief) and is held to the soul-tier craft bar.
- **Visual register — Architect's Studio.** Spare and confident: generous whitespace, strong/editorial typography (≈1 display + 1–2 text styles), restrained palette. "Professionalism as the floor, not the ceiling." `[ASSUMPTION: exact palette/typeface chosen in UX.]`
- **The wow builds; it is not front-loaded** (`#40`). Scene 1 is calm and credible; restraint *is* the flex. Two surfaces carry the designed wow: the **Guide visibly thinking/working** (`#16` — creative budget on chat first) and the **Creative Lab** tonal swell; everything else stays calm.
- **The Guide's voice — confident advocate, never hype.** Proactively makes the case "like a sharp recruiter who knows the work cold" (`#26`), but every claim is tied to a cited artifact: "the skeptic gets sold *and* gets the receipts" (`#27`). Plainly states when something isn't documented. Concise, bulleted, no speculation. "Spontaneity in phrasing, control over substance" (`#36`).
- **Two kinds of openness, kept distinct:** *process* transparency (the Glass Box, honest) vs *narrative* curation (the personal story shown as a highlight reel, not warts-and-all — `#11`).
- **References:** architect's studio; film composer (for soundtrack sequencing); cinematic "director's mode." **Anti-references (avoid):** static CV/résumé; raw file dump ("raw guts"); flat gallery/grid; confessional tone; page-reload model; "trust me" framing; hacker/Matrix terminals; literal AI metaphors (floating brains/robots/neural stock art); gimmick fonts; neon-gradient overload; scroll-jacking with no skip affordance; "look at my effects" with no message; unrefined "AI-slop" — **human curation is the differentiator; show it.**
- **Engineering is creative** (`#43`): the creative work reinforces (not dilutes) the engineering story; range is evidence of a modern engineer.

## 6. Information Architecture

*The frame the Features hang on. Confirmed/detailed in `bmad-ux`.*

- **Default Scene Arc** (full vision; the Guide may reorder/deepen/skip per visitor): **Hero → Thesis → Master Timeline → Speaker Surface → Flagship Case Study → Wings → Creative Lab → Glass Box → Close**. The Speaker Surface sits early–mid **by design** (`#46`): the reel is the credibility engine for the speaking-first goal (`#44`), so it precedes the deep dives — a placement SM-C1 guards against cinematic re-order regressions.
- **Stage 1 trimmed arc:** **Hero → Master Timeline (seed + teaser) → Speaker Surface → one deep Flagship → Glass Box → Close**. `[ASSUMPTION: Stage 1 ships as discrete, fast Scenes/sections rather than the full continuous cinematic canvas; the Continuous Canvas + camera-path transitions are a Stage 2 capability.]`
- **Fast on-ramp** (`#14`): the homepage orients in seconds (hero + Guide entry + identity); the Master Timeline is the showpiece *one click in*, not the literal front door — preserving the skeptical organizer's fast path.
- **Two navigation modes, always both available:** the **Guide** (primary, rich, agentic) and the **Lean Static Fallback** (complete, browsable, accessible). The agent is a **router** to **Static Mirror** pages, never the only way to a fact.
- **Wings** are the default content structure (Technical / Creative / Agentic), self-navigable; the agent blends across them on demand.
- **Design principle — "agentic ideal, graceful fallback"** (named at `#31`): every feature ships its smart/agentic version where feasible and degrades cleanly where not. Applied per-FR below; the per-feature "how agentic at launch" call is an Open Question (§14) for features where it's unsettled.

## 7. Features

*FRs are globally numbered (FR-N) and stable. Each carries a stage tag: `[S1]` Credible Hub (MVP) · `[S2]` The Magic · `[S3]` Full Richness. Glossary terms used verbatim. `[ASSUMPTION]` marks inferences.*

### 7.1 Experience Shell & Cinematic Canvas

**Description:** The Architect's Studio shell and the way visitors move through it. Stage 1 is a fast, restrained, sectioned shell with a calm hero. Stage 2 turns it into a Continuous Canvas with cinematic Scene transitions, a director's-mode Scene Arc, and the Depth Dial. Realizes UJ-1, UJ-2, UJ-3.

#### FR-1: Calm credible hero `[S1]`
A visitor landing cold sees the "Seasoned, building at the frontier" hero that communicates who Josh is within seconds, with the Guide entry and a fast on-ramp, without front-loading spectacle. Realizes UJ-1, UJ-2.
**Consequences (testable):**
- The hero conveys identity (name, **headshot/portrait**, one-line positioning) and an Invite-Me-or-explore choice above the fold on mobile and desktop.
- Hero meets the performance budget (NFR-1): FCP < ~2s mid-mobile; no blocking WebGL.
- A reduced-motion or no-JS visitor still gets a complete, styled static hero (NFR-2).

#### FR-2: Sectioned Scene structure with skip/progress affordances `[S1]`
A visitor can move through the Stage 1 Scenes (per §6 trimmed arc) and always knows where they are and how to skip ahead.
**Consequences (testable):**
- Every Scene is reachable directly via a stable URL/anchor (supports deep links like UJ-2's Speaker Surface link).
- No scroll-jacking without a visible skip/progress affordance.

#### FR-3: Continuous Canvas with cinematic Scene transitions `[S2]`
The site becomes a single Continuous Canvas navigated as a directed camera path, with graphic transitions replacing page loads (`#32`, `#33`).
**Consequences (testable):**
- Navigating between Scenes produces a continuous transition (no full page reload) when motion is enabled.
- Under `prefers-reduced-motion`, transitions degrade to instant section changes with no loss of content (NFR-2).
- At most one fixed WebGL canvas is used site-wide (NFR-1). `[ASSUMPTION: the single optional WebGL set-piece, if built, lives here or in the Master Timeline.]`

#### FR-4: Director's-mode Scene Arc reordering `[S2]`
The Guide can reorder, deepen, or skip Scenes for a visitor based on the conversation (`#41`), while a sensible default cut always exists.
**Consequences (testable):**
- A visitor who tells the agent their intent is taken to a reordered Scene sequence; a visitor who does nothing gets the default arc.
- Reordering never hides content from the Lean Static Fallback.

#### FR-5: Depth Dial `[S2]`
A visitor can set how deep the experience goes — 30-second skim → overview → deep technical/process dive — and the site/agent matches that depth (`#23`).
**Consequences (testable):**
- Changing the Depth Dial changes the level of detail surfaced for a given Scene without navigating away.
- The dial state is reflected by both the agent path and the static path.

### 7.2 The Guide

**Description:** The grounded conversational interface (`#7`, `#22`, `#26`, `#27`, `#36`). Stage 1 answers-with-citations and routes; Stage 2 adapts the experience and runs curated Demonstrations; Stage 3 captures/books speaking inquiries. Always paired with the Lean Static Fallback. The agent's *visible thinking/working* is a designed wow surface (`#16`), not a hidden spinner — reconciled with NFR-2 (announce per-message, not per-token). Realizes UJ-1, UJ-2.

#### FR-6: Grounded, cited answers from the Knowledge Base `[S1]`
A visitor can ask the Guide a question and receive an answer drawn only from the Knowledge Base, with a citation to the source artifact/section.
**Consequences (testable):**
- The agent retrieves only from the build-time KB index and never uses outside knowledge. *(Retrieval mechanism — BM25-first, top-k, embeddings-if-justified — is an architecture decision; see §10.)*
- When the retrieval score is below threshold or context is empty, the agent returns a canned "I don't have that documented" response and **does not call the model**.
- Every substantive claim names or links the Static Mirror page/section it came from.
- The server-side persona/system prompt is never returned to the client.
- `[ASSUMPTION: mid-tier model (e.g. claude-haiku-4-5 / gpt-5-mini class) with streaming, per research.]`

#### FR-7: Agent-as-router to Static Mirror `[S1]`
The Guide routes visitors to crawlable Static Mirror pages rather than being the sole source of any fact.
**Consequences (testable):**
- Every fact the agent can state also exists as real HTML on a Static Mirror page (verifiable via `view-source` + find, JS disabled — NFR-3).
- Agent responses embed working links to those pages.

#### FR-8: Lean Static Fallback reachability `[S1]`
A visitor who never opens the agent (or has JS off) can still reach **all** content through a lean, browsable index/navigation (`#24`).
**Consequences (testable):**
- 100% of content reachable via the agent is also reachable via the static navigation.
- The fallback nav is keyboard-operable and screen-reader navigable (NFR-2).

#### FR-9: Prompt-injection-resistant grounding `[S1]`
The agent maintains strict separation between retrieved context and visitor input so that visitor instructions cannot override the persona or grounding rules.
**Consequences (testable):**
- A visitor message attempting to change the agent's instructions, reveal the system prompt, or make it speak outside the KB does not succeed (spot-tested against a standard injection set).

#### FR-10: Agent-adaptive re-curation `[S2]`
The agent re-curates which Wings/Scenes/projects surface based on a visitor's stated intent ("show me something cool" → playable; "I'm an organizer" → Speaker Surface) (`#20`, `#22`).
**Consequences (testable):**
- Two visitors stating different intents receive demonstrably different orderings — e.g. an organizer is taken to the **Speaker Surface** first; a "show me something cool" visitor gets **playable** projects first; an agentic-curious visitor gets the **Agentic Wing** / Glass Box first.
- Re-curation is reflected in-place without losing static reachability.

#### FR-11: The Demonstrator (curated agentic-work demonstration) `[S2]`
A visitor can trigger a curated, pre-recorded/replayable Demonstration of real agentic work and a Build Walkthrough that teaches the BMAD Method step by step (`#8`, `#9`, `#35`).
**Consequences (testable):**
- Demonstrations are served as pre-approved static assets; **no live arbitrary execution engine is exposed** (Guardrail §9.1).
- Nothing Josh has not approved can be shown.

#### FR-12: Speaking-inquiry capture & booking via agent `[S3]`
A visitor can complete a speaking inquiry (and `[ASSUMPTION: optionally propose/booking times]`) directly in the agent conversation, feeding the same store as Invite-Me (FR-31) (`#45`).
**Consequences (testable):**
- An agent-captured inquiry is persisted to the same Postgres store and emailed to Josh as an Invite-Me submission (FR-31).
- The agent never promises a commitment on Josh's behalf beyond a stated response expectation.

### 7.3 Glass Box (Proof-as-Process)

**Description:** The curated, read-only view of the site's real BMAD Artifacts — the signature remarkable element (`#4`, `#5`, `#6`). Stage 1 renders the real artifacts plus a chronological teaser; Stage 2 adds the guided-tour polish. Realizes UJ-1.

#### FR-13: Read-only rendering of real BMAD Artifacts `[S1]`
A visitor can navigate a curated, read-only rendering of the project's actual `_bmad-output/` BMAD Artifacts (brief, brainstorm, research, PRD, and retrospectives/stories as they accrue), proving the site builds itself.
**Consequences (testable):**
- The rendered artifacts are the real repo artifacts (sourced from git at build time), not hand-written facsimiles.
- The view is read-only and curated/framed ("polished glass") — it is not a raw, unframed file dump.
- Artifacts are present in the Static Mirror (crawlable) (NFR-3).
- Only artifacts on an explicit **publish allowlist** are rendered; a **never-render set** — `.decision-log.md`, `review-*.md`, `reconcile-*.md`, internal addenda, and anything not allowlisted — is excluded at build time (default-deny), so the Glass Box cannot leak internal/process-private content (`#5`). `[ASSUMPTION: Josh curates the allowlist.]`

#### FR-14: Stage-1 chronological timeline teaser `[S1]`
The Glass Box includes a lightweight chronological teaser of the build history that foreshadows the Stage 2 Master Timeline.
**Consequences (testable):**
- The teaser shows the real sequence of BMAD Artifacts in time and links into the Glass Box detail.
- The teaser degrades to a static ordered list in the Lean Static Fallback.

#### FR-15: Guided tour + explorable map `[S2]`
A visitor can take a story-driven guided tour of the Glass Box (primary) or browse an explorable map (secondary) (`#6`).
**Consequences (testable):**
- The guided tour presents a narrated path through selected artifacts; the explorable map allows free browsing of the same set.

### 7.4 Master Timeline

**Description:** The organizing spine of Josh's journey (`#12`, `#13`, `#18`). Stage 1 seeds it (two flagship projects) and exposes the teaser (FR-14); Stage 2 delivers the zoomable timeline; Stage 3 realizes site-wide semantic zoom. Realizes UJ-1, UJ-4.

#### FR-16: Timeline seeded with curated BMAD Dots `[S1]`
The Master Timeline ships in Stage 1 as a **hand-curated** seed of **BMAD Dots** drawn from the real BMAD Artifacts of the two Stage-1 flagship projects (the portfolio itself + `loandemo`) (`#18`). The automated, deterministic git→Dot harvest is deferred to Stage 2 (FR-17, Open Q #10), so Stage 1 carries no unsolved pipeline and genuinely stands alone.
**Consequences (testable):**
- Each Dot maps to a real artifact (a planning workflow, completed epic, course-correction, or retro) and drills into it.
- Stage-1 Dots may be authored from a static, hand-curated manifest; **no automated harvest is required to ship Stage 1**.

#### FR-17: Zoomable Master Timeline `[S2]`
A visitor can zoom one continuous timeline from career-milestone level (project = dot) into a project's detailed BMAD Dots, as a single shareable gesture (`#13`).
**Consequences (testable):**
- Zooming out shows projects as milestones; zooming into a project expands its Dots.
- A Dot reveals: workflow output, epic scope, why a correction happened, retro conclusions, and skills implemented at that stage.
- Zoomed out, the timeline reads as a **craft-progression narrative** — vibe-coding → agentic engineering (`#10`), letting a visitor "interrogate the work" across projects. (The highlight-reel curation `#11` must not sand off this growth arc — keep the progression legible.)
- Dots are generated by an **automated, deterministic build-time harvest** from the repo's real BMAD Artifacts (the Stage-2 resolution of Open Q #10), replacing Stage 1's hand-curated manifest; adding artifacts regenerates Dots at build time (supports UJ-4).

#### FR-18: Site-wide semantic zoom `[S3]`
Semantic zoom extends across the whole site, not just the timeline (`#13` full form).
**Consequences (testable):**
- **Deferred pending UX (Stage 3):** concrete behavior is defined in `bmad-ux`. Directional acceptance: at any given zoom level, all Scenes present content at a *consistent* granularity (none stuck at full detail while others summarize). `[ASSUMPTION: exact behavior defined in UX.]`

### 7.5 Speaker Surface

**Description:** The fast-credible conversion path for organizers (`#46`), shaped by the speaker-conversion research. Stage 1 delivers the full credible surface; later stages enrich media. Realizes UJ-2; primary driver of SM-1.

#### FR-19: Speaker Reel & signature talks `[S1]`
A visitor reaches a Speaker Surface with the READY 2026 reel front and center, plus signature talks each with an **outcome-oriented title** (real numbers / war-stories, not a generic label; credibility framed *specifically* — "led X used by Y", not "30 years" alone), audience level, a 150–200-word abstract, 3–5 takeaways, and **offered formats/durations**.
**Consequences (testable):**
- READY 2026 (the `loandemo` talk) is the lead item.
- `[ASSUMPTION: 3–5 signature talks; a 60–120s reel + 2–3 full-talk links — exact list is content-inventory, §14.]`
- All talk facts exist in the Static Mirror with `Event` + `VideoObject` JSON-LD (NFR-3).
- Each talk lists offered **formats/durations** and basic **logistics** (travel, tech requirements).
- The **veteran-IC vantage** is presented as a pitchable angle — e.g. a seed talk like *"Patterns That Survive Hype Cycles: from CORBA to Kubernetes"* `[ASSUMPTION: example seed; confirm/replace.]`

#### FR-20: Copy-paste bios & social proof `[S1]`
The Speaker Surface provides copy-paste bios (50-word and 100–150-word) and social proof (logos, organizer/attendee testimonials, ratings).
**Consequences (testable):**
- Both bio lengths are present and one-tap copyable.
- **Audience-draw metrics** (subscriber/view counts) are *displayed*, not merely measured — organizers weigh audience draw. `[ASSUMPTION: which metrics to show; §14.]`
- `[ASSUMPTION: real testimonials/logos available — placeholders flagged until provided, §14.]`

#### FR-21: Downloadable one-sheet / EPK `[S2]`
A visitor can download a 1–2 page speaker one-sheet (EPK) PDF.
**Consequences (testable):**
- The EPK link serves a current PDF reflecting the signature talks and bios.

### 7.6 Projects & Wings

**Description:** How Josh's body of work is presented (`#17`, `#19`, `#21`, `#25`, `#28`, `#30`). Stage 1 = two flagship case studies done well + curated content links; Stage 2 = full Wings, playable embeds, multi-format case studies, Video-Synced Repo; Stage 3 = remaining content imported. Realizes UJ-1, UJ-3, UJ-4.

#### FR-22: Two flagship case studies `[S1]`
A visitor can explore two flagship projects done well: the portfolio itself (seeding the Glass Box) and `loandemo` (the live-on-stage proof), each as a layered case study fusing available assets (video + repo + write-up + timeline) (`#28`). The **Flagship Case Study** Scene (§6) leads with `loandemo`; the portfolio-itself flagship is surfaced chiefly via the Glass Box.
**Consequences (testable):**
- Each flagship has a Static Mirror page with `CreativeWork` JSON-LD (NFR-3).
- `loandemo` connects to its READY 2026 talk (FR-19).

#### FR-23: Curated content links/embeds `[S1]`
A visitor can reach curated links/embeds to Josh's YouTube, Suno, and GitHub from the site (`#3`).
**Consequences (testable):**
- Links are curated into the repo (no live runtime reads — Guardrail §9.1 / `#37`).
- `[ASSUMPTION: specific channel URLs/handles pending, §14.]`

#### FR-24: Distinct Wings `[S2]`
A visitor can self-navigate three distinct Wings — Technical, Creative, Agentic — as the default structure, which the agent can blend on demand (`#21`).
**Consequences (testable):**
- Each Wing is independently reachable and browsable without the agent.

#### FR-25: Greatest-hits, relevance-ordered `[S2]`
Work is presented as a curated greatest-hits surfaced by relevance to the visitor's interest, not as a chronological résumé (`#25`).
**Consequences (testable):**
- Ordering responds to stated interest (via the agent) and defaults to a curated order otherwise; there is no static reverse-chronological CV as the primary surface.

#### FR-26: Playable project embeds `[S2]`
A visitor can play web creative/technical projects live in the browser rather than viewing screenshots (`#19`) — e.g. `vector-wars` (Three.js/Vite), `voyager` (web sim), `christmas-elves` (Phaser).
**Consequences (testable):**
- Each playable embed loads lazily (NFR-1) and has a static poster/fallback.
- `[ASSUMPTION: these three are the Stage-2 playable set; others import in Stage 3.]`

#### FR-27: Video-Synced Repo `[S2]`
As a talk/demo video plays, the site highlights and jumps to the exact code being discussed (`#30`).
**Consequences (testable):**
- Time-coded markers move the repo view in lockstep with playback; with motion/JS off, the video and a static repo link remain available.

#### FR-28: Remaining content import `[S3]`
All remaining projects, talks, and songs are imported via Project Import (`#38`) into Timeline, Wings, and KB.
**Consequences (testable):**
- Each imported item appears on the Master Timeline, in its Wing, and is answerable by the agent.

### 7.7 Creative Showcase & Creative Lab

**Description:** The creative dimension (`#42`, `#29`, `#31`, `#43`). Stage 1 surfaces curated creative links; Stage 2 delivers the Creative Lab movement and Adaptive Soundtrack. Realizes UJ-3.

#### FR-29: Creative Lab movement `[S2]`
A visitor (unless the agent reads them as engineering-only) experiences the Creative Lab — a tonal-shift Scene where Suno, generative art, and playable work take center stage (`#42`).
**Consequences (testable):**
- The Creative Lab is skippable and never blocks the path to Speaker Surface or Glass Box.

#### FR-30: Adaptive Soundtrack `[S2]`
Original Suno instrumentals (no lyrics) score the site by Scene and auto-duck when a video plays (`#29`, `#31`); a fixed Scene→track mapping is the fallback for the agent-curated ideal.
**Consequences (testable):**
- Audio is off by default and user-controllable; it never autoplays with sound against browser/user preferences.
- When a YouTube video plays, the soundtrack ducks/quiets.
- Featured tracks are commercially licensed (Guardrail §9.2 / Suno prerequisite).

### 7.8 Conversion & Contact (Invite-Me)

**Description:** Turning attention into outcomes (`#44`, `#45`). The Close converts to invite/follow/join; Invite-Me captures speaking inquiries. Realizes UJ-2, UJ-3; primary driver of SM-1 and SM-3.

#### FR-31: Invite-Me form (persisted + emailed) `[S1]`
A visitor can submit a speaking inquiry via a short, accessible contact form; the submission is **persisted to the attached Postgres database and emailed to Josh**.
**Consequences (testable):**
- A submitted inquiry creates a Postgres row (in a table the site owns) **and** triggers an email to Josh.
- The form confirms receipt with a **stated response time** (e.g. "I reply within N business days"). `[ASSUMPTION: N TBD.]`
- The form captures a structured **attribution field** ("how did you hear about me?") so inquiries are attributable (feeds SM-1).
- The form is keyboard-operable, labeled, and validated accessibly (NFR-2); it collects the minimum necessary fields, no account required (Guardrail §9.2).
- `[ASSUMPTION: email transport TBD — VM-local mailer or SMTP; §14.]`

#### FR-32: Close / follow & subscribe CTAs `[S1]`
The Close Scene presents clear invite-me / follow-the-work / join-the-audience actions (`#45`).
**Consequences (testable):**
- Follow/subscribe CTAs link to Josh's channels and are tracked as conversion events (FR-36).

### 7.9 Content Pipeline & Maintenance

**Description:** The code-as-CMS model that makes the site a living BMAD project (`#34`, `#37`, `#38`, `#39`). Spans all stages. Realizes UJ-4.

#### FR-33: Single git source of truth; build-time generation `[S1]`
All site content derives from one curated git repo; the build generates the Static Mirror, KB index, and Glass Box / timeline-teaser data — with no CMS and no runtime external reads. *(In Stage 1 the Master Timeline's Dots come from a hand-curated manifest, FR-16; the automated Timeline-data harvest is Stage 2, FR-17.)*
**Consequences (testable):**
- No admin/CMS surface exists.
- At runtime the site performs no reads from GitHub/YouTube/Suno; all such content is curated into the repo (`#37`).
- A build produces: prerendered Static Mirror routes, the KB index, and the Glass Box artifact-teaser data from real artifacts (the Master Timeline's Stage-1 Dots are hand-curated per FR-16).

#### FR-34: Project Import & `/bmad-correct-course` extension `[S1]`
Josh can add a new project by running Project Import and extending the site via `/bmad-correct-course` (new epic/stories → dev cycle → deploy), after which the project appears on the Timeline and is answerable by the agent (`#38`, `#39`).
**Consequences (testable):**
- A documented Project Import path wires a new project's artifacts, media, and write-up into Timeline, Wings, and KB.
- After import + build, the project is retrievable by the agent (FR-6); it appears on the Master Timeline as a hand-curated Dot in Stage 1 (FR-16) and via the automated harvest once that ships in Stage 2 (FR-17).

### 7.10 Discoverability (Static Mirror / SEO / GEO)

**Description:** "If it matters for SEO/AI, it must be in the initial HTML." First-class because organizers Google Josh (`#44`). Spans Stage 1+. See NFR-3 for the cross-cutting standard.

#### FR-35: Structured-data emission `[S1]`
Key routes emit server-rendered JSON-LD: `Person` + `ProfilePage` (home/about), `Event` (talks), `VideoObject` (recordings), `CreativeWork` (projects), `FAQPage` (Q&A).
**Consequences (testable):**
- Each route type emits its schema and passes the Rich Results Test.

### 7.11 Measurement & Analytics

**Description:** Privacy-first measurement so success metrics have a real method (§13). Stage 1. Realizes the measurement need behind SM-1/SM-3.

#### FR-36: Privacy-first funnel & conversion analytics `[S1]`
The site measures page/funnel behavior, outbound-channel clicks, and the Invite-Me conversion using cookieless, privacy-respecting analytics with no PII.
**Consequences (testable):**
- Analytics set no tracking cookies and collect no PII (Guardrail §9.2).
- Invite-Me submissions, outbound follow/subscribe clicks, and Glass Box/Timeline engagement are measurable.
- `[ASSUMPTION: Plausible-style tool (self-host vs SaaS TBD), §14.]`

## 8. Cross-Cutting Non-Functional Requirements

*System-wide quality attributes. Numbered NFR-N for cross-reference.*

- **NFR-1 Performance.** FCP < ~2s on mid-range mobile; main-page JS < ~200–250KB gzipped; at most one fixed WebGL canvas site-wide; heavy stack (WebGL, large embeds) lazy-loaded (`client:visible`/`client:idle`); compressed assets for any WebGL (KTX2/Basis/Draco) with static fallback. `[ASSUMPTION: budgets adopted from research; confirm.]`
- **NFR-2 Accessibility.** `prefers-reduced-motion` gated at two layers (CSS media query **and** JS — do not init GSAP/ScrollTrigger/WebGL; show static hero). Guide widget: `role="dialog"`; transcript `role="log"` + `aria-live="polite"` with updates batched **per-message, not per-token**; focus management on open/close/response; real `<button>` elements; fully keyboard-operable. WebGL canvas treated as `aria-hidden` decorative with DOM equivalents. Avoid Lenis/smooth-scroll or gate it behind reduced-motion. `[ASSUMPTION: target WCAG 2.1 AA.]`
- **NFR-3 SEO/GEO (first-class).** SSG-prerender all key routes (home, about, each talk, each project, speaking, contact); the Static Mirror exposes all agent-revealed facts as real HTML verifiable via `view-source` + find with JS disabled (agent = router, not silo); answer-first intros, clear heading hierarchy, Q&A blocks, plain-text key facts; do not block AI crawlers; brand/name present in short answers; JSON-LD per FR-35.
- **NFR-4 Agent reliability & latency.** Responses stream; retrieval is from the build-time index only; empty/low-score context skips the model call; the agent backend is a single small service behind nginx. **Latency targets:** time-to-first-token < ~1.5 s; hard ceiling ~10 s before a graceful fallback message; retrieval adds < ~200 ms. `[ASSUMPTION: targets pending load testing.]`
- **NFR-5 Static, key-free runtime.** All non-agent content is prebuilt static assets served by nginx (`#A1` — static film + small live agent brain); the only dynamic components are the agent backend and the Invite-Me endpoint. No runtime API keys or external rate limits in the content path.
- **NFR-6 Maintainability.** Code-as-CMS; content added only via git/BMAD (`/bmad-correct-course`); KB index and Glass Box teaser data regenerate deterministically at build time from real artifacts; the Master Timeline's automated, deterministic Dot harvest is a Stage 2 capability (FR-17), with Stage 1 using a hand-curated manifest (FR-16).
- **NFR-7 Observability.** Privacy-first analytics (FR-36) + server logs sufficient to measure §13 metrics and detect agent retrieval misses (the documented trigger to consider embeddings).

## 9. Constraints & Guardrails

### 9.1 Safety
- The Guide is **retrieve-only** with a **citation-required** prompt and **strict context separation** against prompt injection (FR-6, FR-9). Persona/system prompt is server-side and never exposed.
- **No public live agentic execution** — Demonstrations are pre-recorded/curated (`#35`); no arbitrary execution engine is exposed to visitors.
- **No live external reads** at runtime (`#37`); nothing unapproved ever appears (`#11` highlight-reel curation governs narrative; Glass Box governs honest process exposure).

### 9.2 Privacy
- Cookieless, no-PII analytics (FR-36); no visitor accounts.
- Invite-Me collects the minimum necessary fields; inquiry data in Postgres is access-controlled and used only to respond to the inquiry. `[ASSUMPTION: retention policy TBD, §14.]`

### 9.3 Cost
- One small agent backend + one LLM endpoint (the VM's OpenAI-compatible endpoint; no external key); mid-tier model for the agent; static hosting for everything else — operationally cheap and simple.

## 10. Platform & Delivery Constraints

*Recorded as input/constraint; `bmad-create-architecture` confirms the stack.*

- **Hosting.** Static build served by an nginx vhost at `joshuabrandt.abacusai.cloud` (ingress port 80) on Josh's Abacus VM, plus a small live backend for the Guide and the Invite-Me endpoint. Postgres is attached (Invite-Me store now; pgvector available if embeddings are ever justified). S3 path currently unset.
- **LLM.** The VM's OpenAI-compatible endpoint exposes 137 models incl. `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.x`, `gemini-3.x` — no external key needed. `[ASSUMPTION: mid-tier model for the agent.]`
- **Recommended stack (input).** Astro (SSG) + React islands (hero + chat widget); CSS scroll-driven animations as the ~80% baseline; GSAP + ScrollTrigger for the cinematic layer; at most one Three.js/React-Three-Fiber hero set-piece with static fallback; avoid Lenis. Layers map to stages (baseline → cinematic → optional set-piece).
- **RAG index (input).** Build-time markdown indexer; chunk at heading boundaries (≈300–800 tokens); BM25/keyword first; add vectors (`sqlite-vec`/LanceDB/pgvector) only if logged retrieval misses justify it.
- **Launch prerequisites (must clear before/at deploy):**
  1. **Enable public URL access** — `public_url_enabled` is currently **OFF**; nothing routes publicly until it is enabled in the Abacus Cloud Services UI.
  2. **Suno commercial rights** — commercial use attaches at generation time; upgrade to a paid plan and **re-generate** any featured tracks (free-tier tracks are not retroactively licensed). Apply the same "made while subscribed" check to any paid AI tool used for featured content. **Note:** fully-AI-generated audio has limited U.S. statutory copyright, so what Josh holds is the **contractual license** Suno grants (0% revenue share on paid-plan commercial use), not authorship ownership.
  3. `github_connected` is OFF — **not a blocker** (no live GitHub reads); use `gh auth login`/PAT for push-pull.

## 11. Non-Goals (Explicit)

- **No CMS / admin panel** — code-as-CMS via git (`#34`).
- **No live runtime reads** from GitHub/YouTube/Suno — all content curated into the repo (`#37`).
- **No public live agentic execution** — Demonstrations are pre-recorded/curated (`#35`).
- **No job-seeking / "open to work" mode** — latent/future; architected for but not built (`#44`). `[NON-GOAL for MVP]`
- **Not a cold-traffic lead-gen funnel** — success is qualified peer shares + organizer conversions, not raw volume.
- **Not a static CV/résumé** — greatest-hits by relevance, not a chronological résumé (`#25`).
- **Podcast integration** — concept-phase; out for now; synergy scoped later if/when it launches. `[NOTE FOR PM: emotionally load-bearing — revisit if the podcast ships.]`

## 12. MVP Scope & Staging

### 12.1 In Scope — Stage 1 (Credible Hub), MVP
A credible, shareable site that stands alone, targeting ~end-of-June-2026. FRs: **FR-1, FR-2, FR-6, FR-7, FR-8, FR-9, FR-13, FR-14, FR-16, FR-19, FR-20, FR-22, FR-23, FR-31, FR-32, FR-33, FR-34, FR-35, FR-36** — i.e. the calm shell + fast hero, the grounded Guide + Lean Static Fallback, the Glass Box (real artifacts + timeline teaser), a **hand-curated** seed of the Master Timeline (automated harvest → Stage 2), the Speaker Surface (reel/topics/bios/social proof), two flagship case studies + curated content links, Invite-Me (persist+email), the Close, the git/code-as-CMS pipeline + Project Import, the Static Mirror/JSON-LD, and privacy-first analytics.

### 12.2 Out of Scope for MVP (specified, deferred)
- **Stage 2 (The Magic):** FR-3, FR-4, FR-5, FR-10, FR-11, FR-15, FR-17, FR-21, FR-24, FR-25, FR-26, FR-27, FR-29, FR-30. (Continuous Canvas + cinematic transitions, director's-mode reordering, Depth Dial, agent re-curation, Demonstrator, guided-tour Glass Box, zoomable Master Timeline, EPK, full Wings, greatest-hits ordering, playable embeds, Video-Synced Repo, Creative Lab, Adaptive Soundtrack.)
- **Stage 3 (Full Richness):** FR-12, FR-18, FR-28. (Agent capture/booking, site-wide semantic zoom, remaining-content import.)
- **Hard non-goals:** per §11.

### 12.3 Staging note
Stage = delivery sequence, not priority cut (`#47`): every stage is committed MVP-quality scope, shipped incrementally so a credible site is always live; Stage 1 stands alone and later stages add magic without re-platforming.

## 13. Success Metrics

*Each SM cross-references the FRs it validates. 12-month horizon unless noted.*

**Primary**
- **SM-1 — Speaking outcome.** ≥ 1 speaking inquiry submitted via Invite-Me (FR-31) or agent capture (FR-12), measured by the form's structured **attribution field** + analytics referrer (FR-36). *(Narrative note, not a pass condition: an invitation where the site only plausibly/indirectly helped is encouraging but isn't instrumented, so it does not by itself satisfy SM-1.)* Validates FR-19, FR-20, FR-31, FR-32.
- **SM-2 — Reputation engine.** Josh pitches ≥ 1 new conference — ideally *a talk about the site itself*. Leading signal: the site is shared/mentioned in the agentic-engineering community. Method: manual + outbound-share analytics (FR-36). Validates FR-13, FR-16/FR-17, FR-19.

**Secondary**
- **SM-3 — Audience.** +500 net-new subscribers/follows across Josh's channels (6–12 months). Method: channel counts + outbound-click analytics (FR-36). Validates FR-23, FR-26/FR-29, FR-32.
- **SM-4 — Ship discipline.** Stage 1 is **live and publicly shareable by the ~end-of-June-2026 soft target**, independent of any other project. Method: deploy date of the §12.1 FR set.

**Counter-metrics (do not optimize)**
- **SM-C1 — Don't bury the organizer.** The fast-credible organizer path (UJ-2) must stay reachable *without* engaging chat or the cinematic layer; time-to-Speaker-Surface and Invite-Me must not regress as Stage 2/3 polish lands. Counterbalances the cinematic features behind SM-1/SM-2.
- **SM-C2 — Don't slip the ship.** Stage 1 ships on the soft target even if Stage 2/3 "magic" is incomplete; richness never justifies missing the date. Counterbalances SM-2/SM-3 ambition.
- **SM-C3 — Zero ungrounded agent claims.** The Guide must not fabricate or over-hype; spot-audits should find no claim that isn't grounded/cited. Counterbalances the "confident advocate" pressure behind SM-1.
- **SM-C4 — Quality of shares over volume.** A spike in low-intent cold traffic is not success; the signal is peer shares/follows. Counterbalances raw-traffic gaming of SM-3.

## 14. Open Questions

1. **Final frontend stack** (architecture phase): Astro vs Next; whether the single optional WebGL set-piece is built and at which stage (FR-3/FR-17).
2. **UJ protagonist names/archetypes** — confirm or replace Devon/Mara/Sam (§3.3).
3. **Content inventory & metadata:** `loandemo` repo URL; READY 2026 talk title/abstract/date; YouTube/Suno/GitHub handles; which projects map to which Wing; which talks fill the reel; which Suno tracks are featured (FR-19, FR-22, FR-23, FR-26, FR-30).
4. **Analytics tool** — Plausible-style choice; self-host vs SaaS and the privacy posture (FR-36).
5. **Invite-Me email transport** (VM-local mailer vs SMTP) and **inquiry data retention** policy (FR-31, §9.2).
6. **Suno regeneration (tracked pre-Stage-2 work item)** — confirm which existing featured tracks are free-tier (non-commercial) assets that must be **re-generated** under a paid plan before they can ship; gates FR-30 (Stage 2). (§10 prerequisite.)
7. **Podcast synergy** — deferred until/if the podcast ships (§11).
8. **Stage 2 vs Stage 3 cut lines** — confirm the exact feature split (e.g. is the Demonstrator Stage 2 as assumed?).
9. **Per-feature "agentic ideal, graceful fallback" calls** — how agentic each feature is at launch vs fallback (the recurring `#31` decision); esp. FR-4/FR-5/FR-10 (director's-mode & re-curation), FR-11 (Demonstrator), FR-30 (Adaptive Soundtrack), FR-12 (agent capture).
10. **Master Timeline data model (Stage 2)** — how BMAD Dots are deterministically harvested from git artifacts at build time (FR-17). Stage 1 ships hand-curated Dots (FR-16), so this no longer gates the MVP.

## 15. Assumptions Index

*Every `[ASSUMPTION]` surfaced for confirmation.*

- §3.3 — UJ protagonist names (Devon/Mara/Sam) are invented; archetypes matter more than names.
- §6 — Stage 1 ships as discrete fast Scenes; the full Continuous Canvas + camera-path transitions are Stage 2.
- §7.1 FR-3 — the single optional WebGL set-piece, if built, lives in the Canvas or Master Timeline.
- §7.2 FR-6 — mid-tier model (claude-haiku-4-5 / gpt-5-mini class) with streaming.
- §7.2 FR-12 — agent booking may propose times; exact booking depth TBD.
- §7.5 FR-19/FR-20 — 3–5 signature talks, 60–120s reel + 2–3 full talks; real testimonials/logos pending (placeholders flagged).
- §7.6 FR-23/FR-26 — specific channel URLs/handles pending; the three named playables are the Stage-2 set.
- §7.7 FR-30 — featured tracks regenerated under a paid Suno plan.
- §7.8 FR-31 — Invite-Me email transport TBD (VM mailer vs SMTP).
- §7.11 FR-36 — Plausible-style analytics; self-host vs SaaS TBD.
- §5 — exact palette/typeface chosen in UX.
- §7.3 FR-13 — Glass Box publish-allowlist is Josh-curated (default-deny).
- §7.4 FR-16/FR-18 — Stage-1 Dots may be hand-curated; site-wide semantic-zoom behavior defined in UX.
- §8 NFR-4 — agent latency targets pending load testing.
- §8 NFR-1 — performance budgets adopted from research; confirm.
- §8 NFR-2 — target WCAG 2.1 AA.
- §7.5 FR-19/FR-20 — veteran-IC seed talk title is an example; which audience-draw metrics to display, TBD.
- §7.8 FR-31 — stated response-time value (N business days) TBD.
- §9.2 — inquiry-data retention policy TBD.
- §10 — mid-tier agent model; stack recorded as input pending architecture.
