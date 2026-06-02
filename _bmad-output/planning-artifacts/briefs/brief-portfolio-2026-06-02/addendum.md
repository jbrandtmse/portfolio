# Addendum — Josh Brandt Portfolio Brief

Downstream depth that supports the brief but doesn't belong in its 1–2 pages. Feeds the PRD, UX, and Architecture phases.

## Canonical Companion Documents
- **Brainstorm** — full 47-idea inventory, themes, rejected alternatives, and design rationale: `_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md`
- **Pre-brief research** — competitive/inspiration scan, speaker-conversion playbook, frontend-stack comparison, SEO/accessibility, grounded-RAG design, and VM verification: `_bmad-output/research/portfolio-pre-brief-research-2026-06-02.md`

## Parked Roadmap — Stage 2/3 detail (beyond the brief's Scope summary)
**Stage 2 — The Magic:** cinematic continuous canvas + scene transitions; zoomable BMAD master timeline (semantic zoom: career arc → per-project dots for workflows/epics/course-corrections/retros); adaptive Suno soundtrack (agent-curated ideal, fixed-mapping fallback); agent-adaptive reordering + depth dial; playable project embeds (vector-wars, voyager, christmas-elves); video-synced live repo; the Creative Lab tonal movement.

**Stage 3 — Full Richness:** site-wide semantic zoom; agent capturing/booking speaking inquiries; remaining content fully imported; podcast synergy if/when it launches.

## Architecture-Phase Inputs (from research)
- **Frontend stack (recommended):** Astro (SSG) + React islands for the hero experience and chat widget. Baseline motion via pure CSS scroll-driven animations; cinematic layer via GSAP + ScrollTrigger; at most one hero WebGL set-piece via Three.js/React-Three-Fiber with a static fallback. Avoid Lenis/smooth-scroll (or gate behind reduced-motion). Perf budget: FCP < ~2s mobile, main-page JS < ~200–250KB gz.
- **Grounded RAG agent:** build-time index of curated markdown; start with keyword/BM25 (corpus is small) and add embeddings only if retrieval misses justify it (sqlite-vec / LanceDB / pgvector — Postgres is attached). Guardrails: retrieve-only, score-threshold → canned "not covered," citation-required system prompt, strict context separation vs prompt injection. Fixed confident-advocate persona, server-side. Mid-tier model + streaming for speed.
- **SEO / accessibility (first-class):** SSG-prerender all key routes; mirror all agent-revealed facts in crawlable static HTML (agent = router, not silo); JSON-LD (Person, ProfilePage, Event, VideoObject, CreativeWork, FAQPage); accessible chat (role=dialog/log, aria-live polite, focus management, real buttons); two-layer prefers-reduced-motion gate; canvas treated as decorative with DOM equivalents; GEO basics (answer-first, clear headings, plain-text facts).
- **VM facts:** `joshuabrandt.abacusai.cloud` hostname exists (ingress port 80); 137 LLM models incl. claude-opus-4-8; Postgres attached; S3 path unset; `public_url_enabled` currently OFF; `github_connected` OFF (fine — no live reads).

## Key Calibrated / Rejected Alternatives (rationale preserved)
- **Project structure:** distinct wings (Technical/Creative/Agentic) as the *default*, with the agent blending on demand — chosen over a single filterable gallery or a hard blend.
- **Timeline placement:** flagship section one click in, *not* the literal homepage — preserves a fast on-ramp for the skeptical organizer.
- **Live agentic execution:** rejected in favor of pre-recorded/curated demos — nothing unapproved is ever shown publicly.
- **Personal narrative:** highlight-reel of successes, *not* warts-and-all — while keeping process transparency (Glass Box) honest. Two distinct kinds of openness.
- **Maintenance model:** code-as-CMS extended via `/bmad-correct-course` (new content = a BMAD epic/stories) — chosen over a CMS or live GitHub harvesting.
- **Recurring design pattern:** "agentic ideal, graceful fallback" — ship the smart version where feasible, degrade cleanly where not.
