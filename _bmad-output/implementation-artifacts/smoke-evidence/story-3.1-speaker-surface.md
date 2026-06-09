# Lead per-story smoke — Story 3.1 (Speaker Surface — reel & signature talks)

Date: 2026-06-06 · Method: browser/e2e + build-output inspection · Result: **PASS** · iterations: 1 · defects caught by smoke: 0 (the MED reel-page self-link was caught + fixed at code-review; the smoke confirmed the fix on the real build)

Exercised the real `astro build` output of `/speaking/` and `/speaking/reel/` (the user-observable Speaker Surface), plus the authoritative literal canonical gate re-run after the code-review fix.

## Canonical gate (post-code-review, AC5)

`pnpm test:all` re-run end-to-end → **EXIT 0**: scripts vitest 107 · api vitest 2 · web vitest 578 · Playwright e2e 180 (incl. 22 `[speaking]` + axe AA) · Lighthouse on `/` + `/about/` all budgets. Two clean builds byte-identical (NFR-6).

## /speaking/ (AC1, AC3, AC4)

- **Reel is the lead item:** `ReelPoster` `<a href="/speaking/reel/">`, `aria-label="Watch speaker reel — Joshua R. Brandt, MSE · READY 2026 · approximately 90 seconds"` (names the reel + ~90s duration; static link-out, followable JS-off). No autoplay / no player JS.
- **Signature talks:** 3 `TalkCard`s with outcome-oriented titles; the first abstract inline, the other two inside native `<details>` (2 `<details>` in the DOM) with full abstract text present; the veteran-IC vantage is the 3rd talk.
- **Credibility floor:** every unconfirmed talk title/abstract carries a visible `[ASSUMPTION]` flag in the DOM text (not tint/style alone); the reel video is `[OPEN]`.
- **Structured data:** exactly **3 `Event` JSON-LD nodes** (one per talk), `performer.name` = the real "Joshua R. Brandt, MSE", `startDate` a fixed `2026-01-01` constant (deterministic `[OPEN]` placeholder until Josh confirms dates/venues).

## /speaking/reel/ (AC2 + the code-review posterHref fix)

- **VideoObject** in the initial HTML: `@type=VideoObject`, `duration=PT1M30S`, real name.
- **posterHref fix confirmed:** the reel-page poster `<a>` links to the hosted video `https://joshuabrandt.abacusai.cloud/reel.mp4` (`[OPEN]` until the asset lands) — NOT a self-link to `/speaking/reel/`. (On `/speaking/`, the poster still correctly links to `/speaking/reel/` — AC1 intact.)

## NFR floor

- **0 executable JS** on both routes (1 `<script>` each, both `application/ld+json` DATA).
- **AA:** axe 0 violations on both routes (Playwright e2e tier).
- **NFR-6:** byte-deterministic build; all JSON-LD dates fixed constants.

## Verdict

All ACs exercised against the real build/runtime and confirmed; the code-review fix verified live. PASS — clear to commit.
