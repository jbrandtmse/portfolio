---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  # Canonical spec set (anchors)
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/addendum.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md"
  # Upstream sources (included at Josh's direction; largely distilled into the PRD)
  - "_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/brief.md"
  - "_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/addendum.md"
  - "_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md"
  - "_bmad-output/research/portfolio-pre-brief-research-2026-06-02.md"
project_name: portfolio
user_name: Josh
date: 2026-06-05
---

# portfolio - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **portfolio** (`joshuabrandt.abacusai.cloud` — the Joshua R. Brandt portfolio site), decomposing the requirements from the PRD, the UX Design spines (DESIGN.md + EXPERIENCE.md), and the Architecture into implementable stories.

**Staging note.** Per the PRD, all three delivery stages are specified at full FR depth, but **Stage = delivery sequence, not priority cut**. Stage 1 (Credible Hub) is the MVP and stands alone (~end-of-June-2026 soft target); Stage 2 (The Magic) and Stage 3 (Full Richness) layer onto the same base without re-platforming. Each requirement below carries its stage tag: `[S1]` · `[S2]` · `[S3]`. Epic design (Step 2) will scope epics to **Stage 1 first**, with Stage 2/3 epics sketched for sequencing.

## Requirements Inventory

### Functional Requirements

*Globally numbered FR-N, stable, carried verbatim from PRD §7 with stage tags. Glossary terms (the Guide, Glass Box, Master Timeline, BMAD Method Dot, Static Mirror, Lean Static Fallback, Speaker Surface, Invite-Me) are used exactly. **Stage 1 = 19 FRs · Stage 2 = 14 FRs · Stage 3 = 3 FRs.***

**7.1 Experience Shell & Cinematic Canvas**
- **FR-1 `[S1]`** — Calm credible hero. "Seasoned, building at the frontier"; identity (name, headshot/portrait, one-line positioning) + an Invite-Me-or-explore choice above the fold on mobile & desktop; meets the NFR-1 perf budget (no blocking WebGL); complete styled static hero under reduced-motion/no-JS. (UJ-1, UJ-2)
- **FR-2 `[S1]`** — Sectioned Scene structure with skip/progress affordances. Every Scene reachable via a stable URL/anchor (supports deep links); no scroll-jacking without a visible skip/progress affordance.
- **FR-3 `[S2]`** — Continuous Canvas with cinematic Scene transitions. Continuous transition (no full reload) when motion enabled; degrades to instant section changes under `prefers-reduced-motion`; at most one fixed WebGL canvas site-wide.
- **FR-4 `[S2]`** — Director's-mode Scene Arc reordering. The Guide reorders/deepens/skips Scenes per conversation; a sensible default cut always exists; reordering never hides content from the Lean Static Fallback.
- **FR-5 `[S2]`** — Depth Dial. Visitor sets depth (30-second skim → overview → deep dive); reflected by both the agent path and the static path.

**7.2 The Guide**
- **FR-6 `[S1]`** — Grounded, cited answers from the Knowledge Base. Retrieves only from the build-time KB index; below-threshold/empty context → canned "I don't have that documented" with **no model call**; every substantive claim names/links its Static Mirror source; server-side persona never returned to the client.
- **FR-7 `[S1]`** — Agent-as-router to Static Mirror. Every fact the agent can state also exists as real HTML on a Static Mirror page (verifiable via `view-source` + find, JS off); responses embed working links.
- **FR-8 `[S1]`** — Lean Static Fallback reachability. 100% of agent-reachable content reachable via static navigation; keyboard-operable and screen-reader navigable.
- **FR-9 `[S1]`** — Prompt-injection-resistant grounding. Visitor instructions cannot override the persona/grounding or reveal the system prompt (spot-tested against a standard injection set).
- **FR-10 `[S2]`** — Agent-adaptive re-curation. Different stated intents → demonstrably different orderings (organizer → Speaker Surface first; "show me something cool" → playable first; agentic-curious → Agentic Wing/Glass Box first); reflected in-place without losing static reachability.
- **FR-11 `[S2]`** — The Demonstrator. Curated/pre-recorded replayable Demonstration of real agentic work + a BMAD Build Walkthrough; pre-approved static assets only — **no live arbitrary execution engine** (Guardrail §9.1).
- **FR-12 `[S3]`** — Speaking-inquiry capture & booking via agent. Agent-captured inquiry persists to the same Postgres store and emails Josh (= FR-31); never promises a commitment beyond a stated response expectation.

**7.3 Glass Box (Proof-as-Process)**
- **FR-13 `[S1]`** — Read-only rendering of real BMAD Artifacts. Real repo artifacts (sourced from git at build time), curated/framed ("polished glass", not a raw dump), present in the Static Mirror; only **publish-allowlisted** artifacts render (default-deny never-render set: `.decision-log.md`, `review-*`, `reconcile-*`, internal addenda).
- **FR-14 `[S1]`** — Stage-1 chronological timeline teaser. Shows the real sequence of BMAD Artifacts in time and links into Glass Box detail; degrades to a static ordered list.
- **FR-15 `[S2]`** — Guided tour + explorable map. A narrated path through selected artifacts (primary) + a free-browse explorable map (secondary).

**7.4 Master Timeline**
- **FR-16 `[S1]`** — Timeline seeded with curated BMAD Dots. Hand-curated seed from the two Stage-1 flagships (the portfolio itself + `loandemo`); each Dot maps to a real artifact and drills into it; **no automated harvest required to ship Stage 1**.
- **FR-17 `[S2]`** — Zoomable Master Timeline. Zoom from career-milestone level into a project's Dots; a Dot reveals workflow output/epic scope/correction reason/retro conclusions/skills; reads as a craft-progression narrative; Dots generated by automated deterministic build-time harvest.
- **FR-18 `[S3]`** — Site-wide semantic zoom. Consistent content granularity at any zoom level across all Scenes (concrete behavior defined in UX).

**7.5 Speaker Surface**
- **FR-19 `[S1]`** — Speaker Reel & signature talks. READY 2026 reel as the lead item; signature talks each with an outcome-oriented title, audience level, 150–200-word abstract, 3–5 takeaways, offered formats/durations + logistics; all talk facts in the Static Mirror with `Event` + `VideoObject` JSON-LD; the veteran-IC vantage presented as a pitchable angle.
- **FR-20 `[S1]`** — Copy-paste bios & social proof. 50-word + 100–150-word bios, one-tap copyable; audience-draw metrics *displayed*; logos/testimonials/ratings (placeholders flagged until real content provided).
- **FR-21 `[S2]`** — Downloadable one-sheet / EPK. A current 1–2 page PDF reflecting the signature talks and bios.

**7.6 Projects & Wings**
- **FR-22 `[S1]`** — Two flagship case studies. The portfolio itself (seeds the Glass Box) + `loandemo` (live-on-stage proof); each a layered case study; Static Mirror page with `CreativeWork` JSON-LD; `loandemo` connects to its READY 2026 talk.
- **FR-23 `[S1]`** — Curated content links/embeds. Curated YouTube/Suno/GitHub links/embeds (curated into the repo; no live runtime reads); channel URLs pending (content inventory).
- **FR-24 `[S2]`** — Distinct Wings. Technical/Creative/Agentic self-navigable as the default structure; the agent blends across them on demand.
- **FR-25 `[S2]`** — Greatest-hits, relevance-ordered. Ordering responds to stated interest and defaults to a curated order; no static reverse-chronological CV as the primary surface.
- **FR-26 `[S2]`** — Playable project embeds. `vector-wars`/`voyager`/`christmas-elves` playable in-browser; lazy-load + static poster fallback.
- **FR-27 `[S2]`** — Video-Synced Repo. Time-coded markers move the repo view in lockstep with playback; video + static repo link remain available with motion/JS off.
- **FR-28 `[S3]`** — Remaining content import. All remaining projects/talks/songs imported via Project Import into Timeline/Wings/KB; each appears on the Timeline, in its Wing, and is answerable by the agent.

**7.7 Creative Showcase & Creative Lab**
- **FR-29 `[S2]`** — Creative Lab movement. A tonal-shift Scene where Suno/generative art/playable work take center stage; skippable, never blocks the path to Speaker Surface or Glass Box.
- **FR-30 `[S2]`** — Adaptive Soundtrack. Original Suno instrumentals score the site by Scene and auto-duck under video; off by default, user-controllable, never autoplays with sound; featured tracks commercially licensed (Suno regen prerequisite).

**7.8 Conversion & Contact (Invite-Me)**
- **FR-31 `[S1]`** — Invite-Me form (persisted + emailed). A short accessible contact form; submission creates a Postgres row **and** emails Josh; confirms receipt with a stated response time; captures a structured attribution field; keyboard-operable/labeled/accessibly-validated; minimum fields, no account.
- **FR-32 `[S1]`** — Close / follow & subscribe CTAs. The Close presents invite-me / follow-the-work / join-the-audience actions; follow/subscribe CTAs link to Josh's channels and are tracked as conversion events (FR-36).

**7.9 Content Pipeline & Maintenance**
- **FR-33 `[S1]`** — Single git source of truth; build-time generation. No admin/CMS surface; no runtime external reads; a build produces prerendered Static Mirror routes + the KB index + Glass Box artifact-teaser data from real artifacts.
- **FR-34 `[S1]`** — Project Import & `/bmad-correct-course` extension. A documented Project Import path wires a new project's artifacts/media/write-up into Timeline/Wings/KB; after import + build, the project is retrievable by the agent and appears on the Master Timeline as a hand-curated Dot (Stage 1).

**7.10 Discoverability (Static Mirror / SEO / GEO)**
- **FR-35 `[S1]`** — Structured-data emission. Server-rendered JSON-LD: `Person`+`ProfilePage` (home/about), `Event` (talks), `VideoObject` (recordings), `CreativeWork` (projects), `FAQPage` (Q&A); each route passes the Rich Results Test.

**7.11 Measurement & Analytics**
- **FR-36 `[S1]`** — Privacy-first funnel & conversion analytics. Cookieless, no-PII; measures funnel behavior, outbound-channel clicks, the Invite-Me conversion, and Glass Box/Timeline engagement.

### NonFunctional Requirements

*System-wide quality attributes, carried verbatim from PRD §8. These drive the architecture more than any single FR and apply to every story.*

- **NFR-1 — Performance.** FCP < ~2s on mid-range mobile; main-page JS < ~200–250KB gzipped; at most one fixed WebGL canvas site-wide; heavy stack (WebGL, large embeds) lazy-loaded (`client:visible`/`client:idle`); compressed WebGL assets (KTX2/Basis/Draco) with static fallback.
- **NFR-2 — Accessibility (WCAG 2.1 AA).** Two-layer `prefers-reduced-motion` gate (CSS media query **and** JS init-guard — do not init GSAP/ScrollTrigger/WebGL; show static hero); the Guide widget `role="dialog"` (non-modal) with `role="log"` transcript + `aria-live="polite"` batched **per-message, not per-token**, focus management, real `<button>` elements, fully keyboard-operable; WebGL canvas `aria-hidden` decorative with DOM equivalents; avoid Lenis/smooth-scroll or gate behind reduced-motion; color never the sole signal.
- **NFR-3 — SEO/GEO (first-class).** SSG-prerender all key routes; the Static Mirror exposes all agent-revealed facts as real HTML (verifiable via `view-source` + find, JS off); answer-first intros, clean heading hierarchy, Q&A blocks, plain-text key facts; do not block AI crawlers; brand/name present in short answers; JSON-LD per FR-35.
- **NFR-4 — Agent reliability & latency.** Responses stream; retrieval is from the build-time index only; empty/low-score context skips the model call; the agent backend is a single small service behind nginx; TTFT < ~1.5s, hard ceiling ~15s before a graceful fallback message (absorbs reasoning-class tail latency and per-deployment `GUIDE_LLM_MODEL` variance), retrieval adds < ~200ms; knowledge horizon = last build ("fresh-as-of-last-build", not "never stale").
- **NFR-5 — Static, key-free runtime.** All non-agent content is prebuilt static assets served by nginx; the only dynamic components are the agent backend and the Invite-Me endpoint; no runtime API keys or external rate limits in the content path.
- **NFR-6 — Maintainability.** Code-as-CMS; content added only via git/BMAD (`/bmad-correct-course`); KB index and Glass Box teaser data regenerate deterministically at build time from real artifacts; the automated Timeline-Dot harvest is a Stage 2 capability.
- **NFR-7 — Observability.** Privacy-first analytics (FR-36) + server logs sufficient to measure the §13 success metrics and detect agent retrieval misses (the documented trigger to consider embeddings).

### Additional Requirements

*Technical/infrastructure requirements distilled from the Architecture (`architecture.md`) that shape implementation beyond the FRs. **AR-1 (the starter template) drives Epic 1, Story 1.***

- **AR-1 — Starter template / scaffold `[S1]` (⭐ EPIC 1 STORY 1).** Scaffold a **pnpm monorepo in this repo** (the repo *is* the single source of truth, FR-33): `web/` (`npm create astro@latest` — Empty/Minimal, **TypeScript strict** — then `astro add react`), `api/` (`npm create hono@latest` — Node template), and a `shared/` package. One `pnpm install` covers all; wire local nginx static + `/api` proxy. *Architecture: "Project initialization is the first story."*
- **AR-2 — Data layer.** PostgreSQL (attached VM DB) + **Drizzle ORM** (typed schema + migrations). `inquiries` table: `id` (uuid `gen_random_uuid()`), `created_at`/`updated_at` (`timestamptz` UTC), `name`, `email`, `org`, `message`, `topic`, `attribution`, `source` (`form`|`agent`), `status` (`new`|`replied`), `mail_status` (`sent`|`failed`|`skipped`). Access-controlled; retention TBD.
- **AR-3 — KB index & retriever.** **Orama v3** build-time in-memory index from curated markdown (chunked at heading boundaries, ~300–800 tokens), serialized, loaded by the Hono service at startup; BM25 lexical, top-k 3–6; read-only at runtime. A `search(query, k)` **retriever abstraction** isolates the later lexical→hybrid/vector swap (pgvector available; gated on NFR-7 logged misses).
- **AR-4 — API surface.** Minimal REST on **Hono 4**, exactly two public endpoints: `POST /api/guide` (SSE stream; typed events `token`|`citation`|`done`|`error`) and `POST /api/invite` (JSON). Same-origin (CORS closed); Zod validation on all inputs; rate-limiting on both; honeypot on the form.
- **AR-5 — Email transport.** Nodemailer → a transactional provider (default **Resend**; swappable via SMTP). Email = the notification; **Postgres = the system of record** (an inquiry is never lost if mail fails; `mail_status` recorded). SPF/DKIM DNS required at launch.
- **AR-6 — Frontend rendering & state.** Astro SSG (`output: 'static'`); React islands **only** for hero affordances + the Guide panel + the Invite form (`client:visible`/`client:idle`); 0 JS elsewhere (holds NFR-1). One cross-island nanostore atom `$guideOpen`; no other global state.
- **AR-7 — Styling system.** No CSS framework. DESIGN.md tokens authored as **CSS custom properties** in `web/src/styles/tokens.css` (verbatim values) + Astro scoped `<style>`. Source Serif 4 subset to Latin, weights 400/600/700, `font-display: swap`.
- **AR-8 — Infrastructure & deploy.** nginx vhost at `joshuabrandt.abacusai.cloud` (:80) serves `web/dist/` **and** reverse-proxies `/api/*` → the Hono service (Node, localhost high port); Hono under a **systemd** unit; deploy script: `git pull → pnpm install → pnpm build → systemctl restart api → nginx -t && systemctl reload nginx`.
- **AR-9 — Build-time content pipeline.** `scripts/` generate the Orama KB index, the Static Mirror data, the Glass Box render from `_bmad-output/` (via the publish allowlist), the Stage-1 hand-curated Timeline manifest, and JSON-LD + `sitemap.xml` + `robots.txt`. Deterministic from real artifacts (NFR-6).
- **AR-10 — Analytics.** Self-hosted **Umami v3** on the VM (own schema on the attached Postgres); cookieless script in `<head>`. Custom events (kebab `area-action`): `guide-opened`, `guide-query`, `citation-followed`, `invite-submitted`, `channel-clicked`, `speaker-reel-played`.
- **AR-11 — Observability.** Hono structured JSON-line logs (error/warn/info/debug); a dedicated `retrieval_miss` info event logs `{query, topScore, threshold}` (NFR-7 embeddings trigger); no PII, no inquiry message bodies in logs.
- **AR-12 — Secrets management.** `ABACUS_API_KEY` (LLM endpoint) fetched from the VM metadata service (IMDSv2) at runtime; DB URL + email key in a gitignored `.env` on the VM; a typed `env.ts` per package (Zod-validated, fail-fast); secrets never imported into `web/` client code (NFR-5).
- **AR-13 — Single publish allowlist (one gate).** ONE file `content/glassbox.allowlist.ts`, **default-deny**, read by BOTH the Glass Box render AND the KB indexer — the single gate preventing internal-doc leakage (closes red-team H3).
- **AR-14 — Testing & CI.** Vitest (unit — pipeline/retrieval), Playwright (e2e + JS-off/reduced-motion + `view-source` SEO checks), Lighthouse CI (NFR-1 budget guard); shared root ESLint + Prettier + TS strict.
- **AR-15 — Shared contract package.** `shared/` holds the Zod schemas (`InviteInput`, `GuideQuery`) and the SSE event types (`token`|`citation`|`done`|`error`) — imported by both `web` islands and `api` (one source of truth; never cross-import internals). camelCase JSON end-to-end; DB snake_case bridged only in Drizzle.
- **AR-16 — Launch gates.** `public_url_enabled` is currently **OFF** → must be enabled (hard gate before anything routes publicly); SPF/DKIM DNS for email; (Stage 2) Suno commercial regeneration gates FR-30. `github_connected` OFF is fine (no live reads; use `gh auth`/PAT).

### UX Design Requirements

*First-class, actionable work items from the UX spines (DESIGN.md = visual; EXPERIENCE.md = behavior/IA). The spines **win on conflict** with any mock. UX-DR5–UX-DR9 enumerate all **18 locked components**.*

**Design foundation (tokens)**
- **UX-DR1 — Color system.** Implement the 8 core semantic tokens (`surface-base` #F6F0E6, `surface-raised` #FBF7EF, `ink-primary` #211B14, `ink-secondary` #6B5D4A, `border-hairline` #D8CAB3, `grid-line` #ECE3D3, `accent` #1E3A5F Prussian navy, `accent-hover` #162B47) + 2 AA-safe muted-ink variants (`ink-ghost` #776B55, `ink-meta-min` #756B56) as CSS custom properties (verbatim hex). One accent, one ink family; color never the sole carrier of meaning. Meaningful muted text stays ≥4.5:1; only purely decorative marks may drop below.
- **UX-DR2 — Typography ramp.** All **Source Serif 4** (display/h1/h2/h3/body/lede/meta/kicker) with the optical-size axis exercised (opsz→display for the headline, eased→text for reading); the long-form-only **drop-cap** + **pull-quote** devices reserved for `/glass-box/{artifact}` & case studies; subset to Latin 400/600/700, `font-display: swap`. No exclamation marks, no gimmick faces, mono only for tiny route labels.
- **UX-DR3 — Shape & spacing scales.** Radii (`sm` 2px, `md` 6px, `lg` 8px, `panel` 12px, `full` 9999px — only nodes & the Guide are fully round); 8px spacing scale + named values (`card-pad`, `gutter`, mobile/desktop margins, `section-band`, `reading-measure` 680px, `content-measure` 1040px).
- **UX-DR4 — Flat/hairline elevation.** Depth via tonal layering (`surface-raised` on `surface-base`) + hairline borders only; **exactly ONE soft shadow site-wide** (`shadow-float`), reserved for the Guide panel + pill. Any other shadow breaks the system.

**Component system (18 locked components — DESIGN.md §Components; behavioral rules in EXPERIENCE.md §Component Patterns)**
- **UX-DR5 — Shared chrome components.** (1) **Wordmark** (`Joshua R. Brandt, MSE`, tracked uppercase); (2) **Kicker** (small-caps eyebrow + 26px navy lead-tick); (3) **Button — primary** (filled navy, cream text, AA, focus ring); (4) **Button — secondary** (outline, warm-wash hover); (5) **Input** (Guide composer; hairline border, navy focus ring, always labeled); (6) **Static-fallback footer** (real `<a>` links to all Mirror routes; JS-off).
- **UX-DR6 — Guide components.** (7) **Guide pill** (persistent bottom-right entry, filled navy, monogram glyph, carries `shadow-float`); (8) **Guide panel** — **THE single elevated surface**: floating, NON-modal (`role="dialog"` `aria-modal="false"`, focus moves in but is **not trapped**), head (monogram + "Grounded · cites its sources" status + real minimize/close `<button>`s), `role="log"` body announced per-message, composer, and a designed "Reading the record" thinking state (not a spinner); (9) **Citation chip** (pill → Mirror route, mono route label, ↗); (10) **Citation link** (inline accent, hairline underline).
- **UX-DR7 — Glass Box components.** (11) **Artifact card** (type chip · h3 title · italic curator note · "Read →"; **ghost variant** dashed/`ink-ghost` for upcoming nodes; "Live · in progress" pill); (12) **Artifact reader** (`/glass-box/{artifact}` long-form: header chip · curator note · drop-cap lede · body · pull-quote, at the reading measure).
- **UX-DR8 — Timeline components.** (13) **Timeline-dot ("BMAD Method Dot")** — shared node across Glass Box & Master Timeline; states resting/filled/**live** (static halo, no animation)/upcoming (dashed)/faint (runway)/milestone; rides a 1px hairline spine; degrades to a plain `<ol>`; (14) **Era-band** (labeled region — quiet ~30-year runway vs the dense agentic turn; dashed divider; `aria-label` per `<li>`); (15) **Flagship node** (milestone Dot expanding to a small cluster of real-link Dots; portfolio node cross-links into the Glass Box, loandemo node drills to `/work/loandemo#…`).
- **UX-DR9 — Speaker Surface components.** (16) **Talk-card** (audience-level chips · outcome-oriented h3 · abstract — first expanded, rest in native `<details>`, works JS-off · hairline-tick takeaways · format pills · logistics); (17) **Bio-block** (50w + 100–150w; real Copy `<button>` → "Copied ✓"; selectable-text fallback; word-count label); (18) **Metric** (audience-draw figure in navy + label + italic source; hairline-gridded 4-up/2-up); plus **Testimonial** (italic quote, navy left rule, quiet attribution) and **Reel-poster** (the one rich visual: editorial navy gradient + faint registration grid, cream play ring, **no autoplay**, static link fallback — never a Matrix/AI cliché).

**Information architecture & behavior**
- **UX-DR10 — Two-layer IA + canonicalization.** A narrative **home Scene Arc at `/`** (summarize-and-link teasers, 1–2 sentences + link) over crawlable **Static Mirror routes**; every Mirror route is **self-canonical**; teasers never duplicate Mirror body text (duplicate-content guard — clean Mirror wins the citation).
- **UX-DR11 — Stage-1 route map + locked Scene order.** Surface→route map: `/` (Hero, Thesis, Close), `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box` (+`/glass-box/{artifact}`), `/about`, `/faq`, `/invite`, `/browse`. **Locked Scene order:** Hero → Thesis → Master Timeline → Speaker → Flagship (loandemo) → Glass Box → Close. Speaker sits early–mid **by design** (SM-C1).
- **UX-DR12 — Hero fork.** Three ways in: **"Explore"** (→ Scene Arc), **"I'm here to book a talk"** (→ `/speaking`, **bypasses the Guide + cinematic layer**, protects SM-C1), and a quiet **"Or ask my Guide about the work."** Real `<a>` links, JS-off followable.
- **UX-DR13 — Static fallback.** A `/browse` index + a static footer on every page linking every Mirror route; reaches 100% of agent-reachable content (FR-8); works JS-off, screen-reader navigable.
- **UX-DR14 — Three GEO Mirror routes.** `/about` (canonical `Person`+`ProfilePage` home — long bio, headshot, `sameAs` channel links), `/faq` (crawlable `FAQPage` — real `<h3>` Q + `<p>` A; the Guide mirrors its answers here), `/speaking/reel` (server-rendered reel metadata so `VideoObject` is satisfiable in initial HTML; reel poster's link-out fallback).
- **UX-DR15 — Answer-first ledes.** Every Mirror route opens with a plain-text intro whose **first sentence names "Joshua R. Brandt, MSE"** and answers the surface's core question (the verbatim passage an answer-engine lifts — GEO).

**Voice & content**
- **UX-DR16 — Microcopy & canonical named strings.** Confident/cited/plain; **NO exclamation marks anywhere**; "the BMAD Method" in prose (bare "BMAD" only in the coined "BMAD Method Dots"). Canonical strings: wordmark `Joshua R. Brandt, MSE`; positioning line **"Seasoned, building at the frontier"** (hero `<h1>`); thesis line "The medium is the message."; CTA strings ("Explore", "I'm here to book a talk", "Ask my Guide", "Invite me to speak"); 50w + 100–150w bios (lowercase tail form vs Title-case hero form — do not normalize).
- **UX-DR17 — Guide voice.** Greeting ("I'm your guide to Joshua's work. I only say what it can back up."); honesty line ("I don't have that documented." + pointer to what *is* covered); three KB-answerable starter prompts; refers to him as "Joshua" in conversation; **two-element grounded assurance** (persistent panel-header "Grounded · cites its sources" + citations-carry-the-honesty; the over-asserting per-answer "zero ungrounded claims" footnote is dropped).

**Product-soul contracts**
- **UX-DR18 — Guide grounding & safety contract.** Retrieve-only from the build-time index; below-threshold → **no model call** (honest by construction; protects SM-C3); every substantive claim cited to a real Mirror route; prompt-injection-resistant context separation (FR-9); per-message visible thinking (`role="status"`, never per-token, NFR-2); server-side persona never exposed.
- **UX-DR19 — Glass Box curation.** Two views: the **reader** (`/glass-box/{artifact}`, editorial long-form) and the **index** (`/glass-box`, curated chronological build-story on BMAD Method Dots). The launch set carries **real shipping evidence day one** — a non-ghosted "live site / its public repo" node + loandemo's **code/repo · build · retro** Dots — plus planning nodes; still-to-come nodes (architecture · epics & stories · retrospectives) stay **ghosted** ("never finished, never stale"). The default-deny allowlist (never-render: decision logs, `review-*`, `reconcile-*`, addenda) is framed on-page as **an act of taste**. Recursion beat: "You're reading the build history of the site you're reading it on."

**Conversion behavior**
- **UX-DR20 — Invite-Me form behavior.** A real accessible `<form>`: persistent visible `<label>`s (never placeholder-as-label); required fields marked **in text**; the **attribution field** as a labeled `<select>`/radio group; inline validation (`aria-invalid` + `aria-describedby`/`aria-errormessage`; on failed submit an **error summary** at top takes focus, links to each bad field); success = `aria-live="polite"` confirmation + stated response time `[N]`; offline/submit-failure = non-destructive `role="alert"` that **preserves values** + offers retry + a mailto/`/about` fallback; works as a real form post if JS fails.

**Cross-cutting quality**
- **UX-DR21 — Accessibility floor (WCAG 2.1 AA).** Two-layer reduced-motion gate (CSS + JS), **enumerated per animated surface** with a static fallback each (scene-rail meter → static filled bar; Guide thinking sweep → static text; S2 camera path → **disabled outright**; Master Timeline → static `<ol>`). Non-modal Guide focus-return: on minimize/close → focus returns to the pill; after a citation routes the page behind → focus stays in the panel, the navigation is announced via `aria-live`, and a skip-link moves focus to the routed Mirror `<h1>`. Real `<button>`/`<a>`, visible `:focus-visible`, color never the sole signal, clean heading hierarchy (one `<h1>`), DOM reading order. Implemented via a **shared reduced-motion gate utility** (`web/src/lib/motion.ts`), not re-implemented per component.
- **UX-DR22 — Responsive transforms.** Presentation-only (same DOM), mobile + desktop both first-class: scene-rail (right rail ↔ sticky top bar + Jump menu), Master Timeline (horizontal arc ↔ vertical reflow, reading order preserved), Guide panel (~400px floating card ↔ partial bottom sheet), hero (two-column ↔ compact name+headshot lockup), Speaker Surface (sticky-header nav + metric/quote/bio grids reflow).
- **UX-DR23 — Static discoverability infrastructure.** Build-generate `sitemap.xml` (every Mirror route + `lastmod`) and `robots.txt` with an **explicit AI-crawler allow-list** (≥ ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended + related current tokens — confirm at build, tokens drift); self-canonical Mirror routes; `<html lang="en">` site-wide (single locale, no i18n).
- **UX-DR24 — Interaction primitives & banned anti-patterns.** Scroll-native arc + scene-rail (all 7 scene entries are real keyboard-operable in-page anchors); deep-linking (every Scene anchor; every surface a Mirror route; `/speaking` self-sufficient on a cold deep link); floating non-modal dialog; **cite→route** (page behind navigates, conversation persists); copy-to-clipboard with feedback; horizontal↔vertical timeline reflow. **Banned:** scroll-jacking without a visible skip affordance, hover-only affordances on touch, per-token chat churn, modal scrims over the page.

### FR Coverage Map

*Every FR mapped to its owning epic — no FR is dropped. **Stage 1 (E1–E4) = 19 FRs · Stage 2 (E5–E9) = 14 · Stage 3 (E10) = 3 · total 36.***

| FR | Epic | What it delivers |
|---|---|---|
| FR-1 | Epic 1 | Calm credible hero ("Seasoned, building at the frontier") |
| FR-2 | Epic 1 | Sectioned Scene structure + skip/progress scene-rail |
| FR-3 | Epic 5 | Continuous Canvas with cinematic Scene transitions |
| FR-4 | Epic 5 | Director's-mode Scene Arc reordering |
| FR-5 | Epic 5 | Depth Dial |
| FR-6 | Epic 4 | Grounded, cited answers from the Knowledge Base |
| FR-7 | Epic 4 | Agent-as-router to Static Mirror |
| FR-8 | Epic 1 | Lean Static Fallback reachability (footer + `/browse`) |
| FR-9 | Epic 4 | Prompt-injection-resistant grounding |
| FR-10 | Epic 5 | Agent-adaptive re-curation |
| FR-11 | Epic 9 | The Demonstrator (curated agentic-work demonstration) |
| FR-12 | Epic 10 | Speaking-inquiry capture & booking via agent |
| FR-13 | Epic 2 | Read-only rendering of real BMAD Artifacts |
| FR-14 | Epic 2 | Stage-1 chronological timeline teaser |
| FR-15 | Epic 6 | Guided tour + explorable map |
| FR-16 | Epic 2 | Master Timeline seeded with curated BMAD Dots |
| FR-17 | Epic 6 | Zoomable Master Timeline (+ auto-harvest) |
| FR-18 | Epic 10 | Site-wide semantic zoom |
| FR-19 | Epic 3 | Speaker Reel & signature talks |
| FR-20 | Epic 3 | Copy-paste bios & social proof |
| FR-21 | Epic 9 | Downloadable one-sheet / EPK |
| FR-22 | Epic 2 | Two flagship case studies (portfolio-itself + loandemo) |
| FR-23 | Epic 3 | Curated content links/embeds (Close creative touch) |
| FR-24 | Epic 7 | Distinct Wings |
| FR-25 | Epic 7 | Greatest-hits, relevance-ordered |
| FR-26 | Epic 7 | Playable project embeds |
| FR-27 | Epic 7 | Video-Synced Repo |
| FR-28 | Epic 10 | Remaining content import |
| FR-29 | Epic 8 | Creative Lab movement |
| FR-30 | Epic 8 | Adaptive Soundtrack |
| FR-31 | Epic 3 | Invite-Me form (persisted + emailed) |
| FR-32 | Epic 3 | Close / follow & subscribe CTAs |
| FR-33 | Epic 1 | Single git source of truth; build-time generation |
| FR-34 | Epic 2 | Project Import & `/bmad-correct-course` extension |
| FR-35 | Epic 1 | Structured-data (JSON-LD) emission |
| FR-36 | Epic 1 | Privacy-first funnel & conversion analytics |

**NFRs (cross-cutting, every epic):** NFR-1 Performance, NFR-2 Accessibility, NFR-3 SEO/GEO, NFR-5 Static key-free runtime, NFR-6 Maintainability — owned by Epic 1's foundation and honored as acceptance criteria in every later epic; NFR-4 Agent reliability/latency concentrates in Epic 4; NFR-7 Observability spans Epic 1 (analytics) + Epic 4 (`retrieval_miss`).

**Additional Requirements:** AR-1 → Epic 1 Story 1 (scaffold). AR-6/7/8/9/10/12/14/16 → Epic 1. AR-13 → Epic 2. AR-2/4/5 → Epic 3. AR-3/11 → Epic 4. AR-15 (shared contract) → Epic 1 (created), extended in Epics 3 & 4.

**UX Design Requirements:** UX-DR1–5, 10, 13, 15, 16, 21, 22, 23, 24 → Epic 1. UX-DR7, 8, 19 → Epic 2. UX-DR9, 20 → Epic 3. UX-DR6, 17, 18 → Epic 4. UX-DR11, 12 span Epics 1–4 (route map + hero fork wired progressively); UX-DR14 (`/about`, `/faq`, `/speaking/reel`) split across Epic 1 (`/about`), Epic 3 (`/speaking/reel`), Epic 4 (`/faq`).

## Epic List

*Organized by user value and the PRD priority order (practitioner amplification = the soul; organizer conversion = SM-1; "agentic ideal, graceful fallback" honored throughout). The design is fully validated (PRD + Architecture + UX spines all final), so epics are **few and large**, consolidating surfaces that share core files. **Stage 1 (E1–E4) is detailed here and in Step 3, Stage-1 first;** Stage 2/3 epics are sketched for sequencing and detailed once Stage 1 ships. Each epic is standalone and enables — but does not require — later epics.*

### Stage 1 — Credible Hub (MVP)

#### Epic 1: Foundation — Credible Hub Shell & Static Mirror
A visitor landing cold gets a fast, calm, credible, **crawlable** site — the "Seasoned, building at the frontier" hero with the sectioned Scene structure + skip/progress scene-rail — reachable end-to-end with JS off, deployed behind nginx, and measured. Establishes the scaffold (the pnpm monorepo), the locked design-token system + shared chrome, the Static Mirror infrastructure (answer-first ledes, self-canonical routes, JSON-LD, sitemap/robots), the `/browse` + static-footer fallback, the build-time content pipeline foundation, and the cross-cutting NFR floor. **Standalone: ships a credible site on its own; enables every later epic.**
**FRs covered:** FR-1, FR-2, FR-8, FR-33, FR-35, FR-36

#### Epic 2: Proof-as-Process — Glass Box, Master Timeline & Flagships
The practitioner (UJ-1) sees the **recursion proof**: navigates the curated, read-only render of the site's real BMAD Artifacts, scrubs the seeded craft-progression Master Timeline, and reads the two flagship case studies (the portfolio-itself via the Glass Box + `loandemo`) — with **shipping evidence day one** (the non-ghosted live-site/repo node + loandemo's code/build/retro Dots). Establishes the single default-deny publish allowlist, the shared BMAD-Method-Dot + artifact components, the `_bmad-output`→render pipeline, the hand-curated dots manifest, and the Project Import / `/bmad-correct-course` extension path. The day-one *remarkable* element. **Builds on Epic 1; standalone.**
**FRs covered:** FR-13, FR-14, FR-16, FR-22, FR-34

#### Epic 3: Speaker Surface & Conversion
The organizer (UJ-2) confirms fit fast — the READY 2026 reel, signature talks, copy-paste bios, social proof — and **invites Josh in under two minutes** via a form that persists to Postgres **and** emails him; the wanderer (UJ-3) gets a curated creative touch and a follow/subscribe CTA at the Close. Establishes the speaker components, the Postgres `inquiries` schema + the Hono `/api/invite` endpoint (validation, rate-limit, honeypot) + transactional email, the accessible Invite-Me form behavior, and the `Event`/`VideoObject`/`CreativeWork` JSON-LD on these routes. The SM-1 conversion path, end to end. **Builds on Epic 1 (and links to Epic 2's loandemo case study); standalone organizer path.**
**FRs covered:** FR-19, FR-20, FR-23, FR-31, FR-32

#### Epic 4: The Guide — Grounded Advocate (capstone)
The practitioner can **converse** with the grounded Guide — concise, cited, honest, prompt-injection-resistant answers that route into the Mirror pages built in Epics 1–3. Establishes the Orama build-time KB index + the `search(query,k)` retriever seam, the Hono `/api/guide` SSE endpoint + the grounding/safety contract (retrieve-only, fail-closed below threshold with no model call, citation-required, context separation, server-side persona), the non-modal Guide pill + panel island with per-message visible thinking and focus-return, `/faq` mirroring, and retrieval-miss observability. Because every fact already lives in the static Mirror, the site is fully credible **without** the Guide — this epic is the agentic enhancement over a complete fallback. **Builds on Epics 1–3; requires no future epic.**
**FRs covered:** FR-6, FR-7, FR-9

### Stage 2 — The Magic (sketched; detailed after Stage 1 ships)

#### Epic 5: Cinematic Canvas, Director's Mode & Depth Dial
The Stage-1 discrete Scenes become a Continuous Canvas navigated as a directed camera path; the Guide reorders/deepens/skips Scenes by stated intent and the visitor sets depth — all behind the two-layer reduced-motion gate, never burying the organizer (SM-C1).
**FRs covered:** FR-3, FR-4, FR-5, FR-10

#### Epic 6: Zoomable Timeline & Guided Glass Box
The Master Timeline becomes one zoomable gesture (career milestones → a project's Dots) fed by the deterministic git→Dot auto-harvest; the Glass Box gains a narrated guided tour + an explorable map.
**FRs covered:** FR-15, FR-17

#### Epic 7: Wings, Playables & Video-Synced Repo
The three distinct Wings (Technical/Creative/Agentic) become the full default structure with greatest-hits relevance ordering, playable in-browser project embeds, and the video-synced live repo.
**FRs covered:** FR-24, FR-25, FR-26, FR-27

#### Epic 8: Creative Lab & Adaptive Soundtrack
The tonal-shift Creative Lab movement and the original Suno adaptive soundtrack (off by default, auto-ducking under video; Suno commercial-regen prerequisite).
**FRs covered:** FR-29, FR-30

#### Epic 9: The Demonstrator & Speaker EPK
The curated, pre-recorded Demonstrator + BMAD Build Walkthrough (no live execution) and the downloadable speaker one-sheet/EPK PDF.
**FRs covered:** FR-11, FR-21

### Stage 3 — Full Richness (sketched)

#### Epic 10: Full Richness
In-chat speaking-inquiry capture & booking via the Guide (feeding the same store as Invite-Me), site-wide semantic zoom, and the remaining-content import.
**FRs covered:** FR-12, FR-18, FR-28

---

# Epics & Stories

<!-- Stage 1 (Epics 1–4) detailed with Given/When/Then acceptance criteria. Stage 2/3 (Epics 5–10) carry story-level stubs to be detailed when each stage is scheduled. Stories are ordered with no forward dependencies; each is sized for a single dev-agent session. -->

## Epic 1: Foundation — Credible Hub Shell & Static Mirror

A visitor landing cold gets a fast, calm, credible, crawlable site — the "Seasoned, building at the frontier" hero with the sectioned Scene structure + skip/progress scene-rail — reachable end-to-end with JS off, deployed behind nginx, and measured. Establishes the scaffold, the locked design-token system + shared chrome, the Static Mirror infrastructure (answer-first ledes, self-canonical routes, JSON-LD, sitemap/robots), the `/browse` + static-footer fallback, the build-time content pipeline foundation, and the cross-cutting NFR floor. *Covers FR-1, FR-2, FR-8, FR-33, FR-35, FR-36.*

### Story 1.1: Scaffold the pnpm monorepo (web · api · shared)

As Josh, the builder,
I want the site scaffolded as a single pnpm monorepo (Astro `web`, Hono `api`, shared contract package) in this repo,
So that every later story has a consistent, deployable home and the site is literally its own source of truth.

**Acceptance Criteria:**

**Given** the repo root (which is the single source of truth, FR-33)
**When** the workspace is initialized
**Then** `web/` is an Astro 6 app (Empty/Minimal template, TypeScript strict) with `@astrojs/react` added, `api/` is a Hono 4 Node service, and `shared/` is a package exporting placeholder Zod-schema and SSE-event-type modules
**And** a root `pnpm-workspace.yaml` lists `web`, `api`, `shared`, and a single `pnpm install` from root installs all three.

**Given** the workspace
**When** lint/format/type-check run from root
**Then** a shared `tsconfig.base.json` (strict), a root ESLint flat config, and Prettier are in place, each package extends the base TS config, and `pnpm -r typecheck` passes on the empty scaffold.

**Given** local development
**When** `pnpm dev` runs
**Then** `astro dev` (web) and the Hono dev server (api, tsx watch) run concurrently, a local proxy maps `/api/*` to the Hono port to mirror production, and a placeholder `GET /api/health` returns 200 through the proxy.

**Given** the scaffold is committed
**When** the repo is inspected
**Then** `.gitignore` excludes `node_modules`, `web/dist`, `api/data`, and `.env`, and a committed `.env.example` documents required vars with no secrets present.

### Story 1.2: Design system — tokens, base layout & shared chrome

As a visitor,
I want the site to render in one calm, warm, editorial identity,
So that it reads as the work of someone with taste from the first glance.

**Acceptance Criteria:**

**Given** the locked DESIGN.md tokens
**When** `web/src/styles/tokens.css` is authored
**Then** all 8 core colors + 2 muted-ink variants, the Source Serif 4 type ramp, the radius scale, the 8px spacing scale, and the single `--shadow-float` exist as kebab-namespaced CSS custom properties with verbatim values
**And** no component hardcodes a hex/size a token covers (enforced in review/lint).

**Given** the type system
**When** the site loads
**Then** Source Serif 4 is self-hosted, subset to Latin weights 400/600/700, with `font-display: swap`.

**Given** any page
**When** it renders
**Then** `BaseLayout.astro` provides `<html lang="en">`, head/meta, a JSON-LD slot, and a global footer slot, ships 0 JS by default, and realizes the flat/hairline system (depth via `surface-raised` + hairlines, never shadow except the Guide).

**Given** the design system
**When** the shared chrome is built
**Then** Wordmark (`Joshua R. Brandt, MSE`), Kicker (small-caps + navy lead-tick), and Button (primary/secondary as real `<button>`/`<a>`, `:focus-visible` ring, AA contrast) exist as reusable Astro components matching DESIGN.md and render correctly with JS off.

### Story 1.3: Calm, credible hero with the audience fork

As a visitor landing cold,
I want a calm hero that tells me who Josh is in seconds and offers clear ways in,
So that I'm oriented and can choose my path without being hit with spectacle.

**Acceptance Criteria:**

**Given** a cold visit on mobile or desktop
**When** the hero renders
**Then** it shows the wordmark, a headshot/portrait (styled placeholder until the real asset, flagged `[OPEN]`), and the `<h1>` positioning line "Seasoned, building at the frontier", all above the fold
**And** the "built in the open · a BMAD Method project" framing is present with no hype and no exclamation marks.

**Given** the hero
**When** the visitor chooses a path
**Then** "Explore" enters the home Scene Arc, "I'm here to book a talk" is a real `<a>` to `/speaking` that bypasses any agent/cinematic layer (SM-C1), and a quiet "Or ask my Guide about the work" entry is present (wired to open the Guide in Epic 4; until then it gracefully links to `/faq`)
**And** all fork controls are real links/buttons, keyboard-operable, and followable with JS off.

**Given** a mid-range mobile device
**When** the hero loads
**Then** FCP is < ~2s with no blocking WebGL and main-page JS within the ~200–250KB gz budget (NFR-1)
**And** under `prefers-reduced-motion` or JS-off the visitor still gets a complete, styled static hero (NFR-2).

### Story 1.4: Home Scene scaffold + scene-rail (skip/progress)

As a visitor,
I want to move through the home's Scenes and always know where I am and how to skip ahead,
So that I am never trapped in scroll-jacking and can jump straight to what I want.

**Acceptance Criteria:**

**Given** the home `/`
**When** it renders
**Then** it presents the locked 7-scene order (Hero → Thesis → Master Timeline → Speaker → Flagship → Glass Box → Close) as discrete sections each with a stable in-page anchor (`#hero`…`#close`), the Thesis scene content ("The medium is the message.") is authored here
**And** the Timeline/Speaker/Flagship/Glass Box scenes are teaser slots (filled by their epics) and the Close is a shell (CTAs filled by Epic 3), each summarize-and-link to its Mirror route without duplicating the Mirror body (UX-DR10).

**Given** desktop
**When** the visitor scrolls
**Then** a slim right scene-rail shows all 7 scenes as real in-page anchor links (each a ≥44×44px target with a visible `:focus-visible` ring), a progress meter ("Scene N of 7"), a "Skip to the end", and a "Jump: book a talk" shortcut to `/speaking`
**And** the current scene is indicated via `aria-current` + weight, never color alone.

**Given** mobile
**When** the visitor scrolls
**Then** the rail collapses to a sticky top progress bar + a "Jump to section" menu carrying the same anchors and skip/jump affordances.

**Given** the home
**When** motion is reduced or JS is off
**Then** the progress meter is a static filled bar, scenes are plain sequential sections, and there is no scroll-jacking without the visible skip affordance.

### Story 1.5: Static Mirror layout, route stubs & the canonical /about

As a search engine, answer engine, or JS-off visitor,
I want every key surface to exist as a real, crawlable, answer-first page,
So that Josh's facts are indexable and reachable independent of the agent or JS.

**Acceptance Criteria:**

**Given** any Mirror route
**When** it renders
**Then** `MirrorLayout.astro` opens with a plain-text answer-first lede whose first sentence names "Joshua R. Brandt, MSE", is self-canonical (`<link rel="canonical">` to itself), has a clean heading hierarchy (one `<h1>`), and includes the footer slot.

**Given** the Stage-1 route map
**When** the site builds
**Then** real crawlable pages exist for `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, and `/invite`, each an answer-first stub (entity-named lede + heading + placeholder body its epic will flesh out)
**And** each stub is verifiable via `view-source` + find with JS disabled.

**Given** `/about`
**When** it renders
**Then** it is the canonical home for the long bio + headshot + `sameAs` channel links as real HTML `<a>`s (handles flagged `[OPEN]` until supplied) and opens answer-first
**And** the bio text is set verbatim from the approved copy (50-word and 100–150-word forms), with no exclamation marks.

### Story 1.6: Structured-data emission, sitemap & robots

As a conference organizer who Googles Josh,
I want the site to surface accurate structured data and be fully indexable,
So that Josh's speaker facts and identity are credible before I even click (NFR-3, FR-35).

**Acceptance Criteria:**

**Given** the JSON-LD framework
**When** `web/src/lib/jsonld.ts` is built
**Then** it exposes builders for `Person`, `ProfilePage`, `Event`, `VideoObject`, `CreativeWork`, and `FAQPage`, emitted server-rendered into the `BaseLayout` JSON-LD slot
**And** home + `/about` emit `Person` + `ProfilePage` now; the `/speaking`, `/speaking/reel`, `/work/loandemo`, and `/faq` stubs emit their type with placeholder data their epic completes.

**Given** any emitted schema
**When** validated
**Then** each route type passes the Rich Results Test.

**Given** the build
**When** the pipeline runs
**Then** a generated `sitemap.xml` enumerates every existing Mirror route with `lastmod` and is referenced from a generated `robots.txt` whose AI-crawler allow-list includes at minimum ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, and Google-Extended (plus related current tokens; final list confirmed at build).

### Story 1.7: Lean Static Fallback — /browse + global footer

As a visitor with JS off or using a screen reader,
I want a complete static index and footer that reach every surface,
So that nothing is ever hidden behind the agent or the cinematics (FR-8).

**Acceptance Criteria:**

**Given** any page
**When** it renders
**Then** a static footer (in `BaseLayout`) carries real `<a>` links to every Mirror route (`/`, `/about`, `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, `/invite`, `/browse`), works with JS off, and is screen-reader navigable.

**Given** `/browse`
**When** it renders
**Then** it is a crawlable index listing/linking every Mirror route with a one-line description each
**And** it reaches 100% of the content that the agent (Epic 4) will be able to surface — parity is re-verified as each later epic lands its route content.

**Given** keyboard-only navigation
**When** the visitor tabs through the footer and `/browse`
**Then** every link is reachable and operable with a visible `:focus-visible` indicator.

### Story 1.8: Build-time content pipeline foundation

As Josh, the builder,
I want the site to deterministically generate itself from the git repo at build time with no CMS and no runtime external reads,
So that the site is maintainable as code and never depends on a live third party (FR-33, NFR-6).

**Acceptance Criteria:**

**Given** a `scripts/` build pipeline
**When** `pnpm build` runs
**Then** it produces the prerendered Static Mirror (`astro build` → `web/dist/`) deterministically from `content/` + the repo, and exposes extension points for the KB index (Epic 4) and Glass Box data (Epic 2) without requiring them to exist yet
**And** no admin/CMS surface exists and the build performs no reads from GitHub/YouTube/Suno.

**Given** the same inputs
**When** the build runs twice
**Then** the output is byte-stable (deterministic), confirming code-as-CMS reproducibility.

### Story 1.9: Accessibility & performance floor + test harness

As any visitor, including those using assistive technology or reduced motion,
I want the site to meet a consistent accessibility and performance floor,
So that the experience is usable and fast for everyone (NFR-1, NFR-2).

**Acceptance Criteria:**

**Given** the need for one consistent gate
**When** `web/src/lib/motion.ts` is built
**Then** it provides a shared two-layer reduced-motion gate (CSS media query + JS init-guard) used by every animated surface (not re-implemented per component), and a documented pattern for color-never-the-sole-signal and visible `:focus-visible`.

**Given** the test harness
**When** CI runs
**Then** Vitest (unit), Playwright (e2e + a JS-off pass + a `prefers-reduced-motion` pass + a `view-source` SEO check), and Lighthouse CI (guarding the NFR-1 budget) are configured and green on the Epic-1 surfaces.

**Given** the home and `/about`
**When** audited
**Then** they meet WCAG 2.1 AA for contrast, heading hierarchy (one `<h1>`), keyboard operability, and DOM reading order on both mobile and desktop.

### Story 1.10: Deploy, analytics & launch gates

As Josh,
I want the site deployed behind nginx with privacy-first analytics and the launch gates cleared,
So that a credible cut is live, shareable, and measurable (FR-36, SM-4).

**Acceptance Criteria:**

**Given** the VM
**When** the deploy script runs
**Then** `scripts/deploy.sh` performs `git pull → pnpm install → pnpm build → systemctl restart portfolio-api → nginx -t && systemctl reload nginx`, nginx serves `web/dist/` and reverse-proxies `/api/*` to the Hono service (under a systemd unit), and secrets are read server-side via VM metadata / a gitignored `.env` (never in `web/` client code, NFR-5).

**Given** the live site
**When** a visitor browses
**Then** self-hosted cookieless Umami (its own schema on the attached Postgres) records no-PII events (`guide-opened`, `guide-query`, `citation-followed`, `invite-submitted`, `channel-clicked`, `speaker-reel-played`) wired via an `analytics.ts` helper (events fire as their surfaces land).

**Given** the launch checklist
**When** preparing to go public
**Then** `public_url_enabled` is enabled (hard gate), SPF/DKIM DNS is recorded as a prerequisite for Epic 3 email, and a launch check confirms `view-source`/JS-off reachability, the Lighthouse budget, and AA — `github_connected` OFF is noted as a non-blocker.

## Epic 2: Proof-as-Process — Glass Box, Master Timeline & Flagships

The practitioner (UJ-1) sees the recursion proof: navigates the curated, read-only render of the site's real BMAD Artifacts, scrubs the seeded craft-progression Master Timeline, and reads the two flagship case studies (the portfolio-itself via the Glass Box + `loandemo`) — with shipping evidence day one. Establishes the single default-deny publish allowlist, the shared BMAD-Method-Dot + artifact components, the `_bmad-output`→render pipeline, the hand-curated dots manifest, and the Project Import / `/bmad-correct-course` extension path. *Covers FR-13, FR-14, FR-16, FR-22, FR-34. Builds on Epic 1.*

### Story 2.1: Publish allowlist (default-deny) + Glass Box render pipeline

As Josh,
I want a single default-deny gate that decides which real artifacts ever publish, plus the pipeline that renders them,
So that the Glass Box is polished glass — proof, never a raw file dump or an internal-doc leak (FR-13, AR-13).

**Acceptance Criteria:**

**Given** the repo's `_bmad-output/` artifacts
**When** the publish gate is authored
**Then** ONE file `content/glassbox.allowlist.ts` is the single, default-deny source of truth (an artifact renders only if explicitly allowlisted) and is the same gate later read by the KB indexer (Epic 4).

**Given** the build pipeline (from Story 1.8)
**When** `scripts/render-glassbox.ts` runs
**Then** it reads the allowlisted artifacts from git at build time and emits structured reader data (title, type, date, curator note, body) deterministically — no hand-written facsimiles, real repo artifacts only.

**Given** the never-render set (`.decision-log.md`, `review-*`, `reconcile-*`, internal addenda, and anything not allowlisted)
**When** the pipeline runs and a unit test asserts the output set
**Then** none of those files appear in the rendered data (default-deny verified by test), so internal/process-private content cannot leak.

### Story 2.2: Glass Box artifact reader (`/glass-box/{artifact}`)

As a practitioner,
I want to read each published BMAD Artifact as a polished long-form document,
So that I can inspect the real process behind the work, not just a summary (FR-13, UX-DR7).

**Acceptance Criteria:**

**Given** an allowlisted artifact
**When** `/glass-box/{artifact}` renders
**Then** the artifact-reader component presents the editorial long-form (header chip · curator note · drop-cap lede · body · pull-quote) at the reading measure, in Source Serif, sourced from the Story-2.1 render data
**And** the page is in the Static Mirror (answer-first lede + self-canonical via MirrorLayout) and is crawlable with JS off.

**Given** the reader
**When** audited
**Then** it is read-only (no edit affordances), uses the long-form-only editorial devices (drop-cap, pull-quote) reserved for this surface, and meets WCAG 2.1 AA (heading hierarchy, contrast, keyboard).

### Story 2.3: Glass Box index — the curated chronological build-story (`/glass-box`)

As a practitioner,
I want a curated, dated build-story of how this site was made,
So that I feel the recursion — I'm reading the build history of the site I'm on (FR-13, FR-14, UX-DR19).

**Acceptance Criteria:**

**Given** the Story-2.1 render data
**When** `/glass-box` renders
**Then** it shows a dated vertical timeline spine whose navy nodes are BMAD Method Dots (the artifact-card + timeline-dot components are built here), each mapping to a real artifact and linking into its reader from Story 2.2 — this chronological spine is the FR-14 teaser foreshadowing the Master Timeline.

**Given** the launch set
**When** the index renders
**Then** it carries the planning nodes (product brief · brainstorm · pre-brief research · PRD · UX design) **plus a real, non-ghosted "the live site / its public repo" shipping node** (repo/commits URL flagged `[OPEN]`), while still-to-come nodes (architecture · epics & stories · retrospectives) are **ghosted** ("As it accrues") yet remain real list items
**And** node status is carried in text + shape, never color alone.

**Given** the curation
**When** the index is read
**Then** the default-deny posture is framed on the page as an act of taste (not a technicality), the recursion beat is stated plainly ("You're reading the build history of the site you're reading it on."), and a cross-link clarifies Glass Box = this project's build history vs Master Timeline = the cross-project arc.

**Given** JS is off
**When** the index loads
**Then** the spine degrades to a plain ordered `<ol>` of dated artifact links with no loss of content.

### Story 2.4: Master Timeline — hand-curated, seeded (`/timeline`)

As a visitor,
I want to scrub one continuous timeline of Josh's craft progression,
So that I can read the arc from veteran shipping to agentic engineering and drill into the proof (FR-16, UX-DR8).

**Acceptance Criteria:**

**Given** a hand-curated manifest `content/timeline/dots.ts`
**When** `/timeline` renders
**Then** the seeded BMAD Method Dots are drawn from the real artifacts of the two Stage-1 flagships (the portfolio itself + `loandemo`), each Dot maps to a real artifact and drills into it, and **no automated harvest is required** (the deterministic git→Dot harvest is explicitly Stage 2)
**And** the timeline-dot component (from Story 2.3) is reused; era-band and flagship-node components are built here.

**Given** the spine
**When** it renders
**Then** era-bands label the quiet ~30-year runway vs the dense agentic turn (divided by a dashed hairline), and the two flagship nodes expand to a small cluster of their Dots — the portfolio node's Dots cross-link into the Glass Box, the loandemo node's Dots drill to `/work/loandemo#…`.

**Given** the viewport
**When** desktop vs mobile renders
**Then** the same semantic ordered list reflows horizontal (left→right craft-arc) on desktop and vertical on mobile — presentation only, DOM reading order (oldest→newest) identical — and degrades to a plain `<ol>` with JS off.

### Story 2.5: loandemo flagship case study (`/work/loandemo`)

As a practitioner or organizer,
I want a layered case study of `loandemo`, the live-on-stage proof,
So that I see real engineering shipping evidence — not just a plan (FR-22).

**Acceptance Criteria:**

**Given** `/work/loandemo`
**When** it renders
**Then** it is a layered case study fusing available assets (video + repo + write-up + timeline), reuses the artifact-card/reader patterns, opens answer-first, and carries `CreativeWork` JSON-LD
**And** content gaps (repo + artifact URLs) are flagged `[OPEN]` with curated substitutes until supplied.

**Given** the case study
**When** a peer inspects it
**Then** its BMAD Method Dots include real shipping evidence — code/repo · build · retro — not only planning, and it cross-links to its READY 2026 talk on `/speaking` (the route exists from Epic 1; talk content lands in Epic 3).

**Given** the portfolio-itself flagship
**When** a visitor looks for it
**Then** it is surfaced chiefly via the Glass Box (Stories 2.2/2.3) — together with this story, the two Stage-1 flagships of FR-22 are complete.

### Story 2.6: Project Import & `/bmad-correct-course` extension path

As Josh, the builder,
I want a documented path to add a new project so it appears on its own timeline,
So that the site grows by being engineered, not edited — no CMS (FR-34, UJ-4).

**Acceptance Criteria:**

**Given** a new project's curated artifacts, media, and write-up
**When** the documented Project Import path is followed
**Then** the project's content is wired into `content/` (KB markdown), the hand-curated `content/timeline/dots.ts` manifest, and the publish allowlist, and a build regenerates the site deterministically.

**Given** the import + build
**When** the site is rebuilt
**Then** the project appears on the Master Timeline as a hand-curated Dot (Stage 1) and its artifacts are available in the Glass Box where allowlisted; its KB markdown becomes agent-retrievable once Epic 4 ships (validated there).

**Given** the maintenance model
**When** documented
**Then** the path is expressed as a normal `/bmad-correct-course` epic/stories → dev cycle → deploy flow (no admin/CMS surface), consistent with FR-33.

## Epic 3: Speaker Surface & Conversion

The organizer (UJ-2) confirms fit fast — the READY 2026 reel, signature talks, copy-paste bios, social proof — and invites Josh in under two minutes via a form that persists to Postgres **and** emails him; the wanderer (UJ-3) gets a curated creative touch and a follow/subscribe CTA at the Close. Establishes the speaker components, the Postgres `inquiries` schema + the Hono `/api/invite` endpoint + transactional email, and the accessible Invite-Me form. The SM-1 conversion path, end to end. *Covers FR-19, FR-20, FR-23, FR-31, FR-32. Builds on Epic 1 (and links to Epic 2's loandemo case study).*

### Story 3.1: Speaker Surface — reel & signature talks (`/speaking`)

As a conference organizer,
I want the reel and specific, outcome-oriented talks front and center,
So that I can confirm Josh can deliver a great talk in seconds (FR-19, UX-DR9).

**Acceptance Criteria:**

**Given** `/speaking` (fleshing the Epic-1 stub)
**When** it renders
**Then** the READY 2026 reel is the lead item via the reel-poster component (editorial navy gradient + faint registration grid, cream play ring, **no autoplay**, a static link-out fallback) and `/speaking/reel` is a server-rendered sub-route hosting the reel metadata so `VideoObject` is satisfiable in the initial HTML
**And** content gaps (reel video, talk titles/abstracts) are flagged `[OPEN]` with placeholders labeled in text.

**Given** the signature talks
**When** they render
**Then** each talk-card carries an outcome-oriented title, audience-level chip(s), a 150–200-word abstract (the first expanded, the rest behind a native `<details>` that works JS-off with text in the DOM), 3–5 takeaways, formats/durations pills, and logistics (travel, A/V)
**And** the veteran-IC vantage is presented as a pitchable angle (e.g. a seed talk title, flagged `[ASSUMPTION]`).

**Given** discoverability
**When** the page is built
**Then** all talk facts exist in the Static Mirror as real HTML and emit `Event` (+ `VideoObject` on recordings) JSON-LD via the Story-1.6 framework, passing the Rich Results Test.

### Story 3.2: Copy-paste bios & social proof (`/speaking`)

As a conference organizer,
I want copy-paste bios and credible social proof,
So that I can drop Josh into a program and trust the audience draw (FR-20, UX-DR9).

**Acceptance Criteria:**

**Given** the Speaker Surface
**When** the bios render
**Then** a 50-word and a 100–150-word bio each appear in a bio-block with a real Copy `<button>` that confirms "Copied ✓", and selectable text is always the fallback (works if copy JS fails)
**And** the bios are set verbatim from the approved copy (no exclamation marks; lowercase running-sentence tail form distinct from the Title-case hero `<h1>`).

**Given** social proof
**When** it renders
**Then** audience-draw metrics (subscribers/views/talks/years) are *displayed* in metric components (navy figure + label + source), and testimonials (italic quote + attribution + navy rule) and conference/company logos are present
**And** real figures/testimonials/logos are flagged `[OPEN]` and placeholders are labeled in text (not tint alone), with `Person`/`Event` facts kept consistent with the JSON-LD.

### Story 3.3: Invite-Me capture — data model, endpoint & email

As Josh,
I want every speaking inquiry reliably persisted and emailed to me,
So that no opportunity is ever lost, even if email fails (FR-31, AR-2/4/5).

**Acceptance Criteria:**

**Given** the attached Postgres
**When** the `inquiries` schema is migrated via Drizzle
**Then** it has `id` (uuid `gen_random_uuid()`), `created_at`/`updated_at` (`timestamptz` UTC), `name`, `email`, `org`, `message`, `topic`, `attribution`, `source` (`form`|`agent`), `status` (`new`|`replied`), and `mail_status` (`sent`|`failed`|`skipped`), and is access-controlled.

**Given** `POST /api/invite`
**When** a valid JSON submission arrives
**Then** the Hono endpoint validates against the shared `InviteInput` Zod schema, persists a row (Drizzle), triggers an owner email (Nodemailer → Resend), records `mail_status`, and returns a receipt — Postgres is the system of record so a mail failure never loses the inquiry.

**Given** abuse vectors
**When** requests hit the endpoint
**Then** a honeypot field and rate-limiting reject spam, CORS is closed (same-origin), and on a mail-send failure the API still returns success for persistence with `mail_status='failed'` logged (no PII/message body in logs).

**Given** the launch prerequisite
**When** email is configured
**Then** SPF/DKIM DNS is in place for the sending domain (carried from Story 1.10).

### Story 3.4: Invite-Me form (accessible, resilient)

As a conference organizer (UJ-2 terminal step) or any visitor,
I want a short, accessible contact form that confirms receipt,
So that I can invite Josh without friction and know it went through (FR-31, UX-DR20).

**Acceptance Criteria:**

**Given** the `/invite` page and the Close scene
**When** the form renders
**Then** it is a real accessible `<form>` POSTing to `/api/invite` (works as a real form post if enhancement JS fails); every field has a persistent visible `<label>`; required fields are marked in text (not asterisk/color alone); and the attribution field ("how did you hear about Joshua?") is a labeled `<select>`/radio group (captures the FR-31 structured attribution).

**Given** validation
**When** the visitor submits with errors
**Then** each bad field gets `aria-invalid="true"` + a message wired via `aria-describedby`/`aria-errormessage`, and an error summary at the top receives focus and links to each field; the submit control shows a disabled `submitting` state.

**Given** a successful submission
**When** the server confirms
**Then** an `aria-live="polite"`/`role="status"` confirmation announces receipt with the stated response time ("I reply within [N] business days · persisted + emailed, never an auto-responder"; `N` flagged `[OPEN]`).

**Given** a network/submit failure
**When** the POST fails
**Then** a non-destructive `role="alert"` state preserves the entered values, states the failure plainly, and offers retry + a fallback (mailto / `/about`) — the inquiry is never silently lost. The whole form is keyboard-operable with a visible `:focus-visible` ring.

### Story 3.5: The Close — follow/subscribe CTAs & curated creative touch

As a content wanderer (UJ-3) or an organizer finishing the arc,
I want clear ways to invite, follow, or enjoy more of Josh's work,
So that attention converts into an invite or a follow (FR-32, FR-23).

**Acceptance Criteria:**

**Given** the home Close scene (the Epic-1 shell)
**When** it renders
**Then** it presents invite-me / follow-the-work / join-the-audience actions, embeds the Invite-Me form from Story 3.4, and the follow/subscribe CTAs link to Josh's channels (handles flagged `[OPEN]`) and fire the `channel-clicked`/`invite-submitted` conversion events (FR-36 helper from Story 1.10).

**Given** the wanderer's payoff
**When** the Close renders
**Then** a single curated Stage-1 creative touch (one featured Suno track or YouTube video) is present, lazy-loaded behind a static poster, with a curated link that works JS-off
**And** all such links/embeds are curated into the repo — the site performs no live runtime reads of YouTube/Suno/GitHub (FR-23, Guardrail §9.1).

## Epic 4: The Guide — Grounded Advocate (capstone)

The practitioner can converse with the grounded Guide — concise, cited, honest, prompt-injection-resistant answers that route into the Mirror pages built in Epics 1–3. Establishes the Orama build-time KB index + retriever seam, the Hono `/api/guide` SSE endpoint + the grounding/safety contract, the non-modal Guide pill + panel island with per-message visible thinking and focus-return, `/faq` mirroring, and retrieval-miss observability. Because every fact already lives in the static Mirror, the site is fully credible **without** the Guide — this is the agentic enhancement over a complete fallback. *Covers FR-6, FR-7, FR-9. Builds on Epics 1–3.*

### Story 4.1: Knowledge Base index & retriever seam

As Josh,
I want a build-time index over curated KB markdown with a clean retriever interface,
So that the Guide can only ever speak from blessed, deterministic source material (FR-6, AR-3).

**Acceptance Criteria:**

**Given** curated KB markdown in `content/kb/` (e.g. `about`, `speaking`, `loandemo`, `faq`, `bmad-method`), authored from the same facts the Static Mirror exposes
**When** `scripts/build-kb-index.ts` runs at build time
**Then** it chunks each doc at heading boundaries (~300–800 tokens) and writes a serialized Orama v3 index to `api/data/`, governed by the same default-deny allowlist as the Glass Box (Story 2.1) so nothing internal is indexed.

**Given** the Hono service
**When** it starts
**Then** it loads the serialized index into memory read-only, and a `search(query, k)` retriever abstraction (BM25 lexical, top-k 3–6) isolates the engine so a later lexical→hybrid/vector swap (pgvector, gated on NFR-7 misses) does not ripple into the agent.

**Given** the deterministic build
**When** the index is regenerated from unchanged content
**Then** the output is stable, and the agent's knowledge horizon is defined as "fresh as of the last build" (not "never stale").

### Story 4.2: Crawlable FAQ Mirror route (`/faq`)

As an answer engine or a JS-off visitor,
I want a real, crawlable Q&A page,
So that the Guide's answers have a citable home that exists independent of the agent (FR-7, UX-DR14).

**Acceptance Criteria:**

**Given** `/faq` (fleshing the Epic-1 stub)
**When** it renders
**Then** it presents server-rendered `<h3>` question + `<p>` answer pairs seeded from the Guide's three starter prompts + common organizer/peer questions, opens answer-first (naming "Joshua R. Brandt, MSE"), and emits `FAQPage` JSON-LD via the Story-1.6 framework.

**Given** the two-layer model
**When** the Guide later answers a question
**Then** its answer mirrors to a `/faq` entry where applicable, and `/faq` is verifiable via `view-source` + find with JS disabled.

### Story 4.3: The Guide endpoint — retrieve → ground → stream (`/api/guide`)

As a practitioner,
I want grounded, cited, streaming answers that refuse to make things up,
So that I get the case made with receipts — and an honest "I don't know" otherwise (FR-6, FR-9, AR-4).

**Acceptance Criteria:**

**Given** `POST /api/guide` with `{query, threadContext}`
**When** retrieval returns context at or above threshold
**Then** the endpoint assembles a grounded prompt (strict retrieved-context↔visitor-input separation), calls the VM OpenAI-compatible LLM (mid-tier, streaming), and returns an SSE stream of typed events (`token` · `citation {route,label}` · `done` · `error`), with every substantive claim carrying a citation to a real Mirror route, and per-message boundaries so the client batches `aria-live` per message.

**Given** empty or below-threshold retrieval
**When** the request is processed
**Then** the endpoint returns the canned "I don't have that documented." response and **does NOT call the model** (FR-6, protects SM-C3), and logs a `retrieval_miss` event `{query, topScore, threshold}` (no PII) per AR-11/NFR-7.

**Given** a prompt-injection attempt
**When** a visitor message tries to override the persona, reveal the system prompt, or escape the KB
**Then** it does not succeed when spot-tested against a standard injection set, the server-side persona/system prompt is never returned to the client, and the attempted override is logged (FR-9).

**Given** latency limits
**When** the model is slow or the endpoint is down
**Then** TTFT targets < ~1.5s, a hard ceiling ~15s (absorbs reasoning-class tail latency and per-deployment `GUIDE_LLM_MODEL` variance) yields a graceful in-voice fallback message + Mirror links (not a raw error), and retrieval adds < ~200ms (NFR-4).

### Story 4.4: The Guide island — non-modal panel, citations & visible thinking

As a practitioner,
I want a calm, accessible Guide I can talk to without losing my place,
So that I can interrogate the work conversationally and follow the receipts (FR-6, FR-7, UX-DR6/17/18/21).

**Acceptance Criteria:**

**Given** any page
**When** the Guide is closed
**Then** a persistent bottom-right "Ask my Guide" pill (and the hero's quiet inline entry, now wired live to replace the Epic-1 `/faq` fallback) opens the panel via the single `$guideOpen` nanostore; both are real controls.

**Given** the open Guide
**When** it renders
**Then** it is the single elevated surface — a floating, **NON-modal** panel (`role="dialog"` `aria-modal="false"`; focus moves in but is **not trapped**; the page stays interactive, no scrim), with a head (monogram + "Grounded · cites its sources" status + real minimize/close `<button>`s), a `role="log"` `aria-live="polite"` transcript announced **per message**, the labeled Input composer (the Input component is built here), an in-voice greeting ("I'm your guide to Joshua's work. I only say what it can back up."), and the three KB-answerable starter prompts as `<button>` chips.

**Given** a message is sent
**When** the Guide retrieves
**Then** a designed per-message thinking state ("Reading the record" → "Reading: <named sources>") announces once via `role="status"` (never per token, NFR-2), and the answer renders with citation chips; following a citation **routes the page behind** to that Mirror route while the conversation persists (FR-7), and the per-answer assurance lets the citations carry the honesty (no over-asserting footnote).

**Given** non-modal focus management
**When** the visitor minimizes/closes (Esc or button) or follows a citation
**Then** on minimize/close focus **returns to the pill** (thread preserved); after a citation routes the page, focus **stays in the panel**, the navigation is announced via an `aria-live` region ("Opened: …"), and a skip-link can move focus to the routed Mirror `<h1>`
**And** all controls are real `<button>`/`<a>`, keyboard-operable with a visible `:focus-visible` ring, and the island degrades to the static Mirror beneath it if it fails to load (analytics `guide-opened`/`guide-query`/`citation-followed` fire without PII).

## Epic 5: Cinematic Canvas, Director's Mode & Depth Dial

The Stage-1 discrete Scenes become a Continuous Canvas navigated as a directed camera path; the Guide reorders/deepens/skips Scenes by stated intent and the visitor sets depth — all behind the two-layer reduced-motion gate, never burying the organizer (SM-C1). Layers the GSAP/ScrollTrigger cinematic layer (+ ≤1 R3F/WebGL set-piece) onto the Epic-1 scene base and the Epic-4 Guide. *Covers FR-3, FR-4, FR-5, FR-10. Stage 2.*

### Story 5.1: Continuous Canvas with cinematic Scene transitions

As a motion-enabled visitor,
I want the site to move as one continuous cinematic canvas,
So that navigating feels like a directed camera path through scenes, not page loads.

**Acceptance Criteria:**

**Given** motion is enabled
**When** the visitor navigates between Scenes
**Then** a continuous transition (no full page reload) plays via the GSAP 4 + ScrollTrigger cinematic layer (`web/src/lib/cinematic/`), layered over the Stage-1 discrete-scene base.

**Given** the performance budget
**When** the canvas runs
**Then** at most one fixed WebGL canvas is used site-wide (the optional R3F/Three.js set-piece) with compressed assets (KTX2/Basis/Draco) and a static fallback image/video (NFR-1).

**Given** `prefers-reduced-motion` (the two-layer CSS + JS gate)
**When** the page loads
**Then** the directed camera path is **disabled outright** (not merely sped up) and degrades to instant section changes / the Stage-1 discrete Scenes with no loss of content (NFR-2).

**Given** the camera path drives scroll
**When** the sequence plays
**Then** the scene-rail skip + per-scene jump stay visible and keyboard-operable throughout — no scroll-jacking without a visible skip affordance (FR-2).

### Story 5.2: Depth Dial

As a visitor,
I want to set how deep the experience goes,
So that I get a 30-second skim, an overview, or a deep technical/process dive on my terms.

**Acceptance Criteria:**

**Given** the Depth Dial control
**When** the visitor changes it (skim → overview → deep dive)
**Then** the level of detail surfaced for a given Scene changes in place without navigating away.

**Given** the dial state
**When** it is set
**Then** it is reflected by **both** the agent path (the Guide matches the chosen depth) and the static path.

**Given** accessibility
**When** the dial is operated
**Then** it is a real, labeled, keyboard-operable control whose state is carried in text (not color alone).

### Story 5.3: Agent re-curation by stated intent

As a visitor telling the Guide what I'm here for,
I want the site to re-curate around my intent,
So that I'm taken to what matters to me first.

**Acceptance Criteria:**

**Given** two visitors stating different intents
**When** each converses with the Guide
**Then** they receive demonstrably different orderings — an organizer is taken to the Speaker Surface first, a "show me something cool" visitor gets playable projects first, an agentic-curious visitor gets the Agentic Wing / Glass Box first.

**Given** re-curation
**When** it is applied
**Then** it is reflected in-place without losing static reachability — the Lean Static Fallback still reaches all content (FR-8).

**Given** counter-metric SM-C1
**When** re-curation runs
**Then** the organizer fast path is never buried (the hero bypass and the `/speaking` deep link remain reachable without chat).

### Story 5.4: Director's-mode Scene reordering

As a visitor in conversation with the Guide,
I want the Guide to reorder, deepen, or skip Scenes for me,
So that the cinematic journey adapts to my goals while a sensible default always exists.

**Acceptance Criteria:**

**Given** a visitor who states their intent
**When** the Guide drives the canvas
**Then** it reorders/deepens/skips the Scene sequence accordingly, and a visitor who does nothing gets the default cut.

**Given** reordering
**When** it is applied
**Then** it never hides content from the Lean Static Fallback and never regresses SM-C1.

**Given** the cinematic layer
**When** director's mode runs
**Then** it composes with the Continuous Canvas (Story 5.1) and the agent re-curation (Story 5.3), and degrades under reduced-motion to the default discrete-scene arc.

## Epic 6: Zoomable Timeline & Guided Glass Box

The Master Timeline becomes one zoomable gesture (career milestones → a project's Dots) fed by the deterministic git→Dot auto-harvest; the Glass Box gains a narrated guided tour + an explorable map. *Covers FR-15, FR-17. Stage 2. Builds on Epic 2.*

### Story 6.1: Deterministic git→Dot auto-harvest

As Josh, the builder,
I want BMAD Dots harvested deterministically from real git artifacts at build time,
So that the timeline regenerates itself as I add projects — no manual manifest.

**Acceptance Criteria:**

**Given** the repo's `_bmad-output/` artifacts
**When** `scripts/harvest-timeline.ts` runs at build time
**Then** it deterministically harvests BMAD Dots (planning workflows, completed epics, course-corrections, retrospectives) from real artifacts, governed by the same default-deny allowlist, replacing the Stage-1 hand-curated manifest (FR-17, OQ#10 resolution).

**Given** a newly added/imported project
**When** the site rebuilds
**Then** its Dots are regenerated automatically (supports UJ-4) with no hand-editing.

**Given** identical inputs
**When** the harvest runs twice
**Then** the Dot set is byte-stable (deterministic, NFR-6).

### Story 6.2: Zoomable Master Timeline

As a visitor,
I want to zoom one continuous timeline from career milestones into a project's Dots,
So that I can interrogate the work across projects in a single shareable gesture.

**Acceptance Criteria:**

**Given** the timeline
**When** the visitor zooms out vs into a project
**Then** zoomed out, projects read as career milestones; zooming into a project expands its Dots.

**Given** a Dot
**When** it is opened
**Then** it reveals the workflow output, epic scope, why a correction happened, retro conclusions, and skills implemented at that stage.

**Given** the zoomed-out view
**When** it is read
**Then** it reads as a craft-progression narrative (vibe-coding → agentic engineering), and the highlight-reel curation does not sand off the growth arc.

**Given** reduced-motion or JS-off
**When** the timeline loads
**Then** no information is gated behind the zoom gesture (both levels remain reachable) and it degrades to the semantic `<ol>`.

### Story 6.3: Glass Box guided tour

As a practitioner,
I want a narrated, story-driven tour of the Glass Box,
So that I'm walked through how the site went from idea to deployed.

**Acceptance Criteria:**

**Given** `/glass-box`
**When** the visitor starts the guided tour
**Then** it presents a narrated path through selected artifacts in build-story order (the primary Glass Box experience, #6).

**Given** the tour
**When** it runs
**Then** it composes with the artifact reader (Epic 2) and degrades to the static ordered list with JS off.

### Story 6.4: Glass Box explorable map

As a practitioner,
I want a free-browse map of the artifacts,
So that I can explore the build history self-directed.

**Acceptance Criteria:**

**Given** `/glass-box`
**When** the visitor chooses the explorable map
**Then** it allows free browsing of the same artifact set the guided tour covers (the secondary path, #6).

**Given** the map
**When** it is used
**Then** every node links to its artifact reader and remains crawlable / JS-off reachable.

## Epic 7: Wings, Playables & Video-Synced Repo

The three distinct Wings become the full default structure with greatest-hits relevance ordering, playable in-browser project embeds, and the video-synced live repo. *Covers FR-24, FR-25, FR-26, FR-27. Stage 2.*

### Story 7.1: Distinct Wings (Technical / Creative / Agentic)

As a visitor,
I want three clear Wings I can navigate myself,
So that I can explore Josh's work by domain without needing the agent.

**Acceptance Criteria:**

**Given** the default structure
**When** a visitor browses
**Then** the Technical, Creative, and Agentic Wings are each independently reachable and browsable without the agent.

**Given** the Guide
**When** asked
**Then** it can blend across Wings on demand (composing with Epic-5 re-curation) without removing the self-navigable default.

**Given** the Static Mirror
**When** a Wing renders
**Then** each Wing and its items are crawlable HTML (NFR-3).

### Story 7.2: Greatest-hits, relevance-ordered

As a visitor,
I want work surfaced as a curated greatest-hits by relevance,
So that I see what matters to me, not a chronological résumé.

**Acceptance Criteria:**

**Given** a stated interest (via the Guide)
**When** work is surfaced
**Then** ordering responds to that interest; with no stated interest, a curated default order is used.

**Given** the site
**When** inspected
**Then** there is no static reverse-chronological CV as the primary surface (#25).

### Story 7.3: Playable project embeds

As a visitor,
I want to play web projects live in the browser,
So that I experience the work instead of viewing screenshots.

**Acceptance Criteria:**

**Given** the Stage-2 playable set (`vector-wars` = Three.js/Vite, `voyager` = web sim, `christmas-elves` = Phaser)
**When** a project showcase renders
**Then** each embed plays live in the browser.

**Given** the performance budget
**When** a playable loads
**Then** it lazy-loads (`client:visible`/`client:idle`, NFR-1) behind a static poster/fallback.

### Story 7.4: Video-Synced Repo

As a visitor watching a talk/demo,
I want the repo to follow the exact code being discussed,
So that watching and reading the code become one synchronized experience.

**Acceptance Criteria:**

**Given** a talk/demo video
**When** it plays
**Then** time-coded markers move the repo view in lockstep with playback, highlighting/jumping to the exact code being discussed.

**Given** motion/JS off
**When** the surface loads
**Then** the video and a static repo link remain available (graceful fallback).

## Epic 8: Creative Lab & Adaptive Soundtrack

The tonal-shift Creative Lab movement and the original Suno adaptive soundtrack (off by default, auto-ducking under video; the Suno commercial-regeneration prerequisite cleared before launch). *Covers FR-29, FR-30. Stage 2.*

### Story 8.1: Creative Lab movement

As a content wanderer (or a curious practitioner),
I want a tonal-shift creative scene,
So that Josh's Suno, generative art, and playable work take center stage.

**Acceptance Criteria:**

**Given** the Scene Arc
**When** the visitor reaches the Creative Lab
**Then** it is a tonal-shift Scene where Suno / generative art / playable work take center stage (#42).

**Given** a visitor the Guide reads as engineering-only
**When** the arc runs
**Then** the Creative Lab is skippable and never blocks the path to the Speaker Surface or Glass Box.

### Story 8.2: Adaptive Soundtrack

As a visitor,
I want original Suno instrumentals to score the site,
So that the portfolio sounds like Josh — without ever hijacking my audio.

**Acceptance Criteria:**

**Given** audio
**When** the site loads
**Then** it is off by default and user-controllable, and never autoplays with sound against browser/user preferences.

**Given** a Scene change
**When** the agent-curated ideal is available
**Then** the soundtrack adapts by Scene; otherwise a fixed Scene→track mapping is the graceful fallback.

**Given** a YouTube video plays
**When** audio is on
**Then** the soundtrack ducks/quiets.

**Given** licensing
**When** tracks are featured
**Then** they are commercially licensed — the Suno paid-plan regeneration prerequisite is cleared before launch (PRD §10 / AR-16).

## Epic 9: The Demonstrator & Speaker EPK

The curated, pre-recorded Demonstrator + BMAD Build Walkthrough (no live execution) and the downloadable speaker one-sheet/EPK PDF. *Covers FR-11, FR-21. Stage 2.*

### Story 9.1: The Demonstrator

As a practitioner,
I want to trigger a curated demonstration of real agentic work,
So that I see the skill performed, not just described.

**Acceptance Criteria:**

**Given** the Demonstrator
**When** it is triggered
**Then** it plays a curated, pre-recorded/replayable demonstration served as pre-approved static assets.

**Given** safety
**When** it runs
**Then** no live arbitrary execution engine is exposed to visitors and nothing Josh has not approved is shown (Guardrail §9.1, #35).

### Story 9.2: BMAD Build Walkthrough

As a practitioner,
I want a step-by-step walkthrough of the BMAD Method,
So that I learn Josh's approach while watching it demonstrated.

**Acceptance Criteria:**

**Given** the walkthrough
**When** a visitor follows it
**Then** the agent walks through something being built, teaching the BMAD Method step by step (#9).

**Given** the curation
**When** it runs
**Then** it is pre-approved/curated (consistent with Story 9.1), never live arbitrary execution.

### Story 9.3: Speaker one-sheet / EPK

As a conference organizer,
I want a downloadable speaker one-sheet,
So that I can circulate Josh's talks and bio internally.

**Acceptance Criteria:**

**Given** the Speaker Surface
**When** the visitor downloads the EPK
**Then** the link serves a current 1–2 page PDF reflecting the signature talks and bios.

**Given** updates to talks/bios
**When** the content changes
**Then** the EPK reflects the current content.

## Epic 10: Full Richness

In-chat speaking-inquiry capture & booking via the Guide (feeding the same store as Invite-Me), site-wide semantic zoom, and the remaining-content import. *Covers FR-12, FR-18, FR-28. Stage 3.*

### Story 10.1: In-chat speaking-inquiry capture & booking

As a conference organizer talking to the Guide,
I want to complete a speaking inquiry right in the conversation,
So that I can invite Josh without leaving the chat.

**Acceptance Criteria:**

**Given** the Guide
**When** a visitor completes a speaking inquiry in conversation (optionally proposing times)
**Then** it is persisted to the same Postgres `inquiries` store with `source='agent'` and emailed to Josh as an Invite-Me submission (FR-31).

**Given** the agent
**When** capturing an inquiry
**Then** it never promises a commitment on Josh's behalf beyond a stated response expectation.

### Story 10.2: Site-wide semantic zoom

As a visitor,
I want consistent semantic zoom across the whole site,
So that every Scene presents content at a coherent level of detail.

**Acceptance Criteria:**

**Given** any zoom level
**When** the site renders
**Then** all Scenes present content at a consistent granularity (none stuck at full detail while others summarize).

**Given** the behavior is UX-deferred
**When** this story is scheduled
**Then** the concrete interaction is defined in `bmad-ux` first. `[OPEN: behavior deferred pending UX]`

### Story 10.3: Remaining content import

As Josh, the builder,
I want all remaining projects, talks, and songs imported,
So that the site is the complete, current record of my work.

**Acceptance Criteria:**

**Given** the remaining content
**When** it is imported via Project Import
**Then** each item is wired into the Master Timeline, its Wing, and the KB.

**Given** import + build
**When** complete
**Then** each imported item appears on the Master Timeline, in its Wing, and is answerable by the agent.
