---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  # PRD (anchor — status: final)
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/addendum.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-brief.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-brainstorm.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-research.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-adversarial.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-downstream.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-rubric.md"
  - "_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/.decision-log.md"
  # UX design (DESIGN.md + EXPERIENCE.md spines — status: final)
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/validation-report.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-accessibility.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-seo-geo.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-peer-credibility.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-voice.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-rubric.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/.decision-log.md"
  # Product brief (status: final)
  - "_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/brief.md"
  - "_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/addendum.md"
  # Pre-brief research
  - "_bmad-output/research/portfolio-pre-brief-research-2026-06-02.md"
# Discovered but not separately loaded (architecturally-relevant content distilled into the PRD + reconcile-brainstorm.md):
#   - _bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md (47 ideas)
workflowType: 'architecture'
project_name: 'portfolio'
user_name: 'Josh'
date: '2026-06-04'
lastStep: 8
status: 'complete'
completedAt: '2026-06-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 36 FRs total (Stage 1 / MVP = 19; Stage 2 = 14; Stage 3 = 3),
grouped into architectural subsystems. Stage-1 set:
- Experience shell (FR-1, FR-2): SSG hero + sectioned scroll-native scenes + scene-rail
  skip/progress. (Continuous Canvas / cinematic camera-path = Stage 2.)
- The Guide / grounded agent (FR-6, FR-7, FR-8, FR-9): retrieve-only RAG over a build-time
  KB index; citation-required; fail-closed below threshold (no model call); prompt-injection
  separation; server-side persona; streaming; router to crawlable Static Mirror pages.
- Glass Box (FR-13, FR-14): build-time render of real _bmad-output/ artifacts via a publish
  allowlist (default-deny); chronological build-story teaser.
- Master Timeline (FR-16): hand-curated Dot manifest in Stage 1 (deterministic git→Dot
  auto-harvest deferred to Stage 2, FR-17 / OQ#10).
- Speaker Surface (FR-19, FR-20): reel + signature talks + copy-paste bios + social proof
  (the SM-1 conversion surface).
- Projects (FR-22, FR-23): two flagship case studies (portfolio-itself + loandemo) + curated
  content links/embeds (no runtime external reads).
- Conversion (FR-31, FR-32): Invite-Me form persisted to Postgres AND emailed; Close CTAs.
- Content pipeline (FR-33, FR-34): single git source of truth; build generates Static Mirror
  + KB index + Glass Box data; Project Import via /bmad-correct-course. No CMS.
- Discoverability (FR-35) + Analytics (FR-36): server-rendered JSON-LD (Person/ProfilePage,
  Event, VideoObject, CreativeWork, FAQPage); cookieless, no-PII analytics.

**Non-Functional Requirements:** 7 NFRs drive the architecture more than any single FR.
- NFR-1 Performance: FCP <~2s mid-mobile; main-page JS <~200–250KB gz; ≤1 WebGL canvas
  site-wide; lazy-load heavy stack (client:visible/idle); compressed WebGL assets + static fallback.
- NFR-2 Accessibility (WCAG 2.1 AA): two-layer reduced-motion gate (CSS + JS); non-modal Guide
  dialog (role=dialog/log, aria-live batched per-message, focus-return); color never the sole signal.
- NFR-3 SEO/GEO (first-class): SSG-prerender all key routes; Static Mirror verifiable via
  view-source + JS-off; answer-first ledes; canonical/sitemap/robots(AI-crawler allow-list).
  Underwrites the #1 speaking goal.
- NFR-4 Agent reliability/latency: build-time index only; TTFT <~1.5s, hard ceiling ~10s,
  retrieval <~200ms; knowledge horizon = last build ("fresh-as-of-last-build", not "never stale").
- NFR-5 Static, key-free runtime: only two dynamic components — the Guide backend and the
  Invite-Me endpoint; everything else prebuilt static served by nginx; no runtime API keys.
- NFR-6 Maintainability: code-as-CMS; deterministic build-time regeneration from real artifacts.
- NFR-7 Observability: privacy-first analytics + server logs sufficient to measure §13 metrics
  and detect agent retrieval misses (the documented trigger to consider embeddings).

**Scale & Complexity:**
Medium overall. Low on enterprise axes (no multi-tenancy, no auth/accounts, no real-time
collaboration, small data volume, single locale). Medium-high on exactly two axes: the grounded
RAG agent (grounding + safety + latency) and the build-time content pipeline (markdown → KB
index + Static Mirror + Glass Box + JSON-LD/sitemap/robots). Dominant risk is effort
concentration in a solo build (PRD red-team C3/C4), not architectural scale.

- Primary domain: full-stack web — static-first (SSG) with a thin dynamic edge behind nginx.
- Complexity level: medium (with two non-trivial subsystems carrying the risk).
- Estimated Stage-1 architectural components: ~6–8 — SSG site · build-time content/KB pipeline ·
  KB index artifact · Guide RAG backend · Invite-Me endpoint + Postgres + email · analytics ·
  nginx reverse-proxy.

### Technical Constraints & Dependencies

Fixed inputs (not open decisions):
- Hosting: Abacus VM; nginx vhost at joshuabrandt.abacusai.cloud (ingress port 80); static
  build + small live backend; S3 path currently unset.
- Data: attached Postgres (Invite-Me store; pgvector available if embeddings are ever justified).
- LLM: VM OpenAI-compatible endpoint — no external key; mid-tier model assumed (haiku /
  gpt-5-mini class) with streaming.
- Hard non-goals: no CMS/admin; no live runtime reads from GitHub/YouTube/Suno; no public live
  agentic execution.
- Launch prerequisites: public_url_enabled is currently OFF (hard gate before anything routes
  publicly); Suno commercial-rights regeneration (Stage-2 gate for FR-30); github_connected OFF
  (NOT a blocker — no live GitHub reads; use gh auth / PAT for push-pull).

### Cross-Cutting Concerns Identified

- SEO/GEO emission — Static Mirror + JSON-LD + canonical + sitemap/robots + answer-first ledes,
  on every key route (first-class; underwrites the speaking goal).
- Accessibility (WCAG 2.1 AA) — reduced-motion two-layer gate, non-modal Guide, keyboard +
  color-not-sole-signal, accessible Invite-Me form — across every component.
- Performance budget — JS ceiling, ≤1 WebGL canvas, lazy-loading, font subsetting — governs the
  frontend build.
- Static↔dynamic seam (#A1) + index-freshness horizon — what is prebuilt vs. served live; the
  agent's knowledge cutoff = last build.
- Agent grounding & safety — retrieve-only, citation-required, fail-closed, prompt-injection
  separation, server-side persona.
- Code-as-CMS content pipeline — deterministic build-time generation; Stage-1 hand-curated
  Timeline manifest (auto-harvest = Stage 2).
- Privacy — cookieless/no-PII analytics; inquiry-data access control + retention (TBD).
- Glass Box build-time curation/redaction — publish allowlist (default-deny) so internal/process
  docs never leak.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web, static-first: an Astro 6 SSG frontend (crawlable Static Mirror +
a few React islands) plus a thin Node/TypeScript API edge (the Guide RAG service +
the Invite-Me endpoint) behind the VM's nginx vhost. No heavyweight app framework —
the bulk of the site is prebuilt static assets (NFR-5), with two small dynamic surfaces.
(Versions verified current via web search on 2026-06-04: Astro 6.4; React via
@astrojs/react; Hono 4.x; GSAP 4 — now free incl. ScrollTrigger — for the Stage-2
cinematic layer.)

### Starter Options Considered

- Official Astro minimal scaffold (`create astro`) — SELECTED. Astro 6.x, TypeScript
  strict, empty/minimal template; islands via @astrojs/react.
- Next.js (`create-next-app`) — considered, set aside (PRD Open Q #1). A single React/RSC
  universe is attractive, but heavier baseline JS works against the ~200–250KB budget
  (NFR-1), and the crawlable Static-Mirror discipline (NFR-3) is more manual than Astro's
  HTML-first default. Josh confirmed Astro.
- Opinionated kits / Astro themes (T3, shadcn-based, astro-theme-*) — rejected. DESIGN.md
  is a fully bespoke ink-on-cream identity ("no shadcn/Material to inherit from"); a themed
  starter would fight the hand-authored tokens and add weight. We want the empty canvas.
- Backend: `create hono` (Node template) — for the API service. Hono 4.x; web-standard
  streaming for the agent; chosen over Fastify 5 (heavier than needed) and Python/FastAPI
  (a second runtime, no type-sharing with the frontend).

### Selected Starter: Astro 6 (minimal, TypeScript-strict) + React islands + Hono 4 API

**Rationale for Selection:**
Astro's islands model maps 1:1 onto the product: SSG-prerender every Mirror route (free
NFR-3 crawlability + the JS-off fallback), ship 0 JS by default (protects NFR-1), and
hydrate React only for the three island surfaces (the Guide pill, the Guide panel, and the Invite-Me form).
It lives inside this repo so the build can render the real _bmad-output/ artifacts for the
Glass Box (FR-13) — the site is literally its own source of truth (FR-33). The separate
Hono service keeps the static surface key-free (NFR-5); nginx serves dist/ directly and
reverse-proxies /api/* to Hono.

**Initialization Command(s):**

```bash
# From the repo root (this repo IS the single source of truth — FR-33).
# Frontend — Astro 6, minimal template, TypeScript strict:
npm create astro@latest web
#   -> Template: Empty / Minimal   -> TypeScript: Strict   -> install + git: as desired
cd web && npx astro add react      # React islands (@astrojs/react) for hero + Guide

# Backend — Hono 4 (Node.js template), the Guide + Invite-Me service:
npm create hono@latest api         # -> template: nodejs

# Tie them into one pnpm workspace at the repo root (web/ + api/) so one
# `pnpm install` covers both and they share types/content tooling.
```

(Exact create-* CLI flags confirmed at scaffold — flags drift across versions; the major
versions above are verified current as of 2026-06-04.)

**Architectural Decisions Provided by (or set with) the Starter:**

**Language & Runtime:** TypeScript (strict) across both web/ (Astro 6) and api/ (Hono 4 on
Node.js) — one language end-to-end.

**Styling Solution:** No CSS framework. Author DESIGN.md's locked tokens (8 colors, the
Source Serif 4 ramp, 8px spacing scale, radii, the single elevation shadow) as CSS custom
properties in a global src/styles/tokens.css, plus Astro's per-component scoped <style>.
Smallest payload, exact control over the flat/hairline/editorial system. (Tailwind v4 via
@tailwindcss/vite was the considered alternative.)

**Build Tooling:** Vite (under Astro). `astro build` -> static dist/ with output: 'static'
(nginx serves it directly). Font subsetting (Source Serif 4 -> Latin, weights 400/600/700,
font-display: swap) and the JS budget enforced as build concerns. The build also runs the
content pipeline (KB index + Static Mirror data + Glass Box allowlist render +
JSON-LD/sitemap/robots) — detailed in the decisions step.

**Testing Framework:** Not included by the minimal starter (it makes few decisions).
Intended, to be formalized in the decisions step: Vitest (unit — pipeline/retrieval),
Playwright (e2e + JS-off/reduced-motion + view-source SEO checks), Lighthouse CI to guard
the NFR-1 perf budget. Added deliberately, not inherited.

**Code Organization:** pnpm monorepo in this repo: web/ (Astro: src/pages = Mirror routes,
src/components, src/layouts, src/styles, src/islands for the React hero/Guide), api/ (Hono:
Guide + Invite-Me endpoints), and the existing _bmad-output/ as a build-time content source
(allowlisted). Curated KB/content markdown location finalized in the decisions step.

**Development Experience:** `astro dev` (Vite HMR) for the site; a tsx/hono dev server for
the API; TypeScript strict; one `pnpm install`.

**Note:** Project initialization using these commands should be the first implementation
story (scaffold web/ + api/ as a pnpm workspace in this repo; wire nginx static + /api
proxy locally).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation):** Astro 6 SSG + React islands (frontend) · Hono 4 / Node-TS
(API) · Orama v3 build-time in-memory KB index (retrieval) · PostgreSQL + Drizzle ORM (data) ·
the agent grounding/safety contract · SSE `/api/guide` + JSON `/api/invite` · nginx static +
`/api` reverse-proxy topology · secrets server-side only.

**Important (shape architecture):** CSS-token styling · transactional email via Nodemailer
(Resend default) · self-hosted Umami v3 analytics · nanostores cross-island state · systemd +
deploy script · the build-time content pipeline · Zod validation + rate-limit/honeypot ·
Vitest/Playwright/Lighthouse-CI testing.

**Deferred (post-MVP / Stage 2–3):** embeddings/hybrid retrieval (Orama hybrid or pgvector) —
only if logged retrieval misses justify (NFR-7 trigger) · GSAP 4 + ScrollTrigger cinematic layer
+ ≤1 R3F/WebGL set-piece (Stage 2) · deterministic git→Timeline-Dot auto-harvest (Stage 2,
FR-17) · Adaptive Soundtrack (Stage 2; Suno regen prereq) · in-chat speaking-inquiry booking
(Stage 3, FR-12).

### Data Architecture

- **Database:** PostgreSQL (attached to the VM; pgvector available). Fixed input.
- **Access layer:** Drizzle ORM (typed schema + migrations; SQL-first) over raw `pg`, for
  type-safety and migration discipline. (Confirm exact version at scaffold.)
- **Invite-Me schema** (`inquiries`): `id`, `created_at`, `name`, `email`, `org`, `message`,
  `topic`, `attribution` (how-heard — structured for SM-1), `source` (`form` | `agent`, for the
  Stage-3 FR-12 path), `status` (`new` | `replied`), `mail_status` (`sent` | `failed` |
  `skipped`, so a failed notification is visible). Access-controlled; retention policy TBD (§9.2).
- **KB index:** Orama v3, built at build time from curated markdown (chunked at heading
  boundaries, ~300–800 tokens), serialized and loaded into memory by the Hono service at startup;
  BM25-style lexical, top-k 3–6; read-only at runtime (deterministic, fixed-per-deploy → grounds
  the agent; matches NFR-4 "build-time index only"). Agent's knowledge horizon = last build (it
  states its cutoff = last build date; resolves red-team H4 "never-stale").
- **Retriever abstraction:** a `search(query, k)` interface isolates the lexical engine, so the
  later lexical→hybrid/vector swap (Orama hybrid or pgvector) doesn't ripple into the agent/API.
- **Caching:** none needed (static content served by nginx; agent responses uncached in v1).

### Authentication & Security

- **No user authentication / accounts** — explicit non-goal; no visitor login surface.
- **Agent grounding & safety contract** (the product's security core): retrieve-only from the
  build-time index; citation-required (every claim → a Static Mirror route); fail-closed below
  threshold → canned "I don't have that documented" with NO model call (FR-6 / SM-C3); strict
  retrieved-context↔visitor-input separation for prompt-injection resistance, with production
  logging of attempted overrides (FR-9 / red-team M4); server-side persona never returned to the
  client.
- **Secrets:** `ABACUS_API_KEY` (LLM endpoint) fetched from the VM metadata service (IMDSv2) at
  runtime by the Hono service; DB URL + email-provider key in a gitignored `.env` on the VM. None
  reach the client — the static surface stays key-free (NFR-5).
- **API surface:** same-origin (`/api` under the site host via nginx → CORS closed); Zod schema
  validation on all inputs; rate-limiting on `/api/guide` and `/api/invite`; honeypot + rate-limit
  on the form (spam control without accounts/PII).
- **Privacy:** cookieless, no-PII analytics (Umami); inquiry data access-controlled, used only to
  respond (§9.2).

### API & Communication Patterns

- **Style:** minimal REST on Hono 4; two endpoints only.
- `POST /api/guide` — {query, threadContext} → retrieve → ground → **SSE stream** (Hono
  `streamSSE`); TTFT <~1.5s, hard ceiling ~10s → graceful in-voice fallback (NFR-4); per-message
  boundaries so the client batches `aria-live` per message (NFR-2). Endpoint-down → in-voice
  apology + Mirror links (closes the UX "Guide unavailable" gap).
- `POST /api/invite` — JSON → Zod validate → persist (Drizzle) → notify owner (Nodemailer) →
  receipt; records `mail_status`; failure path returns a non-destructive error so the client
  preserves values + offers a mailto fallback.
- **Email transport:** Nodemailer → a transactional provider (default **Resend**, free ~3k/mo;
  swappable to Brevo/Mailgun/SES via SMTP). SPF/DKIM DNS required at launch. Email is the
  notification; Postgres is the system of record (so an inquiry is never lost if mail fails).

### Frontend Architecture

- **Rendering:** Astro SSG (`output: 'static'`); every Mirror route prerendered to crawlable HTML
  (NFR-3).
- **Islands:** React only for the three islands — the Guide pill, the Guide panel, and the Invite-Me form (`client:visible`/
  `client:idle`); everything else ships 0 JS — holds the ~200–250KB budget (NFR-1).
- **State:** nanostores for the single cross-island signal (open the Guide from hero/footer);
  otherwise local React state inside the Guide island (the conversation thread). No global store.
- **Styling:** CSS custom properties = DESIGN.md tokens (`src/styles/tokens.css`) + Astro scoped
  `<style>`; Source Serif 4 subset (Latin, 400/600/700, `font-display: swap`).
- **Routing:** Astro file-based (`src/pages`) = the Mirror routes (`/`, `/about`, `/timeline`,
  `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/glass-box/[artifact]`, `/faq`,
  `/invite`, `/browse`).
- **Cinematic layer (Stage 2, deferred):** CSS scroll-driven baseline (~80%) + GSAP 4 +
  ScrollTrigger (verified free, incl. ScrollTrigger) for the directed camera path + ≤1 R3F/Three.js
  WebGL set-piece with static fallback; all behind the two-layer reduced-motion gate (NFR-2).

### Infrastructure & Deployment

- **Hosting:** Abacus VM; nginx vhost at `joshuabrandt.abacusai.cloud` (ingress :80). nginx serves
  `web/dist/` static AND reverse-proxies `/api/*` → the Hono service (Node, localhost high port).
  Only the agent + invite endpoints are dynamic (NFR-5).
- **Process management:** the Hono service runs under a systemd unit (auto-restart, boot
  persistence) over pm2.
- **Build/deploy:** `pnpm build` runs the content pipeline + `astro build`; deploy script =
  `git pull → pnpm install → pnpm build → systemctl restart <api> → nginx -t && systemctl reload
  nginx`. Local-on-VM build (code-as-CMS; no external CI needed to ship); optional GitHub Actions
  to run tests on push.
- **Content pipeline (build-time):** generates the Orama KB index, the Static Mirror data, the
  Glass Box render from `_bmad-output/` via the publish allowlist (default-deny), the Stage-1
  hand-curated Timeline manifest, and the JSON-LD + `sitemap.xml` + `robots.txt` (AI-crawler
  allow-list). Deterministic, from real artifacts (NFR-6).
- **Analytics:** self-hosted Umami v3 on the VM, reusing the attached Postgres (its own
  schema/tables); cookieless script in the site head.
- **Observability:** Hono structured request logs + retrieval-miss logging (NFR-7 — the
  documented trigger to revisit embeddings).
- **Launch gates:** `public_url_enabled` is OFF → must enable (hard gate); SPF/DKIM DNS for email;
  (Stage 2) Suno commercial regen for FR-30. `github_connected` OFF is fine (no live reads).
- **Testing/CI:** Vitest (pipeline/retrieval units), Playwright (e2e + JS-off/reduced-motion +
  `view-source` SEO checks), Lighthouse CI (NFR-1 budget guard).

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold the pnpm workspace in-repo: `web/` (Astro 6 + React) + `api/` (Hono 4) — first story.
2. Design tokens → `tokens.css` from DESIGN.md; base layout; nginx static + `/api` proxy locally.
3. Content pipeline: markdown → Orama KB index + Static Mirror data + Glass Box allowlist render +
   JSON-LD/sitemap/robots.
4. Hono `/api/guide` (retrieve → ground → SSE) with the grounding/safety contract; Guide island.
5. Postgres + Drizzle `inquiries`; `/api/invite` (persist + Nodemailer/Resend); Invite-Me form.
6. Mirror routes + SEO/GEO emission; Umami; analytics events.
7. systemd + deploy script; enable public URL; SPF/DKIM; launch checks (view-source/JS-off,
   Lighthouse, a11y).

**Cross-Component Dependencies:**
- The grounding contract spans the content pipeline (index) ↔ the Hono service ↔ the Mirror routes
  (citation targets): the agent can't cite what the Static Mirror doesn't expose, so they ship
  together.
- One publish allowlist (default-deny) governs BOTH the Glass Box render AND what the KB index/agent
  may surface — two consumers, one list (prevents the red-team H3 leak of internal docs).
- The `search(query, k)` retriever interface isolates the lexical→hybrid swap so the embeddings
  decision (NFR-7) stays local.
- nginx is the single front door (static + `/api` proxy + the analytics path); the static/dynamic
  seam lives there.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

Rules that bind every dev agent so parallel work stays compatible — covering the seams most likely
to drift on this stack. DESIGN.md / EXPERIENCE.md remain authoritative for visual/behavioral/a11y
specifics ("spine wins on conflict"); this doc is authoritative for stack/structure/contracts.

### Naming Patterns

**Database (Postgres + Drizzle):**
- Tables: snake_case, plural (`inquiries`). Columns: snake_case (`created_at`, `mail_status`).
- PK: `id` = uuid (`gen_random_uuid()` — non-enumerable inquiry IDs). [choice: uuid over serial.]
- Timestamps: `created_at` / `updated_at` as `timestamptz` (UTC). FKs: `<entity>_id`. Indexes:
  `idx_<table>_<cols>`. Drizzle schema in `api/src/db/schema.ts`; TS properties are camelCase →
  snake_case columns (the ONLY place the two casings meet).

**API / HTTP:**
- Routes under `/api`, lowercase kebab; action-style endpoints (`/api/guide`, `/api/invite`).
- JSON request/response fields: **camelCase** [choice: camelCase JSON end-to-end — TS idiom both
  sides; DB snake_case is bridged in Drizzle, never leaked raw]. Astro route params: bracket syntax
  (`/glass-box/[artifact].astro`); Mirror routes lowercase kebab.

**Code (TypeScript / Astro / React):**
- Astro components: PascalCase `.astro` (`Hero.astro`, `SceneRail.astro`). Route pages: lowercase
  matching the URL (`index.astro`, `glass-box/[artifact].astro`).
- React islands: PascalCase `.tsx` (`GuidePanel.tsx`, `InviteForm.tsx`) in `web/src/islands/`.
- Library modules: kebab-case `.ts` (`kb-index.ts`, `llm-client.ts`). Functions/vars camelCase;
  types/interfaces PascalCase; true constants UPPER_SNAKE.

**CSS:**
- Tokens = CSS custom properties, kebab, namespaced by group: `--color-*`, `--font-*`, `--space-*`,
  `--radius-*`, `--shadow-float` — authored once in `web/src/styles/tokens.css` from DESIGN.md
  (verbatim values). Component classes: semantic kebab matching DESIGN.md component names
  (`.scene-rail`, `.talk-card`, `.guide-panel`), scoped per Astro component. Never hardcode a
  hex/size a token covers.

### Structure Patterns

Monorepo (one pnpm workspace; this repo = single source of truth):

    / (root)          pnpm-workspace.yaml, shared tsconfig/eslint/prettier, deploy script
      web/            Astro 6 site
        src/pages/      Mirror routes (= the route map)
        src/layouts/    base + page layouts
        src/components/ Astro components (grouped by scene/domain)
        src/islands/    React islands (Hero affordances, GuidePanel, InviteForm)
        src/styles/     tokens.css + globals
        src/lib/        build/runtime helpers (jsonld, pipeline, allowlist reader)
        public/         subset fonts, static assets
      api/            Hono 4 service
        src/index.ts    app entry
        src/routes/     guide.ts, invite.ts
        src/lib/        retriever (Orama), llm-client, email, env
        src/db/         schema.ts + migrations/
      content/        curated KB markdown (the agent's source of truth)
      scripts/        build-time content pipeline + deploy
      _bmad-output/   real BMAD artifacts (Glass Box source, via allowlist)

- Tests: co-located `*.test.ts` (Vitest); e2e in `web/e2e/` (Playwright).
- Publish allowlist: ONE file (`content/glassbox.allowlist.ts`), default-deny, read by BOTH the
  Glass Box render and the KB indexer (the single gate preventing internal-doc leakage).
- Env: a typed `env.ts` per package validates required vars (Zod) at startup, fail-fast; secrets
  never imported into `web/` client code.

### Format Patterns

**API responses:** success = **direct JSON**, no envelope, HTTP status carries success [choice:
direct over `{data,error}` wrapper]. Error = `{ error: { code, message } }` + 4xx/5xx; full detail
logged server-side, safe message to client.
**`/api/guide` SSE** (`text/event-stream`): typed events — `token` (incremental text), `citation`
(`{route,label}`), `done`, `error`. Client batches the `aria-live` announcement once per completed
message (NFR-2), never per `token`.
**Data:** camelCase JSON; ISO-8601 UTC date strings (`timestamptz` in DB); `true`/`false`; uuid
string IDs.

### Communication Patterns

**Analytics (Umami custom events):** kebab `area-action`, consistent across the funnel —
`guide-opened`, `guide-query`, `citation-followed`, `invite-submitted`, `channel-clicked`,
`speaker-reel-played`. No PII in props (§9.2/NFR-7).
**Cross-island state (nanostores):** one atom `$guideOpen` in `web/src/lib/store.ts`; hero/footer
set it, the Guide island subscribes. No other global state.
**Logging (api):** structured JSON lines, levels error/warn/info/debug. A dedicated
`retrieval_miss` info event logs `{query, topScore, threshold}` (NFR-7 — the embeddings trigger).
No PII, no inquiry message bodies in logs.

### Process Patterns

**Error handling:** central Hono error middleware → safe `{error:{code,message}}` + status; React
islands wrapped in error boundaries — a failing island degrades to the static content beneath it
(never a white-screen). The Guide on timeout (~10s)/endpoint-down → in-voice fallback + Mirror
links, not a raw error.
**Validation:** Zod at the API boundary is authoritative; islands add inline validation for UX
only. Never trust client validation alone.
**Loading/async:** the Guide "thinking" state is the designed per-message retrieval moment
(`role="status"`, announced once); forms use a disabled `submitting` state; heavy/island content
lazy-loads behind a static poster.
**Retry:** the client may retry a network failure (preserving form values); the agent never
auto-retries the model on low confidence (fail-closed = canned answer, no model call).

### Enforcement Guidelines

**All dev agents MUST:**
- Treat the UX spines as authoritative for visual/behavioral/a11y specifics; this doc for
  stack/structure/contracts; use Glossary terms verbatim (no synonyms).
- Keep the DB↔client casing boundary inside Drizzle; emit camelCase JSON; never leak snake_case or
  secrets to `web/` client code.
- Route every visitor-facing fact through a crawlable Mirror route (the agent cites, never invents);
  honor the publish allowlist (default-deny) for anything from `_bmad-output/`.
- Honor the a11y contract on every interactive surface: real `<button>`/`<a>`, visible
  `:focus-visible`, color-never-the-sole-signal, the two-layer reduced-motion gate, per-message
  aria-live — via a shared gate utility, not re-implemented per component.
- Keep the NFR-1 budget: 0-JS by default, hydrate only the three islands, no token hardcoding.

**Enforcement:** shared root ESLint + Prettier + TS strict; Vitest/Playwright/Lighthouse-CI gates;
code-review against this section. These rules seed the dev-agent `project-context.md` (via
bmad-generate-project-context).

### Pattern Examples

**Good:** `inquiries.created_at` (DB) ↔ `inquiry.createdAt` (TS) via Drizzle; `GuidePanel.tsx`
emits `guide-query`; `--color-accent` for the navy, never `#1E3A5F` inline.
**Anti-pattern:** a `{data:...}` envelope on one endpoint and direct JSON on another; a React island
that throws and white-screens the page; a hex literal duplicating a token; the agent stating a fact
with no Mirror citation.

## Project Structure & Boundaries

### Complete Project Directory Structure

(Stage-1 concrete tree; Stage-2 dirs noted inline. Existing BMAD/tooling dirs preserved.)

    portfolio/                              # repo root = single source of truth (FR-33)
    ├── package.json                        # root workspace scripts: dev, build, test, deploy
    ├── pnpm-workspace.yaml                 # packages: web, api, shared
    ├── tsconfig.base.json                  # shared strict TS config
    ├── eslint.config.js  .prettierrc       # shared lint/format
    ├── .gitignore  .env.example            # .env, dist, node_modules, api/data ignored
    ├── .github/workflows/ci.yml            # Vitest + Playwright + Lighthouse CI (optional)
    │
    ├── shared/                             # API contract — imported by web islands AND api
    │   ├── package.json
    │   └── src/
    │       ├── schemas.ts                  # Zod: InviteInput, GuideQuery (one source of truth)
    │       └── events.ts                   # SSE event types: token | citation | done | error
    │
    ├── web/                                # Astro 6 SSG site (output: 'static')
    │   ├── astro.config.mjs                # @astrojs/react, content-layer glob loader → ../content
    │   ├── package.json  tsconfig.json
    │   ├── public/
    │   │   ├── fonts/                       # Source Serif 4 subset (woff2, 400/600/700)
    │   │   └── og/                          # Open Graph share images
    │   ├── e2e/                             # Playwright: JS-off, reduced-motion, view-source SEO
    │   └── src/
    │       ├── pages/                       # FILE ROUTES = the Mirror routes
    │       │   ├── index.astro              # Home Scene Arc (Hero→Thesis→…→Close)  FR-1,2,32
    │       │   ├── about.astro              # canonical Person+ProfilePage bio       NFR-3
    │       │   ├── timeline.astro           # Master Timeline (hand-curated)         FR-16
    │       │   ├── speaking.astro           # Speaker Surface                        FR-19,20
    │       │   ├── speaking/reel.astro      # reel metadata (VideoObject)            NFR-3
    │       │   ├── work/loandemo.astro      # Flagship case study                    FR-22
    │       │   ├── glass-box/index.astro    # build-story index                      FR-13,14
    │       │   ├── glass-box/[artifact].astro  # artifact reader                     FR-13
    │       │   ├── faq.astro                # crawlable FAQPage Q&A                   NFR-3
    │       │   ├── invite.astro             # Invite-Me page                         FR-31
    │       │   ├── browse.astro             # static fallback index                  FR-8
    │       │   ├── robots.txt.ts            # generated robots (AI-crawler allow)    NFR-3
    │       │   └── sitemap.xml.ts           # generated sitemap                      NFR-3
    │       ├── layouts/
    │       │   ├── BaseLayout.astro         # <html lang=en>, head, footer, JSON-LD slot
    │       │   └── MirrorLayout.astro       # answer-first lede + self-canonical + scene-rail slot
    │       ├── components/                  # Astro (0-JS), grouped by scene/domain
    │       │   ├── hero/HeroStatic.astro    ├── scene/SceneRail.astro
    │       │   ├── timeline/{TimelineSpine,TimelineDot,EraBand}.astro
    │       │   ├── glassbox/{ArtifactCard,ArtifactReader}.astro
    │       │   ├── speaking/{TalkCard,BioBlock,Metric,Testimonial,ReelPoster}.astro
    │       │   ├── common/{Footer,Wordmark,Kicker,CitationChip}.astro
    │       │   └── seo/JsonLd.astro
    │       ├── islands/                     # React (hydrated) — the ONLY shipped JS
    │       │   ├── GuidePanel.tsx           # the Guide: SSE client            FR-6,7,8,9
    │       │   ├── GuidePill.tsx            # open trigger ($guideOpen)
    │       │   └── InviteForm.tsx           # accessible form                  FR-31
    │       ├── styles/{tokens.css, global.css}   # DESIGN.md tokens → CSS custom properties
    │       └── lib/
    │           ├── store.ts                 # nanostores $guideOpen
    │           ├── jsonld.ts                # Person/Event/VideoObject/CreativeWork/FAQPage builders
    │           ├── motion.ts                # two-layer reduced-motion gate utility
    │           └── analytics.ts             # Umami event helpers
    │
    ├── api/                                 # Hono 4 service (the Guide + Invite-Me)
    │   ├── package.json  tsconfig.json  drizzle.config.ts
    │   ├── data/                            # generated: kb-index (Orama) — gitignored
    │   └── src/
    │       ├── index.ts                     # Hono app: logging, rate-limit, error middleware
    │       ├── env.ts                       # Zod-validated env, fail-fast
    │       ├── routes/
    │       │   ├── guide.ts                 # POST /api/guide: retrieve→ground→SSE  FR-6,7,9
    │       │   └── invite.ts                # POST /api/invite: validate→persist→email  FR-31
    │       ├── lib/
    │       │   ├── retriever.ts             # Orama load + search(query,k) (abstracted seam)
    │       │   ├── grounding.ts             # prompt assembly, context↔input separation, persona
    │       │   ├── llm-client.ts            # VM OpenAI-compatible client (streaming)
    │       │   ├── email.ts                 # Nodemailer → Resend
    │       │   └── logger.ts                # structured JSON logs + retrieval_miss (NFR-7)
    │       └── db/
    │           ├── schema.ts                # Drizzle: inquiries
    │           ├── client.ts                # pg pool + drizzle
    │           └── migrations/
    │
    ├── content/                             # curated KB markdown = the agent's source of truth
    │   ├── kb/{about,speaking,loandemo,faq,bmad-method,...}.md   # chunked at headings
    │   ├── timeline/dots.ts                 # hand-curated Stage-1 Dots manifest      FR-16
    │   └── glassbox.allowlist.ts            # DEFAULT-DENY publish allowlist (the one gate)
    │
    ├── scripts/
    │   ├── build-kb-index.ts                # content/kb/*.md → Orama index → api/data/
    │   ├── render-glassbox.ts               # _bmad-output/ via allowlist → reader data  FR-13
    │   └── deploy.sh                        # git pull → build → restart api → reload nginx
    │
    ├── deploy/
    │   ├── nginx/joshuabrandt.conf          # vhost: serve web/dist + proxy /api → Hono
    │   └── systemd/portfolio-api.service    # the Hono service unit
    │
    ├── _bmad-output/                        # EXISTING — real BMAD artifacts (Glass Box source)
    ├── _bmad/  .claude/  docs/              # EXISTING — BMAD config, skills/rules, docs
    └── epic-cycle-workflow-creation.md      # EXISTING

    Stage-2 additions (not built now): web/src/lib/cinematic/ (GSAP/ScrollTrigger camera path),
    web/src/islands/WebGLSetpiece.tsx (≤1 R3F, static fallback), scripts/harvest-timeline.ts
    (deterministic git→Dot auto-harvest, FR-17), api vector path (Orama hybrid or pgvector).

### Architectural Boundaries

**API boundaries:** exactly two public endpoints behind nginx — `POST /api/guide` (SSE) and
`POST /api/invite` (JSON). The static site (`web/dist`) has NO server boundary (pure files served
by nginx). Outbound from `api` only: the VM LLM endpoint (grounding) and Resend (email). CORS is
closed (same-origin under the site host).

**Component boundaries:** Astro components render at build time, ship 0 JS. The ONLY client
boundary is the three React islands; they reach the server only via `fetch`/SSE to `/api/*` and
share state only through the single `$guideOpen` nanostore. A failing island degrades to the
static content beneath it.

**Service boundaries:** `web` (build artifact) and `api` (runtime service) are separate processes;
they share the typed contract via `shared/` (Zod schemas + SSE event types) — never by importing
each other's internals. The build pipeline (`scripts/`) writes the Orama index that `api` reads
read-only at startup.

**Data boundaries:** Postgres holds `inquiries` (owned by `api`/Drizzle) and Umami's own tables
(owned by Umami) — separate schemas. The KB index is a build artifact (pipeline writes, `api`
reads). `content/` markdown is the read-only source of truth; `_bmad-output/` is read only through
the allowlist.

### Requirements to Structure Mapping

**FR-category → location:**
- Experience shell (FR-1,2) → `web/pages/index.astro` + `components/hero,scene`
- The Guide (FR-6,7,8,9) → `api/routes/guide.ts` + `api/lib/{retriever,grounding,llm-client}` +
  `web/islands/GuidePanel.tsx` + `content/kb/`
- Glass Box (FR-13,14) → `scripts/render-glassbox.ts` + `content/glassbox.allowlist.ts` +
  `web/pages/glass-box/*` + `components/glassbox`
- Master Timeline (FR-16) → `content/timeline/dots.ts` + `web/pages/timeline.astro` +
  `components/timeline`
- Speaker Surface (FR-19,20) → `web/pages/speaking*.astro` + `components/speaking` +
  `content/kb/speaking.md`
- Projects (FR-22,23) → `web/pages/work/loandemo.astro` + `content/kb/loandemo.md`
- Conversion (FR-31,32) → `api/routes/invite.ts` + `api/db/schema.ts` + `api/lib/email.ts` +
  `web/islands/InviteForm.tsx` + `web/pages/invite.astro`
- Content pipeline (FR-33,34) → `scripts/*` + `content/` + root build
- Discoverability (FR-35) → `web/lib/jsonld.ts` + `components/seo` + `pages/{robots,sitemap}`
- Analytics (FR-36) → `web/lib/analytics.ts` + Umami (deploy)

**Cross-cutting concerns → home:**
- a11y (NFR-2) → `web/lib/motion.ts` (shared reduced-motion gate) + the UX spines (authoritative)
- SEO/GEO (NFR-3) → `MirrorLayout.astro` (answer-first + canonical) + `lib/jsonld` +
  `pages/{robots,sitemap}`
- perf (NFR-1) → `astro.config` (island hydration) + `public/fonts` (subset) + Lighthouse-CI budget
- grounding/security → `api/lib/grounding.ts` + `env.ts` + `index.ts` middleware
- secrets (NFR-5) → `api/env.ts` + `.env` (gitignored) + VM-metadata fetch in `llm-client`/`email`

### Integration Points

**Internal communication:** islands → `/api/*` (fetch/SSE) only; cross-island via `$guideOpen`;
build pipeline → Orama index file → `api` (read-only).
**External integrations:** VM OpenAI-compatible LLM endpoint (api, streaming, key from VM metadata);
Resend transactional email (api); Umami (browser script → Umami service). No runtime reads of
GitHub/YouTube/Suno (all curated into `content/`).
**Data flow:**
1. Build: `content/` + `_bmad-output/`(allowlisted) → pipeline → Orama index (`api/data/`) + Astro
   `web/dist/` (Mirror pages, Glass Box, JSON-LD, sitemap, robots).
2. Read path: visitor → nginx → static `web/dist/` (fast, key-free).
3. Guide: island → `/api/guide` → retriever (Orama in-mem) → grounding → LLM endpoint (stream) →
   SSE → citations route the page to Mirror routes.
4. Invite: island → `/api/invite` → Zod → Drizzle/Postgres + Nodemailer/Resend → receipt
   (`mail_status` recorded).
5. Analytics: page/island → Umami script → Umami (Postgres).

### File Organization Patterns

**Configuration:** root holds shared `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`,
`pnpm-workspace.yaml`, `.env.example`; each package extends the root TS config; secrets live only
in a gitignored `.env` on the VM.
**Source:** `web` by scene/domain (components) with islands isolated in `src/islands/`; `api` by
concern (`routes/`, `lib/`, `db/`); the contract in `shared/`.
**Tests:** co-located `*.test.ts` (Vitest) next to the unit; `web/e2e/` for Playwright (JS-off,
reduced-motion, `view-source` SEO).
**Assets:** subset fonts + OG images in `web/public/`; curated media curated into the repo (no
runtime external reads).

### Development Workflow Integration

**Dev server:** `pnpm dev` runs `astro dev` (web, Vite HMR) + the Hono dev server (api, tsx watch)
concurrently; a local nginx (or Astro proxy) maps `/api` → the Hono port to mirror production.
**Build:** `pnpm build` = `build-kb-index` + `render-glassbox` (pipeline) → `astro build` →
`web/dist/` + `api/data/kb-index`. Deterministic from `content/` + allowlisted `_bmad-output/`.
**Deploy:** `scripts/deploy.sh` on the VM — `git pull → pnpm install → pnpm build → systemctl
restart portfolio-api → nginx -t && systemctl reload nginx`. nginx serves `web/dist` + proxies
`/api`. Launch gate: enable `public_url_enabled`; add SPF/DKIM DNS.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** One TypeScript stack end-to-end — Astro 6.4 + React islands, Hono 4,
Orama v3, Drizzle + Postgres, CSS-token styling — with no version or runtime conflicts. The
static-first + thin-API split (nginx serves `web/dist`, proxies `/api/*` to Hono) is a proven,
internally consistent topology that directly realizes NFR-5 (key-free static runtime). GSAP 4 (now
free) de-risks the Stage-2 cinematic layer at zero licensing cost.

**Pattern Consistency:** The conventions support the decisions without contradiction — the
camelCase-JSON ↔ snake_case-DB boundary is isolated in Drizzle; the SSE event contract lives in
`shared/`; the islands-only hydration rule enforces the NFR-1 budget; one default-deny allowlist
governs both Glass Box render and KB indexing.

**Structure Alignment:** The directory tree implements every decision; the web/api/shared service
boundaries are clean; integration points (islands → `/api/*`, pipeline → Orama index → api) are
explicit. No decision lacks a home in the structure.

### Requirements Coverage Validation ✅

**Functional Requirements (Stage-1, all 19 supported):** FR-1/2 → `index.astro` + hero/scene
components · FR-6/7/8/9 → `api/guide` (retriever + grounding) + `GuidePanel` + Mirror citations +
`browse`/footer · FR-13/14 → `render-glassbox` + allowlist + `glass-box/*` · FR-16 →
`content/timeline/dots` + `timeline.astro` · FR-19/20 → `speaking*.astro` + speaking components ·
FR-22/23 → `work/loandemo.astro` + curated `content/kb` · FR-31/32 → `api/invite` + Drizzle +
email + `InviteForm` + Close CTAs · FR-33/34 → `content/` + `scripts/` build · FR-35 → `jsonld` +
robots/sitemap · FR-36 → `analytics` + Umami. **Stage 2/3** layer onto the same base by design
(cinematic on the scene/island base; auto-harvest as a `scripts/` addition over the same
`_bmad-output/`; hybrid retrieval via the abstracted `search(query,k)` seam; agent booking feeds
the same `inquiries` store) — the "extend without re-platforming" goal is architecturally
supported (a goal, honestly, not a guarantee — red-team L5).

**Non-Functional Requirements (all 7 addressed):** NFR-1 → SSG 0-JS baseline + islands-only +
font subset + Lighthouse-CI budget · NFR-2 → shared reduced-motion gate + non-modal Guide contract
+ AA tokens (UX spines authoritative) + Playwright JS-off/reduced-motion · NFR-3 → SSG Mirror +
answer-first/canonical `MirrorLayout` + JSON-LD + robots/sitemap + `view-source` check · NFR-4 →
SSE streaming + in-memory build-time index + fail-closed + ~10s fallback (targets pending load
test) · NFR-5 → static + two endpoints + secrets server-side via VM metadata · NFR-6 → code-as-CMS
deterministic pipeline · NFR-7 → Umami + structured logs + `retrieval_miss` logging.

### Implementation Readiness Validation ✅

**Decision Completeness:** all critical decisions documented with verified-current versions
(Astro 6.4, Hono 4, Orama v3, Umami v3, GSAP 4); the agent model is mid-tier and model-agnostic at
the `llm-client` seam (confirm exact pick at impl).
**Structure Completeness:** complete, specific tree; boundaries and integration points defined; FR
→ location mapping present.
**Pattern Completeness:** naming/format/structure/communication/process patterns + enforcement +
good/anti examples cover the identified conflict points.

### Gap Analysis Results

**Critical gaps (block implementation): NONE.** Stage 1 can start at the scaffold step.

**Important gaps (resolve before the *relevant story*, not before start):**
- Content inventory (carried from PRD §14 / UX open gaps): `loandemo` repo + artifact URLs;
  READY 2026 talk details + reel; channel handles; testimonials/logos/audience metrics; signature-
  talk titles; Invite-Me response-time `N`; real headshot asset; Guide monogram mark. These gate
  specific stories' "done," not the architecture.
- Invite-Me data retention policy (§9.2, TBD) — a decision, not a blocker.
- Email provider account + SPF/DKIM DNS — a launch task.
- `public_url_enabled` is OFF — hard launch gate.

**Nice-to-have:**
- True Source Serif 4 italic file vs synthesized italic (perf call, DESIGN.md open).
- A dedicated `loandemo` case-study layout (UX noted it reuses the artifact-card pattern; not yet
  mocked).
- Final `robots.txt` AI-crawler token list (confirm at build — tokens drift).

### Validation Issues Addressed

No coherence or coverage issues required architectural change. The two risks the PRD red-team
raised that touch architecture were already resolved upstream and are reflected here: the Glass Box
leak risk (H3) is closed by the single default-deny allowlist gating both the render and the index;
the Stage-1 over-scope risk (C3/C4) was mitigated by Josh's earlier scope call (hand-curated
Timeline; deterministic git→Dot harvest deferred to Stage 2). The "never-stale" vs build-time-index
tension (H4) is resolved by the agent stating its knowledge horizon = last build.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION (all 16 checklist items confirmed; no Critical Gaps —
the open items are content-inventory and launch tasks, not architecture gaps).

**Confidence Level:** high — the stack is verified-current and internally coherent, every Stage-1
FR/NFR maps to a concrete component, and the riskiest pipeline (git→Timeline harvest) was already
deferred out of the MVP critical path.

**Key Strengths:**
- Static-first + thin-API split → cheap, robust, key-free, fully crawlable — directly serves the
  #1 SEO/speaking goal.
- One default-deny allowlist closes the internal-doc leak risk by construction.
- The abstracted retriever seam lets lexical → hybrid happen without a rewrite (NFR-7 trigger).
- The grounding/safety contract (fail-closed, cite-required, injection separation, server-side
  persona) is first-class, not bolted on.
- Stage 2/3 layer onto the same base — no re-platform designed in.

**Areas for Future Enhancement:**
- Embeddings/hybrid retrieval when logged misses justify it.
- The Stage-2 cinematic layer (GSAP camera path; ≤1 R3F/WebGL set-piece).
- Deterministic git→Timeline-Dot auto-harvest (FR-17).
- In-chat speaking-inquiry booking (FR-12).
- Solo-build execution risk (PRD red-team C4) is a project-management concern, not an architecture
  gap — the staged, de-risked scope is the mitigation.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow the architectural decisions exactly as documented; treat DESIGN.md + EXPERIENCE.md as
  authoritative for visual/behavioral/a11y specifics ("spine wins on conflict") and this document
  for stack/structure/contracts.
- Use the implementation patterns consistently; use Glossary terms verbatim.
- Respect the web/api/shared boundaries and the single-allowlist gate.
- Refer to this document for all architectural questions; surface genuine gaps rather than guessing.

**First Implementation Priority:** scaffold the pnpm workspace in this repo —
`npm create astro@latest web` (Empty/Minimal, TypeScript strict) + `astro add react`,
`npm create hono@latest api` (Node), and a `shared/` package — then wire the local nginx static +
`/api` proxy. (Project initialization is the first story.)
