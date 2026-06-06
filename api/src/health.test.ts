import { describe, expect, it } from 'vitest';

import app from './index.ts';

// Real-runtime integration test for the /api/health endpoint (Story 1.1).
//
// `app.request()` is Hono's in-process request entrypoint: it drives a real
// Request through the actual app router and returns the real Response — the
// same code path the @hono/node-server runtime exercises, minus the socket.
// This is a genuine runtime assertion (status code + response body), not a
// structural/mock check (skill-rules Rule 3 form for a service/API).
//
// Routes are mounted under `.basePath('/api')`, so the health route is reached
// at `/api/health` — the same path the dev proxy and prod nginx forward (AR-8).
describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ok' });
  });

  it('returns JSON content type', async () => {
    const res = await app.request('/api/health');

    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
