# Validation Report — portfolio

- **DESIGN.md:** `…/ux-portfolio-2026-06-03/DESIGN.md`
- **EXPERIENCE.md:** `…/ux-portfolio-2026-06-03/EXPERIENCE.md`
- **Run at:** 2026-06-04 · Full review (5 lenses)

## Overall verdict

The spine pair is a **mechanically strong, well-disciplined contract** — the rubric walker found zero critical coverage gaps (58 token refs resolve, all 18 components doubly-specified, every Stage-1 FR/UJ traced), and voice/terminology is **clean** (no superseded-string leaks into the contract; no hype; no exclamation marks). The work that remains is **not structural — it's three sharp gaps the mechanical pass can't see:** (1) **SEO/GEO is thin** — the discoverability floor (the whole point of the speaking goal) is *asserted in prose, not engineered*: a promised FAQPage/Person schema with no crawlable home, and no canonical/sitemap/robots strategy. (2) **Accessibility has real holes** on otherwise-strong thinking — the primary-conversion form is unspecified, two state-bearing inks fail AA, and the non-modal Guide's focus-return is silent. (3) The **skeptical-peer lens** surfaced the launch's biggest soft risk: the recursion — the one share-trigger — currently fires on *planning paperwork* while ghosting the *shipping engineering* the peer audience actually respects, on top of a placeholder-heavy Speaker Surface.

None of these break the contract; all are resolvable by patching the spines (plus a couple of genuine judgment calls).

## Category verdicts (rubric walker)

- Flow coverage — **strong**
- Token completeness — **strong**
- Component coverage — **strong**
- State coverage — **strong** (mechanical) — but see Invite-Me states (a11y critical)
- Visual reference coverage — **adequate**
- Bloat & overspecification — **adequate**
- Inheritance discipline — **strong**
- Shape fit — **strong**

**Extra-lens ratings:** Accessibility — *adequate (sharp gaps)* · SEO/GEO — *thin* · Skeptical-peer credibility — *adequate* · Voice & consistency — *strong*.

## Findings by severity

### Critical (3)

**[SEO]** FAQPage schema promised, no crawlable Q&A surface (§IA / Guide) — the Guide's Q&A is JS-gated chat with no URL, so an LLM asked "who is Joshua R. Brandt / can he speak on X" has no HTML to cite.
*Fix:* add `/faq` (or a server-rendered FAQ block) seeded from the Guide's starter prompts; carries FAQPage.

**[SEO]** Canonicalization unaddressed (§IA two-layer) — the model deliberately duplicates content (arc teaser vs Mirror route); risks the cinematic `/` being indexed/cited over the clean route.
*Fix:* self-canonical Mirror routes; home teasers summarize-and-link, not copy.

**[Accessibility]** Invite-Me form has zero accessible spec (§State Patterns; UJ-2 climax, FR-31) — the terminal step of the primary conversion has no `<form>`/`<label>`/`<input>`, no validation, error, or success-announcement contract.
*Fix:* spec accessible form markup, inline validation, error states, an `aria-live` success confirmation, and an offline/failure path.

### High (10)

**[SEO]** `Person`/`ProfilePage` has no home — assigned to "home/about" but there's no `/about` route and the bio only lives on `/speaking`. *Fix:* add `/about` (or server-render the bio on `/`) hosting Person/ProfilePage + `sameAs` channel links.
**[SEO]** Answer-first / brand-in-answer not operationalized. *Fix:* require an answer-first intro and "Joshua R. Brandt, MSE" in the opening sentence of each Mirror page.
**[SEO]** No sitemap / robots / AI-crawler allow-list. *Fix:* add `sitemap.xml` + `robots.txt` explicitly allowing ClaudeBot, GPTBot/OAI-SearchBot, PerplexityBot, Google-Extended, etc.
**[SEO]** Reel `VideoObject` can't satisfy initial-HTML (no `/speaking/reel`, `[OPEN]` fields). *Fix:* server-render reel metadata at a stable route.
**[Accessibility]** Muted inks fail AA for meaningful text — ghost/"still to come" `#9A8E79` (2.84:1) and metric-source `#8A8273` (3.36:1). *Fix:* darken to ≥4.5:1; add AA-safe muted/ghost tokens to DESIGN.md.
**[Accessibility]** Non-modal Guide focus-return unspecified — on minimize (risks orphaning focus on a hidden panel) and after a citation routes the page behind. *Fix:* return focus to the pill on minimize; announce the route via `aria-live`.
**[Accessibility]** Reduced-motion gate not pinned per animated surface (scene-rail meter, thinking sweep, S2 camera path, timeline). *Fix:* enumerate the gate per surface.
**[Accessibility]** S2 directed-camera-path scroll-jacking not tied to the visible-skip requirement (FR-2). *Fix:* bind the S2 camera path to the scene-rail skip affordance.
**[Peer credibility]** The recursion fires on planning docs, ghosts the engineering — the 5 real Glass Box nodes are brief/brainstorm/research/PRD/UX; architecture, epics & stories, retros are the *ghosted* nodes, so "hard to fake" shows no shipping code to the peer audience. *Fix:* judgment call (see triage).
**[Peer credibility]** Speaker Surface is almost all placeholder on the primary conversion surface (SM-1) — reel, metrics, testimonials, logos, talk titles, response-time all `[OPEN]`. *Fix:* prioritize real content for launch (content-blocker, not a design fix).

### Medium (6)

**[Peer credibility]** No *delivered* Stage-1 wow beat — every spectacle (canvas, zoom, soundtrack, playables, Demonstrator) is Stage 2; calm risks reading as generic to a peer. *Fix:* ensure the Glass Box recursion + the Guide's thinking actually land as the S1 wow (ties to the recursion call).
**[Accessibility / Rubric]** Scene-rail contradiction — promises "jump-to-scene" but ships only skip-to-end + jump-to-talk; the 7 ticks are non-interactive text. *Fix:* make the ticks clickable jump targets (matches FR-2), or correct the copy.
**[Rubric]** UJ-3 (Sam, wanderer) climax relies on creative content placed in Stage 2; Stage 1 ships no creative surface, so the payoff has no S1 home. *Fix:* a minimal S1 creative touch, or explicitly scope UJ-3's payoff to S2.
**[Rubric]** Visual-reference coverage — six mocks cited only at one global IA line, none at the section each illustrates. *Fix:* inline links at Speaker/Timeline/Glass Box/etc. (do at promotion).
**[Peer credibility]** "building at the **frontier**" brushes the edge/hype vocabulary the project rejected with "singularity"; per-answer "zero ungrounded claims" footnotes over-assert and risk "trust me" from the other side. *Fix:* judgment call on the line; soften the assurance microcopy and let citations speak.
**[Voice]** Guide grounded-assurance microcopy diverges + uncited across spines (DESIGN "Grounded · cites its sources" vs EXPERIENCE "zero ungrounded claims"). *Fix:* declare them distinct elements and cross-reference, or unify.

### Low (4 + rubric tail)

**[Voice]** Thinking-state line differs across spines (generic label vs populated instance) — note the relationship.
**[Voice]** Bio-end lowercase "seasoned, building at the frontier." vs Title-case hero — note it's deliberate (mid-sentence).
**[Rubric]** `sources:` frontmatter unquoted `{template}` paths fail strict YAML parse — matches the example-spine convention (toolchain resolves pre-parse); quote for portability.
**[Rubric]** ~13 further low items in `review-rubric.md` (minor overspecification / tidy-ups).

## Reviewer files

- `review-rubric.md`
- `review-accessibility.md`
- `review-seo-geo.md`
- `review-peer-credibility.md`
- `review-voice.md`
