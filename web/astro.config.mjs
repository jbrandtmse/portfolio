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
    build: {
      rollupOptions: {
        output: {
          // NFR-6 / Story 5.1: Stabilise dynamic-import chunk hashes.
          //
          // Story 5.1 introduced the project's first dynamic-import chain
          // (index.astro shim → bootstrap → WebGLSetpiece), which carries
          // GSAP + three.js + @react-three/fiber.  Without explicit chunk
          // boundaries Rollup's default splitter reconstructs the chunk graph
          // on every build and can assign modules to chunks in a different order,
          // causing the content-hash of those chunks to jitter even though their
          // source is unchanged (known upstream: rollup#5902, vite#6773).
          //
          // manualChunks pins the module → chunk assignment explicitly, making
          // the graph structure deterministic and eliminating the hash jitter.
          //
          // DEFERRAL CONTRACT (NFR-1) is preserved: both chunks are produced as
          // separate async chunks (not entry chunks), so Astro/Vite still emits
          // them as dynamic-import targets.  The index.astro inline shim is the
          // ONLY code that triggers the load (on first scroll/interaction inside
          // onMotionAllowed), so Lighthouse's no-interaction trace never fetches
          // either chunk.
          //
          // ISOLATION CONTRACT (NFR-1) is preserved: only the cinematic modules
          // listed here land in these chunks; no other route imports them.
          manualChunks(id) {
            // NFR-6 / Story 5.1: pin vendor library boundaries to eliminate
            // Rollup's chunk-graph hash jitter for dynamic-import chunks.
            //
            // RULES:
            //   1. Only pure-cinematic vendor node_modules are pinned here.
            //      Project source files (src/lib/cinematic/, src/islands/) are
            //      excluded — Vite's preload-helper shim must continue to statically
            //      import only the tiny 1KB preload polyfill, not the heavy chunks.
            //   2. NEVER group a library that has React as a transitive dependency
            //      into a cinematic chunk.  @react-three/fiber re-exports React, so
            //      putting it here would pull ALL React islands (InviteForm, GuidePill)
            //      into the cinematic chunk — breaking NFR-2 (they'd be fetched on
            //      every route, including under reduced-motion).  @react-three/fiber
            //      is intentionally left for Rollup to assign normally; it lands only
            //      in the WebGLSetpiece async chunk, which is fine.
            //
            // three.js core (NO @react-three/* here!) is safely isolated: only
            // WebGLSetpiece.tsx imports it, so it ends up in the cinematic chain.
            // Pinning it prevents Rollup from splitting/reordering its symbols across
            // builds (the root cause of the hash jitter: rollup#5902, vite#6773).
            if (id.includes('/node_modules/three/')) {
              return 'cinematic-three';
            }
            // GSAP is imported only by src/lib/cinematic/index.ts (the camera path).
            // Pinning it into its own chunk eliminates hash jitter in the GSAP chunk.
            if (id.includes('/node_modules/gsap/')) {
              return 'cinematic-gsap';
            }
          },
        },
      },
    },
  },
});
