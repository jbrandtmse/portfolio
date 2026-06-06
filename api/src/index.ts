import { serve } from '@hono/node-server';

import app from './app.js';

// API_PORT keeps the Hono port in one place; the Astro dev proxy reads the same
// var (.env.example default 8787).
const port = Number(process.env.API_PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] Hono listening on http://localhost:${info.port}/api`);
});
