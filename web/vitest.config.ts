/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Minimal Vitest config for the web package (Story 1.2).
// The canonical multi-tier harness (Vitest workspace + Playwright JS-off +
// Lighthouse CI) is Story 1.9's deliverable — this only makes the co-located
// *.test.ts in this package discoverable and runnable now (skill-rules Rule 8).
//
// Wrapped with Astro's `getViteConfig` so Vitest reuses the project's Astro +
// Vite pipeline. That's required to `import` an `.astro` component into a test
// and render it in isolation via the Container API (Button.component.test.ts).
// The build-output suite (fs + a real `astro build`, no `.astro` imports) is
// unaffected and keeps running under the same config.
export default getViteConfig({
  test: {
    // Both suites here run in plain Node: build-output reads files from disk
    // after a real `astro build`; the Container API renders to an HTML string
    // with no DOM. So the default Node environment is correct.
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    // A real `astro build` runs in beforeAll — give it room beyond the 5s default.
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
