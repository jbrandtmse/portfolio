import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// API_PORT mirrors the Hono service port (.env.example default 8787). The Vite
// dev-server proxy forwards /api/* to Hono so the site is same-origin in dev,
// exactly as production nginx reverse-proxies /api/* to Hono (AR-8).
const API_PORT = process.env.API_PORT ?? '8787';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    server: {
      proxy: {
        '/api': `http://localhost:${API_PORT}`,
      },
    },
  },
});
