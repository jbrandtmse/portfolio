import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// API_PORT mirrors the Hono service port (.env.example default 8787). The Vite
// dev-server proxy forwards /api/* to Hono so the site is same-origin in dev,
// exactly as production nginx reverse-proxies /api/* to Hono (AR-8).
const API_PORT = process.env.API_PORT ?? '8787';

// https://astro.build/config
export default defineConfig({
  // Canonical production origin. Feeds Astro.site, which MirrorLayout uses to
  // build each Mirror route's self-canonical <link rel="canonical"> (Story 1.5,
  // UX-DR10), and which Story 1.6's sitemap/robots will reuse.
  site: 'https://joshuabrandt.abacusai.cloud',
  output: 'static',
  // URL-form convention (project-rules.md Rule 2): trailing-slash everywhere so
  // internal links === rel=canonical === sitemap <loc>. `build.format: 'directory'`
  // (explicit; was the default) emits about/index.html so nginx serves /about/
  // directly. `trailingSlash: 'always'` aligns dev/preview redirect behavior with
  // the emitted form, eliminating the 301 hop that /about → /about/ caused in prod.
  build: { format: 'directory' },
  trailingSlash: 'always',
  integrations: [react()],
  vite: {
    server: {
      proxy: {
        '/api': `http://localhost:${API_PORT}`,
      },
    },
  },
});
