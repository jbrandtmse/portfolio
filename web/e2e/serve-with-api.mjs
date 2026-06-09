/**
 * E2E served-runtime launcher (Story 3.4) — the production-faithful topology for
 * the Playwright run: a single public port (PUBLIC_PORT, default 4321) that
 * serves the static `dist/` via `astro preview` AND reverse-proxies `/api/*` to
 * the real Hono API — exactly as production nginx reverse-proxies /api/* to Hono
 * (architecture AR-8). This is what makes the JS-OFF native form POST
 * (<form action="/api/invite" method="POST">) reach the real endpoint end-to-end
 * during the e2e run — `astro preview` alone does NOT proxy /api (it 404s every
 * /api/* request; verified empirically, Story 3.4 QA), so without this launcher
 * the headline AC2 resilience test could never actually exercise the endpoint.
 *
 * WHY a thin proxy in front of `astro preview` (not a hand-rolled static server):
 * the existing e2e suite (url-form / glassbox / timeline / loandemo specs) asserts
 * `astro preview`'s EXACT trailing-slash + redirect behavior (e.g. slashless →
 * 404 not 301; trailing-slash → single 200, no hop). Proxying every NON-/api
 * request straight through to `astro preview` preserves that behavior byte-for-
 * byte, so all prior specs stay green; only /api/* is diverted to Hono.
 *
 * REAL RUNTIME (skill-rules Rule 3): the API runs from SOURCE (tsx src/index.ts)
 * with api/.env loaded (DATABASE_URL → real Postgres; RESEND unset ⇒ mail
 * skipped). If DATABASE_URL is unavailable the API child fails fast (env.ts
 * exits); the JS-off DB test detects that (DATABASE_URL unset in process.env)
 * and skips-with-warning rather than failing the suite.
 *
 * Lifecycle: Playwright starts this via webServer.command and SIGTERM/SIGKILLs
 * it after the run. We forward termination to both children and exit, so no
 * orphaned Hono / preview / proxy process is left behind (the teardown
 * discipline the playwright.config documents).
 *
 * Ports (all overridable via env, sensible defaults that avoid the common 8787
 * dev port so a developer's running `api dev` is never clobbered):
 *   PUBLIC_PORT   (default 4321) — the port Playwright's baseURL hits.
 *   PREVIEW_PORT  (default 4329) — internal astro preview port.
 *   E2E_API_PORT  (default 8799) — internal Hono port (also passed to the API as
 *                                   API_PORT and to the proxy as the /api target).
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = dirname(fileURLToPath(import.meta.url)).replace(/\/e2e$/, '');
const repoRoot = dirname(webRoot);
const apiDir = join(repoRoot, 'api');

const PUBLIC_PORT = Number(process.env.PUBLIC_PORT ?? 4321);
const PREVIEW_PORT = Number(process.env.PREVIEW_PORT ?? 4329);
const E2E_API_PORT = Number(process.env.E2E_API_PORT ?? 8799);
const HOST = '127.0.0.1';

/** Load api/.env into a plain object (no dotenv dep; tolerant minimal parser). */
function loadApiEnv() {
  const envPath = join(apiDir, '.env');
  const out = {};
  if (!existsSync(envPath)) return out;
  for (const rawLine of readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }
  }
  // Give children a moment, then hard-exit.
  setTimeout(() => process.exit(code), 800).unref();
}

for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(sig, () => shutdown(0));
}

// ---------------------------------------------------------------------------
// 1) Start the real Hono API from source (api/.env loaded; real Postgres).
// ---------------------------------------------------------------------------
const apiEnvFile = loadApiEnv();

// Whether a REAL Postgres URL is available (from api/.env or the ambient env).
// This gates ONLY the DB-dependent invite integration test (which skips-with-
// warning when false), NOT whether the API boots — see below.
const hasRealDb = Boolean(apiEnvFile.DATABASE_URL || process.env.DATABASE_URL);

// Surface a REAL DATABASE_URL to the Playwright worker process so the JS-off DB
// test can read+clean up the persisted row (it only RUNS when the WORKER sees
// this set). A placeholder is NEVER surfaced to the worker, so the invite DB
// test still correctly skips-with-warning in a no-DB environment.
if (apiEnvFile.DATABASE_URL) {
  process.env.DATABASE_URL = apiEnvFile.DATABASE_URL;
}

const apiEnv = {
  ...process.env,
  ...apiEnvFile,
  // Force the API onto the internal e2e port (never the dev 8787).
  API_PORT: String(E2E_API_PORT),
  // Guide e2e runs with the deterministic LLM stub — no live LLM call in tests
  // (Story 4.3, Rule 4: test both branches; stub engaged here for the e2e run).
  // GUIDE_LLM_STUB=1 can also be overridden from the caller's env if needed.
  GUIDE_LLM_STUB: process.env.GUIDE_LLM_STUB ?? '1',
};

// ALWAYS start the Hono API — the guide endpoint (POST /api/guide, Story 4.3,
// the canonical Rule-7 SSE e2e) does NOT touch Postgres, so it must run
// independent of DATABASE_URL (CI has no DB). env.ts hard-requires DATABASE_URL
// to be present (a non-empty string) to boot, so when no REAL DB is configured
// we feed the API child a clearly-marked PLACEHOLDER connection string. The
// guide path never queries Postgres, so the placeholder is never dialed; the
// node-postgres Pool connects lazily (only on a real query), so the API boots
// and serves /api/guide fine. The invite DB integration test keys its skip off
// the WORKER's process.env.DATABASE_URL (set above only from a REAL url), which
// stays unset here — so it still skips-with-warning rather than dialing a dead
// placeholder. This closes the Story-4.3 Rule-7 gap: the guide e2e previously
// FAILED with 502 in a no-DB env because the API was never started.
if (!hasRealDb) {
  apiEnv.DATABASE_URL =
    'postgresql://placeholder:placeholder@127.0.0.1:1/placeholder_no_db_e2e?connect_timeout=1';
  console.warn(
    '[e2e-serve] No real DATABASE_URL — starting the Hono API with a PLACEHOLDER DB url so ' +
      'the guide SSE e2e (POST /api/guide, no Postgres) runs. The invite DB integration test ' +
      'skips-with-warning (the worker sees no real DATABASE_URL).',
  );
}

const api = spawn('pnpm', ['--filter', '@portfolio/api', 'exec', 'tsx', 'src/index.ts'], {
  cwd: repoRoot,
  env: apiEnv,
  stdio: ['ignore', 'inherit', 'inherit'],
});
api.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[e2e-serve] Hono API exited unexpectedly (code ${code})`);
    shutdown(1);
  }
});
children.push(api);
const apiHasDb = hasRealDb;

// ---------------------------------------------------------------------------
// 2) Start astro preview (serves dist/) on the internal preview port.
// ---------------------------------------------------------------------------
const preview = spawn('pnpm', ['preview', '--port', String(PREVIEW_PORT), '--host', HOST], {
  cwd: webRoot,
  env: process.env,
  stdio: ['ignore', 'inherit', 'inherit'],
});
preview.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[e2e-serve] astro preview exited unexpectedly (code ${code})`);
    shutdown(1);
  }
});
children.push(preview);

// ---------------------------------------------------------------------------
// 3) Reverse proxy on the public port: /api/* → Hono; everything else → preview.
//    Mirrors production nginx (AR-8). Does NOT follow redirects, so the
//    endpoint's 303 → /invite/thanks/ reaches the browser intact.
// ---------------------------------------------------------------------------
function proxyTo(targetPort, clientReq, clientRes) {
  // PRESERVE the original Host header (do NOT rewrite to the upstream port) —
  // production nginx forwards `Host: $host` unchanged, and the Hono endpoint's
  // same-origin guard compares the request's `Origin` host against `Host`. If we
  // rewrote Host to `127.0.0.1:<upstream>` while the browser sends
  // `Origin: 127.0.0.1:<public>`, the two would differ and the native form POST
  // would be rejected 403 (cross-origin) — which is NOT how it behaves in prod.
  // Keeping Host intact makes Origin === Host for the same-origin native POST.
  const options = {
    host: HOST,
    port: targetPort,
    method: clientReq.method,
    path: clientReq.url,
    headers: { ...clientReq.headers },
  };
  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });
  proxyReq.on('error', (err) => {
    if (!clientRes.headersSent) clientRes.writeHead(502, { 'content-type': 'text/plain' });
    clientRes.end(`[e2e-serve] upstream error: ${err.message}`);
  });
  clientReq.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  const target = url === '/api' || url.startsWith('/api/') ? E2E_API_PORT : PREVIEW_PORT;
  proxyTo(target, req, res);
});

server.listen(PUBLIC_PORT, HOST, () => {
  console.log(
    `[e2e-serve] proxy on http://${HOST}:${PUBLIC_PORT} → preview :${PREVIEW_PORT} (static) + ` +
      `Hono :${E2E_API_PORT} (/api/*)${apiHasDb ? '' : ' [placeholder DB: invite DB test skips, guide runs]'}`,
  );
});
server.on('error', (err) => {
  console.error(`[e2e-serve] proxy listen error: ${err.message}`);
  shutdown(1);
});
