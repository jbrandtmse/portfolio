# Story 2.1 — lead per-story smoke (publish allowlist + Glass Box render pipeline)

**Method:** CLI/library — real invocation of the build pipeline entrypoint (`pnpm build` → `runPipeline` → `render-glassbox` generator). **Result: PASS (1 iteration, 0 defects beyond automated tiers).**

## Pipeline runs (real runtime)
- `[content-pipeline] starting — 1 generator(s) registered` → `running: render-glassbox` → `wrote 6 artifact(s) to web/src/generated/glassbox.json` → `complete`. (The 1.8 empty-registry no-op is now the first real generator, as designed.)

## Contract (AC5) — produced `glassbox.json`
- Exactly the **6 allowlisted** artifacts: brainstorm, pre-brief-research, product-brief, prd, ux-design, ux-experience.
- Every artifact: unique `slug`, non-empty `body` (real repo content, 11k–55k chars), `type` in the union, ISO-8601 `date` (git committer date), non-empty `curatorNote`.

## Default-deny (AC3) — SECURITY-CRITICAL, no internal-doc leak
- Output set === allowlist set (no extra artifact; render iterates the allowlist, not the filesystem).
- Distinctive headlines of real never-render files are **absent** from the output: `review-adversarial.md`, a `.decision-log.md`, `reconcile-brief.md` — none leak.
- (Benign: allowlisted bodies — PRD, EXPERIENCE — legitimately *describe* the never-render set by name; that curated narrative is intended, not a leak.)

## Determinism (NFR-6)
- Two consecutive `pnpm build` runs → byte-identical `glassbox.json` (sha256 equal): `23c69f282b5df26b3212d91e7f2750e2754b5a8bbb56d827fb32009147150a28`.

## Notes
- Build-pipeline/library deliverable → Rule 3 browser-tier exemption applies (Glass Box PAGES are Stories 2.2/2.3). Real-runtime tier = the pipeline invocation above + the scripts vitest (71 tests incl. mutation-resistant default-deny).
- Environmental `EADDRINUSE:8787` (live api holds the port) is unrelated to 2.1 and tracked in deferred-work.md.
