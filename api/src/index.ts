import { serve } from '@hono/node-server';

import app from './app.js';
import { env } from './env.js';
import { loadIndex } from './lib/retriever.js';

// API_PORT is now validated + defaulted in env.ts (resolves deferred [1.1] items:
// "API_PORT no validation" and "API_PORT default duplicated as a literal").
// This is the production entrypoint: `node dist/index.js` binds the port.
// Tests import app.ts directly (not this file), so they never call serve() and
// never bind a socket (Story-3.0 EADDRINUSE invariant).

// Eager KB index load at bootstrap (Story 4.1, Decision 6).
// loadIndex() is idempotent + cached — the first call builds the in-memory Orama
// index; subsequent calls are no-ops. Placed HERE (bootstrap), not in app.ts,
// so importing app.ts in tests never triggers a file-load side-effect
// (Story 3.0 import-side-effect lesson).
loadIndex()
  .then(() => {
    serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
      console.log(`[api] Hono listening on http://localhost:${info.port}/api`);
    });
  })
  .catch((error: unknown) => {
    console.error('[api] FATAL — KB index load failed:', error);
    process.exitCode = 1;
  });
