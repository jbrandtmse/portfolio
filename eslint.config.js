// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

// Minimal Node global set (avoids pulling in the `globals` package for a
// scaffold). Used for config files and the Node-runtime api service.
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'readonly',
  require: 'readonly',
  exports: 'writable',
  globalThis: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
};

export default tseslint.config(
  {
    // Global ignores — build output, deps, generated types.
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.astro/**',
      'web/dist/**',
      'api/dist/**',
      'api/data/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // Node-context files: config + the Hono service + the e2e served-runtime
    // launcher (web/e2e/*.mjs — a plain-Node script that starts the API +
    // preview + proxy for Playwright). Provide Node globals and allow console
    // (used for startup/diagnostics).
    files: ['**/*.config.{js,mjs,ts}', 'api/**/*.ts', 'web/e2e/**/*.mjs'],
    languageOptions: {
      globals: nodeGlobals,
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Ambient declaration files: Astro generates env.d.ts as a triple-slash
    // reference — that is the idiomatic, framework-required form here.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
);
