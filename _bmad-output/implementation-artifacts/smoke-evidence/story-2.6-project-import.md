# Story 2.6 — lead per-story smoke (Project Import & /bmad-correct-course path)

**Method:** CLI/library + doc-follow. Followed `docs/project-import.md` for real against the live build (add a sample project to the allowlist → `pnpm build` → observe → revert), plus the mechanism test (real `renderGlassbox()`/`renderTimeline()`). **Result: PASS after 1 fix (1 defect caught — a doc inaccuracy the automated tiers + code review missed).**

## The path WORKS (AC1/AC2/AC4)
- Followed Wiring-point-3: added a sample allowlist entry (`slug: sample-import-smoke`, pointing at a real un-published artifact `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-05.md`) → `pnpm build` → the sample appeared in `glassbox.json` (7 artifacts) AND a real `/glass-box/sample-import-smoke/index.html` **reader page was built**. The import → build → appears path is real and deterministic. Reverted the entry → rebuild → back to exactly the 6 real artifacts (no live-manifest pollution).
- Mechanism test (real render functions, mutation-verified by QA): 107 scripts vitest pass.

## Defect caught by the smoke (test-pyramid leak — now fixed)
- **`docs/project-import.md` claimed (verify step): "The new Glass Box artifacts appear on `/glass-box/`."** Following the doc, the sample got a `/glass-box/{slug}/` READER page but did **NOT** appear on the `/glass-box/` INDEX (grep: 0) — because the index is driven by the SEPARATE curated `web/src/content/glassbox.index.ts` (Story 2.3), not the allowlist. The doc would have misled a future builder ("I allowlisted it and built, why isn't it on the index?").
- **Fix (lead, post-CR):** added **Wiring point 4 (`web/src/content/glassbox.index.ts` — index featuring, curated)** + a step 4b, and corrected the verify bullet to distinguish: allowlist → reader page (`/glass-box/{slug}/`); index node → `glassbox.index.ts` (optional featuring). The render mechanism was always correct (reader vs curated-index is by design — the allowlist source header itself notes "featured/ghosted on the index is a Story 2.3 decision"); only the DOC over-claimed. Re-verified: doc now accurate; mechanism test 107 green; format:check green.

## AC3 — no CMS / engineering flow
- The doc frames the path as a `/bmad-correct-course` (or epic/stories) → dev → PR → `pnpm build` → `scripts/deploy.sh` flow; NO admin/CMS surface; carries the `[OPEN]`/no-fabrication credibility rule. KB retrievability correctly deferred to Epic 4; Stage-2 auto-harvest noted.

## Floor
- Allowlist reverted clean (6 real artifacts; 0 smoke residue). scripts vitest 107; web vitest 506; build byte-deterministic; format:check/typecheck/lint green.
