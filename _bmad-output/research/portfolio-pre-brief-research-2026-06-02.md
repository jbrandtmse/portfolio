---
title: Pre-Brief Research Findings — Portfolio Site
date: 2026-06-02
status: complete
feeds: bmad-product-brief
related: brainstorming-session-2026-06-02-1723.md
---

# Pre-Brief Research Findings — joshuabrandt.abacusai.cloud

Targeted research run before the Product Brief, covering the brief-critical and architecture topics surfaced in the brainstorm. Sources via Perplexity (web-grounded). VM facts verified directly against this VM's metadata.

## ⚠️ Action Items / Blockers (surface in the brief)

1. **Suno — regenerate tracks after upgrading.** Commercial rights attach to the subscription tier **at the moment a song is generated**. Upgrading to Pro/Premier does **not** retroactively grant commercial rights to tracks made on the free tier. → To use existing songs commercially on the site, **re-generate them while subscribed**. Free-tier tracks cannot be used commercially / publicly-as-commercial. Suno takes 0% revenue share on paid-plan commercial use. (Note: fully AI-generated audio may have limited U.S. statutory copyright; "ownership" = the contractual license Suno grants.)
2. **`public_url_enabled` is currently `False`** on this VM. Public traffic will NOT route until Josh enables public URL access in the Abacus Cloud Services UI. **Must be enabled before deploy.**
3. **`github_connected` is `False`.** The Abacus GitHub auto-token won't work, but this is **not a blocker** — our architecture (#37) does **no live GitHub reads**. For git push/pull use `gh auth login` or a PAT. (Connecting it later is optional.)

## ✅ VM Facts Verified

- **Hostname `joshuabrandt.abacusai.cloud` exists** and routes to this VM (ingress port 80). Other hostnames present: `c12fefd97...`, `remus...`.
- **LLM endpoint is live with 137 models**, including `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.x`, `gemini-3.x`, plus image/audio/video models (flux, gpt_image, elevenlabs, veo, etc.). → The **grounded advocate agent** (#36) has a strong, local, no-external-key brain. Image/audio models could even assist content generation.
- **Postgres database attached** (pgvector is an option if vectors are ever needed). **S3 storage** path not currently populated.

## Topic 1 — Suno / AI-Content Licensing
See Action Item #1. Bottom line: secure a paid plan, **regenerate** the showcase tracks, then they're cleared for the Adaptive Soundtrack (#29) and Creative Lab (#42). Apply the same "made while subscribed" check to any other paid AI tools used for featured content.

## Topic 2 — Competitive / Inspiration Scan
**The brainstorm vision is strongly validated by 2026 best-practice.** The clearest reference is Codrops' *"More Than a Portfolio: Building a Scroll-Driven 3D World"* (Apr 2026) — nearly our exact concept: one continuous "camera take," each section a **scene**, scroll mapped to camera path, project transitions instead of page loads, and **audio that muffles via low-pass filter when entering a sub-scene** (validates our auto-ducking soundtrack #29).

Principles to adopt:
- **"Trailer for my career," not "resume with sections."** Tight narrative; **4–6 scenes max**; 3–6 deep case studies over many shallow ones. (Matches our trimmed Stage-1 arc.)
- **WebGL in focused doses** — one hero "wow" moment, not constant spectacle; everything else lighter.
- **Editorial typography + restraint** (1 display + 1–2 text styles); massive type for hero statements.
- **Agent-as-guide is a recognized 2026 trend** ("Machine Experience," designing for intent, progressive disclosure, even voice nav). Our agent-orchestrated approach (#22) is on-trend, not fringe.
- **AI personalization / "what are you here for?"** early prompt → reorder content. Validates Depth Dial (#23) + Agent-Adaptive (#20).

**Clichés to avoid:** hacker/Matrix terminal aesthetic; literal AI metaphors (floating brains, generic robots, neural-net stock art); "stereotypography" gimmick fonts; neon-gradient overload without hierarchy; aggressive scroll-jacking with no skip/progress affordance; "look at my effects" with no message; unrefined "AI-slop" visuals (human curation is now the differentiator — show it).

## Topic 3 — Speaker Invites / Reputation / Audience (the #1 goal)
What program committees actually weigh: **clear fit + specific, outcome-oriented titles** ("From 1 to 50 Teams: Evolving Architecture Without a Rewrite" beats "Modern Architecture"); **educational value & originality** (war stories, real numbers); **proof you can deliver** (talk videos, ratings, reel); **credibility framed specifically** (not "30 years" alone, but "led X used by Y"); **audience draw** (subs/views/list size + willingness to promote); **reliability/low-hassle**; **diverse perspective** (the veteran-IC vantage is itself a pitchable angle).

High-converting **speaker surface** should contain: headshot + one-line positioning + **"Invite me to speak" CTA** above the fold; copy-paste bios (50 / 100-150 words); **3–5 signature talks** (benefit-led title, audience level, 150-200w abstract, 3-5 takeaways, formats/durations); a **60–120s speaker reel** + 2-3 full talks; **social proof** (conference/company logos, organizer + attendee testimonials, ratings); **audience metrics**; logistics (travel, formats, tech); **frictionless booking** (short form or Calendly, stated response time). Plus a 1-2 page **EPK/one-sheet PDF**.

Reputation→invites tactics: pick a **narrow lane** + a "talk stack"; publish **talk-shaped content** (15-30 min YouTube mini-talks, case-study posts structured like talks); run a **systematic CFP campaign** (tracked spreadsheet, tailored abstracts); build **organizer relationships**; start at **meetups/internal talks** and record everything; **turn each talk into more talks** (collect ratings → testimonials → companion content → update reel). Use the 30-year arc as a differentiator: *"Patterns That Survive Hype Cycles: from CORBA to Kubernetes."*

→ Validates promoting **Speaking to a first-class early-arc scene (#46)** and the **Close as conversion (#45)**.

## Topic 4 — Frontend Stack (architecture-phase, but de-risked)
**Recommended pragmatic stack** (balances cinematic polish + maintainability + accessibility for a solo maintainer):
- **Astro (SSG)** as the site framework — 0 JS by default, content-first, fast; **SSG is also the SEO answer**. Hydrate **React islands** only where needed (the hero experience + the chat widget). (Next.js acceptable if Josh prefers one React universe, but watch bundle size.)
- **Baseline motion = pure CSS scroll-driven animations** (`animation-timeline`/`view-timeline`) for ~80% of reveals/parallax — cheap, accessible, progressively enhanced.
- **Cinematic layer = GSAP + ScrollTrigger** on the hero route (industry standard; strong long-term support); orchestrates scene timelines and, if used, the camera.
- **One hero WebGL moment via Three.js / React Three Fiber** — *optional*, justified only for the timeline/3D set-piece; compressed textures (KTX2/Basis/Draco), dynamic culling, **static fallback image/video**. (Josh's `vector-wars`/`voyager` WebGL skill makes this feasible — but keep it to one set-piece.)
- **Smooth scroll (Lenis): avoid or make opt-in**, disabled under `prefers-reduced-motion`; prefer native scroll given the accessibility priority.
- **Theatre.js / Framer Motion:** likely unnecessary extra layers for a solo site; GSAP covers it.
- **Performance budget:** FCP < ~2s mid-range mobile; main-page JS < ~200-250KB gz; single fixed WebGL canvas; lazy-load the heavy stack via Astro `client:visible`/`client:idle`.

## Topic 5 — SEO & Accessibility for an Agent-First Canvas Site
**Non-negotiable rule: "If it matters for SEO/AI, it must be in the initial HTML."** Conference organizers will Google Josh, so this directly protects the #1 goal.
- **SSG-prerender** all key routes (home, about, each talk, each project, speaking, contact). Don't rely on JS or the chat to reveal indexable content.
- **Mirror the agent's knowledge in crawlable static HTML** — the chat *summarizes/filters/routes*, but raw facts (bio, talk titles+abstracts, project descriptions, FAQ) must exist as real headings/paragraphs/links. The agent should embed links to those static pages (agent = router, not silo). Validate with `view-source:` + Ctrl-F without JS.
- **JSON-LD structured data** (server-rendered): `Person` + `ProfilePage` on home/about; `Event` for talks; `VideoObject` for recordings; `CreativeWork` for projects; `FAQPage` for Q&A. Validate via Rich Results Test.
- **Accessible chat UX:** `role="dialog"` + `role="log"` + `aria-live="polite"` (batch streaming updates per-message, not per-token); proper focus management on open/close/response; real `<button>`s; keyboard operable; treat WebGL canvas as `aria-hidden` decorative with DOM equivalents.
- **`prefers-reduced-motion` gate at two layers** (CSS media query + JS: don't init GSAP/ScrollTrigger/WebGL; show static hero).
- **AI/LLM discoverability (GEO):** answer-first intros, clear heading hierarchy, Q&A blocks, plain-text key facts (numbers/dates), accurate schema, don't block AI crawlers, ensure brand/name appears in short answers.

## Topic 6 — Grounded RAG Advocate Agent
**Simplest maintainable design that satisfies "nothing unapproved":**
- **Source of truth = curated markdown in this git repo.** Build-time indexer parses MD → chunks at heading boundaries (300-800 tokens) → writes index artifacts.
- **For our small corpus (dozens-hundreds of docs), start WITHOUT embeddings** — keyword/BM25 over titles+headings+body + heading boost is usually enough; latency is dominated by the LLM call anyway. **Add vectors only if logged retrieval misses justify it** (then `sqlite-vec` or LanceDB on the VM, or pgvector since Postgres is attached).
- **Guardrails (anti-hallucination):** retrieve only from the index; **score threshold → canned "not covered" answer** (skip the model call entirely on empty context); **citation-required** system prompt ("cite the doc/section, or say you don't know"); strict context separation to resist prompt injection; never use outside knowledge.
- **Fixed "confident advocate" persona** baked into the server-side system prompt (never exposed): expert + advocate tone, confident where documented, plainly states when something isn't documented, concise/bulleted, no speculation. (Implements #27/#36.)
- **Fast & cheap:** embeddings (if any) at build time only; use a mid-tier model (e.g., gpt-5-mini / haiku-class — and we have Claude Haiku/Sonnet locally); top-k 3-6 chunks; stream responses for perceived speed. Single small backend behind nginx (reverse-proxy pattern), one LLM endpoint.

## Net Implications for the Brief
- The vision is **validated and feasible** on this VM; nothing requires external services.
- **Stack direction:** Astro SSG + CSS-scroll baseline + GSAP hero (+ optional one R3F set-piece) + grounded BM25-first RAG agent on a small backend, all static-built from one curated git repo.
- **Two prerequisites** to schedule: enable `public_url_enabled`; upgrade Suno + regenerate showcase tracks.
- **SEO/static-mirror is a first-class requirement**, not a nice-to-have, because it underwrites the speaking/reputation goal.
