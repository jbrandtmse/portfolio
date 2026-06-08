import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

/**
 * Surface api/.env's DATABASE_URL into the RUNNER's env (Story 3.4) so it is
 * inherited by every Playwright worker. The JS-off native-POST integration test
 * (invite.spec.ts) reads process.env.DATABASE_URL to decide whether to verify +
 * clean up the persisted row against real Postgres; it skips-with-warning when
 * unset (skill-rules Rule 3 — never fail the suite for a missing local DB).
 *
 * The webServer launcher (e2e/serve-with-api.mjs) also reads api/.env to start
 * the Hono API, but a webServer child's env does NOT propagate to the worker
 * processes — so the value must be set HERE, in the runner, as well. Loading is
 * a no-op when api/.env is absent (CI without a DB), preserving the skip path.
 * Only DATABASE_URL is lifted; secrets (RESEND_API_KEY etc.) stay api-side.
 */
function loadDatabaseUrlFromApiEnv(): void {
  if (process.env.DATABASE_URL) return; // already set (CI/secret manager) — respect it.
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'api', '.env');
  if (!existsSync(envPath)) return;
  for (const rawLine of readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    if (line.slice(0, eq).trim() !== 'DATABASE_URL') continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val) process.env.DATABASE_URL = val;
    return;
  }
}
loadDatabaseUrlFromApiEnv();

/**
 * Playwright config — the browser real-runtime tier (Story 1.9, AC2 / IAC-2;
 * architecture.md §AR-14; skill-rules Rule 3). This is the tier that exercises
 * the built Epic-1 site in a REAL browser: a normal e2e pass, a JS-off pass, a
 * prefers-reduced-motion pass, a view-source SEO check, and the WCAG 2.1 AA axe
 * audit (mobile + desktop).
 *
 * SEPARATION FROM VITEST (Rule 8): these specs live in `web/e2e/` and run under
 * THIS config via `pnpm test:e2e`; Vitest only globs `test/**` + `src/**`
 * (vitest.config.ts) so the two runners never pick up each other's specs. Both
 * are wired into the documented all-tiers command (`pnpm test:all`, root
 * package.json) so neither tier is orphaned from CI.
 *
 * SYSTEM CHROME: every project uses `channel: 'chrome'` (the installed
 * /usr/bin/google-chrome-stable) to AVOID Playwright's ~130MB chromium download.
 * `--no-sandbox` is required to launch Chrome as root/in this sandboxed VM.
 *
 * SERVED BUILD + TEARDOWN: `webServer` builds the site and serves `dist/` via
 * `astro preview`; Playwright starts it before the run and tears it down after
 * (no orphaned port / browser process — the lead-smoke teardown discipline,
 * declarative here).
 */

const PORT = 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Launch the SYSTEM Chrome (no download) and allow it to run in this VM.
// (Not `as const`: Playwright's LaunchOptions.args expects a mutable string[].)
const chromeLaunch = { channel: 'chrome', args: ['--no-sandbox'] };

export default defineConfig({
  testDir: './e2e',
  // Keep e2e deterministic and the served build stable; this suite is small.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  // Build the site, then serve it the way PRODUCTION does (Story 3.4): a single
  // public port that serves the static dist/ via `astro preview` AND reverse-
  // proxies /api/* to the real Hono API — mirroring nginx (architecture AR-8).
  // This is what lets the JS-OFF native form POST (<form action="/api/invite">)
  // reach the real endpoint end-to-end during the run (the headline AC2
  // resilience guarantee). `astro preview` ALONE does NOT proxy /api — it 404s
  // every /api/* request (vite.server.proxy is dev-only; verified empirically),
  // so a preview-only webServer could never actually exercise the native POST.
  //
  // The launcher (e2e/serve-with-api.mjs) starts the Hono API from SOURCE with
  // api/.env loaded (real Postgres; RESEND unset ⇒ mail skipped), starts astro
  // preview internally, and proxies in front. Non-/api requests pass straight
  // through to astro preview so its EXACT trailing-slash/redirect behavior is
  // preserved (every prior url-form/glassbox/timeline spec stays green); only
  // /api/* is diverted to Hono. Playwright polls BASE_URL and treats the
  // proxy's transient 502 (preview still starting) as not-ready, so there is no
  // startup race. The launcher forwards SIGTERM to both children on teardown.
  //
  // `pnpm build` is the deterministic content+astro build (root script, Story
  // 1.8). reuseExistingServer locally avoids a rebuild when a server is already
  // up.
  webServer: {
    command: 'pnpm --dir .. build && node e2e/serve-with-api.mjs',
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Each spec runs under EXACTLY the project(s) whose context it needs, scoped by
  // testMatch — so e.g. js-off.spec.ts never also runs with JS on under `desktop`.
  projects: [
    // (a) Normal e2e + (d) view-source SEO + Story 2.0 URL-form (AC6: the
    // no-301-hop served-runtime check) — desktop, JS on, motion on.
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /(home|view-source|url-form)\.spec\.ts/,
    },
    // (Story 5.1) Cinematic camera path + WebGL set-piece e2e — desktop, JS on.
    // Tests: motion-enabled bootstrap after scroll, reduced-motion disabled-outright,
    // FR-2 scene-rail operable, AC2 static still in initial HTML, AC3 no-canvas.
    {
      name: 'cinematic',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /cinematic\.spec\.ts/,
    },
    // (IAC-3) WCAG 2.1 AA audit at a DESKTOP viewport (/ and /about).
    {
      name: 'axe-desktop',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /axe\.spec\.ts/,
    },
    // (IAC-3) WCAG 2.1 AA audit at a MOBILE viewport (/ and /about).
    {
      name: 'axe-mobile',
      use: { ...devices['Pixel 5'], launchOptions: chromeLaunch },
      testMatch: /axe\.spec\.ts/,
    },
    // (b) JS-OFF pass — the 0-JS static floor (NFR-1). javaScriptEnabled:false so
    // no enhancement runs; the page must still render and every link work.
    {
      name: 'js-off',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromeLaunch,
        javaScriptEnabled: false,
      },
      testMatch: /js-off\.spec\.ts/,
    },
    // (c) REDUCED-MOTION pass — the rail meter stays the static bar, the observer
    // never runs, aria-current stays on #hero (the shared motion.ts gate, Layer 2).
    // The spec emulates the preference per-page via page.emulateMedia (reliable
    // with the system-chrome channel) rather than use.reducedMotion (flaky here).
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /reduced-motion\.spec\.ts/,
    },
    // (Story 2.2) Glass Box artifact reader — desktop, JS on. Asserts real-
    // runtime render of the reader pages: type chip, curator note, body prose,
    // drop-cap/pull-quote CSS, WCAG 2.1 AA (axe), 0 executable scripts.
    {
      name: 'glassbox-reader',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /glassbox-reader\.spec\.ts/,
    },
    // (Story 2.3) Glass Box index — desktop, JS on. Asserts real-runtime render
    // of the build-story spine: dots, artifact cards, ghost nodes, recursion beat,
    // WCAG 2.1 AA (axe), 0 executable scripts. JS-off tested inline via
    // browser.newContext({ javaScriptEnabled: false }).
    {
      name: 'glassbox-index',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /glassbox-index\.spec\.ts/,
    },
    // (Story 2.4) Master Timeline — desktop + mobile, JS on. Asserts real-
    // runtime render of the timeline: era-bands, flagship clusters, Glass Box
    // Dot links, loandemo forward-refs, DOM order (desktop vs mobile unchanged),
    // WCAG 2.1 AA (axe), 0 executable scripts. JS-off tested inline.
    {
      name: 'timeline',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /timeline\.spec\.ts/,
    },
    // (Story 2.5) loandemo case study — desktop, JS on. Asserts real-runtime
    // render of the flagship case study: one <h1>, answer-first lede, #code/
    // #build/#retro fragment targets (resolves 2.4 Dot links), drop-cap + pull-
    // quote editorial devices, cross-links (/speaking/, /glass-box/, /timeline/),
    // [OPEN] flags, 0 executable scripts, WCAG 2.1 AA (axe), keyboard focus ring.
    {
      name: 'loandemo',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /loandemo\.spec\.ts/,
    },
    // (Story 3.1) Speaker Surface — /speaking/ + /speaking/reel/. Asserts
    // real-runtime render: reel poster is the lead item and is a followable <a>
    // to /speaking/reel/ JS-off; collapsed talk abstracts are in the DOM;
    // <details> toggles; WCAG 2.1 AA (axe); 0 executable scripts; voice.
    {
      name: 'speaking',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /speaking\.spec\.ts/,
    },
    // (Story 3.4) Invite-Me form — the FIRST React island. Three groups:
    // (a) JS-off native POST → /invite/thanks/ + real DB row (cleanup in afterAll);
    // (b) JS-on island interactions: invalid → error summary + aria-invalid;
    //     valid → aria-live success; network failure → role=alert + values preserved;
    // (c) WCAG 2.1 AA axe audit on /invite/ (form + island).
    {
      name: 'invite',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /invite\.spec\.ts/,
    },
    // (Story 4.2) FAQ Mirror route — /faq/. Asserts real-runtime render of the
    // crawlable Q&A: six visible <h3> questions scoped to .faq (Rule 8 — not a
    // whole-doc match the JSON-LD could satisfy); FAQPage JSON-LD present + valid;
    // single-source Q&A↔JSON-LD consistency; WCAG 2.1 AA (axe); 0 executable
    // scripts; no exclamation marks; JS-off readable (server-rendered HTML);
    // resolves the Story 4.1 /faq/ citation target (Rule 3).
    {
      name: 'faq',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /faq\.spec\.ts/,
    },
    // (Story 4.3) Guide endpoint SSE e2e — POST /api/guide through the proxy.
    // Rule 7: proven to EXECUTE (not skipped); exercises (a) fail-closed path
    // (nonsense query → canned "I don't have that documented." SSE, no model call)
    // and (b) grounded path (KB-answerable query → token+citation+done events)
    // both via the serve-with-api.mjs prod-faithful proxy (GUIDE_LLM_STUB=1).
    // Canonical Epic-4 Rule-7 case (retro A3).
    {
      name: 'guide',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /guide\.spec\.ts/,
    },
    // (Story 4.4) Guide island e2e — the GuidePill + GuidePanel React islands.
    // Rule 7: proven to EXECUTE (not skipped); exercises:
    //   (a) pill opens the NON-modal dialog (role="dialog" aria-modal="false")
    //   (b) hero entry opens the Guide (progressive enhancement)
    //   (c) chip query → real SSE from /api/guide renders (GUIDE_LLM_STUB=1)
    //   (d) citation click → page routes behind + conversation persists
    //   (e) Esc → focus returns to pill
    //   (f) axe WCAG 2.1 AA → 0 violations
    //   (g) JS-off → hero entry navigates to /faq/ (the static fallback)
    // All via the serve-with-api.mjs prod-faithful proxy.
    {
      name: 'guide-panel',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /guide-panel\.spec\.ts/,
    },
    // (Story 5.2) Depth Dial — AC1–AC5. Desktop, JS on (JS-off tests use inline
    // browser.newContext()). Uses the serve-with-api proxy for the GuidePanel
    // agent-path test (AC2: GuidePanel sends depth in /api/guide body).
    {
      name: 'depth-dial',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /depth-dial\.spec\.ts/,
    },
    // (Story 5.3) Agent re-curation by stated intent. Desktop, JS on.
    // Rule 7: proven to EXECUTE (not skipped); exercises:
    //   (a) organizer → speaker at visual order 1 (CSS order property)
    //   (b) explorer → flagship at visual order 1
    //   (c) different intents → demonstrably different orderings (AC1)
    //   (d) re-curation in place — URL unchanged (FR-8)
    //   (e) JS-off → canonical DOM order unchanged (FR-8/NFR-3)
    //   (f) hero /speaking bypass present without chat (SM-C1)
    //   (g) the REAL controller (applyRecuration via the GuidePanel SSE path)
    //       re-orders in place — mutation-verified (QA, Rule 8): (a)–(d) inline
    //       the CSS-order assignment, so (g) is the only test that binds the
    //       production web controller end-to-end.
    // All via the serve-with-api.mjs prod-faithful proxy (GUIDE_LLM_STUB=1).
    {
      name: 'recuration',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
      testMatch: /recuration\.spec\.ts/,
    },
  ],
});
