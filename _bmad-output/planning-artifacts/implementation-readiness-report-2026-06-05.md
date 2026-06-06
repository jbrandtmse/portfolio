---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
overallStatus: READY (Stage 1)
documentsIncluded:
  - prds/prd-portfolio-2026-06-02/prd.md
  - prds/prd-portfolio-2026-06-02/addendum.md
  - architecture.md
  - epics.md
  - ux-designs/ux-portfolio-2026-06-03/DESIGN.md
  - ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-05
**Project:** portfolio

## 1. Document Inventory

| Type | File(s) | Size | Modified | Format |
|------|---------|------|----------|--------|
| PRD | `prds/prd-portfolio-2026-06-02/prd.md` (+ `addendum.md`) | 55.7 KB (+2.6 KB) | 2026-06-04 | Whole |
| Architecture | `architecture.md` | 51.2 KB | 2026-06-04 | Whole |
| Epics & Stories | `epics.md` | 90.4 KB | 2026-06-05 | Whole |
| UX Design | `ux-designs/ux-portfolio-2026-06-03/DESIGN.md` + `EXPERIENCE.md` | 40.4 KB + 47.3 KB | 2026-06-04 | Canonical pair |

**Supplementary input (traceability):** `briefs/brief-portfolio-2026-06-02/brief.md` (11.1 KB, 2026-06-02) — Product Brief.

**Discovery findings:**
- Duplicates (whole + sharded): None. No `index.md` exists anywhere.
- Missing required documents: None. All four required types present.
- Selected documents confirmed by user (Josh) on 2026-06-05.

## 2. PRD Analysis

Source: `prds/prd-portfolio-2026-06-02/prd.md` (+ `addendum.md`). PRD uses globally-numbered **FR-1…FR-36** with stage tags `[S1]` Credible Hub (MVP) · `[S2]` The Magic · `[S3]` Full Richness, and cross-cutting **NFR-1…NFR-7**.

### Functional Requirements (verbatim requirement statement + stage)

| FR | Stage | Requirement |
|----|-------|-------------|
| FR-1 | S1 | Calm credible hero — landing-cold visitor sees the "Seasoned, building at the frontier" hero communicating who Josh is in seconds, Advocate Agent entry + fast on-ramp, no front-loaded spectacle. Identity (name, headshot, one-line positioning) + Invite-Me-or-explore above the fold; meets NFR-1; reduced-motion/no-JS static hero. |
| FR-2 | S1 | Sectioned Scene structure with skip/progress affordances — move through Stage-1 Scenes, always know where you are / how to skip. Every Scene reachable via stable URL/anchor; no scroll-jacking without visible skip/progress. |
| FR-3 | S2 | Continuous Canvas with cinematic Scene transitions — single canvas as directed camera path, graphic transitions replace page loads; degrade to instant under reduced-motion; ≤1 fixed WebGL canvas site-wide. |
| FR-4 | S2 | Director's-mode Scene Arc reordering — agent reorders/deepens/skips Scenes per conversation; default cut always exists; never hides content from fallback. |
| FR-5 | S2 | Depth Dial — visitor sets depth (30s skim → overview → deep dive); reflected by both agent and static path. |
| FR-6 | S1 | Grounded, cited answers from the Knowledge Base — answer drawn only from build-time KB index with citation; below-threshold/empty context returns canned "not documented" and does NOT call the model; persona/system prompt never returned to client. |
| FR-7 | S1 | Agent-as-router to Static Mirror — every fact the agent states also exists as real HTML on a Static Mirror page; responses embed working links. |
| FR-8 | S1 | Lean Static Fallback reachability — 100% of agent-reachable content reachable via static nav; keyboard + screen-reader operable. |
| FR-9 | S1 | Prompt-injection-resistant grounding — strict separation of retrieved context vs visitor input; injection attempts fail (spot-tested). |
| FR-10 | S2 | Agent-adaptive re-curation — agent re-curates Wings/Scenes/projects by stated intent; different intents → demonstrably different orderings; static reachability preserved. |
| FR-11 | S2 | The Demonstrator — curated pre-recorded/replayable demonstration of agentic work + Build Walkthrough; static assets only, no live arbitrary execution; nothing unapproved shown. |
| FR-12 | S3 | Speaking-inquiry capture & booking via agent — complete inquiry in conversation, feeds same Postgres store + email as Invite-Me (FR-31); agent never over-promises. |
| FR-13 | S1 | Read-only rendering of real BMAD Artifacts — curated read-only view of actual `_bmad-output/` artifacts (real, git-sourced at build); publish allowlist / never-render default-deny set (`.decision-log.md`, `review-*`, `reconcile-*`, internal addenda excluded); present in Static Mirror. |
| FR-14 | S1 | Stage-1 chronological timeline teaser — lightweight chronological teaser of build history foreshadowing the Master Timeline; degrades to static ordered list. |
| FR-15 | S2 | Guided tour + explorable map — story-driven guided tour (primary) or explorable map (secondary) of the Glass Box. |
| FR-16 | S1 | Timeline seeded with curated BMAD Dots — Master Timeline ships as hand-curated seed of Dots from the two Stage-1 flagships (portfolio + loandemo); each Dot maps to a real artifact and drills in; NO automated harvest required for S1. |
| FR-17 | S2 | Zoomable Master Timeline — zoom from career-milestone (project=dot) into a project's Dots as one shareable gesture; Dots auto-harvested deterministically at build time; reads as craft-progression narrative. |
| FR-18 | S3 | Site-wide semantic zoom — semantic zoom across whole site; concrete behavior deferred to UX; consistent granularity per zoom level. |
| FR-19 | S1 | Speaker Reel & signature talks — Speaker Surface with READY 2026 reel front-and-center; signature talks each with outcome-oriented title, audience level, 150–200-word abstract, 3–5 takeaways, offered formats/durations + logistics; talk facts in Static Mirror with Event + VideoObject JSON-LD. |
| FR-20 | S1 | Copy-paste bios & social proof — 50-word and 100–150-word bios one-tap copyable; social proof (logos/testimonials/ratings); audience-draw metrics displayed. |
| FR-21 | S2 | Downloadable one-sheet / EPK — 1–2 page speaker EPK PDF reflecting current talks + bios. |
| FR-22 | S1 | Two flagship case studies — portfolio-itself + loandemo, each a layered case study (video+repo+write-up+timeline); Static Mirror page with CreativeWork JSON-LD; loandemo connects to READY 2026 (FR-19). |
| FR-23 | S1 | Curated content links/embeds — curated links/embeds to YouTube, Suno, GitHub; curated into repo (no live runtime reads). |
| FR-24 | S2 | Distinct Wings — three self-navigable Wings (Technical/Creative/Agentic) as default structure; agent blends on demand. |
| FR-25 | S2 | Greatest-hits, relevance-ordered — curated greatest-hits by relevance, not chronological résumé; no static reverse-chron CV as primary surface. |
| FR-26 | S2 | Playable project embeds — play web projects live (vector-wars, voyager, christmas-elves); lazy-load + static poster/fallback. |
| FR-27 | S2 | Video-Synced Repo — video playback highlights/jumps to exact code; static video + repo link with motion/JS off. |
| FR-28 | S3 | Remaining content import — all remaining projects/talks/songs imported via Project Import into Timeline, Wings, KB. |
| FR-29 | S2 | Creative Lab movement — tonal-shift Scene (Suno, generative art, playable); skippable; never blocks Speaker Surface/Glass Box. |
| FR-30 | S2 | Adaptive Soundtrack — original Suno instrumentals score by Scene, auto-duck under video; off by default, user-controllable; featured tracks commercially licensed. |
| FR-31 | S1 | Invite-Me form (persisted + emailed) — accessible contact form; submission creates a Postgres row AND emails Josh; confirms receipt with stated response time; structured attribution field; minimum fields, no account. |
| FR-32 | S1 | Close / follow & subscribe CTAs — Close Scene presents invite/follow/join actions; CTAs link to channels, tracked as conversion events (FR-36). |
| FR-33 | S1 | Single git source of truth; build-time generation — all content from one curated git repo; build generates Static Mirror + KB index + Glass Box/timeline-teaser data; no CMS, no runtime external reads. |
| FR-34 | S1 | Project Import & /bmad-correct-course extension — add a project via Project Import + /bmad-correct-course; after build it appears on Timeline (hand-curated Dot in S1) and is answerable by the agent. |
| FR-35 | S1 | Structured-data emission — key routes emit server-rendered JSON-LD: Person+ProfilePage, Event, VideoObject, CreativeWork, FAQPage; passes Rich Results Test. |
| FR-36 | S1 | Privacy-first funnel & conversion analytics — cookieless no-PII analytics; measures funnel, outbound-channel clicks, Invite-Me conversion, Glass Box/Timeline engagement. |

**Total FRs: 36** — Stage 1 (MVP): **19** (FR-1,2,6,7,8,9,13,14,16,19,20,22,23,31,32,33,34,35,36) · Stage 2: **14** (FR-3,4,5,10,11,15,17,21,24,25,26,27,29,30) · Stage 3: **3** (FR-12,18,28).

### Non-Functional Requirements (verbatim)

| NFR | Requirement |
|-----|-------------|
| NFR-1 Performance | FCP < ~2s mid-mobile; main-page JS < ~200–250KB gzipped; ≤1 fixed WebGL canvas site-wide; heavy stack lazy-loaded (`client:visible`/`client:idle`); compressed WebGL assets (KTX2/Basis/Draco) with static fallback. |
| NFR-2 Accessibility | `prefers-reduced-motion` gated at CSS **and** JS layers (don't init GSAP/ScrollTrigger/WebGL; static hero). Agent widget `role="dialog"`; transcript `role="log"` + `aria-live="polite"` batched per-message not per-token; focus management; real `<button>`s; keyboard-operable. WebGL `aria-hidden` decorative with DOM equivalents. Avoid Lenis/smooth-scroll or gate behind reduced-motion. Target WCAG 2.1 AA. |
| NFR-3 SEO/GEO (first-class) | SSG-prerender all key routes; Static Mirror exposes all agent-revealed facts as real HTML (verifiable via view-source + find, JS disabled); answer-first intros, heading hierarchy, Q&A blocks, plain-text key facts; don't block AI crawlers; brand/name in short answers; JSON-LD per FR-35. |
| NFR-4 Agent reliability & latency | Responses stream; retrieval from build-time index only; empty/low-score context skips model call; single small service behind nginx. TTFT < ~1.5s; hard ceiling ~10s before graceful fallback; retrieval adds < ~200ms. |
| NFR-5 Static, key-free runtime | All non-agent content prebuilt static served by nginx; only dynamic components = agent backend + Invite-Me endpoint; no runtime API keys / external rate limits in content path. |
| NFR-6 Maintainability | Code-as-CMS; content added only via git/BMAD (`/bmad-correct-course`); KB index + Glass Box teaser regenerate deterministically at build; Timeline automated Dot harvest is S2 (FR-17), S1 hand-curated manifest (FR-16). |
| NFR-7 Observability | Privacy-first analytics (FR-36) + server logs sufficient to measure §13 metrics and detect agent retrieval misses (trigger to consider embeddings). |

**Total NFRs: 7.**

### Additional Requirements & Constraints

- **Guardrails (§9):** Safety — agent retrieve-only, citation-required, strict context separation (FR-6/9), no public live agentic execution, no live external reads, persona server-side. Privacy — cookieless no-PII analytics, no visitor accounts, Invite-Me minimum fields + access-controlled. Cost — one small agent backend + one LLM endpoint (VM OpenAI-compatible, no external key), mid-tier model, static hosting.
- **Platform (§10):** nginx vhost at `joshuabrandt.abacusai.cloud` (ingress port 80) on Abacus VM + small live backend; Postgres attached (Invite-Me store; pgvector available); VM OpenAI-compatible LLM endpoint; recommended stack Astro SSG + React islands, CSS scroll-driven baseline, GSAP+ScrollTrigger cinematic layer, ≤1 Three.js/R3F set-piece, avoid Lenis; build-time markdown RAG indexer, BM25-first, vectors only if misses justify.
- **Launch prerequisites:** (1) `public_url_enabled` is OFF — must enable before public routing; (2) Suno commercial rights — regenerate featured tracks under paid plan (gates FR-30); (3) `github_connected` OFF — not a blocker.
- **Non-Goals (§11):** no CMS/admin; no live runtime reads; no public live agentic execution; no job-seeking/"open to work" mode (architected-for, not built); not a cold-traffic lead-gen funnel; not a static CV/résumé; podcast integration out for now.
- **Success Metrics (§13):** SM-1 speaking outcome (FR-19,20,31,32 + FR-12); SM-2 reputation engine (FR-13,16/17,19); SM-3 audience (FR-23,26/29,32); SM-4 ship discipline (S1 live by ~end-June-2026); counter-metrics SM-C1 (don't bury organizer) … SM-C4 (quality over volume).
- **Open Questions (§14):** 10 open items — final frontend stack; UJ names; content inventory/metadata; analytics tool; Invite-Me email transport + retention; Suno regeneration; podcast; S2/S3 cut lines; per-feature agentic-vs-fallback calls; Master Timeline harvest data model (S2, no longer gates MVP).

### PRD Completeness Assessment (initial)

The PRD is **final, dense, and traceability-ready**: every FR is globally numbered, stage-tagged, tied to user journeys (UJ-1…4) and success metrics (SM-1…4), and carries *testable* consequences — exactly the structure that lets epics/stories be checked for coverage. Strengths: explicit MVP FR list (§12.1), explicit deferral of S2/S3 FRs, guardrails and NFRs are cross-referenced. Open items are honestly surfaced (§14–15) as `[ASSUMPTION]`/Open-Question rather than hidden, and several (content inventory, email transport, analytics tool) are content/ops decisions rather than spec gaps. **For readiness, the Stage-1 FR set (19 FRs) + 7 NFRs is the coverage baseline epics must satisfy.**

## 3. Epic Coverage Validation

Source: `epics.md` (10 epics, ~75 stories sketched; Stage-1 Epics 1–4 fully detailed with Given/When/Then). The epics doc carries an explicit **FR Coverage Map**. I validated it **bottom-up** — confirming each FR maps to an actual *delivering story*, not just a claimed cell in the map.

### Coverage Matrix (FR → Epic → delivering story → status)

| FR | Stage | Epic | Delivering story | Status |
|----|-------|------|------------------|--------|
| FR-1 | S1 | E1 | 1.3 Calm credible hero | ✓ Covered |
| FR-2 | S1 | E1 | 1.4 Scene scaffold + scene-rail (skip/progress) | ✓ Covered |
| FR-6 | S1 | E4 | 4.1 KB index/retriever, 4.3 grounded endpoint | ✓ Covered |
| FR-7 | S1 | E4 | 4.2 /faq Mirror, 4.4 citation→route | ✓ Covered |
| FR-8 | S1 | E1 | 1.7 /browse + global footer | ✓ Covered |
| FR-9 | S1 | E4 | 4.3 prompt-injection resistance | ✓ Covered |
| FR-13 | S1 | E2 | 2.1 allowlist+render, 2.2 reader, 2.3 index | ✓ Covered |
| FR-14 | S1 | E2 | 2.3 Glass Box index = chronological teaser | ✓ Covered |
| FR-16 | S1 | E2 | 2.4 Master Timeline (hand-curated, seeded) | ✓ Covered |
| FR-19 | S1 | E3 | 3.1 Speaker reel & signature talks | ✓ Covered |
| FR-20 | S1 | E3 | 3.2 Copy-paste bios & social proof | ✓ Covered |
| FR-22 | S1 | E2 | 2.5 loandemo + 2.2/2.3 portfolio-itself | ✓ Covered |
| FR-23 | S1 | E3 | 3.5 Close curated creative touch / links | ✓ Covered |
| FR-31 | S1 | E3 | 3.3 data model/endpoint/email, 3.4 form | ✓ Covered |
| FR-32 | S1 | E3 | 3.5 Close follow/subscribe CTAs | ✓ Covered |
| FR-33 | S1 | E1 | 1.1 scaffold (single source), 1.8 build pipeline | ✓ Covered |
| FR-34 | S1 | E2 | 2.6 Project Import / `/bmad-correct-course` | ✓ Covered |
| FR-35 | S1 | E1 | 1.6 JSON-LD, sitemap, robots | ✓ Covered |
| FR-36 | S1 | E1 | 1.10 Umami privacy-first analytics | ✓ Covered |
| FR-3 | S2 | E5 | 5.1 Continuous Canvas transitions | ✓ Covered (stub) |
| FR-4 | S2 | E5 | 5.4 Director's-mode reordering | ✓ Covered (stub) |
| FR-5 | S2 | E5 | 5.2 Depth Dial | ✓ Covered (stub) |
| FR-10 | S2 | E5 | 5.3 Agent re-curation by intent | ✓ Covered (stub) |
| FR-15 | S2 | E6 | 6.3 guided tour, 6.4 explorable map | ✓ Covered (stub) |
| FR-17 | S2 | E6 | 6.1 git→Dot harvest, 6.2 zoomable timeline | ✓ Covered (stub) |
| FR-24 | S2 | E7 | 7.1 Distinct Wings | ✓ Covered (stub) |
| FR-25 | S2 | E7 | 7.2 Greatest-hits ordering | ✓ Covered (stub) |
| FR-26 | S2 | E7 | 7.3 Playable embeds | ✓ Covered (stub) |
| FR-27 | S2 | E7 | 7.4 Video-Synced Repo | ✓ Covered (stub) |
| FR-29 | S2 | E8 | 8.1 Creative Lab movement | ✓ Covered (stub) |
| FR-30 | S2 | E8 | 8.2 Adaptive Soundtrack | ✓ Covered (stub) |
| FR-11 | S2 | E9 | 9.1 Demonstrator, 9.2 Build Walkthrough | ✓ Covered (stub) |
| FR-21 | S2 | E9 | 9.3 Speaker EPK | ✓ Covered (stub) |
| FR-12 | S3 | E10 | 10.1 In-chat inquiry capture | ✓ Covered (stub) |
| FR-18 | S3 | E10 | 10.2 Site-wide semantic zoom | ✓ Covered (stub) |
| FR-28 | S3 | E10 | 10.3 Remaining content import | ✓ Covered (stub) |

### Missing Requirements

**None.** All 36 PRD FRs map to a delivering story. No FR is dropped, and no FR appears in the epics that is absent from the PRD (the epics carry FR-1…FR-36 verbatim from PRD §7). The Stage-1 MVP set (19 FRs) is fully decomposed into detailed Given/When/Then stories.

**Beyond FRs — also traced (not required by this step, noted for completeness):**
- **NFRs (7/7):** NFR-1/2/3/5/6 owned by Epic 1's foundation and re-asserted as ACs in later epics; NFR-4 concentrated in Epic 4; NFR-7 spans Epic 1 (analytics) + Epic 4 (`retrieval_miss`). All seven have explicit story-level acceptance criteria.
- **Architecture Requirements (AR-1…16):** mapped — AR-1→Story 1.1, AR-6/7/8/9/10/12/14/16→Epic 1, AR-13→Epic 2, AR-2/4/5→Epic 3, AR-3/11→Epic 4, AR-15→Epic 1 (extended in 3 & 4). All present in stories.
- **UX Design Requirements (UX-DR1…24):** mapped across Epics 1–4 (foundation/components/IA/voice/conversion). All present.

### Coverage Statistics

- **Total PRD FRs:** 36
- **FRs covered in epics:** 36
- **Coverage percentage:** **100%** (Stage 1: 19/19 detailed · Stage 2: 14/14 stubbed · Stage 3: 3/3 stubbed)
- **Orphan FRs (in epics, not in PRD):** 0
- **NFR coverage:** 7/7 · **AR coverage:** 16/16 · **UX-DR coverage:** 24/24

**Assessment:** FR traceability is **exemplary** — globally-stable FR numbers carried verbatim PRD→epics, a maintained coverage map, and (verified here) a real delivering story behind every FR. No coverage gaps block implementation readiness at the requirements-traceability level.

## 4. UX Alignment Assessment

### UX Document Status

**FOUND** — two canonical, `status: final` spines (updated 2026-06-04):
- `DESIGN.md` — visual spine (owns *how it looks*): 10 color tokens, Source Serif 4 ramp, spacing/radius/elevation, the **18 locked components**.
- `EXPERIENCE.md` — behavior spine (owns *how it works*): two-layer IA, Stage-1 route map, locked Scene order, voice/microcopy, state patterns, accessibility floor, the four user journeys.

Both declare **"this spine wins on conflict with any mock, wireframe, or import."** This is the project's standard form, not a shard.

### UX ↔ PRD Alignment — STRONG

| Dimension | Finding |
|-----------|---------|
| User journeys | EXPERIENCE.md Key Flows (Devon/Mara/Sam + Josh-maintenance) match PRD §3.3 UJ-1…UJ-4 beat-for-beat ✓ |
| Scene Arc | UX locked order (Hero → Thesis → Master Timeline → Speaker → Flagship → Glass Box → Close) = PRD §6 Stage-1 trimmed arc ✓ |
| Counter-metric SM-C1 | Hero fork "I'm here to book a talk" bypasses Guide+cinematics — directly implements PRD's "don't bury the organizer" ✓ |
| Glass Box / Proof-as-Process | UX "shipping evidence day one" (non-ghosted live-site/repo node + loandemo code/build/retro Dots) enriches FR-13/FR-14 without contradicting them ✓ |
| GEO Mirror routes | UX `/about`, `/faq`, `/speaking/reel` elaborate FR-35/NFR-3; consistent ✓ |
| Voice/guardrails | UX "Guide says only what it can back up," citations-carry-honesty, no-exclamation-marks all trace to PRD §5 + SM-C3 ✓ |

### UX ↔ Architecture Alignment — STRONG

- Architecture **explicitly ingests** both spines as input documents and adopts "spine wins on conflict" as a binding enforcement rule.
- **Every one of the 18 locked components has an architectural home** in the directory tree: scene-rail→`components/scene/SceneRail.astro`; Guide pill/panel→`islands/{GuidePill,GuidePanel}.tsx`; citation chip→`components/common/CitationChip.astro`; artifact card/reader→`components/glassbox`; timeline-dot/era-band/flagship→`components/timeline`; talk-card/bio/metric/testimonial/reel-poster→`components/speaking`; Invite form→`islands/InviteForm.tsx`; static footer→`components/common/Footer.astro`.
- DESIGN.md tokens → `web/src/styles/tokens.css` (verbatim CSS custom properties); two-layer reduced-motion gate → `web/src/lib/motion.ts` (shared, not per-component).
- UX route map = architecture's Astro file-routes **exactly** (`/`, `/about`, `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/glass-box/[artifact]`, `/faq`, `/invite`, `/browse`).
- Performance (NFR-1): UX "≤1 WebGL canvas / font subset / lazy-load" is realized by Astro SSG 0-JS baseline + islands-only hydration + Lighthouse-CI budget.

### Alignment Issues / Warnings (all minor — none block implementation)

1. **⚠️ Terminology drift: "Advocate Agent" (PRD glossary) vs "the Guide" (UX + Epics + Architecture).** The PRD §4 glossary still canonicalizes **"Advocate Agent"** and states *"Introducing a synonym anywhere is a discipline violation."* The UX spines renamed it **"the Guide"**, and the epics + architecture adopted "the Guide" (the epics header hedges as *"The Advocate Agent (the 'Guide')"*). Downstream is self-consistent, but by the PRD's own discipline rule the rename should be propagated back into the PRD glossary via `/bmad-correct-course` so the vocabulary is single-sourced. **Severity: low (hygiene).**

2. **⚠️ Stale upstream-sync flag in EXPERIENCE.md.** Lines 120 & 356 still instruct "propagate the positioning line 'Seasoned, building at the frontier' back to the PRD" — but the **PRD was already updated 2026-06-04** to exactly that line (PRD §1 and FR-1 both carry it). The flag is **obsolete** and should be cleared so it doesn't read as an open action. **Severity: low (doc hygiene).**

3. **⚠️ Architecture prose under-counts islands (2 vs 3).** Two passages say islands hydrate "the two interactive surfaces (hero + Guide panel)," but the directory tree and Architectural Boundaries correctly specify **three** islands (`GuidePanel`, `GuidePill`, `InviteForm`) — and DESIGN.md lists hero + Guide + Invite form. The authoritative structure is right; only the prose slips. Note so island hydration/perf budgeting isn't under-scoped. **Severity: low (wording).**

4. **⚠️ Promoted mockups carry pre-rename strings.** `mockups/guide.html` still labels the agent "Advocate"; retired exploration artifacts carry "Josh Brandt" / "Seasoned, Not Stuck" / bare "BMAD". Both spines explicitly declare the canonical strings (the Guide; Joshua R. Brandt, MSE; "Seasoned, building at the frontier"; "the BMAD Method") govern and "spine wins on conflict." **Watch-item for dev agents:** author from the spine's canonical strings, never copy a mock string. **Severity: low (acknowledged tech-debt).**

**Architecture-readiness note (bonus):** `architecture.md` is `status: complete` with all 16 checklist items confirmed, every Stage-1 FR/NFR mapped to a concrete component, verified-current versions (Astro 6.4, Hono 4, Orama v3, Umami v3, GSAP 4), and the PRD red-team risks (H3 leak, C3/C4 over-scope, H4 never-stale) explicitly reconciled. Self-reported gap analysis: **no critical gaps**; remaining items are content-inventory + launch tasks.

**Verdict:** PRD ↔ UX ↔ Architecture are **substantively aligned** across journeys, scenes, components, routes, performance, accessibility, and SEO/GEO. The four findings above are vocabulary/doc-hygiene sync items, not coverage or design gaps.

## 5. Epic Quality Review

Standard applied: **create-epics-and-stories** best practices — user value (not technical milestones), epic independence (no Epic N → Epic N+1 requirement), no blocking forward dependencies, story sizing, DB-tables-when-needed, starter-template-first, and Given/When/Then AC quality. Scope: all 10 epics; the Stage-1 set (**Epics 1–4**, fully detailed) is the implementation-ready target; Epics 5–10 are deliberately story-stubs pending each stage's detail pass.

### A. User-Value Focus — PASS (no technical-milestone epics)

Every epic is framed around a user outcome, not an engineering task:
- **E1 Foundation** — "a visitor landing cold gets a fast, calm, credible, **crawlable** site … deployed and measured." (Despite being foundational, it ships a *standalone credible site*, not "set up infra.")
- **E2 Proof-as-Process** — the practitioner sees the recursion proof.
- **E3 Speaker Surface & Conversion** — the organizer confirms fit and invites in under two minutes (the SM-1 path).
- **E4 The Guide** — the practitioner converses with a grounded, cited advocate.
- **E5–E10** — cinematic canvas, zoomable timeline, Wings/playables, Creative Lab, Demonstrator/EPK, full richness — all user-capability titles.

No "Setup Database / API Development / Infrastructure" epics. Technical scaffolding correctly lives **inside** Epic 1 Story 1.1 as the mandated starter-template story (see §D), not as its own epic.

### B. Epic Independence — PASS (no forward-epic requirements)

| Epic | Depends on | Requires a *later* epic? | Verdict |
|------|-----------|--------------------------|---------|
| E1 | — (standalone) | No | ✓ Ships a credible site alone |
| E2 | E1 (backward) | No | ✓ Standalone on E1 |
| E3 | E1 (backward); cross-links E2's loandemo | No (cross-link is stub-mediated) | ✓ |
| E4 | E1–E3 (backward; capstone) | No | ✓ Site is *fully credible without* the Guide |
| E5–E10 | Stage-1 base (backward) | No | ✓ Layer on without re-platform |

**Cross-link handling (a strength, not a violation):** E2's loandemo case study links to `/speaking` and E3's speaker page links to `/work/loandemo`. This *mutual* reference is **stub-mediated** — Epic 1 Story 1.5 creates **all** route stubs up front, so neither epic breaks if the other is unbuilt; the links resolve to a stub until the owning epic fills content. Likewise Epic 1's hero "Ask my Guide" entry **gracefully links to `/faq`** until Epic 4 wires the live Guide. These are textbook **progressive-enhancement-with-fallback**, not blocking forward dependencies.

### C. Story Quality & Sizing — PASS (Stage 1)

- Every Stage-1 story uses **As-a/I-want/So-that** + multiple **Given/When/Then** ACs, each testable and specific.
- ACs are **error- and edge-inclusive**: e.g. Story 3.4 enumerates default/invalid/submitting/success/offline-fail; Story 3.3 covers the mail-failure path (`mail_status='failed'`, still persists); Story 4.3 covers below-threshold (no model call), prompt-injection, and the ~10s latency ceiling; JS-off and reduced-motion fallbacks are enumerated per surface.
- Stories are scoped to "a single dev-agent session" and ordered with no *blocking* forward references.
- **Traceability is maintained at the story level** — each cites the FRs/ARs/UX-DRs it serves (e.g. "(FR-31, AR-2/4/5)", "(FR-13, UX-DR7)").

### D. Special Checks — PASS

- **Starter-template-first:** Architecture mandates the Astro+Hono pnpm monorepo (AR-1). **Epic 1 Story 1.1 = "Scaffold the pnpm monorepo"** (create-astro/create-hono init, workspace, shared tsconfig/eslint/prettier, concurrent dev server + `/api` proxy, `.gitignore`/`.env.example`). Exactly matches the requirement. ✓
- **DB-tables-when-needed (not upfront):** The `inquiries` table is created in **Epic 3 Story 3.3** — where Invite-Me first needs it — **not** in Epic 1. Umami's schema lands in Epic 1 Story 1.10 (where analytics ships); the Orama KB index in Epic 4 Story 4.1 (where the Guide needs it). Data is created at point of need. ✓ (This is the single most-commonly-violated rule, and it's correct here.)
- **Greenfield setup present:** initial scaffold (1.1), dev environment (1.1), test harness + CI + deploy (1.9, 1.10). ✓

### E. Best-Practices Compliance Checklist

| Check | E1 | E2 | E3 | E4 | E5–E10 (stubs) |
|-------|----|----|----|----|----------------|
| Delivers user value | ✓ | ✓ | ✓ | ✓ | ✓ |
| Functions independently (no forward-epic need) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stories appropriately sized | ✓ | ✓ | ✓ | ✓ | ⏳ pending detail pass |
| No blocking forward dependencies | ✓ | ✓ | ✓ | ✓ | ✓ |
| DB tables created when needed | n/a | n/a | ✓ | ✓ (index) | n/a |
| Clear Given/When/Then ACs | ✓ | ✓ | ✓ | ✓ | ⏳ stub-level ACs |
| FR traceability maintained | ✓ | ✓ | ✓ | ✓ | ✓ |

### Findings by severity

**🔴 Critical violations: NONE.** No technical-milestone epics; no hard forward dependencies; no epic-sized unstartable stories.

**🟠 Major issues: NONE.** ACs are specific and error-inclusive; independence and DB-timing are correct.

**🟡 Minor concerns / watch-items:**
1. **Epic 1 is large and front-loaded (10 stories).** It carries the scaffold + token system + hero + scene-rail + Static Mirror + JSON-LD + `/browse` + build pipeline + the entire NFR floor + deploy/analytics — i.e. most of the infrastructure lands before the first *remarkable* element (Glass Box, Epic 2). This is **deliberate** ("epics are few and large") and each story is independently sized, but Epic 1's completion is a sizeable gate. *Recommendation:* keep an eye on the densest stories — **1.2** (all tokens + BaseLayout + shared chrome), **1.10** (deploy + analytics + launch gates), and **3.3** (schema + endpoint + email) bundle three concerns each; if any overflows a session, split along its natural seams (they're already cohesive vertical slices, so no structural change needed).
2. **Epics 5–10 are intentionally stub-level and NOT yet implementation-ready.** They have user stories + directional Given/When/Then but are explicitly "detailed when each stage is scheduled." The readiness verdict in §6 therefore applies to **Stage 1 (Epics 1–4)**; Stage 2/3 need their detail pass (and the `bmad-create-story` context-fill) before a dev agent runs them. Consistent with the staging philosophy — flagged so it isn't mistaken for full coverage.
3. **Pervasive `[OPEN]` content-inventory placeholders.** Many Stage-1 stories carry `[OPEN]`/`[ASSUMPTION]` flags (real headshot, loandemo repo+artifact URLs, READY 2026 talk details, channel handles, testimonials/logos/metrics, Invite-Me response-time `N`, the live-site/repo URL). Each story flags them with curated substitutes, so they don't block *starting*, but a dev/review agent must not mark a story "done" while its `[OPEN]` content is still a placeholder. *Recommendation:* resolve the content inventory (PRD §14 / UX "Open gaps" / Architecture "Important gaps") as a parallel track; treat each `[OPEN]` as a story-level acceptance gate. (See §6 pre-flight checklist.)
4. **Progressive-enhancement fallbacks must actually be built.** Because cross-epic references are stub/fallback-mediated, the integrity of "no forward dependency" depends on each fallback (route stub, `/faq` Guide-link, placeholder JSON-LD) genuinely existing when its referrer ships. Story 1.5 (route stubs) and Story 1.7 (`/browse` parity "re-verified as each later epic lands") already encode this — keep that parity check live through Epics 2–4.
5. **Terminology drift (carried from §4):** the epics adopt "the Guide" while the PRD glossary still canonicalizes "Advocate Agent." Low-severity vocabulary sync.

**Assessment:** This is an **unusually disciplined epic breakdown** — correct epic granularity, genuine standalone increments, point-of-need data creation, a mandated scaffold-first story, story-level FR/AR/UX-DR traceability, and error-inclusive BDD acceptance criteria. The minor concerns are sizing-watch and content-inventory items, none of which block Stage-1 implementation.

## 6. Summary and Recommendations

### Overall Readiness Status

# ✅ READY — for Stage 1 (Epics 1–4) implementation

The portfolio planning set is **implementation-ready for the Stage-1 MVP**. The PRD, UX spines, and Architecture are all `status: final`/`complete`; the epics achieve **100% FR traceability** with a *verified* delivering story behind every FR; and the Stage-1 epic breakdown passes the create-epics-and-stories quality bar with **zero critical and zero major violations**. The dev cycle can begin at **Epic 1, Story 1.1 (scaffold the pnpm monorepo)**.

**Caveat (by design):** "READY" applies to **Stage 1 (Epics 1–4)**. Epics 5–10 (Stage 2/3) are intentionally story-stubs and need their detail/context-fill pass before a dev agent runs them — schedule that when each stage is picked up.

### What's strong (evidence-backed)

- **Traceability is exemplary** — globally-stable FR-1…FR-36 carried verbatim PRD → UX → Architecture → Epics; a maintained FR Coverage Map; story-level FR/AR/UX-DR citations. 36/36 FRs, 7/7 NFRs, 16/16 ARs, 24/24 UX-DRs all land in a story.
- **Epic discipline** — genuine standalone increments, no forward-epic requirements, point-of-need DB creation (`inquiries` in Epic 3, not upfront), a mandated scaffold-first story, and error-inclusive Given/When/Then ACs.
- **Cross-document coherence** — journeys, scene order, the 18 locked components, the route map, the performance budget, the a11y contract, and the SEO/GEO floor are consistent across all three spines; the Architecture self-validates with no critical gaps and explicitly reconciles the PRD red-team risks (H3 leak, C3/C4 over-scope, H4 never-stale).

### Issues found — 9 findings, all LOW severity (0 critical, 0 major)

| # | Category | Finding | Action |
|---|----------|---------|--------|
| 1 | Vocabulary | PRD glossary still canonicalizes "Advocate Agent"; UX/Epics/Arch use "the Guide" (PRD's own rule forbids synonyms) | Propagate the rename into the PRD §4 glossary via `/bmad-correct-course` |
| 2 | Doc hygiene | EXPERIENCE.md's "sync positioning back to PRD" flag (lines 120, 356) is **stale** — the PRD was already updated 2026-06-04 to "Seasoned, building at the frontier" | Clear the obsolete flag in the UX spine |
| 3 | Doc wording | Architecture prose says "two islands" in 2 spots; the structure correctly specifies **three** (GuidePanel, GuidePill, InviteForm) | Fix the prose so island hydration isn't under-scoped |
| 4 | Tech-debt | Promoted mockups carry pre-rename strings ("Advocate", "Josh Brandt", "Seasoned, Not Stuck", bare "BMAD") | Dev agents author from the spine's canonical strings (spine wins on conflict) — optionally refresh the mocks |
| 5 | Epic sizing | Epic 1 is large/front-loaded (10 stories); densest are 1.2, 1.10, 3.3 | Watch session-fit; split along existing seams only if a story overflows |
| 6 | Staging | Epics 5–10 are stub-level, not yet dev-ready | Run the detail/context-fill pass when each stage is scheduled |
| 7 | Content gaps | Pervasive `[OPEN]`/`[ASSUMPTION]` placeholders (headshot, loandemo URLs, talk details, channel handles, testimonials/metrics, response-time `N`, live-repo URL) | Resolve the content inventory in parallel; treat each `[OPEN]` as a story-level "done" gate |
| 8 | Integrity | "No forward dependency" relies on stub/fallback mediation (route stubs, `/faq` Guide-link, placeholder JSON-LD) | Keep Story 1.5 stubs + Story 1.7 `/browse` parity checks live through Epics 2–4 |
| 9 | Vocabulary | (same root as #1) epics hedge "Advocate Agent (the 'Guide')" | Resolved by #1 |

### Known launch/content pre-flight gates (carried from PRD §10 / Architecture — not new defects)

- 🔴 **`public_url_enabled` is OFF** — hard gate; nothing routes publicly until enabled in the Abacus Cloud Services UI (needed at Epic 1 Story 1.10 launch).
- 🟠 **SPF/DKIM DNS** for the sending domain — prerequisite for Epic 3's Invite-Me email (Story 3.3).
- 🟡 **Suno commercial regeneration** — Stage-2 gate for FR-30 only (not a Stage-1 blocker).
- ℹ️ `github_connected` OFF is **not** a blocker (no live GitHub reads; use `gh auth`/PAT).

### Recommended Next Steps

1. **Begin Stage-1 implementation at Epic 1, Story 1.1** (scaffold the pnpm monorepo) — nothing blocks the start. Use `bmad-create-story` to context-fill each story, then `bmad-dev-story` to implement.
2. **Run the content-inventory track in parallel** — collect the `[OPEN]` items (headshot, loandemo repo+artifacts, READY 2026 talk details, channel handles, testimonials/logos/metrics, response-time `N`, live-site/repo URL) so they're ready as each owning story reaches "done."
3. **Do the four doc-hygiene syncs** (findings #1–4) via a single `/bmad-correct-course`: propagate "the Guide" + the new positioning line into the PRD glossary, clear the stale EXPERIENCE.md sync flags, fix the Architecture "two islands → three" wording. Low effort, removes the only cross-document inconsistencies.
4. **Clear the launch gates before Epic 1 Story 1.10 / Epic 3 Story 3.3** — enable `public_url_enabled`; add SPF/DKIM DNS.
5. **Schedule the Stage-2/3 detail pass** (Epics 5–10) when Stage 1 ships — they're sequenced, not yet story-complete.

### Final Note

This assessment identified **9 findings across 2 substantive categories** (UX-alignment hygiene and epic-quality watch-items), **all low-severity — zero critical, zero major** — plus the known launch/content pre-flight gates already documented upstream. None block Stage-1 implementation. The planning artifacts are coherent, fully traceable, and unusually disciplined; the items above are sync/hygiene refinements you can address in a single course-correction or absorb story-by-story. **You may proceed to implementation as-is**, addressing the doc-hygiene syncs and content inventory alongside the build.

---

*Assessment by: Implementation Readiness workflow (`bmad-check-implementation-readiness`) · Assessor role: Requirements-Traceability PM · For: Josh · Date: 2026-06-05 · Documents assessed: PRD (+addendum), Architecture, Epics & Stories, UX (DESIGN.md + EXPERIENCE.md).*
