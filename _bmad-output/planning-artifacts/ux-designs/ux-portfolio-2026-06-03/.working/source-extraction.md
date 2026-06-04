# Source Extraction (Discovery working note — not a spine)

> _The downstream spine documents win on conflict. This is a faithful extraction of what the upstream planning docs (PRD anchor, brief, brainstorm, research) actually say — no design authored here, no directions invented. Gaps are flagged as gaps._

**Sources read (PRD is the ANCHOR; on conflict, prefer PRD and note it):**
1. PRD (anchor): `…/prds/prd-portfolio-2026-06-02/prd.md` + `addendum.md`
2. Product brief: `…/briefs/brief-portfolio-2026-06-02/brief.md` + `addendum.md`
3. Brainstorm: `_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md` (47 ideas)
4. Pre-brief research: `_bmad-output/research/portfolio-pre-brief-research-2026-06-02.md`

Idea numbers (e.g. `#39`) and `FR-N` carry from the sources for traceability. The working title is "Josh Brandt Portfolio Site" at `joshuabrandt.abacusai.cloud`.

---

## Product in one paragraph

`joshuabrandt.abacusai.cloud` is a personal portfolio that "doesn't *describe* Josh Brandt's work — it **demonstrates** it." Josh is a software engineer with 30 years of shipping experience who has gone deep on agentic engineering, but that work is "scattered and invisible" across GitHub, conference talks, YouTube, and Suno. The site is the "remarkable center of gravity" that makes the substance "undeniable and shareable": a clean, confident experience navigated by a grounded **Advocate Agent**, built and maintained *as a public BMAD project* so the site itself is **Exhibit A** (`#2`) — "the medium is the message." Its honest job is to be a craft artifact remarkable enough that peers **share** it (building reputation) and a credible hub that **converts** attention into speaking invitations and audience — explicitly *not* a cold-traffic lead-gen funnel. The resolving positioning is **"Seasoned, Not Stuck"** (`#1`): a 30-year veteran *and* a cutting-edge agentic practitioner at once. Every rich/agentic/cinematic path has a **Lean Static Fallback** so "nothing is ever hidden behind the magic."

---

## Target users / personas

Four JTBD audiences; named protagonists for journeys (names are `[ASSUMPTION]` per PRD §3.3 — "substitute real archetypes freely; the beats matter more than the names").

- **Practitioner / peer (the amplifier)** — *"Show me something that earns my respect and is worth sharing with my network."* Wants depth, surprise, credibility-among-peers (Glass Box, Master Timeline, meta-recursion). **PRIMARY DESIGN TARGET — the default experience is tuned for them.** Brief: "immersive, deep, 'whoa'." Protagonist **UJ-1 = Devon** — "a fellow agentic-engineering builder who clicked a link from a community channel (Discord/X/Slack). Curious, a little skeptical of 'AI portfolio' hype." Desktop, cold arrival.
- **Conference organizer / program-committee member (the converter)** — *"Quickly confirm this person can deliver a great talk, and let me invite them without friction."* "Busy, mildly skeptical, may not want to chat." **PRIMARY CONVERSION TARGET — served by a guaranteed fast-credible path.** Protagonist **UJ-2 = Mara** — "a program-committee member who heard Josh's name (a referral, or the buzz from UJ-1). Busy; does not want to chat with a bot." Likely **mobile**.
- **Content wanderer** — *"I liked a video/track; give me more to enjoy and an easy way to follow."* "Came for delight, not evaluation." Feeds the audience goal. Protagonist **UJ-3 = Sam** — "Found a Josh YouTube video or Suno track; here for delight." Mobile, low intent.
- **Josh, the builder** — *"Let me add a new project as a normal BMAD epic and have it appear on the site's own timeline, with no CMS."* "The maintenance model *is* part of the product story." Protagonist **UJ-4 = Josh**, local repo + BMAD toolchain.

**Priority order (verbatim intent):** "practitioner amplification is the *upstream engine* — peer shares build the awareness that *causes* organizer conversions and audience growth. The default experience funds that engine first (the practitioner); the organizer path stays fast and frictionless but is *fed* by the reputation practitioners create."

**Non-users (v1):**
- **Hiring managers / recruiters / clients** — explicitly NOT a current target (`#44`). "The site must not repel them and is architected to support a future 'open to work' mode, but no job-seeking surface is built in v1."
- **Cold, unqualified traffic** — "the site is not a lead-gen funnel."

---

## Form-factor & platform signals

- **Web** — a website at `joshuabrandt.abacusai.cloud`. No mobile-app or desktop-app intent anywhere.
- **Multi-surface within web: mobile + desktop both first-class.** FR-1: identity + Invite-Me-or-explore choice "above the fold **on mobile and desktop**." NFR-1 performance budget is explicitly "mid-range **mobile**": FCP < ~2s. UJ-1 (practitioner) = "**desktop**, arriving cold"; UJ-2 (organizer) = "likely **mobile**"; UJ-3 (wanderer) = "**mobile**, low intent." So design must be mobile-credible for the conversion + wander paths, desktop-immersive for the practitioner path.
- **Hosting / OS context (not a UX device target, recorded for completeness):** static build served by an nginx vhost on Josh's Abacus VM (ingress port 80) + a small live backend for the Advocate Agent and the Invite-Me endpoint. Postgres attached. LLM via the VM's OpenAI-compatible endpoint (137 models incl. claude-opus-4-8/sonnet-4-6/haiku-4-5, gpt-5.x, gemini-3.x) — no external key.
- **Browser-capability targets that shape layout/behavior:** must work with **JS disabled**, with **`prefers-reduced-motion`**, and be **crawlable** (SEO/GEO first-class). At most **one fixed WebGL canvas** site-wide.

---

## Core features / capabilities, and the screens/surfaces each implies

Stage tags from PRD: `[S1]` Credible Hub (MVP) · `[S2]` The Magic · `[S3]` Full Richness. (PRD note: "Stage = delivery sequence, not priority cut" — every stage is committed MVP-quality scope.)

**A. Experience Shell & Cinematic Canvas**
- **FR-1 Calm credible hero `[S1]`** → Hero Scene. Identity (name, headshot/portrait, one-line positioning), Advocate Agent entry, an Invite-Me-or-explore choice above the fold on mobile + desktop. "Without front-loading spectacle." Static styled hero under reduced-motion/no-JS.
- **FR-2 Sectioned Scene structure w/ skip/progress `[S1]`** → every Scene reachable via stable URL/anchor (deep links); "no scroll-jacking without a visible skip/progress affordance."
- **FR-3 Continuous Canvas + cinematic Scene transitions `[S2]`** → single Continuous Canvas navigated as a "directed camera path," graphic transitions replace page loads; degrades to instant section changes under reduced-motion. (Stage 1 ships as discrete fast Scenes — see §6 addendum decision.)
- **FR-4 Director's-mode Scene Arc reordering `[S2]`** → the Advocate Agent reorders/deepens/skips Scenes per visitor; a sensible default cut always exists; reordering never hides content from the fallback.
- **FR-5 Depth Dial `[S2]`** → visitor-operated control: "30-second skim → overview → deep technical/process dive"; reflected by both agent and static paths.

**B. The Advocate Agent**
- **FR-6 Grounded, cited answers from the KB `[S1]`** → chat widget. Answers only from build-time KB index; below-threshold/empty → canned "I don't have that documented" and **does not call the model**; every substantive claim names/links its Static Mirror source; server-side persona never returned to client.
- **FR-7 Agent-as-router to Static Mirror `[S1]`** → every fact the agent states also exists as real HTML; responses embed working links.
- **FR-8 Lean Static Fallback reachability `[S1]`** → a lean browsable index/nav reaching 100% of agent-reachable content; keyboard-operable, screen-reader navigable.
- **FR-9 Prompt-injection-resistant grounding `[S1]`** → visitor instructions cannot override persona/grounding.
- **FR-10 Agent-adaptive re-curation `[S2]`** → agent re-curates Wings/Scenes/projects by stated intent (organizer → Speaker Surface first; "show me something cool" → playable first; agentic-curious → Agentic Wing/Glass Box first).
- **FR-11 The Demonstrator `[S2]`** → curated, pre-recorded/replayable Demonstration of real agentic work + a Build Walkthrough teaching BMAD step by step; pre-approved static assets, **no live arbitrary execution**.
- **FR-12 Speaking-inquiry capture & booking via agent `[S3]`** → inquiry (optionally propose booking times) completed in-chat, feeding the same store as Invite-Me.

Note: the agent's **visible thinking/working** is "a designed wow surface (`#16`), not a hidden spinner" — reconciled with NFR-2 to **announce per-message, not per-token**.

**C. Glass Box (Proof-as-Process) — the signature day-one remarkable element**
- **FR-13 Read-only rendering of real BMAD Artifacts `[S1]`** → navigable, curated, read-only view of the project's actual `_bmad-output/` artifacts (brief, brainstorm, research, PRD, retros/stories as they accrue). "Polished glass, not raw guts" — not a raw file dump. **Publish allowlist (default-deny)**; never-render set = `.decision-log.md`, `review-*.md`, `reconcile-*.md`, internal addenda. Present in Static Mirror.
- **FR-14 Stage-1 chronological timeline teaser `[S1]`** → lightweight chronological teaser of build history foreshadowing the Master Timeline; degrades to a static ordered list.
- **FR-15 Guided tour + explorable map `[S2]`** → story-driven guided tour (primary) + explorable map (secondary) over the same artifact set (`#6` — "Guided Tour Primary, Explorable Map Secondary").

**D. Master Timeline — the organizing spine**
- **FR-16 Timeline seeded with curated BMAD Dots `[S1]`** → hand-curated seed of **BMAD Dots** from the two Stage-1 flagships (the portfolio itself + `loandemo`). Each Dot maps to a real artifact and drills into it. No automated harvest required to ship Stage 1.
- **FR-17 Zoomable Master Timeline `[S2]`** → semantic zoom: out → projects as career milestones; in → a project's BMAD Dots, as "a single shareable gesture." A Dot reveals "workflow output, epic scope, why a correction happened, retro conclusions, and skills implemented at that stage." Zoomed out it reads as a **craft-progression narrative** — "vibe-coding → agentic engineering" (`#10`). Dots auto-harvested deterministically at build time.
- **FR-18 Site-wide semantic zoom `[S3]`** → semantic zoom across the whole site; concrete behavior **deferred to UX** ("at any given zoom level, all Scenes present content at a consistent granularity").

**E. Speaker Surface — the fast-credible conversion path**
- **FR-19 Speaker Reel & signature talks `[S1]`** → dedicated Speaker Surface. **READY 2026 reel front and center**; signature talks each with an **outcome-oriented title** ("led X used by Y", not "30 years" alone), audience level, a 150–200-word abstract, 3–5 takeaways, offered **formats/durations**, basic **logistics** (travel, tech). Veteran-IC vantage pitched as an angle (seed example: *"Patterns That Survive Hype Cycles: from CORBA to Kubernetes"* `[ASSUMPTION]`). All talk facts in Static Mirror w/ `Event` + `VideoObject` JSON-LD.
- **FR-20 Copy-paste bios & social proof `[S1]`** → **50-word and 100–150-word** bios, one-tap copyable; social proof (logos, organizer/attendee testimonials, ratings); **audience-draw metrics displayed** (subscriber/view counts). Real testimonials/logos pending — placeholders flagged.
- **FR-21 Downloadable one-sheet / EPK `[S2]`** → 1–2 page speaker one-sheet PDF.

**F. Projects & Wings**
- **FR-22 Two flagship case studies `[S1]`** → **Flagship Case Study** Scene leads with `loandemo` (live-on-stage proof); the portfolio-itself flagship is surfaced chiefly via the Glass Box. Each a layered case study fusing video + repo + write-up + timeline; each has a Static Mirror page w/ `CreativeWork` JSON-LD.
- **FR-23 Curated content links/embeds `[S1]`** → curated links/embeds to Josh's **YouTube, Suno, GitHub**; no live runtime reads (curated into repo). Specific URLs/handles pending.
- **FR-24 Distinct Wings `[S2]`** → **Technical / Creative / Agentic** Wings as default structure, each independently browsable; agent blends on demand.
- **FR-25 Greatest-hits, relevance-ordered `[S2]`** → curated greatest-hits by relevance, "not as a chronological résumé"; "no static reverse-chronological CV as the primary surface."
- **FR-26 Playable project embeds `[S2]`** → play web projects live (e.g. `vector-wars` Three.js/Vite, `voyager` web sim, `christmas-elves` Phaser); lazy-load + static poster/fallback.
- **FR-27 Video-Synced Repo `[S2]`** → as a talk/demo video plays, the site highlights/jumps to the exact code; with motion/JS off, video + static repo link remain.
- **FR-28 Remaining content import `[S3]`** → all remaining projects/talks/songs imported into Timeline, Wings, KB.

**G. Creative Showcase & Creative Lab**
- **FR-29 Creative Lab movement `[S2]`** → a tonal-shift Scene (Suno, generative art, playable work center stage); **skippable**; never blocks the path to Speaker Surface or Glass Box.
- **FR-30 Adaptive Soundtrack `[S2]`** → original Suno **instrumentals (no lyrics)** score the site by Scene, **auto-duck under video**; **off by default, user-controllable, never autoplays with sound**; fixed Scene→track mapping is the fallback.

**H. Conversion & Contact (Invite-Me)**
- **FR-31 Invite-Me form (persisted + emailed) `[S1]`** → short, accessible contact form; **persisted to Postgres AND emailed to Josh**; confirms receipt with a **stated response time** ("I reply within N business days" — N TBD); captures a structured **attribution field** ("how did you hear about me?"); keyboard-operable, labeled, accessibly validated; minimum fields, no account.
- **FR-32 Close / follow & subscribe CTAs `[S1]`** → the **Close Scene**: clear invite-me / follow-the-work / join-the-audience actions; follow/subscribe CTAs link to channels + tracked as conversion events.

**I. Content Pipeline & Maintenance**
- **FR-33 Single git source of truth; build-time generation `[S1]`** → no admin/CMS surface; no runtime reads from GitHub/YouTube/Suno; build produces Static Mirror routes + KB index + Glass Box teaser data.
- **FR-34 Project Import & `/bmad-correct-course` extension `[S1]`** → add a project by Project Import + `/bmad-correct-course`; after build it appears on the Timeline and is agent-answerable.

**J. Discoverability (Static Mirror / SEO / GEO)**
- **FR-35 Structured-data emission `[S1]`** → JSON-LD: `Person`+`ProfilePage` (home/about), `Event` (talks), `VideoObject` (recordings), `CreativeWork` (projects), `FAQPage` (Q&A).

**K. Measurement & Analytics**
- **FR-36 Privacy-first funnel & conversion analytics `[S1]`** → cookieless, no-PII analytics; measures funnel, outbound-channel clicks, Invite-Me conversion, Glass Box/Timeline engagement. (Plausible-style; self-host vs SaaS TBD.)

**Default Scene Arc (full vision; agent may reorder/deepen/skip):** Hero → Thesis → Master Timeline → Speaker Surface → Flagship Case Study → Wings → Creative Lab → Glass Box → Close. (Speaker Surface sits early–mid **by design**, `#46` — the reel is the credibility engine; guarded by counter-metric SM-C1 against cinematic re-order regressions.)

**Stage 1 trimmed arc:** Hero → Master Timeline (seed + teaser) → Speaker Surface → one deep Flagship → Glass Box → Close. `[ASSUMPTION: Stage 1 ships as discrete, fast Scenes/sections rather than the full continuous cinematic canvas.]`

**Fast on-ramp (`#14`):** homepage orients in seconds (hero + Advocate Agent entry + identity); the Master Timeline is the showpiece "one click in, not the literal front door."

---

## Content types & density

- **What Josh creates/consumes that the site presents (curated into one git repo, no live reads):**
  - **BMAD Artifacts** (markdown): brief, PRD, UX, architecture, epics, stories, retrospectives, brainstorm, research — the Glass Box + Timeline substance. (`#18`: "nearly every repo ships its `_bmad-output/` and `_bmad/` artifacts… confirmed across voyager, agentbbs, vector-wars, christmas-elves, loandemo, autodungeon, iris-couch, etc.")
  - **Conference talks / videos** — READY 2026 reel + 2–3 full talks; YouTube embeds. Speaker Reel is 60–120s.
  - **Code / GitHub repos** — curated greatest-hits; two flagships (portfolio itself, `loandemo`); Stage-2 playables (`vector-wars`, `voyager`, `christmas-elves`).
  - **Suno music** — original instrumentals (no lyrics) as Adaptive Soundtrack (Stage 2).
  - **Generative art** — surfaced in the Creative Wing / Creative Lab.
  - **Speaker collateral** — bios (50w + 100–150w), abstracts (150–200w, 3–5 takeaways), EPK PDF, testimonials, logos, audience metrics.
- **Volume / density:** **curated, not vast.** Research: "trailer for my career, not resume with sections"; **"4–6 scenes max; 3–6 deep case studies over many shallow ones."** Brief: "two flagship projects done well." Brainstorm Body tier: "polished, **not vast**." RAG corpus described as "dozens–hundreds of docs" / "small corpus." So: low surface count, high per-item depth; layered/multi-format case studies rather than a grid of thumbnails.
- **Media types:** text (markdown artifacts, abstracts, bios), video (YouTube embeds, reel), audio (Suno instrumentals), interactive (playable WebGL/Phaser embeds), images (headshot/portrait; screenshots are noted as **sparse** — "only autodungeon & SpectraSight have real ones today," so playable embeds substitute).

---

## Brand, voice & tone hints

- **Positioning line:** "Seasoned, Not Stuck" (`#1`) — 30-year veteran AND cutting-edge agentic practitioner, "neither pole alone."
- **Core principle:** **Proof-as-Process** — "demonstrate skill by exposing the real, disciplined process that produced the work, rather than asserting it." "The medium is the message." "Exhibit A is the site itself."
- **Default register:** "serious, and I have taste." "Professionalism as the floor, not the ceiling." Confident, restrained, calm.
- **Advocate Agent voice — "confident advocate, never hype."** Proactively makes the case "like a sharp recruiter who knows the work cold" (`#26`), but "every claim is tied to a cited artifact: 'the skeptic gets sold *and* gets the receipts'" (`#27`). "Plainly states when something isn't documented. Concise, bulleted, no speculation." "Spontaneity in phrasing, control over substance" (`#36`).
- **Two kinds of openness, kept distinct:** *process* transparency (Glass Box, honest, warts and all about the build) vs *narrative* curation (the personal story shown as a **highlight reel, not warts-and-all** — `#11`).
- **"Engineering is creative" (`#43`):** the creative work reinforces (not dilutes) the engineering story; "range is evidence of a modern engineer."
- **References (verbatim):** "architect's studio; film composer (for soundtrack sequencing); cinematic 'director's mode.'" Research adds the Codrops "scroll-driven 3D world / camera-take" reference and "trailer for my career."

---

## Visual identity hints (ONLY what is explicitly present)

- **Architect's Studio** is the named dominant visual language: "spare, confident, generous whitespace, strong typography, restrained palette." `[ASSUMPTION (PRD §5): exact palette/typeface chosen in UX.]`
- **Typography:** "strong/editorial typography (≈1 display + 1–2 text styles)." Research: "Editorial typography + restraint (1 display + 1–2 text styles); massive type for hero statements."
- **Palette:** "restrained palette" — **no specific colors named.** (GAP — UX must choose; PRD assumption tagged.)
- **Imagery:** name + **headshot/portrait** in the hero (FR-1). Conference/company **logos** + testimonials on the Speaker Surface. Screenshots **sparse** → playable embeds preferred over static images.
- **Mood:** calm/credible first; "the wow builds; it is not front-loaded" (`#40`); "restraint *is* the flex." Cinematic, film-like ("camera path," "scenes," "director's mode," "soundtrack").
- **Motion:** baseline CSS scroll-driven reveals/parallax (~80%); cinematic GSAP/ScrollTrigger layer; at most one Three.js/R3F WebGL set-piece with static fallback.

---

## Experience qualities the docs emphasize

- **Calm / restrained / confident** — "calm and credible" hero; "restraint is the flex"; "serious, and I have taste."
- **Credible / trustworthy / proof-driven** — "credible hub"; "credible-when-Googled"; "the skeptic gets sold and gets the receipts"; zero ungrounded claims.
- **Remarkable / shareable / "whoa"** — "remarkable center of gravity"; the recursion is "a recursive 'whoa' they want to share"; Glass Box is "the designated day-one *remarkable* element."
- **Fast** — "fast on-ramp"; "orients in seconds"; "confirm and invite in under two minutes"; FCP < ~2s mobile.
- **Cinematic / immersive** — "a film you can talk to"; continuous canvas; directed camera path (esp. Stage 2).
- **Agentic / adaptive / personalized** — "the agent *is* the interface"; "tell me what you're here for and I'll build your path."
- **Accessible / never-hidden** — "complete access, curated surface — nothing hidden, nothing overwhelming."
- **Quality compass (verbatim):** Advocate Agent + Proof-as-Process are **the soul**; cinematic polish + content are **the body**; maintainability is **the skeleton**. "When effort is scarce, protect the soul first."

---

## Cross-cutting concerns explicitly raised

- **Accessibility (first-class, NFR-2):** target **WCAG 2.1 AA** `[ASSUMPTION]`. `prefers-reduced-motion` gated at **two layers** (CSS media query AND JS — don't init GSAP/ScrollTrigger/WebGL; show static hero). Advocate Agent widget: `role="dialog"`; transcript `role="log"` + `aria-live="polite"`, updates **batched per-message, not per-token**; focus management on open/close/response; real `<button>` elements; fully keyboard-operable. WebGL canvas = `aria-hidden` decorative with DOM equivalents. Avoid Lenis/smooth-scroll (or gate behind reduced-motion). Fallback nav keyboard-operable + screen-reader navigable.
- **Motion:** explicitly handled (above) — no scroll-jacking without a visible skip/progress affordance; transitions degrade to instant under reduced-motion.
- **SEO / GEO (first-class, NFR-3):** "If it matters for SEO/AI, it must be in the initial HTML." SSG-prerender all key routes; Static Mirror exposes all agent-revealed facts as real HTML (verifiable via `view-source` + find, JS off); answer-first intros, clear heading hierarchy, Q&A blocks, plain-text key facts; don't block AI crawlers; brand/name in short answers; JSON-LD per FR-35. (Directly protects the speaking goal — "organizers Google Josh.")
- **Performance (NFR-1):** FCP < ~2s mid-mobile; main-page JS < ~200–250KB gz; ≤1 fixed WebGL canvas; heavy stack lazy-loaded (`client:visible`/`client:idle`); compressed WebGL assets (KTX2/Basis/Draco) with static fallback.
- **Privacy (NFR-7, §9.2):** cookieless, no-PII, no tracking cookies; **no visitor accounts**; Invite-Me collects minimum fields; inquiry data access-controlled, used only to respond. Retention policy TBD.
- **Audio/sound:** off by default, user-controllable, never autoplays with sound; auto-ducks under video.
- **Content moderation / safety (§9.1):** agent is **retrieve-only**, citation-required, strict context separation vs prompt injection; persona server-side; **no public live agentic execution** (Demonstrations pre-recorded/curated); no live external reads; "nothing unapproved ever appears."
- **Input modalities:** typed chat (Advocate Agent) + standard pointer/keyboard navigation + static browse. Research mentions voice nav as a 2026 *trend* but it is **not** specified as in-scope.
- **i18n / localization:** **NOT mentioned anywhere.** (GAP — no localization requirement stated.)
- **Dark mode:** **NOT mentioned anywhere.** (GAP — no light/dark theme requirement stated.)
- **Offline:** **NOT mentioned** (though the static surface is inherently robust). (GAP if PWA/offline expected.)
- **Notifications:** **NOT mentioned** for visitors. The only outbound is the email to Josh on Invite-Me submission.
- **Regulated language / compliance:** none beyond AI-content licensing (Suno commercial rights). Not a regulated domain.

---

## Key user journeys / scenarios (structured)

From PRD §3.3 (named protagonists; names `[ASSUMPTION]`).

- **UJ-1. Devon, the practitioner — finds the recursion irresistible and shares it.**
  - Entry: unauthenticated, **desktop**, cold at the hero from a shared URL.
  - Path: reads the calm "Seasoned, Not Stuck" hero → types a question into the Advocate Agent ("is this site actually built with BMAD?") → agent answers **with citations** and routes them into the **Glass Box** → opens the **real** brief/brainstorm/retros and scrubs the **Master Timeline** teaser.
  - Climax: "the realization that the site they're touring *is the project on the timeline they're scrubbing* — proof-as-process, hard to fake."
  - Resolution: shares the link and follows Josh.
  - Edge: with JS/motion disabled, the Lean Static Fallback exposes the same artifacts as crawlable pages — "the 'whoa' survives degraded."

- **UJ-2. Mara, the organizer — confirms and invites in under two minutes.**
  - Entry: unauthenticated, **likely mobile**, at the hero or a **deep link to Speaker Surface**.
  - Path: **skips the Advocate Agent** → reaches **Speaker Surface** (READY 2026 reel front and center, signature topics, copy-paste bios, social proof) → reads one abstract → taps **Invite-Me**.
  - Climax: a frictionless contact form confirms her inquiry was received with a stated response expectation.
  - Resolution: inquiry **persisted + emailed** to Josh.
  - Edge: arrives Googling Josh first — the **Static Mirror (SSG + JSON-LD)** makes speaker facts/abstracts indexable + credible *before* she clicks.

- **UJ-3. Sam, the wanderer — came for a song and leaves a follower.**
  - Entry: unauthenticated, **mobile, low intent**.
  - Path: lands near the **Creative** content → samples an embedded track / playable project → drifts the calm gallery.
  - Climax: "a genuinely enjoyable moment (a playable embed or a track), not a sales pitch."
  - Resolution: taps a follow/subscribe CTA.
  - Edge: heavy creative embeds lazy-load; on a slow connection the static gallery + links still work.

- **UJ-4. Josh extends the site — and it appears on its own timeline.**
  - Entry: local repo, BMAD toolchain. No CMS by design (`#34`).
  - Path: runs `/bmad-correct-course` → normal dev cycle → curated artifacts + media land in the single git repo → build regenerates the Static Mirror + KB index, refreshes the Master Timeline (hand-curated Dots S1, automated harvest S2+).
  - Climax: the new project shows up as a **BMAD Dot** and is reachable by the agent — "the site grew by being engineered, not edited."
  - Edge: a project with no artifacts/screenshots still imports via Project Import with curated substitutes (e.g. playable embed instead of screenshots).

---

## Success criteria / metrics / definition of "great"

- **SM-1 (Primary) — Speaking outcome.** ≥ 1 speaking inquiry via Invite-Me (FR-31) or agent capture (FR-12); measured by the form's attribution field + analytics referrer.
- **SM-2 (Primary) — Reputation engine.** Josh pitches ≥ 1 new conference — "ideally *a talk about the site itself*." Leading signal: the site is shared/mentioned in the agentic-engineering community.
- **SM-3 (Secondary) — Audience.** +500 net-new subscribers/follows across channels (6–12 months).
- **SM-4 (Secondary) — Ship discipline.** Stage 1 **live and publicly shareable by the ~end-of-June-2026 soft target**, independent of any other project.
- **Counter-metrics (do NOT optimize):**
  - **SM-C1 — Don't bury the organizer.** Fast-credible organizer path (UJ-2) must stay reachable **without** engaging chat or the cinematic layer; time-to-Speaker-Surface + Invite-Me must not regress as Stage 2/3 polish lands. *(Directly constrains UX layering.)*
  - **SM-C2 — Don't slip the ship.** Stage 1 ships on target even if "magic" is incomplete.
  - **SM-C3 — Zero ungrounded agent claims.** No claim that isn't grounded/cited.
  - **SM-C4 — Quality of shares over volume.** Peer shares/follows, not cold-traffic spikes.
- **"Great" (vision):** in 2–3 years, "the **canonical example** of a portfolio built as a public agentic-engineering project" — "a repeatable pattern others adopt"; "never finished and never stale."

---

## Constraints & explicit non-goals / out-of-scope

**Constraints (technical / cost / timeline):**
- **Timeline:** Stage 1 soft target ~**end of June 2026** (self-imposed); ship discipline is a metric (SM-4) and a counter-metric (SM-C2).
- **Architecture:** static build from **one curated git repo**; no CMS; no live external reads; only dynamic pieces = the agent backend + Invite-Me endpoint. Code-as-CMS via git + `/bmad-correct-course`.
- **Stack (recorded as input, confirmed in architecture):** Astro (SSG) + React islands (hero + chat); CSS scroll-driven animations baseline; GSAP + ScrollTrigger cinematic layer; ≤1 Three.js/R3F set-piece with static fallback; avoid Lenis.
- **Agent:** mid-tier model (claude-haiku-4-5 / gpt-5-mini class) `[ASSUMPTION]`, streaming; build-time BM25-first RAG, vectors only if logged misses justify.
- **Cost:** "operationally cheap and simple" — one small backend + one LLM endpoint (VM's, no external key) + static hosting.
- **Launch prerequisites:** (1) **enable `public_url_enabled`** — currently OFF, nothing routes publicly until enabled; (2) **Suno commercial rights** — upgrade to paid plan and **re-generate** featured tracks (free-tier not retroactively licensed); (3) `github_connected` OFF — **not a blocker**.

**Explicit Non-Goals (PRD §11):**
- **No CMS / admin panel** (code-as-CMS via git, `#34`).
- **No live runtime reads** from GitHub/YouTube/Suno (`#37`).
- **No public live agentic execution** — Demonstrations pre-recorded/curated (`#35`).
- **No job-seeking / "open to work" mode** — latent/future; architected for, not built (`#44`).
- **Not a cold-traffic lead-gen funnel** — success is qualified peer shares + organizer conversions.
- **Not a static CV/résumé** — greatest-hits by relevance, not a chronological résumé (`#25`).
- **Podcast integration** — concept-phase, out for now (PRD note: "emotionally load-bearing — revisit if the podcast ships").

---

## Stated design preferences AND anti-patterns / things to avoid

**Preferences (do):**
- Architect's Studio: spare, confident, generous whitespace, strong/editorial typography (~1 display + 1–2 text styles), restrained palette, massive hero type.
- The wow **builds**, not front-loaded; restraint as the flex; calm credible Scene 1.
- Concentrate the "wow / creative budget" on **two surfaces**: the **Advocate Agent visibly thinking/working** and the **Creative Lab tonal swell**; everything else stays calm.
- WebGL in focused doses — **one** hero set-piece, not constant spectacle.
- Agent-first navigation **with** a complete lean static fallback ("agentic ideal, graceful fallback," `#31`) applied per-feature.
- Fast on-ramp; Timeline as flagship one click in (not the front door); Speaker Surface early–mid by design.
- Distinct Wings (Technical/Creative/Agentic) as the default; agent blends on demand.
- Multi-format/layered case studies over scattered links; playable over screenshotted.
- Human curation visible as the differentiator.

**Anti-patterns (avoid — PRD §5 + research clichés):**
- Static CV/résumé; raw file dump ("raw guts"); flat gallery/grid.
- Confessional/warts-and-all *narrative* tone (process transparency stays honest, the personal story is a highlight reel).
- Page-reload model; "trust me" framing.
- **Hacker/Matrix terminals**; **literal AI metaphors** (floating brains / robots / neural-net stock art).
- **Gimmick / "stereotypography" fonts**; **neon-gradient overload** without hierarchy.
- **Scroll-jacking with no skip/progress affordance**.
- "Look at my effects" with no message; **unrefined "AI-slop" visuals**.

---

## Stakes signal

**Consumer-facing public web, reputation-grade — high personal stakes, not regulated, not internal.**
- **Why consumer/public:** it is a public marketing/reputation site for an individual, open to unauthenticated cold visitors arriving from social/community channels; success is measured in shares, follows, and inbound speaking inquiries.
- **Why high-stakes (taste/craft):** the PRD says "there is no defensible *technology* moat; the advantage is **authenticity + novelty + a real track record**… the real risk is **execution and taste, not competitors**." The site IS the proof of Josh's skill — a low-craft execution actively undermines the thesis. The Glass Box is held to a "soul-tier craft bar." Brand reputation among skeptical expert peers is on the line.
- **Why NOT regulated:** no PII collection beyond a contact form, no accounts, no payments, not a regulated domain. The only compliance-adjacent concern is **AI-content licensing** (Suno commercial rights) and **prompt-injection/agent-safety** hygiene.
- **Why NOT hobby/internal:** it has explicit business outcomes (speaking invites, audience growth), a ship date, success metrics, and an external skeptical audience.

---

## Open questions & gaps that UX must resolve

**A. Explicit PRD Open Questions (§14) with UX relevance:**
1. **Visual system undecided** — "exact palette/typeface chosen in UX" (PRD §5 assumption). No colors, no typefaces, no specific type scale stated. **UX must author the visual identity.**
2. **UJ protagonist names/archetypes** (Devon/Mara/Sam) — confirm or replace.
3. **Content inventory & metadata** unresolved: `loandemo` repo URL; READY 2026 title/abstract/date; YouTube/Suno/GitHub handles; which projects map to which Wing; which talks fill the reel; which Suno tracks are featured. *(Affects how much real content vs placeholder UX can lay out.)*
4. **Per-feature "agentic ideal, graceful fallback" calls** — how agentic each feature is at launch vs fallback (esp. FR-4/FR-5/FR-10 director's-mode & re-curation, FR-11 Demonstrator, FR-30 soundtrack, FR-12 capture).
5. **Stage 2 vs Stage 3 cut lines** — confirm exact feature split (e.g. is the Demonstrator Stage 2 as assumed?).
6. **Master Timeline data model (Stage 2)** — how Dots are deterministically harvested from git artifacts (does not gate MVP; Stage 1 is hand-curated).

**B. UX-behavior gaps the docs leave undecided (affect look/behavior):**
7. **Continuous Canvas vs discrete Scenes for Stage 1** — PRD addendum DECIDED Stage 1 = discrete fast Scenes; the camera-path canvas is Stage 2 (FR-3). *(Resolved in PRD; flag if UX wants to revisit.)* But the **exact Stage-1 section/transition treatment** (how sectioned scenes look, scroll vs click navigation, progress/skip affordance design) is undefined.
8. **Depth Dial UI** (Stage 2) — control affordance, default state, and how depth maps to surfaced detail per Scene = undefined.
9. **Agent widget form factor** — docked panel vs modal vs inline hero element; how the "visible thinking" is rendered (without per-token churn); how routing-to-Static-Mirror links present in chat.
10. **Master Timeline interaction** — what a Dot looks like, zoom gesture (Stage 2), and the Stage-1 teaser's visual form (it "degrades to a static ordered list").
11. **"Above the fold" hero composition on mobile** — fitting name + headshot + one-line positioning + agent entry + Invite-Me-or-explore choice into a small viewport.
12. **Glass Box "polished glass" rendering** — how raw markdown artifacts become a curated, framed, navigable read-only view (typographic treatment of long docs; guided-tour vs map affordances in S2).
13. **Speaker Surface layout** — ordering of reel/topics/bios/social-proof; how copy-paste-bio one-tap copy is surfaced; how audience metrics + (placeholder) testimonials display.
14. **Stated response time (N business days)** for Invite-Me confirmation copy — value TBD.
15. **Dark mode, i18n, offline, push notifications, voice nav** — none specified. If any are expected, they are gaps; otherwise treat as explicitly out-of-scope.
16. **Site-wide semantic zoom behavior (FR-18, Stage 3)** — explicitly "deferred pending UX."

---

## ⚠ Dropped / soft-pedaled qualitative ideas (in brief/brainstorm/research; thinner or absent in the PRD FRs)

These carry intent the UX should not lose, even where the PRD compressed them into FR/Glossary lines:

- **"The Cinematic Journey — a film you can talk to" (`#33`) and "One Continuous Canvas" (`#32`) as the organizing metaphor.** The PRD demotes this to a Stage-2 FR-3 + an addendum decision that Stage 1 is discrete Scenes. The brainstorm framed the *whole site* as "a directed camera path through scenes, the agent choosing which scene to fly the visitor to next." UX should keep the cinematic north star visible even while shipping discrete Scenes first.
- **"Engineering is creative" (`#43`)** — present in PRD §5 but as a one-liner; the brainstorm treats it as a thesis that "dissolves the professional/creative tension as a false one." A felt design implication (the Creative Lab as "a felt emotional movement," soundtrack "swells") that the FRs flatten.
- **The Adaptive Soundtrack "like a film composer" (`#29`/`#31`)** — research validated the auto-ducking low-pass-filter detail (Codrops reference); the emotional "a portfolio that *sounds* like Josh" framing is softer in the PRD (FR-30 is mostly guardrails: off-by-default, ducking, licensing).
- **"Trailer for my career, not resume with sections" + "4–6 scenes max, 3–6 deep case studies"** (research) — a concrete density/narrative discipline that the PRD implies via "two flagships" but doesn't restate as a hard scene-count ceiling. Useful UX guardrail.
- **The agent's *visible thinking/working* as a designed wow surface (`#16`)** — the PRD keeps it but immediately constrains it to "per-message, not per-token" for accessibility. The brainstorm's intent ("the chat agent visibly thinking/doing" is where the creative budget goes) should still drive a deliberately crafted (not default-spinner) thinking state.
- **"The Demonstrator" / "Build Walkthrough" teaching BMAD step by step (`#8`/`#9`)** — Stage 2; the *teaching* dimension (walk a visitor through something being built, explaining the method) is easy to lose behind "curated pre-recorded asset."
- **"Interrogate my work" / Evolution Arc "vibe-coding → agentic engineering" (`#10`)** — folded into FR-17's "craft-progression narrative"; the PRD explicitly warns the highlight-reel curation (`#11`) "must not sand off this growth arc — keep the progression legible." A live tension UX must hold.
- **AI-personalization "what are you here for?" early prompt → reorder content** (research, validating `#20`/`#23`) — the entry-point UX pattern (an explicit early intent prompt) is a concrete interaction the PRD leaves implicit inside FR-10/agent behavior.
- **Research clichés-to-avoid list** — fully carried into PRD §5 anti-references; retained here for emphasis (Matrix terminals, literal AI metaphors, gimmick fonts, neon gradients, scroll-jacking, AI-slop).

---

## Conflicts noted (PRD wins per instruction)

No hard factual conflicts found across the four sources — the PRD explicitly "builds on and does not duplicate" the brief/brainstorm/research and carries their idea numbers. The only **calibration** worth flagging:

- **Scene Arc as continuous cinematic canvas (brainstorm `#32`/`#33`/`#41`) vs Stage-1 discrete Scenes (PRD §6 + addendum).** The brainstorm presents the continuous canvas as *the* model; the PRD/addendum DECIDE that Stage 1 ships discrete fast Scenes and the canvas is Stage 2 (FR-3). **PRD wins:** Stage 1 = discrete Scenes; the canvas is committed-but-sequenced, not cut.
- **Brainstorm Scene Arc ordering** (Hero → Thesis → Master Timeline → Speaking Reel → Flagship → Wings → Creative Lab → Glass Box → Close) matches the PRD §6 default arc; the **Stage-1 trimmed arc** (Hero → Master Timeline → Speaker Surface → one Flagship → Glass Box → Close) is the PRD's MVP cut and governs the first build.
