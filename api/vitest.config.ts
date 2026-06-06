import { defineConfig } from 'vitest/config';

// Minimal Vitest config for the api package (Story 1.1).
// The canonical multi-tier harness (Vitest workspace + Playwright + Lighthouse
// CI) is Story 1.9's deliverable — this only makes the co-located *.test.ts in
// this package discoverable and runnable now (skill-rules Rule 8).
export default defineConfig({
  test: {
    // Hono runs on web-standard primitives; the in-process app.request() path
    // needs no DOM — the default Node environment is correct.
    environment: 'node',
    // Co-located unit/integration tests, matching the architecture's
    // "co-located *.test.ts (Vitest)" convention.
    include: ['src/**/*.test.ts'],
  },
});
