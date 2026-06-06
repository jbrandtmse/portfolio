/**
 * /robots.txt — the generated robots policy (Story 1.6, Task 4 / AC3;
 * architecture §AR-9; UX-DR23; NFR-3). A prerendered Astro static endpoint.
 *
 * GEO-first posture (NFR-3): the site WANTS AI crawlers — answer/search engines
 * are a primary discovery surface for Josh's identity and speaker facts. So
 * every AI-crawler token is explicitly ALLOWED (never blocked), then a final
 * `User-agent: *` / `Allow: /` allows everything else. A `Sitemap:` line points
 * at the absolute sitemap URL (built from `context.site`).
 *
 * The token set is the verified 2026 list (story Dev Notes; re-confirmed via web
 * search 2026-06-06 against nohacks.co, searchenginejournal Dec-2025, momentic,
 * and the ai-robots-txt registry). Tokens drift — extend this list as new
 * compliant AI crawlers appear (UX-DR23). The AC3 minimum (ClaudeBot, GPTBot,
 * OAI-SearchBot, PerplexityBot, Google-Extended) is included; the rest are the
 * related current tokens. Bytespider is omitted (commonly non-compliant /
 * ignores robots.txt); since it disregards directives, listing it is moot —
 * documented here as a deliberate call, not an oversight.
 *
 * robots.txt is static text → fully deterministic (NFR-6). Build-time only;
 * ships no client JS.
 */
import type { APIRoute } from 'astro';

// Prerender as a static file at build time.
export const prerender = true;

/**
 * AI-crawler user-agent tokens to explicitly ALLOW (verified 2026 set). Grouped
 * by vendor in the order the story lists them. Each is emitted as
 * `User-agent: <token>` / `Allow: /`.
 */
const AI_CRAWLER_TOKENS: string[] = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'anthropic-ai',
  'Claude-User',
  'Claude-SearchBot',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Google
  'Google-Extended',
  'Google-CloudVertexBot',
  // Apple
  'Applebot-Extended',
  // Amazon
  'Amazonbot',
  // Meta
  'Meta-ExternalAgent',
  // Common Crawl
  'CCBot',
  // Cohere
  'cohere-ai',
];

export const GET: APIRoute = ({ site }) => {
  const origin = site?.href.replace(/\/$/, '') ?? 'https://joshuabrandt.abacusai.cloud';

  // One explicit Allow block per AI crawler (GEO-first; do NOT block — NFR-3).
  const aiBlocks = AI_CRAWLER_TOKENS.map((token) => `User-agent: ${token}\nAllow: /`).join('\n\n');

  const body =
    `# robots.txt — GEO-first: AI crawlers are explicitly welcomed (NFR-3, UX-DR23).\n` +
    `# Every AI-crawler token below is allowed; nothing is disallowed.\n\n` +
    `${aiBlocks}\n\n` +
    `# Everything else may crawl the whole site.\n` +
    `User-agent: *\nAllow: /\n\n` +
    `Sitemap: ${origin}/sitemap.xml\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
