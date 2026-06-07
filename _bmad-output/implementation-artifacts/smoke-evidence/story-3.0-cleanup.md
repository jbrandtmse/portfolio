# Lead per-story smoke — Story 3.0 (Epic 2 Deferred Cleanup)

Date: 2026-06-06 · Method: cli + build-output inspection (direct runtime exercise, distinct from the automated tiers) · Result: **PASS** · iterations: 1 · code-defects caught: 0 (1 operational orphan-process cleanup)

Story 3.0 is a refactor/cleanup with three deliverables. Each was exercised directly against the real runtime / real build output, not just via the test suite.

## AC1 — api test port-robust on this VM (EADDRINUSE eliminated)

`pnpm --filter api test` run with the live `portfolio-api` systemd unit holding `:8787`:
```
Test Files  1 passed (1)
     Tests  2 passed (2)
EXIT: 0
```
Importing the Hono `app` (now from `api/src/app.ts`, no `serve()`) opens no socket → no EADDRINUSE. The in-process `app.request('/api/health')` assertions (200 + `{status:"ok"}` + JSON) still pass (Rule 3 runtime tier preserved).

## AC2 — production entrypoint still binds + serves

Built the api (`pnpm --filter api build`) and ran the real production entrypoint `node api/dist/index.js` (the command the `portfolio-api` systemd unit runs), on a free alt port:
```
$ API_PORT=19191 node api/dist/index.js
[api] Hono listening on http://localhost:19191/api
$ curl http://127.0.0.1:19191/api/health
{"status":"ok"}   HTTP 200
```
The app/bootstrap split did NOT break the deploy path — the entrypoint binds the port and serves exactly as before. `api/package.json`, `scripts/deploy.sh`, and the systemd unit are unchanged.

(Operational note — not a code defect: the code-review agent left an orphaned `node dist/index.js` on port 18787 from its own AC2 check; the lead detected it during the smoke and killed it by PID. No orphan remains.)

## AC5 — timeline date determinism under a non-UTC timezone (the actual bug condition)

Rebuilt the whole site under `TZ=America/Los_Angeles` (UTC−7/8) — the timezone in which the OLD `new Date("2026-06").toLocaleDateString(...)` would roll a UTC-midnight `2026-06` date back to **"May 2026"**. Inspected the built `web/dist/timeline/index.html`:
```
datetime="2026-06"     label=" Jun 2026 "   (×4 milestone)
datetime="2026-06-06"  label=" Jun 2026 "
datetime="2026-06-02"  label=" Jun 2026 "   (×4 dot)
datetime="2026-06-03"  label=" Jun 2026 "   (×2 dot)
datetime="2026-06-06"  label=" Jun 2026 "
```
**Zero "May 2026" labels** — every visible date renders "Jun 2026" via the `timeZone:'UTC'`-pinned `formatDotDate()`, and every `<time datetime>` carries the verbatim manifest ISO string. The determinism fix works under the exact timezone that triggers the bug.

## AC3/AC4 — ArtifactCard external-link label honesty on the shipped /glass-box/ page

Inspected `web/dist/glass-box/index.html`. The external "live site" card:
```
href="https://joshuabrandt.abacusai.cloud/"
aria-label="Visit the live site: https://joshuabrandt.abacusai.cloud/"
rel="noopener noreferrer"  target="_self"
```
The explicit consumer label renders verbatim (consumer unchanged), and the assertion "no `target="_self"` artifact-card link contains the text 'opens in new tab'" PASSES. Internal "Read {title}" links carry honest labels too.

## AC6 — literal canonical gate

`pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`) re-run end-to-end by the lead → **EXIT 0** (632 vitest + 158 e2e + Lighthouse collecting `/` and `/about/`, all four budgets). The `lighthouserc.json` `/about/` fix (the Rule-2 leftover Story 2.0 missed) makes the `lh` step — hence the whole canonical gate — green for all of Epic 3.

## Verdict

All ACs exercised against the real runtime / build and confirmed. PASS — clear to commit.
