import { defineConfig } from 'vitest/config';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the gitignored api/.env file for local dev / VM integration tests.
// On CI where the file doesn't exist, this is a no-op.
dotenvConfig({ path: path.resolve(__dirname, '.env') });

// Minimal Vitest config for the api package.
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
