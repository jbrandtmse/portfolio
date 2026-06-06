---
baseline_commit: 815db91cc2f1dbee54281a5fcab20643bbe3b453
---

# Story 1.1: Scaffold the pnpm monorepo (web · api · shared)

Status: done

<!-- Epic 1: Foundation — Credible Hub Shell & Static Mirror. First story of the epic and of the project. Greenfield: no app code exists yet, only BMAD planning artifacts. -->

## Story

As Josh, the builder,
I want the site scaffolded as a single pnpm monorepo (Astro `web`, Hono `api`, shared contract package) in this repo,
so that every later story has a consistent, deployable home and the site is literally its own source of truth.

## Acceptance Criteria

1. **Given** the repo root (which is the single source of truth, FR-33) **When** the workspace is initialized **Then** `web/` is an Astro 6 app (Empty/Minimal template, TypeScript strict) with `@astrojs/react` added, `api/` is a Hono 4 Node service, and `shared/` is a package exporting placeholder Zod-schema and SSE-event-type modules **And** a root `pnpm-workspace.yaml` lists `web`, `api`, `shared`, and a single `pnpm install` from root installs all three.

2. **Given** the workspace **When** lint/format/type-check run from root **Then** a shared `tsconfig.base.json` (strict), a root ESLint flat config, and Prettier are in place, each package extends the base TS config, and `pnpm -r typecheck` passes on the empty scaffold.

3. **Given** local development **When** `pnpm dev` runs **Then** `astro dev` (web) and the Hono dev server (api, tsx watch) run concurrently, a local proxy maps `/api/*` to the Hono port to mirror production, and a placeholder `GET /api/health` returns 200 through the proxy.

4. **Given** the scaffold is committed **When** the repo is inspected **Then** `.gitignore` excludes `node_modules`, `web/dist`, `api/data`, and `.env`, and a committed `.env.example` documents required vars with no secrets present.

## Integration ACs

*(Rule 1 — this story introduces services/modules. Integration is exercised, not just asserted structurally.)*

- **IAC-1 (web ↔ api runtime wiring):** A request to `/api/health` issued against the **web dev server** (Astro/Vite on its dev port) is proxied to the Hono service and returns HTTP **200** with a small JSON body (e.g. `{ "status": "ok" }`). This proves the dev proxy mirrors the production nginx `/api/*` → Hono topology (AR-8). Verifiable by `curl` against the web dev port — i.e. the consumer (a browser/curl hitting the site origin) produces the observable effect (200 through the proxy), not by inspecting Hono's internals. *(This is the consumer-observable form of AC3.)*
- **IAC-2 (workspace graph integration):** `pnpm install` from the root links all three workspace packages and `pnpm -r typecheck` resolves `shared` as a dependency target without unresolved-module errors — proving the `shared/` package is wired into the workspace and importable (even though no runtime code imports it yet).
- **`shared/` has no *runtime* consumer in this story.** It exports placeholder `InviteInput`/`GuideQuery` Zod schemas and `token|citation|done|error` SSE event types only. **First consumers:** `InviteInput` → Story 3.3 (`/api/invite`) + Story 3.4 (`InviteForm` island); `GuideQuery` + SSE event types → Story 4.3 (`/api/guide`) + Story 4.4 (`GuidePanel` island). Per Rule 1's escape clause, this is the explicit "no consumers yet" declaration for the contract package.

## Consumed-by

*(Rule 2 — downstream consumers of what this story introduces.)*

- **The pnpm workspace + root tooling (tsconfig.base, ESLint, Prettier, scripts):** consumed by **every** subsequent story (1.2–1.10 and all later epics).
- **`web/` Astro app:** consumed by Stories 1.2 (tokens/layout/chrome), 1.3 (hero), 1.4 (scenes), 1.5 (Mirror routes), 1.6 (JSON-LD/sitemap), 1.7 (footer/browse), 1.9 (a11y/test harness).
- **`api/` Hono service:** consumed by Story 3.3 (`/api/invite`), Story 4.3 (`/api/guide`), Story 1.10 (systemd/deploy).
- **`shared/` contract package:** consumed by Story 3.3, 3.4 (`InviteInput`) and Story 4.3, 4.4 (`GuideQuery` + SSE event types).

## Tasks / Subtasks

- [x] **Task 1 — Root workspace + tooling (AC: 1, 2)**
  - [x] Create root `package.json` (private, `"packageManager": "pnpm@11.5.2"`) with scripts: `dev`, `build`, `typecheck`, `lint`, `format`, `format:check` (see Dev Notes for exact script bodies).
  - [x] Create `pnpm-workspace.yaml` listing `packages: [web, api, shared]`.
  - [x] Create `tsconfig.base.json` (TS strict; `target` ES2022, `moduleResolution: "bundler"`, `strict: true`, `noUncheckedIndexedAccess: true`, `esModuleInterop`, `skipLibCheck`). Each package's `tsconfig.json` extends it.
  - [x] Create root flat-config `eslint.config.js` (ESLint 9 flat config: `typescript-eslint` + `eslint-plugin-astro`) and `.prettierrc` (+ `prettier-plugin-astro`). *(Installed ESLint is v10.4.1 — same flat-config API; typescript-eslint@8 + eslint-plugin-astro@1.7 both peer-support ESLint 10.)*
  - [x] Update `.gitignore`: add `api/data/` and `.astro/` (node_modules, dist, .env, .env.* already present — confirm `web/dist` is covered by the existing `dist/` rule). *(Also added `!.env.example` negation so the committed template is not swept by the pre-existing `.env.*` rule.)*
  - [x] Create `.env.example` documenting required vars (no secrets) — see Dev Notes.
- [x] **Task 2 — `web/` Astro 6 app (AC: 1, 3)**
  - [x] Scaffold `web/` with the Astro **Empty/Minimal** template, **TypeScript strict**; add the React integration (`@astrojs/react`). *(Authored directly to the verified `minimal`-template shape + `astro/tsconfigs/strict` rather than running the interactive scaffolder; create-astro@5 has no `--typescript strict` flag — strictness is set via the generated tsconfig.)*
  - [x] `astro.config.mjs`: `output: 'static'`, `react()` integration, and a Vite dev proxy `server.proxy['/api'] → http://localhost:<API_PORT>` (mirrors prod nginx `/api/*` → Hono).
  - [x] `web/tsconfig.json` extends `../tsconfig.base.json`; add `@astrojs/check` so `astro check` runs as `typecheck`. *(Extends `["astro/tsconfigs/strict", "../tsconfig.base.json"]` — both, as AC2 requires — with frontend `lib`/`target` re-asserted in the web config.)*
  - [x] `web/package.json` scripts: `dev: astro dev`, `build: astro build`, `typecheck: astro check`, `preview: astro preview`.
  - [x] Confirm 0-JS-by-default (no islands shipped yet); the empty home page is fine for this story. *(Built `index.html` has 0 `<script>` tags — verified.)*
- [x] **Task 3 — `api/` Hono 4 Node service (AC: 1, 3)**
  - [x] Scaffold `api/` with `create hono@latest` (template **nodejs**), Hono 4.x, `@hono/node-server`. *(Authored directly to the nodejs/@hono/node-server pattern — create-hono@0.19.4's template repo layout has no fetchable `templates/nodejs` path; flags confirmed via `create-hono --help`.)*
  - [x] `api/src/index.ts`: Hono app listening on `API_PORT` (default `8787`); register `GET /api/health` → `c.json({ status: 'ok' })` (200). Mount routes under the `/api` base path so the proxy path matches prod. *(Used `new Hono().basePath('/api')` + `app.get('/health', ...)`.)*
  - [x] `api/package.json` scripts: `dev: tsx watch src/index.ts`, `build: tsc`, `typecheck: tsc --noEmit`, `start: node dist/index.js`. Add `tsx` as a dev dependency.
  - [x] `api/tsconfig.json` extends `../tsconfig.base.json` (`module`/`moduleResolution` suitable for Node ESM; `outDir: dist`). *(Overrides base to `NodeNext` + `noEmit:false` + `allowImportingTsExtensions:false` so `tsc` can emit `dist/`.)*
- [x] **Task 4 — `shared/` contract package (AC: 1, 2)**
  - [x] Create `shared/package.json` (name `@portfolio/shared`, `type: module`, `exports` for `./schemas` and `./events`, `main`/`types` set). Add `zod` as a dependency.
  - [x] `shared/src/schemas.ts`: placeholder Zod schemas `InviteInput` and `GuideQuery` (minimal shapes + exported inferred types) with a `// TODO(Story 3.3 / 4.3): finalize fields` note. *(Zod 4: used top-level `z.email()` — the `z.string().email()` form is deprecated.)*
  - [x] `shared/src/events.ts`: SSE event type union `GuideEvent = token | citation | done | error` (discriminated union) with a `// TODO(Story 4.3): align with /api/guide` note.
  - [x] `shared/tsconfig.json` extends base; `typecheck: tsc --noEmit` (or emit declarations).
  - [x] Reference `@portfolio/shared` as a `workspace:*` dependency from `web` and `api` `package.json` (so the graph is wired) — no runtime import required yet.
- [x] **Task 5 — Wire concurrent dev + verify (AC: 2, 3)**
  - [x] Root `dev` script runs `web` (`astro dev`) and `api` (`tsx watch`) concurrently (`pnpm -r --parallel --if-present run dev`, or `concurrently`). Document the chosen port in `.env.example` + README note. *(Used `pnpm -r --parallel --if-present run dev`; port documented in `.env.example` `API_PORT=8787`.)*
  - [x] Run `pnpm install` from root → all three packages install from one lockfile. *(Exit 0; single root `pnpm-lock.yaml`; esbuild+sharp builds explicitly allowed in `pnpm-workspace.yaml`.)*
  - [x] Run `pnpm -r typecheck` → passes clean on the empty scaffold. *(Exit 0: shared + api `tsc --noEmit` Done; web `astro check` 0 errors/0 warnings/0 hints.)*
  - [x] Run `pnpm dev`, then `curl -s -o /dev/null -w '%{http_code}' http://localhost:<web-dev-port>/api/health` → `200` (proxied to Hono). This is IAC-1 / AC3. *(`curl http://localhost:4321/api/health` → `200`, body `{"status":"ok"}`; dev server stopped after verifying.)*
- [x] **Task 6 — Self-check against ACs**
  - [x] All four ACs + IAC-1/IAC-2 demonstrably pass; leave all changes uncommitted (the lead commits).

## Dev Notes

### Stack & versions (from architecture.md §Starter Template Evaluation, verified 2026-06-04)

- **Astro 6** (latest 6.x, ~6.4) — Empty/Minimal template, **TypeScript strict**; React islands via `@astrojs/react`. `output: 'static'` (SSG; nginx serves `web/dist/`).
- **Hono 4.x** on Node.js (`@hono/node-server`), `create hono` **nodejs** template. Web-standard streaming (used later for the Guide SSE).
- **pnpm 11.5.2** is already installed globally on this VM (`/usr/bin/pnpm`); **Node v22.22.2**, **npm 10.9.7**. Set root `packageManager: "pnpm@11.5.2"`.
- **TypeScript strict** end-to-end (one language across `web` + `api` + `shared`).
- `zod` in `shared/` (placeholder schemas now; the real `InviteInput`/`GuideQuery` land in Epics 3/4).
- **Confirm exact `create-*` CLI flags at scaffold** — flags drift across versions; the major versions above are the committed choices. [Source: architecture.md#Selected-Starter; #Initialization-Commands]
- Testing tools (Vitest / Playwright / Lighthouse-CI) are **deliberately NOT added here** — they are Story 1.9's deliverable. This story only establishes `tsconfig.base.json` + ESLint flat config + Prettier. [Source: architecture.md#Testing-Framework "Added deliberately, not inherited"]

### Dev-proxy topology (AC3 / IAC-1)

Production: nginx serves `web/dist/` and reverse-proxies `/api/*` → Hono (localhost high port) [AR-8]. **Dev must mirror this** so `/api/*` is same-origin in both. Use the Astro config's Vite dev-server proxy:

```js
// web/astro.config.mjs (sketch)
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: { server: { proxy: { '/api': 'http://localhost:8787' } } }, // API_PORT
});
```

So `pnpm dev` → hit `http://localhost:4321/api/health` (Astro dev port) → proxied to Hono `:8787` → `200`. Keep the Hono port in one place (`.env.example` `API_PORT`, default `8787`) and reference it from both the proxy and `api/src/index.ts`.

### `.env.example` (AC4 — document, no secrets)

Document (with placeholder/empty values, never real secrets):
- `API_PORT` (default `8787`) — Hono dev/runtime port.
- `DATABASE_URL` — Postgres (used from Story 3.3; attached VM DB). Placeholder.
- `RESEND_API_KEY` — transactional email (Story 3.3). Placeholder.
- Note as a comment that `ABACUS_API_KEY` (LLM endpoint) is fetched at **runtime from the VM metadata service (IMDSv2)** by the api, NOT stored in `.env` [AR-12]. Secrets never reach `web/` client code (NFR-5).

### Project Structure Notes

Target monorepo layout (this story creates the **skeleton**; later stories fill `src/`):

```
/ (root)   package.json · pnpm-workspace.yaml · tsconfig.base.json · eslint.config.js · .prettierrc · .gitignore · .env.example
  shared/  package.json · src/{schemas.ts, events.ts}
  web/     astro.config.mjs · package.json · tsconfig.json · src/ (Astro default) · public/
  api/     package.json · tsconfig.json · src/index.ts
  content/ scripts/ deploy/   ← created by their owning stories (1.8, 1.10, Epic 2+), NOT now
```

- **Existing dirs are preserved** (`_bmad/`, `_bmad-output/`, `.claude/`, `docs/`, `epic-cycle-workflow-creation.md`). Do not move or modify them. The scaffold sits alongside.
- Naming (architecture §Naming Patterns): packages lowercase; TS modules kebab-case `.ts`; types PascalCase; the DB↔client casing boundary lives only in Drizzle (later). camelCase JSON end-to-end.
- `shared/` is imported by BOTH `web` islands and `api` later — **never** cross-import package internals; the contract is the only shared surface (AR-15). [Source: architecture.md#Service-boundaries]
- Do not introduce a CSS framework, DB, ORM, email, or analytics here — all are later stories. Keep the scaffold minimal.

### Gotchas / constraints

- **Leave the working tree UNCOMMITTED.** The `bmad-dev-story` skill commits by default — suppress that. The lead commits after the per-story smoke gate (epic-cycle Rule SC-3).
- `pnpm -r typecheck` must pass on an essentially empty scaffold — ensure each package has a `typecheck` script and a valid `tsconfig.json` extending base; `web` uses `astro check` (install `@astrojs/check` + `typescript`).
- Astro generates a `.astro/` types dir — add to `.gitignore`.
- The Hono `nodejs` template may scaffold a non-`/api`-prefixed route and a default port — adjust to listen on `API_PORT` and serve `GET /api/health` so the proxy path matches production exactly.
- If `create astro` / `create hono` interactive prompts can't run non-interactively, use their documented non-interactive flags (`--template`, `--typescript strict`, `--no-install`, `--no-git`, `--yes`/`--pm pnpm`), then reconcile into the workspace. Confirm flags against the installed CLI version.
- No ADR registry exists (`docs/adr/` absent) — architecture.md is the architectural source of truth; no Rule 6 ADR constraints apply to this story.

### References

- [Source: epics.md#Story-1.1 — acceptance criteria verbatim]
- [Source: architecture.md#Selected-Starter-Astro-6 — stack, init commands, decisions provided by starter]
- [Source: architecture.md#Structure-Patterns + #Complete-Project-Directory-Structure — monorepo layout]
- [Source: architecture.md#Naming-Patterns + #Format-Patterns — conventions]
- [Source: epics.md#Additional-Requirements — AR-1 (scaffold), AR-6 (rendering), AR-12 (secrets), AR-15 (shared contract)]
- [Source: skill-rules.md#Rule-1 (Integration ACs), #Rule-2 (Consumed-by)]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Opus 4.8, 1M context) — `bmad-dev-story` under `/epic-cycle`.

### Debug Log References

All four Definition-of-Done gates were run and pass:

1. **`pnpm install` (root, single lockfile)** — exit 0. Resolved/added 497 packages across all 4 workspace projects from one root `pnpm-lock.yaml`. `esbuild` + `sharp` native build scripts explicitly allowed via `pnpm-workspace.yaml` `allowBuilds` (pnpm 11 ignores build scripts by default). pnpm auto-added a `minimumReleaseAgeExclude` for two recently-published `@types` versions — left as pnpm wrote it.
2. **`pnpm -r typecheck`** — exit 0. `shared` (`tsc --noEmit`) Done · `api` (`tsc --noEmit`) Done · `web` (`astro check`) `0 errors, 0 warnings, 0 hints` (4 files). Confirms `@portfolio/shared` resolves as a cross-package target (IAC-2).
3. **`pnpm dev` + proxied health check (IAC-1 / AC3)** — `astro dev` (web, :4321) and `tsx watch` Hono (api, :8787) ran concurrently. `curl http://localhost:4321/api/health` → **200**, body `{"status":"ok"}` (proxied through Vite `server.proxy` to Hono, mirroring prod nginx `/api/*` → Hono). Control direct-to-Hono `:8787/api/health` → 200; unknown `/api/*` route through the proxy → 404 (proves the proxy reaches Hono's router). Dev server stopped after verification; ports 4321/8787 confirmed free.
4. **`.gitignore` / `.env.example` (AC4)** — `git check-ignore` confirms `node_modules`, `web/dist`, `api/data`, `.env` ignored; `.env.example` NOT ignored (committed) and present; no real secrets (only `API_PORT=8787` default, empty `DATABASE_URL`/`RESEND_API_KEY` placeholders, and a comment noting `ABACUS_API_KEY` is fetched at runtime via IMDSv2).

Extra (non-AC) checks: `pnpm lint` (ESLint flat config) → exit 0; `pnpm format:check` (Prettier) → exit 0; `pnpm build` → exit 0 (`web/dist/index.html` static SSG with **0 `<script>` tags** = 0-JS-by-default; `api/dist/index.js` compiled). Build artifacts cleaned afterward.

### Completion Notes List

- **Scaffolders authored, not run interactively.** Both `create-astro@5.0.6` and `create-hono@0.19.4` were inspected (`--help`) to confirm flags, but the packages were hand-authored to the verified template shapes (Astro `minimal` template + `astro/tsconfigs/strict`; Hono `nodejs` + `@hono/node-server`) and reconciled directly into the workspace — the story's explicitly-permitted path. This avoids interactive-prompt friction and the heavy reconciliation a separate scaffold-then-merge would need. create-astro@5 has **no** `--typescript strict` flag (strictness lives in the generated tsconfig).
- **Versions verified against the live npm registry (2026-06-06):** astro 6.4.4, @astrojs/react 5.0.7, @astrojs/check 0.9.9, hono 4.12.23, @hono/node-server 2.0.4, tsx 4.22.4, zod 4.4.3, typescript 6.0.3, react 19.2.7, eslint 10.4.1, typescript-eslint 8.60.1, eslint-plugin-astro 1.7.0, prettier 3.8.3, prettier-plugin-astro 0.14.1. All peer-dependency ranges checked: TS 6 ∈ `@astrojs/check`/`typescript-eslint` peers; ESLint 10 ∈ `typescript-eslint@8`/`eslint-plugin-astro@1.7` peers; React 19 ∈ `@astrojs/react@5` peers; Node 22.22.2 / pnpm 11.5.2 ∈ astro engines.
- **`web/tsconfig.json` extends BOTH** `astro/tsconfigs/strict` and `../tsconfig.base.json` (array form) to satisfy AC2's "each package extends the base" while keeping Astro's frontend-appropriate defaults; frontend `target`/`module`/`lib` (`ESNext` + DOM) re-asserted in the web config so the Node-oriented base (`ES2022`, no DOM) doesn't strip browser types. `noUncheckedIndexedAccess` from the base flows through.
- **`api/tsconfig.json` overrides the base** to `module`/`moduleResolution: NodeNext`, `noEmit: false`, `outDir: dist`, `allowImportingTsExtensions: false` so `tsc` can actually emit for `build`/`start` (the base sets `noEmit` + `allowImportingTsExtensions` for the bundler/no-emit packages).
- **`shared/` has no runtime consumer this story** (declared in Integration ACs). Exports placeholder `InviteInput`/`GuideQuery` (zod) + `GuideEvent` discriminated union (`token|citation|done|error`), wired as `workspace:*` into both `web` and `api`. First consumers: Stories 3.3/3.4 and 4.3/4.4.
- **ESLint flat-config refinements** (config, not code bugs): added a minimal inline Node-globals set for `*.config.*` + `api/**/*.ts` (avoids adding the `globals` package to a minimal scaffold); disabled `@typescript-eslint/triple-slash-reference` for `*.d.ts` (Astro generates `env.d.ts` as a triple-slash reference — the framework-idiomatic form). Prettier scope narrowed via `.prettierignore` to the app scaffold only, so the pre-existing BMAD/planning/docs trees are left untouched (per "existing dirs are preserved").
- **No Rule 5 (NFR) tripwire** and **no Rule 6 (ADR) constraints** — no ADR registry exists; `architecture.md` governs and the stack/topology match it.
- **Left UNCOMMITTED** per the epic-cycle directive — the lead commits after the per-story smoke gate.

### File List

Paths relative to repo root. All NEW unless noted.

**Root tooling**
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml` (generated by `pnpm install`)
- `tsconfig.base.json`
- `eslint.config.js`
- `.prettierrc`
- `.prettierignore`
- `.env.example`
- `.gitignore` (MODIFIED — added `.astro/`, `api/data/`, and `!.env.example`)

**`web/` (Astro 6)**
- `web/package.json`
- `web/tsconfig.json`
- `web/astro.config.mjs`
- `web/src/pages/index.astro`
- `web/src/env.d.ts`
- `web/public/favicon.svg`

**`api/` (Hono 4)**
- `api/package.json`
- `api/tsconfig.json`
- `api/src/index.ts`

**`shared/` (@portfolio/shared contract)**
- `shared/package.json`
- `shared/tsconfig.json`
- `shared/src/schemas.ts`
- `shared/src/events.ts`

## Review Findings

_Code-review stage of `/epic-cycle` (adversarial: Blind Hunter + Edge Case Hunter + Acceptance Auditor lenses), 2026-06-06. Reviewer model: claude-opus-4-8[1m]._

### Outcome: PASS — 0 HIGH, 0 MED, 3 LOW (all deferred). No inline patches required.

### AC / Integration-AC gates — re-run live by the reviewer (all exit 0 / 200)

| Gate | Result |
| ---- | ------ |
| `pnpm install` (root, single lockfile) | exit 0 — "Already up to date", 4 workspace projects |
| `pnpm -r typecheck` | exit 0 — shared/api `tsc` Done; web `astro check` 0 errors/0 warnings/0 hints |
| `pnpm -r test` | exit 0 — api 1 file, **2 tests passed** (vitest 4.1.8) |
| `pnpm build` | exit 0 — web static SSG, api `tsc` emit |
| `pnpm lint` | exit 0 — and **verified non-vacuous** (temp unused-var probe → caught, exit 1) |
| `pnpm format:check` | exit 0 — and **verified non-vacuous** (temp unformatted probe → caught, exit 1) |
| **IAC-1 / AC3** `curl :4321/api/health` (through web dev proxy) | **200**, body `{"status":"ok"}`, `content-type: application/json` |
| IAC-1 control: unknown `/api/*` through proxy | **404 "Not Found"** (Hono's own 404 — proves the proxy reaches Hono's router, not Astro's, mirroring prod nginx `/api/*` → Hono / AR-8) |
| IAC-1 control: direct-to-Hono `:8787/api/health` | 200 (consistent) |
| **IAC-2** workspace graph | `@portfolio/shared` is a real symlink (`shared -> ../../../shared`) in **both** `web/node_modules/@portfolio/` and `api/node_modules/@portfolio/`; lockfile records `specifier: workspace:* → link:../shared` for both importers; **runtime import probe** from api context resolved `@portfolio/shared/schemas` and `InviteInput.safeParse` accepted a valid / rejected an invalid email |
| AC4 `.gitignore` | `node_modules`, `web/dist`, `.env`, `api/data/*` (contents of `api/data/` confirmed ignored when the dir exists) all excluded; `.env.example` is **not** ignored (committable); `pnpm-lock.yaml` committable |
| 0-JS-by-default | built `web/dist/index.html` has **0 `<script>` tags** |
| `start` path (Story 1.10 consumer) | `node dist/index.js` boots + serves `/api/health` → 200 (emitted ESM valid) |

Dev server was started, all checks run, then stopped — ports 4321/8787 confirmed free; build artifacts (`web/dist`, `api/dist`, `.astro`) removed so the working tree is clean for the lead's commit.

### Stage rule confirmations (per the epic-cycle directive)

- **Rule 1 (Integration ACs):** SATISFIED — IAC-1 (web↔api proxy) and IAC-2 (workspace graph) are real and verified live; the explicit "`shared/` has no runtime consumer yet" declaration is present and correct (first consumers named: Stories 3.3/3.4, 4.3/4.4).
- **Rule 3 (real-runtime test evidence):** Story 1.1 is **non-user-facing (scaffold/build-pipeline) → EXEMPT** (exemption noted explicitly). A real-runtime `/api/health` test (`api/src/health.test.ts`, status + body + content-type via Hono `app.request`) exists regardless and passes. The absence of the broader Vitest/Playwright/Lighthouse harness is BY DESIGN (Story 1.9) — not flagged.
- **Rule 5 (NFR tripwire):** N/A — no NFR was found unmeasurable/impossible; no code-comment-plus-deferral workaround of an NFR. NFR-5 (key-free static runtime) holds: secret scan of all scaffold files = clean; `web/` references no secrets; `.env.example` has placeholders only (`API_PORT=8787` non-secret default + empty `DATABASE_URL`/`RESEND_API_KEY`); `ABACUS_API_KEY` documented as IMDSv2-runtime-fetched, not stored.
- **Rule 6 (ADR violations):** No-op confirmed — no ADR registry exists (`docs/adr/` absent); `architecture.md` governs and the stack/topology/naming match it.
- **TS strict real:** `tsc --showConfig` confirms effective `strict=true` + `noUncheckedIndexedAccess=true` in all three packages (the `web` array-extends `["astro/tsconfigs/strict", "../tsconfig.base.json"]` correctly lets the base win on overlap; web keeps DOM/`react-jsx`; api keeps `nodenext`+emit).
- **Naming/structure:** match architecture §Naming/§Structure — packages lowercase/scoped, TS modules kebab-case, types PascalCase, route page lowercase, monorepo `web`/`api`/`shared` layout alongside preserved existing dirs.

### Findings (triaged)

- [x] [Review][Defer] SSE `CitationEvent` shape `{id,title,url}` diverges from architecture's documented `{route,label}` [shared/src/events.ts:13] — deferred to Story 4.3/4.4 (the owning consumers); placeholder with TODO, declared finalize-by-consumer in the Integration ACs. See deferred-work.md.
- [x] [Review][Defer] `API_PORT` coerced via `Number(...)` with no validation → `NaN` on non-numeric input [api/src/index.ts:15] — deferred to the planned typed `api/src/env.ts` (Zod, fail-fast) per architecture §Structure Patterns; not a Story 1.1 deliverable. See deferred-work.md.
- [x] [Review][Defer] `API_PORT` default `8787` duplicated as a literal in two files [web/astro.config.mjs:7, api/src/index.ts:15] — deferred; centralize when `env.ts` lands. Harmless today (both read the env var first). See deferred-work.md.

### Reviewer notes

- All three findings are LOW and forward-looking; none required patching working scaffold code. No HIGH/MED findings, so no inline auto-resolution was performed.
- The three review lenses (diff-only correctness, edge/boundary, AC/architecture audit) were applied by the reviewer inline rather than as nested sub-agents (the harness for this epic-cycle stage cannot reliably spawn nested sub-agents); coverage and structured triage are preserved.

## Change Log

| Date       | Version | Description                                                                                   | Author |
| ---------- | ------- | --------------------------------------------------------------------------------------------- | ------ |
| 2026-06-06 | 0.1.0   | Scaffolded the pnpm monorepo (web · api · shared) + root tooling. All 4 ACs + IAC-1/IAC-2 verified passing. Status → review. | Amelia (dev) |
| 2026-06-06 | 0.1.1   | Code review (epic-cycle): all AC/IAC gates re-run live & pass (typecheck/test/build/lint/format exit 0; proxied health → 200; workspace graph + runtime import verified). 0 HIGH/0 MED; 3 LOW deferred to deferred-work.md. Status → done. | Code Review |
