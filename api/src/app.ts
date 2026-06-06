import { Hono } from 'hono';

// All routes are mounted under the /api base path so the dev proxy and the
// production nginx reverse-proxy (both forward /api/* to this service) hit the
// same paths in dev and prod (AR-8).
const app = new Hono().basePath('/api');

// Placeholder health check (Story 1.1). Later stories add /api/invite (3.3)
// and /api/guide (4.3) under this same /api base path.
app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
