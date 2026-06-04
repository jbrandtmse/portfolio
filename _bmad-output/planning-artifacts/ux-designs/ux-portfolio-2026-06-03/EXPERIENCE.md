---
name: Joshua R. Brandt — Portfolio
status: final
sources:
  - {planning_artifacts}/prds/prd-portfolio-2026-06-02/prd.md
  - {planning_artifacts}/briefs/brief-portfolio-2026-06-02/brief.md
  - {output_folder}/brainstorming/brainstorming-session-2026-06-02-1723.md
  - {output_folder}/research/portfolio-pre-brief-research-2026-06-02.md
updated: 2026-06-04
---

# Joshua R. Brandt — Portfolio · Experience Spine

> Owns *how it works*: information architecture, behavior, states, interactions, accessibility, journeys. References `DESIGN.md` tokens by name via `{path.to.token}`. Source specs are cited verbatim (FR-#, UJ-#, SM-#, NFR-#). Distilled at Finalize from the decision log + approved mocks. **This spine wins on conflict with any mock, wireframe, or import.** Undecided items are flagged `[OPEN: …]`; named protagonists are `[ASSUMPTION]`.
>
> Provenance note: the promoted mocks were **not** re-rendered after the renames, so some carry stale strings — most notably `mockups/guide.html` still labels the agent "Advocate" (and the retired exploration artifacts `wireframe-home-arc.html`, `mock-hero-types.html` carry "Josh Brandt" / "Seasoned, Not Stuck" / "BMAD"). The canonical strings — the **Guide**, **Joshua R. Brandt, MSE**, **"Seasoned, building at the frontier"**, **the BMAD Method** — live here and govern.

## Foundation

A **website** at `joshuabrandt.abacusai.cloud` — a personal portfolio that *demonstrates* rather than *describes*, built as a public BMAD Method project so the site is its own Exhibit A ("the medium is the message"). It is not an app; there is no native or PWA target.

- **Mobile + desktop are both first-class.** The practitioner path (UJ-1, desktop) wants depth and immersion; the conversion path (UJ-2, mobile) and the wander path (UJ-3, mobile) must be fully credible on a phone. Neither viewport is a degraded afterthought.
- **No named UI system.** The interface is **custom, built on the locked identity** (see `DESIGN.md` → Brand & Style: warm cream + Prussian navy `{colors.accent}`, all Source Serif 4, hairline rules, faint drafting grid, flat-except-one-shadow). There is no shadcn/Material/etc. to inherit from; component behavior is authored here, visual specs in `DESIGN.md`.
- **JS-off, `prefers-reduced-motion`, and crawlable are first-class, not fallbacks bolted on.** Every rich/agentic/cinematic path has a Lean Static Fallback so "nothing is ever hidden behind the magic" (FR-8). The site commits to **one base mode** (the warm light Gallery); there is no light/dark *toggle* in v1 (out of scope per PRD).
- **`DESIGN.md` is the visual reference.** This spine cross-references its tokens by semantic name and never re-specifies color, type ramp, spacing, or elevation.

---

## Information Architecture

### The two-layer model

The site reconciles a cinematic narrative with a crawlable, agent-routable substrate by running **two layers over the same content**:

1. **Narrative layer — the home Scene Arc at `/`.** A single scrolled page of discrete, ordered **Scenes**. Calm hero first; "the wow builds, restraint is the flex." Teaser Scenes for the rich surfaces; full content lives one click in at the Mirror route.
2. **Mirror layer — the Static Mirror routes.** Every rich surface *also* lives at a real, crawlable URL. The Mirror is simultaneously: the SEO/GEO substance (FR-35, NFR-3), the Guide's routing target (FR-7), and the JS-off / screen-reader fallback (FR-8, NFR-3). "Nothing hidden behind the magic." Three of these Mirror routes exist primarily to give crawlers/answer-engines real HTML to cite: **`/about`** (the canonical home for **Person + ProfilePage** JSON-LD: bio + `sameAs` channel links), **`/faq`** (a crawlable, server-rendered Q&A carrying **FAQPage** JSON-LD; the Guide's answers mirror to here), and **`/speaking/reel`** (a server-rendered route hosting the reel's metadata so **VideoObject** is satisfiable in the initial HTML).

**Canonicalization (IA rule).** Every Mirror route is **self-canonical** (`<link rel="canonical">` to itself) — it is the indexable surface for its content. The home Scene-Arc teasers **summarize-and-link** to their Mirror route: a 1–2 sentence hook + a link, deliberately distinct from and shorter than the Mirror's full body. Teasers do **not** duplicate the Mirror's body text (no full abstracts, no full case-study prose on `/`), so the two layers never become near-duplicates competing for the same passage; the clean Mirror route always wins the citation (resolves the duplicate-content risk the two-layer model would otherwise manufacture). Each Mirror page also opens **answer-first** (see *Voice and Tone → answer-first lede*).

**Answer-first lede (every Mirror page).** Each Mirror route opens with a plain-text, self-contained intro paragraph that answers the surface's core question and names the entity — **"Joshua R. Brandt, MSE" appears in the first sentence** — so an LLM/answer-engine has a verbatim, citable passage. (Strings → *Voice and Tone*.)

The **Guide** (the agent) is a **site-wide overlay with no URL of its own**; it routes visitors *into* the Mirror routes, with citations. It is a **progressive enhancement over the crawlable `/faq`**, not the sole home of any Q&A (FR-7 — agent = router, not the sole source of a fact).

### Stage-1 surface → route map (confirmed)

| Surface | Route(s) | On the home arc |
|---|---|---|
| Hero | `/` (top) | Scene 1 |
| Thesis | `/` | Scene 2 |
| Master Timeline | `/timeline` | Scene 3 (teaser strip) |
| Speaker Surface | `/speaking` | Scene 4 (organizer deep-link target) |
| Flagship case study | `/work/loandemo` | Scene 5 (teaser) |
| Glass Box | `/glass-box` + `/glass-box/{artifact}` | Scene 6 (teaser) |
| Close / Invite-Me | `/` (bottom) + `/invite` | Scene 7 (final) |
| About / bio | `/about` | (linked from footer + hero); canonical **Person + ProfilePage** home — long bio, headshot, `sameAs` channel links (YouTube/GitHub/Suno). Bio no longer lives only on `/speaking`. |
| FAQ / Q&A | `/faq` | (linked from footer); crawlable **FAQPage** — server-rendered `<h3>` Q + `<p>` A pairs, seeded from the Guide's starter prompts + common organizer/peer questions; the Guide mirrors its answers here. |
| Speaker reel | `/speaking/reel` | (sub-route of Scene 4); server-rendered reel metadata so **VideoObject** is satisfiable in initial HTML; also the Reel poster's link-out fallback. |
| The Guide | site-wide overlay (no URL) | persistent |
| Static fallback | footer nav + `/browse` | persistent |

Wings · Creative Lab · playables · zoomable timeline are **Stage 2**, layering into this same two-layer structure (see *Stage sequencing*).

### Scene order (Stage 1, locked)

**Hero → Thesis → Master Timeline → Speaker → Flagship (loandemo) → Glass Box → Close.**

This is the PRD's Stage-1 trimmed arc. The Speaker surface sits early–mid **by design** (the reel is the credibility engine; guarded by counter-metric **SM-C1**). The full-vision arc (adding Wings + Creative Lab) is Stage 2+; the agent's director's-mode re-ordering (FR-4) layers on top in Stage 2 and a sensible default cut always exists.

### The hero fork (first IA decision — serves the two primary audiences)

The hero offers **two ways in** plus a quiet third:
- **"Explore"** → enter the Scene Arc (Devon / peer — depth, the whoa).
- **"I'm here to book a talk"** → jump straight to `/speaking`, **bypassing the Guide and the cinematic layer** (Mara / organizer; protects **SM-C1** — never bury the organizer).
- **"Or ask my Guide about the work"** → a quiet, understated in-hero entry to the Guide overlay, distinct from the two fork buttons.

### The static fallback

A `/browse` index plus a **static fallback footer** present on every page, linking to every Mirror route (`/`, `/about`, `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, `/invite`, `/browse`). It is the JS-off / screen-reader fallback and reaches **100% of agent-reachable content** (FR-8). On mobile the scene-rail collapses but the footer is unchanged.

→ Composition references (promoted mocks): the hero + fork in [`mockups/hero.html`](mockups/hero.html); the Master Timeline arc in [`mockups/master-timeline.html`](mockups/master-timeline.html); the Speaker Surface in [`mockups/speaker-surface.html`](mockups/speaker-surface.html); the Glass Box index in [`mockups/glass-box.html`](mockups/glass-box.html) (spine adds the shipping node; mock predates it); the Guide states + floating behavior in [`mockups/guide.html`](mockups/guide.html) (mock still labels the agent "Advocate"). **Spine wins on conflict** and supersedes any stale strings in the mocks.

---

## Voice and Tone

Microcopy and named strings. Brand voice and aesthetic posture live in `DESIGN.md` → Brand & Style.

### Microcopy rules

| Do | Don't |
|---|---|
| Confident, cited, plain. State the bet; name the receipt. | Hype, superlatives, "trust me," vendor-speak. |
| Complete sentences; restrained. | **NO exclamation marks anywhere.** |
| "Built in the open · a BMAD Method project." | "Look at my effects." |
| Name the methodology as **"the BMAD Method"** in all prose/copy. | Bare "BMAD" in user-facing prose (the coined "BMAD Method Dots" retains "BMAD" as shorthand). |

### The Guide's voice

- **Confident, grounded, cited** — *makes the case with receipts*, reframed as **guiding you through the work** rather than overtly advocating. Softer than "Advocate," warmer than "Agent."
- Refers to him by the formal **"Joshua"** in conversation (the wordmark and all written surfaces use **Joshua R. Brandt, MSE**).
- **Greeting:** *"I'm your guide to Joshua's work. I only say what it can back up."*
- **Honesty line (below-threshold):** *"I don't have that documented."* — then a one-line pointer to what *is* covered (the work, speaking, the Glass Box).
- **Three starter prompts** (KB-answerable, not S2 re-curation):
  1. *"Is this site actually built with the BMAD Method?"*
  2. *"Can he deliver a conference talk?"*
  3. *"Show me something I haven't seen."*

#### Grounded-assurance microcopy — two distinct elements

The Guide's "grounded" assurance lives in **two distinct elements**, intentionally (not one string that drifted). State both and cross-reference:

- **Panel-header status (persistent):** **"Grounded · cites its sources"** — the calm always-on label in the panel head. (Canonical string owned by `DESIGN.md` → `guide-panel`; mirrored here so the two spines agree.)
- **Per-answer assurance (let the citations carry it):** the citation chips on each answer are the honesty signal. **SOFTENED** from the earlier *"zero ungrounded claims"* footnote — that over-asserts (the anti-pattern list rejects "trust me," and over-narrating one's own honesty is the same move in a confident accent). The receipts prove it; the copy should not shout it. `[OPEN: final per-answer string — a quiet "Grounded in the record" or no footnote at all; let the chips do the work]`. The greeting ("I only say what it can back up") states honesty **once** — that is enough.

> Thinking-state label vs. instance: the generic empty label **"Reading the record"** (owned by `DESIGN.md`) and the populated per-message form **"Reading: <named sources>"** (e.g. *"Reading: loandemo case study · Glass Box artifacts"*, below in *State Patterns*) are the **same element in two render states** (empty vs. populated), not two competing strings.

### Named strings (canonical)

- **Name / wordmark:** `Joshua R. Brandt, MSE` (the authoritative form for hero wordmark, headshot label, bios, page headers, JSON-LD/SEO, and all future mocks).
- **Positioning line:** **"Seasoned, building at the frontier"** (the page `<h1>` on the hero; replaces "Seasoned, Not Stuck"). Asserts the duality — deep experience + working at the cutting edge — positively and actively; "building" ties to the demonstrate-don't-describe thesis. ⚠ Upstream-sync flag carried from the decision log: the PRD's resolving positioning is still "Seasoned, Not Stuck" → flow this change back to the PRD via `/bmad-correct-course`.
- **CTA strings:** "Explore" · "I'm here to book a talk" · "Ask my Guide" (pill + inline) · "Invite me to speak" · "Or ask my Guide about the work."
- **Thesis line:** "The medium is the message."
- **Copy-paste bios** (the two real strings, set verbatim in the mock — `[ASSUMPTION]` until Josh confirms): a **50-word short bio** and a **100–150-word long bio** (126w as drafted), both ending *"seasoned, building at the frontier."* — **lowercase + trailing period by design** (it is the tail of a running sentence inside the prose bio, *not* the hero `<h1>`); the standalone hero/`<h1>` form is Title-case **"Seasoned, building at the frontier"**. Do not normalize one to match the other.
- **Answer-first ledes (required strings, one per Mirror page).** Each Mirror route opens with a plain-text intro whose first sentence names **"Joshua R. Brandt, MSE"** and answers that surface's core question — the verbatim passage an answer-engine lifts (GEO). The 50-word short bio is the ready candidate for the `/` and `/about` lede.
  - `/` + `/about`: e.g. *"Joshua R. Brandt, MSE is a software engineer with ~30 years of shipping experience, now building at the frontier of agentic engineering."* `[OPEN: final wording — reuse/trim the 50-word bio]`
  - `/speaking`: a one-sentence answer to *what he speaks on and that he can deliver* (names "Joshua R. Brandt, MSE"). `[OPEN: final wording]`
  - `/work/loandemo`, `/glass-box`, `/faq`, `/timeline`: each opens with its own answer-first, entity-named first sentence. `[OPEN: per-surface wording]`

---

## Component Patterns

Behavioral rules. Visual specs live in `DESIGN.md` → Components.

| Component | Use | Behavioral rules |
|---|---|---|
| **The fork** | Hero | Two real `<a>` links + a quiet Guide link. "Explore" → in-page Scene Arc; "I'm here to book a talk" → `/speaking` (bypasses Guide + cinematic layer). Followable with JS off. |
| **Scene-rail** | Home arc (desktop) | Slim right-edge rail. The **7 scene entries ARE interactive jump-to-scene targets** — each is a real in-page anchor `<a href="#hero">…#thesis…#timeline…#speaking…#flagship…#glass-box…#close">` (keyboard-operable, visible `:focus-visible` ring); the current one is lit via `aria-current="true"` + weight (not color alone). Plus a progress meter ("Scene N of 7"), a **"Skip to the end"** affordance, and a **"Jump: book a talk"** shortcut to `/speaking`. This IS the FR-2 skip/progress affordance. The *decorative tick glyph* beside each entry is `aria-hidden`; the **scene-name link text** carries the meaning and the navigation. (Mobile reflow → *Responsive & Platform*.) |
| **The Guide panel** | Site-wide overlay | **Floating, bottom-anchored, NON-MODAL.** Expands up from the persistent bottom-right "Ask my Guide" pill. The page **stays fully interactive** — no scrim, no focus trap. Lifecycle: open → answer with citations → **citation routes the page behind while the conversation persists** → minimize-to-pill (Esc) preserves the thread. Desktop ≈ 400px floating card bottom-right (max ~65vh); mobile = partial bottom sheet (~55–65vh) with the page visible/scrollable above. **The single elevated surface site-wide** (the one soft shadow — `{elevation.shadow-float}`); everything else is flat/hairline. |
| **Citation chip** | Inside Guide answers | Pill linking to a Mirror route (e.g. `/work/loandemo`, `/glass-box/prd`). Real `<a>`. Tapping it navigates the page behind; it never closes the conversation. Carries the route text visibly (`{typography.meta}`/mono for the route slug). |
| **Artifact card** | Glass Box index, timeline clusters | Type chip (small-caps) · title · date · one-line curator note (italic) · "Read →" link to the artifact **reader** at `/glass-box/{artifact}`. A real link; hover lifts the hairline border only (flat). |
| **Artifact reader** | `/glass-box/{artifact}` | The long-form read: header chip · curator note · **drop-cap lede** · body · pull-quote (the editorial devices reserved for long-form). Settled; rendered in Source Serif at a reading measure. |
| **Timeline Dot ("BMAD Method Dot")** | Master Timeline + Glass Box | The same navy node in both surfaces (foreshadowing: a project's Dots = its build-story). States: resting (hairline ring) · filled (shipped/curated) · **live** (filled + static halo ring, no animation) · faint (the quiet-runway ticks). As a cluster row it becomes a real link into an artifact reader. |
| **Era band** | Master Timeline | A labeled region on the spine (each `<li>` carries an `aria-label`): the quiet ~30-year **runway** vs the dense **agentic-engineering turn**. Presentation only over a real ordered list. |
| **Flagship node** | Master Timeline | A milestone Dot that expands to a small **cluster** of its Dots, each a real link. The portfolio node's Dots cross-link **into the Glass Box**; the loandemo node's Dots drill to `/work/loandemo#…`. (S1: cluster shown statically; S2: a zoom gesture toggles it.) |
| **Talk card** | Speaker Surface | Outcome-oriented title · audience-level chip(s) · 150–200w **abstract** (first one written out; others collapsed behind a native `<details>`/`<summary>` "Read the abstract ▾", expandable JS-off, text in the DOM for crawlers) · 3–5 **takeaways** · **formats/durations** chips · **logistics** (travel, A/V). |
| **Bio-copy block** | Speaker Surface | Bordered block · real `<button>` "Copy" with visible feedback → "Copied ✓" · **selectable-text fallback** (the bio is plain selectable text, with a stated note that it works if the copy JS fails). Word-count label. |
| **Metric** | Speaker credibility strip | Audience-draw figure (subscribers / views / talks / years) in `{colors.accent}` + label + source line. Real numbers `[OPEN]`; placeholders flagged in text (`[ph]`). |
| **Testimonial** | Speaker credibility strip | Italic quote · attribution (name, role, event) · navy left rule. Real ones `[OPEN: testimonials/logos pending]`; placeholders labeled in text, not tint alone. |
| **Reel** | Speaker Surface | Real poster + caption + **static link fallback** (the `<a>` poster carries an `aria-label` naming the reel + its ~90s duration); **no autoplay**; the poster links out (YouTube / `/speaking/reel`) if the player can't load. |
| **Invite-Me form** | Close (`/`) + `/invite` (UJ-2 terminal step, FR-31) | A real accessible `<form>`. **Every field has a persistent visible `<label>`** (never placeholder-as-label); **required fields marked in text** (not asterisk/color alone). The **attribution field** ("how did you hear about Joshua?") is a labeled `<select>` or radio group (captures the structured attribution FR-31 wants). **Inline validation:** on a field error, `aria-invalid="true"` + an error message wired via `aria-describedby`/`aria-errormessage`; on failed submit, an **error summary** at the top receives focus and lists each error as a link to its field. **Success:** an `aria-live="polite"` (`role="status"`) confirmation announces receipt — *"I reply within [N] business days · persisted + emailed, never an auto-responder"* (`[OPEN: N]`). **Offline / submit-failure path:** a non-destructive error state (`role="alert"`) that preserves the entered values, states the failure plainly, and offers retry + a fallback (e.g. a mailto/`/about` contact link) so the inquiry is never silently lost. Keyboard-operable end to end; visible `:focus-visible` ring; works as a real form post if the enhancement JS fails. (Resting input-border contrast → *Accessibility Floor*.) |
| **Static fallback footer** | Every page | Real `<a>` links to all Mirror routes; works JS-off; screen-reader navigable. |

---

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| **Collapsed** | Guide | The persistent bottom-right pill ("Ask my Guide"). The hero also carries a matching inline entry; both are real controls and open the same panel. |
| **Open · empty + starters** | Guide | In-voice greeting (*"I'm your guide to Joshua's work. I only say what it can back up."*) + the three KB-answerable starter prompts as tappable `<button>` chips + a labeled input. |
| **Thinking (per-message)** | Guide | A **deliberately designed retrieval moment**, not a spinner: a calm line revealing *what it is reading* (e.g. "Reading: loandemo case study · Glass Box artifacts") + a restrained hairline progress sweep across named sources (Read / Reading / Queued). Announced **once per message** via a `role="status"` + `aria-live="polite"` region — **never per token** (reconciles the "visible thinking is a wow surface" intent with NFR-2). |
| **Answer + citations** | Guide | Concise, confident, no-hype answer; **every substantive claim carries a citation chip** to a Mirror route — **the citations carry the honesty**. The earlier per-answer *"zero ungrounded claims"* footnote is **softened/dropped** (over-asserting brushes the "trust me" anti-pattern; let the receipts prove it). The persistent **"Grounded · cites its sources"** panel-header status (a *distinct* element, owned by `DESIGN.md`) covers the standing assurance — see *Voice and Tone → Grounded-assurance microcopy* for the two-element split. `[OPEN: keep a quiet per-answer "Grounded in the record" or nothing]`. Transcript is `role="log"` + `aria-live="polite"`, batched per message. |
| **Not documented (below threshold)** | Guide | The honest reply *"I don't have that documented."* + a one-line pointer to what *is* covered, with chips to `/work`, `/speaking`, `/glass-box`. **No model call below threshold** (FR-6) — honest by construction; protects **SM-C3**. |
| **Copy default / Copied** | Bio-copy block | Resting "Copy" → tap → "Copied ✓" (navy filled, check glyph). Reverts after a beat. Selectable-text fallback always present. |
| **Invite-Me: default / invalid / submitting / success / offline-fail** | Invite-Me form | **Default:** labeled empty fields; required-fields stated in text. **Invalid (inline):** the offending field gets `aria-invalid="true"` + a described error; on failed submit an **error summary** at the top takes focus and links to each bad field. **Submitting:** the submit control is disabled with a status. **Success:** an `aria-live="polite"`/`role="status"` confirmation announces receipt + the stated response time (*"I reply within [N] business days · persisted + emailed, never an auto-responder"*, `[OPEN: N]`); FR-31 = persisted to Postgres **and** emailed. **Offline / submit-failure:** a `role="alert"` error that **preserves entered values**, states the failure plainly, offers retry + a fallback contact (mailto / `/about`) — the inquiry is never silently dropped. |
| **Talk: collapsed / expanded** | Talk card | First abstract expanded; the rest collapsed behind a native `<details>` ("Read the abstract ▾" → rotates open). Works JS-off; text in the DOM even when visually collapsed. |
| **Timeline: live·in-progress + ghosted upcoming** | Master Timeline + Glass Box | The current node shows a "Live · in progress" pill + a static halo ring (status also in text). Future nodes are **ghosted** (dashed dot, dashed card, muted ink, "As it accrues") but remain real list items — *"never finished, never stale."* |
| **JS-off** | Global | Scene Arc → an ordered set of sections with a static footer nav; timelines → plain `<ol>`; talk abstracts → open `<details>`; bios → selectable text; Guide → its content is reachable via the Mirror routes the fallback footer links. |
| **Reduced-motion** | Global + per surface | **Two-layer gate — BOTH required, not either/or:** the CSS `prefers-reduced-motion` media query AND the JS init-guard (do not initialize GSAP/ScrollTrigger/WebGL). The opening beat is calm by design, so there is no spectacle to lose. **Enumerated per animated surface, each with its static fallback:** <br>• **Scene-rail progress meter** — the animated width-fill becomes a **static filled bar** at "Scene N of 7."<br>• **Guide thinking sweep** — the hairline progress sweep across named sources becomes **static text** ("Reading: <named sources>"); no motion-hint.<br>• **S2 directed camera path (S2 canvas)** — **disabled outright** by the JS gate (not merely sped up); degrades to the Stage-1 instant section changes / discrete Scenes.<br>• **Master Timeline** — cinematic/scroll transitions off; the semantic `<ol>` renders statically (the live halo is already a *static* ring, no animation). |
| **Loading** | Global | FCP-first: key content is in the initial HTML (SSG). Heavy stack (≤1 WebGL canvas, playables) lazy-loads behind a static poster/fallback. |

---

## Interaction Primitives

- **Scroll-native arc + scene-rail.** The home arc is navigated by scrolling; the persistent scene-rail provides progress, **jump-to-scene (all 7 scene entries are real in-page anchors — keyboard-operable, focus-visible)**, plus skip-to-end and jump-to-`/speaking` (the FR-2 Skip). See *Component Patterns → Scene-rail* for the per-entry anchors. The Stage-2 "directed camera path" (FR-3) layers on top of this base and degrades back to it under reduced-motion.
- **S2 directed-camera-path is bound to the visible skip (FR-2) — no scroll-jacking without it.** While the camera path drives scroll, the scene-rail **skip + per-scene jump stay visible and keyboard-operable throughout** the sequence; and the camera path is one of the surfaces the reduced-motion JS gate **disables outright** (not merely speeds up — a vestibular-harm guard, not just a visual fallback). This is the concrete form of the "scroll-jacking without a visible skip affordance" ban below.
- **Deep-linking.** Every Scene is reachable via a stable in-page anchor (the scene-rail entries use them directly); every rich surface is reachable via its Mirror route. `/speaking` is fully self-sufficient on a cold deep link (UJ-2 / SM-C1).
- **The floating non-modal dialog.** The Guide opens over the page without blocking it (no scrim, no focus trap); focus moves *into* the panel on open but is not trapped.
- **Cite → route.** Tapping a citation navigates the **page behind** to that Mirror route while the **conversation thread persists** floating over it.
- **Copy-to-clipboard.** Bio blocks copy on a real button press with a "Copied ✓" confirmation; selectable text is the fallback.
- **Horizontal-arc ↔ vertical reflow.** The Master Timeline (illustrated in [`mockups/master-timeline.html`](mockups/master-timeline.html)) is one semantic ordered list, presented **horizontal on desktop / vertical on mobile** — orientation is presentation only; reading order (oldest → newest) is preserved in the DOM either way.
- **Banned** (carried from anti-patterns): scroll-jacking without a visible skip affordance; hover-only affordances on touch; per-token chat churn; modal scrims over the page.

---

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` (navy on cream = 10.15:1; secondary ink = 5.6:1 — both AA).

- **Target: WCAG 2.1 AA** `[ASSUMPTION]` (per NFR-2).
- **Two-layer reduced-motion gate** — honored in CSS (`prefers-reduced-motion` media query) **AND** JS (do not initialize GSAP/ScrollTrigger/WebGL; show the static hero) — **both layers required, not either/or**. Avoid Lenis/smooth-scroll, or gate it behind reduced-motion. **Enumerated per animated surface** (scene-rail progress meter → static filled bar; Guide thinking sweep → static text; S2 camera path → disabled outright; Master Timeline → static `<ol>`) in *State Patterns → Reduced-motion*.
- **The Guide = `role="dialog"`, NON-modal (`aria-modal="false"`).** Focus moves into the panel on open but is **NOT trapped** — the page stays usable; the panel sits **after the pill in DOM/tab order** so a keyboard user can tab into it and back out to the page without a trap. Transcript is `role="log"` + `aria-live="polite"`, **batched per message, never per token**. The thinking state announces once per message via a `role="status"` region. All controls (pill, starters, send, minimize, close, citations) are real `<button>`/`<a>` elements; fully keyboard-operable with a visible `:focus-visible` ring; the input is labeled. **Explicit non-modal focus-return (the hard part of a non-trapped dialog):**
  - **On minimize/close** (Esc or the minimize button): focus **returns to the "Ask my Guide" pill** (the invoking control) — never orphaned on the now-hidden panel. The thread is preserved (Esc minimizes, does not destroy it).
  - **After a citation routes the page behind:** focus **stays in the Guide panel** (the conversation persists floating), AND the page navigation is **announced via an `aria-live="polite"` region** (e.g. "Opened: loandemo case study") so a screen-reader user is told the document behind changed. Provide an explicit affordance/skip-link to **move focus to the newly-routed content's heading** (`<h1>` of the Mirror route) for users who want to read it. `[OPEN: exact announcement string per route]`
- **WebGL canvas is `aria-hidden` decorative** with DOM equivalents; no information lives only in the canvas, the drafting grid, scene-rail ticks, timeline Dots/spine, or reel poster — text/links carry it.
- **Everything is crawlable + screen-reader navigable** via the Mirror routes and the static fallback. Heading hierarchy is clean on every surface (one page `<h1>`; section rules and reader notes are non-heading asides so the outline stays intact). Color is never the sole signal — current state, "Live," audience level, ratings, and placeholder/assumption flags are all stated in text.
- **Reading / focus order follows the DOM**, identical in intent on desktop and mobile.

---

## Key Flows

Named-protagonist journeys (names are `[ASSUMPTION]` per PRD §3.3 — the beats matter more than the names). Each has a climax beat.

### UJ-1 — Devon, the practitioner (cold desktop → the recursion)

Devon, a fellow agentic-engineering builder, clicks a community link — curious, a little skeptical of "AI portfolio" hype. Desktop, cold at the hero.

1. Reads the calm "Seasoned, building at the frontier" hero (the fork + quiet Guide entry, illustrated in [`mockups/hero.html`](mockups/hero.html)); nothing front-loads spectacle.
2. Opens the **Guide** and asks *"Is this site actually built with the BMAD Method?"*
3. The Guide shows its **thinking** (what it is reading), then answers concisely **with citation chips**.
4. A citation **routes the page behind into the Glass Box** while the conversation keeps floating.
5. He opens the **real artifacts** in the reader — and crucially the Glass Box index now carries **shipping evidence, not only planning docs**: the planning set (brief, brainstorm, research, PRD, UX) **plus a real, non-ghosted "the live site / its repo" node** (the running site + its public repo/commits as a genuine artifact). He **scrubs the Master Timeline** teaser → full timeline, where the **loandemo** flagship's Dots include real shipping nodes — **code/repo · build · retro** — not just planning.
6. **Climax:** he realizes the site he is touring *is the project on the timeline he is scrubbing* — and that the proof is **planning discipline _plus_ visible shipping** (the site's own repo + loandemo's code/retro), shown **day one**, not an IOU of paperwork. Hard to fake; the Glass Box recursion beat names it: *"You're reading the build history of the site you're reading it on."*
7. **Resolution:** he shares the link and follows Josh.

*Degraded (JS/motion off):* the Lean Static Fallback exposes the same artifacts as crawlable Mirror pages — "the whoa survives degraded."

### UJ-2 — Mara, the organizer (mobile / deep-link → invite in under two minutes)

Mara, a program-committee member, heard Josh's name (a referral, or the buzz from UJ-1). Busy; does **not** want to chat with a bot. Likely mobile; often arriving by deep link to `/speaking`.

1. Hits the hero fork's **"I'm here to book a talk"** → `/speaking`, *or* lands directly on `/speaking` from search (the **Guide is bypassed entirely** — protects **SM-C1**).
2. The sticky header keeps **"Invite me to speak"** within a thumb's reach the whole scroll.
3. Confirms fit fast on the Speaker Surface (illustrated in [`mockups/speaker-surface.html`](mockups/speaker-surface.html)): the **READY 2026 reel** (front and center), the **credibility strip** (audience metrics + social proof), then **reads one abstract**.
4. **Climax:** she **invites in under two minutes, with no chat** — the closing Invite-Me form confirms receipt with a stated response time (*"I reply within [N] business days · persisted + emailed, never an auto-responder"*).
5. **Resolution:** the inquiry is **persisted to Postgres AND emailed to Josh** (FR-31), capturing a structured attribution field.

*Degraded (Googles him first):* the Static Mirror (SSG + Event/VideoObject JSON-LD) makes speaker facts/abstracts indexable and credible *before* she clicks.

### UJ-3 — Sam, the wanderer (mobile, low intent → a follower)

Sam found a Josh YouTube video or Suno track; here for delight, not evaluation. Mobile, low intent.

1. Reaches the **Close scene (`/`)**, which carries a **minimal Stage-1 creative touch** — a single **curated creative link/embed** (e.g. a featured Suno track or YouTube video) that gives Sam's payoff a real S1 home. (The full **Creative Lab / playables** remain **Stage 2**, per *Stage sequencing*; this is the lightweight S1 stand-in, not the Lab.)
2. Samples that embedded track / video; drifts the calm gallery.
3. **Climax:** a **genuinely enjoyable moment** (the curated track or video), **not a sales pitch**.
4. **Resolution:** taps a follow/subscribe CTA (channel handles `[OPEN]`).

*Degraded (slow connection):* the heavy creative embed lazy-loads behind a static poster; the curated link still works JS-off.

> *(UJ-4 — Josh extends the site via `/bmad-correct-course` and it appears on its own Timeline — is a maintenance flow, not a visitor experience; behavior captured under "Proof-as-Process" and Stage sequencing.)*

---

## Inspiration & Anti-patterns

### References (lifted)

- **The Architect's Studio** — spare, confident, editorial typography, restrained palette, generous whitespace; *"the wow builds, restraint is the flex."*
- **"A film you can talk to"** — the cinematic north star (scenes, a directed camera path, the Guide flying you to the next scene). Kept visible even while Stage 1 ships discrete Scenes.
- **Editorial restraint** — drop-cap ledes, small-caps kickers, pull-quotes reserved for long-form (Glass Box reader, case studies); "trailer for my career, not a résumé with sections"; 4–6 scenes, 3–6 deep case studies.

### Anti-patterns (rejected)

- Hacker/**Matrix terminals**; **literal AI metaphors** (floating brains, robots, neural-net stock art).
- **Gimmick / "stereotypography" fonts**; **neon-gradient overload** without hierarchy.
- **Scroll-jacking with no skip/progress affordance** (the scene-rail is the antidote).
- Unrefined **"AI-slop" visuals**; "look at my effects" with no message.
- **Raw file dump** ("raw guts") — the Glass Box is polished glass, curated.
- **Static CV / reverse-chronological résumé** as the primary surface.
- **"Trust me"** framing — every claim is cited; the page reload model.

---

## Responsive & Platform

Mobile + desktop are both first-class. The responsive transforms (presentation only — same DOM):

| Surface | Desktop | Mobile |
|---|---|---|
| Scene-rail | Slim right-edge vertical rail (ticks + progress + Skip + Jump) | Sticky **top progress bar + "Jump to section" menu** |
| Master Timeline | **Horizontal** left→right craft-arc (era bands on one spine) | **Vertical** reflow (era headers; runway up top, agentic turn below; flagships + Dots stacked) |
| Guide panel | ~400px floating card bottom-right (≤65vh), minimize-to-pill | **Partial bottom sheet** (~55–65vh), page visible/scrollable above |
| Hero | Two-column (copy + portrait), full display scale | **Compact name+headshot lockup** (horizontal) + tightened display + stacked fork — all above the fold |
| Speaker Surface | Sticky header w/ inline nav + Invite; 4-up metrics; 3-up quotes; two-up bios | Single scroll; sticky header keeps Invite up high; 2×2 metrics; stacked talks/bios |

**Performance budget (NFR-1):** FCP < ~2s on mid-range mobile; main-page JS < ~200–250KB gz; **≤1 fixed WebGL canvas** site-wide; heavy stack lazy-loaded (`client:visible`/`client:idle`); compressed WebGL assets (KTX2/Basis/Draco) with a static fallback. Source Serif 4 subset to Latin + needed weights (~400/600/700) with `font-display: swap`.

**SEO / GEO floor (NFR-3, FR-35):** key content in the initial HTML, SSG-prerendered; **answer-first intros that name "Joshua R. Brandt, MSE" in the first sentence** (per Mirror page — strings in *Voice and Tone*), clean heading hierarchy, plain-text key facts. **JSON-LD, each on the route that owns it:** `Person`+`ProfilePage` on **`/about`** (the canonical bio home + `sameAs` channel links — YouTube/GitHub/Suno), `FAQPage` on **`/faq`** (real `<h3>` Q + `<p>` A pairs), `Event` on dated appearances + `VideoObject` on **`/speaking/reel`** (and per-talk recordings), `CreativeWork` on the flagship projects. The Static Mirror exposes every agent-revealed fact as real HTML (verifiable via `view-source` + find, JS off). Directly protects the speaking goal — organizers Google Josh.

**Static discoverability infrastructure (authored / build-generated — they do not appear by default):**
- **`sitemap.xml`** — enumerates every Mirror route (`/`, `/about`, `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box` + each published `/glass-box/{artifact}`, `/faq`, `/invite`, `/browse`) with `lastmod`; referenced from `robots.txt`.
- **`robots.txt`** with an **explicit AI-crawler allow-list** (NFR-3 "do not block AI crawlers" → a concrete artifact, not aspiration). Allow at minimum: **ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended** — plus the related current tokens (`ChatGPT-User`, `Claude-User`, `Claude-SearchBot`, `Perplexity-User`, `Applebot-Extended`, `Amazonbot`, `CCBot`). `[OPEN: confirm final token list at build — tokens drift]`.
- **Self-canonical Mirror routes** (`<link rel="canonical">` to self); the home `/` Scene-Arc teasers **summarize-and-link**, never duplicate the Mirror body (see *Information Architecture → Canonicalization*).
- **`<html lang="en">`** site-wide (single locale; no `hreflang` — i18n out of scope).

---

## The Guide — grounding, citation & safety

A product-specific concern (FR-6, FR-9; §9.1; SM-C3). The Guide is the soul of the product and is held to a strict safety/grounding contract. Its panel states (empty + starters, thinking, answer + citations, not-documented) and floating non-modal behavior are illustrated in [`mockups/guide.html`](mockups/guide.html) (the mock still labels the agent "Advocate"; the spine's "Guide" governs):

- **Retrieve-only.** Answers come only from the build-time KB index over the curated repo. No live external reads.
- **Below-threshold → no model call.** If retrieval is empty or below threshold, the Guide returns the canned *"I don't have that documented."* and **does not call the model** (FR-6) — honest by construction; protects **SM-C3 (zero ungrounded agent claims)**.
- **Every substantive claim is cited** to a real Mirror route (FR-7); "the skeptic gets sold *and* gets the receipts."
- **Prompt-injection-resistant.** Visitor instructions cannot override the persona or grounding; strict context separation (FR-9).
- **Per-message visible thinking.** The retrieval moment is a designed surface (shows what it is reading) announced once per message (`role="status"`/`aria-live`), never per token (NFR-2).
- **Server-side persona.** The persona/system prompt is never returned to the client.
- **Stage line:** S1 = grounded cited Q&A · routing to Mirror routes · honest "not documented" · designed thinking state · starter prompts. **S2 (not now):** intent re-curation (FR-10), depth dial (FR-5), director's mode (FR-4). **S3:** in-chat speaking-inquiry capture (FR-12) feeding the same store as Invite-Me.

---

## Proof-as-Process — Glass Box curation

A product-specific concern (FR-13/FR-14; the day-one *remarkable* element). The index is illustrated in [`mockups/glass-box.html`](mockups/glass-box.html) (the spine adds the non-ghosted "live site / repo" shipping node; the mock predates it). The Glass Box has two views:

- **The reader** (`/glass-box/{artifact}`) — the approved Source Serif long-form: header chip · curator note · drop-cap · body · pull-quote. Settled.
- **The index** (`/glass-box`) — a **curated, chronological build-story**: a dated vertical timeline spine whose navy nodes are the same **BMAD Method Dots** the Master Timeline uses (foreshadowing it; degrades to a plain `<ol>` with JS off). The launch set now carries **real shipping evidence, not only planning**: the planning nodes (product brief · brainstorm · pre-brief research · PRD · UX design "Live · in progress") **plus a real, non-ghosted "the live site / its repo" shipping node** — the running site + its **public repo/commits** as a genuine, clickable artifact, so the recursion shows **shipping day one**, not just planning docs. The **still-to-come** nodes (architecture · epics & stories · retrospectives) remain **ghosted** — *"never finished, never stale"* — and de-ghost as they ship. `[OPEN: public repo/commits URL for the live-site node]`.

**Curation made visible (publish allowlist, default-deny).** Only the artifacts worth reading are published — *"polished, not raw."* The **never-render set stays backstage**: decision logs (`.decision-log.md`), reviews (`review-*`), reconciles (`reconcile-*`), and internal addenda. This default-deny posture is framed on the page as **an act of taste**, not a technicality.

**loandemo (the finished flagship) carries real shipping nodes.** Its case-study / Glass-Box Dots at `/work/loandemo` include the shipping evidence an engineering peer respects — **code/repo · build · retro** — not only planning. loandemo is the non-recursive engineering proof; its Dots must show the *build*, not just the *plan*. `[OPEN: loandemo repo + artifact URLs]`.

**The recursion (UJ-1 climax) lands here, reframed:** proof = **planning discipline _plus_ visible shipping** — the site's own non-ghosted live-site/repo node **and** loandemo's code/retro, both present at launch — not planning alone. Restrained and confident, no AI/Matrix cliché: *"You're reading the build history of the site you're reading it on. It's being built in the open, right now."* A cross-link clarifies the boundary: **Glass Box = this project's** build history; **Master Timeline = the cross-project** arc (same Dots, one project in depth).

---

## Stage sequencing

Per-feature "agentic ideal, graceful fallback." **Stage = delivery sequence, not a priority cut** — every stage is committed MVP-quality scope. Stage 1 (shipped scope) is the trimmed arc above. The Stage 2 / Stage 3 layers — each *"agentic ideal, graceful fallback"* — are designed-toward but not built now:

| Layer | Stage | Agentic ideal → graceful fallback |
|---|---|---|
| **Continuous Canvas + cinematic transitions** (FR-3) | S2 | Directed camera path replaces page loads → degrades to instant section changes / the Stage-1 discrete Scenes. |
| **Semantic zoom — Master Timeline** (FR-17) | S2 | One shareable gesture: out → career milestones, in → a project's Dots (+ auto-harvest) → the S1 arc shows both levels at once; no info gated behind a gesture. |
| **Depth Dial** (FR-5) | S2 | Visitor-operated 30s-skim → overview → deep dive → reflected by both agent and static paths. |
| **Director's-mode re-curation** (FR-4, FR-10) | S2 | Guide reorders/deepens/skips Scenes by stated intent → a sensible default cut always exists; never hides content from the fallback; never regresses SM-C1. |
| **Adaptive Soundtrack** (FR-30) | S2 | Suno instrumentals score the site by Scene, auto-duck under video → off by default, user-controllable, never autoplays with sound; fixed Scene→track mapping is the fallback. |
| **The Demonstrator / Build Walkthrough** (FR-11) | S2 | Curated, pre-recorded/replayable demonstration of real agentic work + a BMAD teaching walkthrough → pre-approved static assets, **no live arbitrary execution**. |
| **Wings, playables, Creative Lab, video-synced repo, EPK, remaining import** (FR-21/24/26/27/29) | S2 | Each independently browsable / playable → static poster/links + selectable text fallbacks. |
| **Site-wide semantic zoom** (FR-18) | S3 | Consistent granularity at every zoom level → `[OPEN: behavior deferred pending UX]`. |
| **Maintenance (UJ-4)** | ongoing | Add a project via Project Import + `/bmad-correct-course`; build regenerates the Mirror + KB + Timeline (hand-curated Dots S1 → auto-harvest S2). "The site grew by being engineered, not edited." No CMS. |

---

## Open gaps

`[OPEN]` items the spine cannot resolve without content/decisions (mostly the content inventory):

- `[OPEN]` **loandemo repo/case-study URL** and its real artifacts — including the new **code/repo · build · retro** shipping Dots (not only planning).
- `[OPEN]` **The portfolio's own live-site/repo node** — the public repo/commits URL for the non-ghosted launch shipping node in the Glass Box index.
- `[OPEN]` **Stage-1 creative touch (Close scene)** — the one curated creative link/embed (track or video) that gives UJ-3 an S1 home; depends on channel handles below.
- `[OPEN]` **READY 2026 talk details** (title, abstract, date) and which talks fill the reel.
- `[OPEN]` **`/about` `sameAs` channel URLs** and the **`/faq` seed answers** (starter prompts + common organizer/peer Qs) — content for the two new GEO Mirror routes.
- `[OPEN]` **Answer-first lede wording** per Mirror page (each naming "Joshua R. Brandt, MSE" first); the softened per-answer Guide assurance string; the citation-route `aria-live` announcement strings; the final `robots.txt` AI-crawler token list (tokens drift — confirm at build).
- `[OPEN]` **channel handles** (YouTube / Suno / GitHub) for follow/subscribe CTAs and curated embeds.
- `[OPEN]` **featured creative tracks / playables** (which projects map to which Wing in S2).
- `[OPEN]` **testimonials, logos, audience metrics** — real ones pending; placeholders flagged on the Speaker Surface.
- `[OPEN]` **Invite-Me response-time N** — the "I reply within [N] business days" value is `[TBD]`.
- `[OPEN]` **Signature-talk titles/abstracts** are seeded `[ASSUMPTION]` (e.g. "Patterns That Survive Hype Cycles") — confirm or replace.
- `[OPEN]` **Site-wide semantic zoom (FR-18)** behavior — deferred pending UX (S3).
- `[ASSUMPTION]` **Protagonist names** (Devon / Mara / Sam) — substitute real archetypes freely; the beats matter more than the names.
- ⚠ **Upstream sync:** propagate the new positioning line ("Seasoned, building at the frontier") back to the PRD (`/bmad-correct-course`).
