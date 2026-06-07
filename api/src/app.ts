import { Hono } from 'hono';

import guideRouter from './routes/guide.js';
import inviteRouter from './routes/invite.js';

// All routes are mounted under the /api base path so the dev proxy and the
// production nginx reverse-proxy (both forward /api/* to this service) hit the
// same paths in dev and prod (AR-8).
const app = new Hono().basePath('/api');

// Placeholder health check (Story 1.1).
app.get('/health', (c) => c.json({ status: 'ok' }));

// POST /api/invite — speaking inquiry capture (Story 3.3).
// inviteRouter handles /invite (under the /api base), which resolves to
// the full path /api/invite once the basePath is applied.
app.route('/', inviteRouter);

// POST /api/guide — the Guide endpoint (Story 4.3).
// SSE stream: retrieve → threshold gate → ground → stream tokens + citations.
app.route('/', guideRouter);

export default app;
