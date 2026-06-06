# Story 2.0 — lead per-story smoke evidence (URL-form consistency)

**Method:** browser + served-runtime. Fresh `pnpm --filter web build` → `web/dist` served by `python3 -m http.server`
(mirrors the production nginx `try_files $uri $uri/` directory-redirect behavior) on 127.0.0.1:8099, exercised with
curl + the chrome-devtools MCP. Did NOT touch the live deployment. **Result: PASS (1 iteration, 0 defects caught beyond the automated tiers).**

## AC6 — no 301 hop on internal navigation (the user-observable outcome)
- All 9 non-root routes in the NEW trailing-slash form → single **HTTP 200, no redirect** (`--max-redirs 0`):
  `/about/ /timeline/ /speaking/ /speaking/reel/ /work/loandemo/ /glass-box/ /faq/ /invite/ /browse/`.
- Real-browser footer "About" click → navigated directly to `/about/` → single `GET /about/ [200]`, **zero redirect chain**.
- Proof the fix matters: the OLD slashless form still 301-redirects (`/about → 301 → /about/`, `/glass-box → 301 → …`,
  `/work/loandemo → 301 → …`) — exactly the hop the fix removes by pointing every internal link at the trailing-slash form.

## AC2 — every rendered internal route link is trailing-slash
- Home `/` document (curl + a11y snapshot): footer (all 10), hero fork (`/speaking/`, `/faq/`), scene teasers
  (`/timeline/`, `/speaking/`, `/work/loandemo/`, `/glass-box/`, `/invite/`), rail jump (`/speaking/`) — ALL trailing-slash.
- Correct exclusions (NOT slashed): in-page fragments (`#hero`, `#thesis`, `#close`, …), assets (`/_astro/`, `/fonts/`).

## AC3 / AC4 / AC5 — canonical === sitemap <loc> === link form
- Served canonicals are trailing-slash (`…/about/`, `…/speaking/reel/`, `…/glass-box/`).
- `dist/sitemap.xml` `<loc>` is trailing-slash for all 10 routes; **no `//` double-slash** anywhere.
- The three surfaces agree (link form === canonical form === sitemap form), all trailing-slash.

## Quality floor
- Console: **0 messages** on `/` and `/about/` (clean; 0-JS Mirror pages, single gated rail script on home — NFR-1 intact).
- Screenshot: `smoke-evidence/story-2.0-about-trailing-slash.png` (the /about/ page rendering correctly).
