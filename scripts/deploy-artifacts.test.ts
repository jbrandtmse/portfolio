import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Static-shape guards for the Story 1.10 deploy artifacts (AC1; AR-8) — QA stage.
 *
 * `scripts/deploy.sh`, `deploy/nginx/joshuabrandt.conf`, and
 * `deploy/systemd/portfolio-api.service` are the deploy topology EVERY future
 * epic's deploy rides on (the story's `Consumed-by`: "every future deploy of any
 * epic"). The LEAD executes the real VM deploy + local curl smoke (IAC-1) — that
 * is NOT run here, and these tests deliberately invoke NO sudo/systemctl/nginx.
 *
 * But the artifacts' STATIC shape carries load-bearing invariants that a future
 * edit could silently break, with no other test to catch it (before this file,
 * grep confirms zero test references any of the three). The dev validated them
 * once by hand (`bash -n`, `systemd-analyze verify`, `nginx -t`); these pin the
 * specific contracts so a regression fails CI instead of a deploy:
 *
 *   • deploy.sh uses `set -euo pipefail` (a failed step aborts — no half-deploy),
 *     builds the api EXPLICITLY before restarting it (the 1.8 flag: the root
 *     `pnpm build` no longer compiles the api, so a missing explicit build would
 *     relaunch stale/absent api JS), and orders build → restart correctly.
 *   • the nginx vhost reverse-proxies `/api/` → 127.0.0.1:8787 (the Hono port),
 *     serves web/dist, and matches on the .vm.internal ingress name.
 *   • the systemd unit's ExecStart runs the COMPILED `node dist/index.js` from the
 *     api WorkingDirectory, with auto-restart + boot persistence.
 *
 * Cheap fs/string assertions (plus a real `bash -n` syntax gate on deploy.sh —
 * an actual invocation, not sudo). Discoverable by the scripts package's
 * test glob (the same one matching pipeline-guards.test.ts), so it runs under
 * `pnpm -r test` / CI (skill-rules Rule 8).
 */

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptsDir, '..');

const deploySh = readFileSync(join(scriptsDir, 'deploy.sh'), 'utf8');
const nginxConf = readFileSync(join(repoRoot, 'deploy', 'nginx', 'joshuabrandt.conf'), 'utf8');
const systemdUnit = readFileSync(
  join(repoRoot, 'deploy', 'systemd', 'portfolio-api.service'),
  'utf8',
);

/**
 * Strip shell comments (`#…` to end of line, but NOT inside the shebang `#!`) so
 * the "does the SCRIPT do X" assertions check executable lines, not the doc
 * comments that legitimately NAME the same commands while explaining them. The
 * deploy.sh header documents `set -euo pipefail`, `systemctl restart`, etc., so
 * an un-stripped grep would pass even if the real command were deleted.
 */
function shellCodeOnly(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      if (line.startsWith('#!')) return line; // keep the shebang
      const hashIdx = line.indexOf('#');
      return hashIdx === -1 ? line : line.slice(0, hashIdx);
    })
    .join('\n');
}

const deployCode = shellCodeOnly(deploySh);

describe('deploy.sh — fail-fast + correct build/restart order (Story 1.10 AC1; AR-8)', () => {
  it('is a bash script (shebang) and is syntactically valid (`bash -n`, a real parse — no sudo)', () => {
    expect(deploySh.startsWith('#!')).toBe(true);
    expect(deploySh).toMatch(/^#!.*\b(bash|sh)\b/);
    // Real invocation of bash in no-exec parse mode: catches syntax breakage
    // without running any deploy step. Throws (failing the test) on a parse error.
    expect(() =>
      execFileSync('bash', ['-n', join(scriptsDir, 'deploy.sh')], { stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('enables strict mode `set -euo pipefail` (a failed step aborts the whole deploy)', () => {
    // Exact strict-mode line in executable code — no half-deploy that "succeeds".
    expect(deployCode).toMatch(/^\s*set -euo pipefail\s*$/m);
  });

  it('builds the api EXPLICITLY (`pnpm --filter api build`) — the 1.8 flag', () => {
    // The root build no longer compiles the api (Story 1.8), so deploy.sh MUST
    // build it explicitly, otherwise the restarted unit runs stale/absent JS.
    expect(deployCode).toMatch(/pnpm\s+--filter\s+api\s+build/);
  });

  it('runs the root build (content pipeline + web → web/dist)', () => {
    expect(deployCode).toMatch(/^\s*pnpm build\s*$/m);
  });

  it('restarts the api systemd unit AFTER building the api (never before)', () => {
    expect(deployCode).toMatch(/systemctl\s+restart\s+portfolio-api/);
    const apiBuildIdx = deployCode.search(/pnpm\s+--filter\s+api\s+build/);
    const restartIdx = deployCode.search(/systemctl\s+restart\s+portfolio-api/);
    expect(apiBuildIdx).toBeGreaterThanOrEqual(0);
    expect(restartIdx).toBeGreaterThan(apiBuildIdx);
  });

  it('validates the nginx config before reloading it (`nginx -t` then reload)', () => {
    expect(deployCode).toMatch(/nginx\s+-t/);
    const testIdx = deployCode.search(/nginx\s+-t/);
    const reloadIdx = deployCode.search(/systemctl\s+reload\s+nginx/);
    expect(testIdx).toBeGreaterThanOrEqual(0);
    expect(reloadIdx).toBeGreaterThan(testIdx);
  });

  it('pulls the latest code before building (git pull)', () => {
    expect(deployCode).toMatch(/git\s+pull/);
  });
});

describe('nginx vhost — serves web/dist + proxies /api/ → Hono:8787 (AC1; AR-8)', () => {
  it('matches the VM-ingress server_name joshuabrandt.vm.internal', () => {
    expect(nginxConf).toMatch(/server_name\s+joshuabrandt\.vm\.internal\s*;/);
  });

  it('serves the built static Mirror from web/dist', () => {
    expect(nginxConf).toMatch(/root\s+\S*web\/dist\s*;/);
  });

  it('reverse-proxies a `location /api/` block to 127.0.0.1:8787 (the Hono port)', () => {
    // The /api/ location must proxy_pass to the localhost Hono high port. Scope
    // the proxy_pass assertion to the /api/ block so we prove THIS location is
    // the one wired to 8787 (not some other passthrough).
    const apiBlock = nginxConf.match(/location\s+\/api\/\s*\{[\s\S]*?\}/);
    expect(apiBlock, 'location /api/ block').not.toBeNull();
    expect(apiBlock![0]).toMatch(/proxy_pass\s+http:\/\/127\.0\.0\.1:8787\s*;/);
  });

  it('forwards the real public host to the api via X-Original-Host (Envoy ingress)', () => {
    expect(nginxConf).toMatch(/proxy_set_header\s+Host\s+\$http_x_original_host\s*;/);
  });

  it('carries the websocket/streaming upgrade headers (the Guide streams /api/* in Epic 4)', () => {
    expect(nginxConf).toMatch(/proxy_http_version\s+1\.1\s*;/);
    expect(nginxConf).toMatch(/proxy_set_header\s+Upgrade\s+\$http_upgrade\s*;/);
    expect(nginxConf).toMatch(/proxy_set_header\s+Connection\s+"upgrade"\s*;/);
  });

  it('serves the static Mirror with the SPA-style fallback (try_files … /index.html)', () => {
    const rootBlock = nginxConf.match(/location\s+\/\s*\{[\s\S]*?\}/g);
    expect(rootBlock).not.toBeNull();
    // The catch-all `location /` (the last such block) does the static fallback.
    const lastRoot = rootBlock![rootBlock!.length - 1]!;
    expect(lastRoot).toMatch(/try_files\s+\$uri\s+\$uri\/\s+\/index\.html/);
  });

  it('denies dotfiles so a stray .env is never web-reachable (NFR-5)', () => {
    const dotBlock = nginxConf.match(/location\s+~\s+\/\\\.\s*\{[\s\S]*?\}/);
    expect(dotBlock, 'dotfile deny block').not.toBeNull();
    expect(dotBlock![0]).toMatch(/deny\s+all\s*;/);
  });
});

describe('systemd unit — Hono api as node dist/index.js, auto-restart, boot-persistent (AC1; AR-8)', () => {
  it('ExecStart runs the COMPILED api with node (dist/index.js), not tsx/pnpm', () => {
    // The unit runs the tsc output directly (deploy.sh built api/dist first). It
    // must NOT depend on tsx/pnpm at runtime. Match the ExecStart line specifically.
    const execStart = systemdUnit.match(/^\s*ExecStart=(.+)$/m);
    expect(execStart, 'ExecStart line').not.toBeNull();
    const cmd = execStart![1]!.trim();
    expect(cmd).toMatch(/\bnode\b/);
    expect(cmd).toMatch(/\bdist\/index\.js\b/);
    expect(cmd).not.toMatch(/\b(tsx|pnpm|ts-node)\b/);
  });

  it('runs from the api WorkingDirectory so `dist/index.js` resolves', () => {
    expect(systemdUnit).toMatch(/^\s*WorkingDirectory=\S*\/api\s*$/m);
  });

  it('sets the non-secret API_PORT=8787 to match the nginx proxy target', () => {
    expect(systemdUnit).toMatch(/^\s*Environment=API_PORT=8787\s*$/m);
  });

  it('uses an OPTIONAL gitignored EnvironmentFile for server-side secrets (leading `-`)', () => {
    // The leading `-` makes the unit start even when .env is absent (secrets may
    // come from IMDSv2). NFR-5: secrets are never committed / never in web/.
    expect(systemdUnit).toMatch(/^\s*EnvironmentFile=-\S+/m);
  });

  it('auto-restarts on crash (Restart=always)', () => {
    expect(systemdUnit).toMatch(/^\s*Restart=always\s*$/m);
  });

  it('is boot-persistent (WantedBy=multi-user.target)', () => {
    expect(systemdUnit).toMatch(/^\s*WantedBy=multi-user\.target\s*$/m);
  });

  it('declares no inline secret values (only the non-secret NODE_ENV / API_PORT)', () => {
    // Every Environment= line is a non-secret config knob. A regression that
    // hardcodes e.g. an API key inline would break NFR-5 — guard the shape.
    const envLines = [...systemdUnit.matchAll(/^\s*Environment=([^=\s]+)=/gm)].map((m) => m[1]);
    for (const key of envLines) {
      expect(['NODE_ENV', 'API_PORT']).toContain(key);
    }
  });
});
