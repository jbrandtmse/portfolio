# Lead per-story smoke — Story 3.5 (The Close — follow/subscribe CTAs & curated creative touch)

Date: 2026-06-07 · Method: browser (chrome-devtools, real Chrome — drove the home `#close` scene live) · Result: **PASS** · iterations: 1 · defects caught by smoke: 0
Screenshot: `story-3.5-the-close.png` (home Close scene, island hydrated)

Drove the built home `/` in Chrome, scrolled to the `#close` scene (triggering the `client:visible` island), and inspected the final conversion surface live. The JS-on/JS-off submit paths + analytics are also covered by the green 213-test e2e suite (QA + code-review).

## AC1 — the Close conversion surface (verified live)
- **Embedded InviteForm island hydrated** (`client:visible`): `<form action="/api/invite" method="POST">` with 7 fields, present on home (the Story-3.4 island reused). JS-on submit → inline aria-live success; JS-off native POST → 303 `/invite/thanks/` (both covered by the e2e against real Postgres).
- **3 follow/subscribe CTAs** (real `<a>`, 0-JS analytics):
  - "Subscribe on YouTube `[OPEN: handle]`" → `https://www.youtube.com/`, `data-umami-event-channel="youtube"`
  - "Follow on GitHub `[OPEN: handle]`" → `https://github.com/`, `channel="github"`
  - "Listen on Suno `[OPEN: handle]`" → `https://suno.com/`, `channel="suno"`
  - Each carries `data-umami-event="channel-clicked"`; handles `[OPEN]` in VISIBLE text; hrefs sourced from `CHANNEL_SAMEAS` (consistent with `/about` sameAs).
- **`invite-submitted`** fires from the island on success with `source:'close'` and NO PII (verified by QA's mutation-checked e2e; env-gated no-op without Umami).

## AC2 — curated creative touch (FR-23 / §9.1)
- A single curated creative touch: "A sample of the work · Listen on Suno `[OPEN: track title]`" — a static (CSS-gradient) poster wrapping a curated `<a href="https://suno.com/song/[OPEN: curated-track-id]">` that is followable JS-off.
- **No autoplay** (verified: no `[autoplay]` element). **No live runtime read** of YouTube/Suno/GitHub — the URL is hardcoded/`[OPEN]` (QA/CR verified zero provider sub-resources at build AND zero live provider network at runtime). The §9.1 guardrail holds.

## AC3 — NFR-1 home island carve-out
- Home `/` references the React island (×3) AND keeps its gated scene-rail script — the two sanctioned executable surfaces. The CTAs (`data-umami-event`) + the CSS-poster creative touch add NO app JS. EVERY non-island route (about, speaking, glass-box, timeline, work/loandemo, faq, browse, invite/thanks, speaking/reel) references 0 React chunks (the island is isolated to `/` and `/invite/`).

## AC4/AC5 — env-gated analytics + floor
- `channel-clicked` data-attrs present but inert without Umami; `invite-submitted` a silent no-op without Umami; no PII. Literal `pnpm test:all` green (reviewer-run, exit 0): vitest scripts 107 / api 68 / web 630 · Playwright 213 (incl. real-Postgres home JS-off persist + axe AA 0 on `/`) · Lighthouse budgets hold on `/` (client:visible island + light CSS poster). Byte-deterministic; no exclamation marks; trailing-slash links.

## Verdict
The SM-1 conversion path is complete end-to-end on the home arc: an organizer can invite via the embedded form (JS-on or JS-off), a wanderer can follow/subscribe (3 channel CTAs) or enjoy the curated creative touch — all accessible, 0-fabrication (`[OPEN]` everywhere unconfirmed), analytics env-gated, and the home stays within the NFR-1 island budget. PASS — clear to commit. **Epic 3 feature set complete.**
