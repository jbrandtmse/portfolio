import { defineConfig } from 'vitest/config';

// Minimal Vitest config for the build-time content-pipeline scripts (Story 1.8).
// The canonical multi-tier harness (Vitest workspace + Playwright + Lighthouse
// CI) is Story 1.9's deliverable — this only makes the co-located *.test.ts in
// this package discoverable and runnable now (skill-rules Rule 8), so the
// orchestrator's "runs clean / no network / deterministic" unit test runs under
// `pnpm -r test`.
export default defineConfig({
  test: {
    // The pipeline orchestrator runs in plain Node (fs + child_process), no DOM.
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
