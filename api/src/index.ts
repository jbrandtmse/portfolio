import { serve } from '@hono/node-server';
import { Hono } from 'hono';

// All routes are mounted under the /api base path so the dev proxy and the
// production nginx reverse-proxy (both forward /api/* to this service) hit the
// same paths in dev and prod (AR-8).
const app = new Hono().basePath('/api');

// Placeholder health check (Story 1.1). Later stories add /api/invite (3.3)
// and /api/guide (4.3) under this same /api base path.
app.get('/health', (c) => c.json({ status: 'ok' }));

// API_PORT keeps the Hono port in one place; the Astro dev proxy reads the same
// var (.env.example default 8787).
const port = Number(process.env.API_PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] Hono listening on http://localhost:${info.port}/api`);
});

export default app;
