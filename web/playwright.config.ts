import { defineConfig, devices } from '@playwright/test';

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

  // Build the site and serve dist/ for the whole run; tear it down after.
  // `pnpm build` is the deterministic content+astro build (root script, Story
  // 1.8); `pnpm preview` serves web/dist. reuseExistingServer locally avoids a
  // rebuild when a preview is already up.
  webServer: {
    command: 'pnpm --dir .. build && pnpm preview --port ' + PORT + ' --host 127.0.0.1',
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
  ],
});
