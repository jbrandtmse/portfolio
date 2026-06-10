# Test Automation Summary — Story 9.1 (The Demonstrator), QA stage

Date: 2026-06-10 · Stage: `qa-generate-e2e-tests` (epic-cycle) · Verified fresh (Rule 10).

## Gate exit codes (Rule 14/16)

- `pnpm test:all` → **exit 0** (typecheck → lint → format:check → test → test:e2e → lh; 1377 unit + 453 e2e + Lighthouse all green).
- `pnpm run check-deterministic` → **exit 0** (web/dist byte-identical across two clean builds; 158 files; matching tree hash).

## Credibility audit (Rule 9 — broad)

Built + served the real site; resolved every manifest link against `web/dist/`.

- 6 published Glass Box readers + `/timeline/` all resolve 200; live-site URL is the deployed origin; 4 ghost readers (architecture/epics/retrospective/shipping) correctly absent and rendered as honest non-link "coming in the Glass Box" spans.
- Verified groundings: "47 ideas" (brainstorm `ideas_generated: 47`), "thirty-year arc" (timeline 1996–2026), "Source Serif 4" + "ink-on-cream" (UX Design reader).
- **Two stale-count fabrications found + FIXED:** "Fourteen project rules" (actual 17) and "nine epics" (actual 10). Reworded to durable qualitative framing in `content/demonstrator.ts` + `content/kb/demonstrator.md`. Stage-4 observable "will be published" forward-promise softened to a present fact.
- Final served output: no `[OPEN:`, no ADR, no invented BMAD expansion, no exclamation, no ghost-as-live link.

## Tests added / hardened (mutation-verified)

- `web/test/build-output.test.ts` (+3): every LIVE href resolves on the real build; no ghost reader linked as live `<a>`; no stale fixed epic/rule count in visible prose. All red on injected fabrication, revert green.
- `scripts/build-kb-index.test.ts` (+1): generalized the architecture-doc credibility guard to cover epics/retrospective/shipping ghost docs (exempts `[OPEN:]`/`[ASSUMPTION]`). Mutation-verified.
- `web/e2e/demonstrator.spec.ts` (+4): focus-moves-to-panel (AC1/Rule 13, mutation-verified); reduced-motion mounts+steps (AC2, via `page.emulateMedia`, non-vacuity asserted) + static spine under reduced motion; served ghost-link guard; served stale-count guard (scoped to prose, not decorative numbers).

## Coverage

- AC1 (replay observable): demonstrator e2e — 22 defined = 22 run, 0 skipped (Rule 7); registered `demonstrator` Playwright project.
- AC2 (crawlable + safe + NFR-1): 8-item static `<ol>`, JS-off followable links, reduced-motion usable, 3 exec scripts (carve-out).
- AC3 (credibility): manifest + served-output + KB guards above.
- AC4 (composition): route in `routes.ts` (footer/sitemap, trailing-slash), KB indexed, CreativeWork JSON-LD valid, Glass Box tour unaffected (24/24 green), `$tourStep`/`$demoStep` independent.
- Rule 12: `react-hooks/exhaustive-deps` clean on `DemonstratorReplay.tsx`.
