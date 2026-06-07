import { serve } from '@hono/node-server';

import app from './app.js';
import { env } from './env.js';

// API_PORT is now validated + defaulted in env.ts (resolves deferred [1.1] items:
// "API_PORT no validation" and "API_PORT default duplicated as a literal").
// This is the production entrypoint: `node dist/index.js` binds the port.
// Tests import app.ts directly (not this file), so they never call serve() and
// never bind a socket (Story-3.0 EADDRINUSE invariant).
serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`[api] Hono listening on http://localhost:${info.port}/api`);
});
