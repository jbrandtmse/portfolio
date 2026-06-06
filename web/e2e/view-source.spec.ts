import { expect, test } from '@playwright/test';

/**
 * VIEW-SOURCE SEO check (Story 1.9, AC2 / IAC-2 (d); UX-DR10/UX-DR14/UX-DR15, the
 * SEO/GEO floor) — the citable substance is in the INITIAL HTML, JS-independent.
 * These assertions use Playwright's `request` fixture (a raw HTTP GET, NO browser
 * rendering, NO JS execution) so they prove the bytes a crawler / answer engine /
 * "view-source" reader sees — exactly the view-source tier architecture.md §AR-14
 * calls for (skill-rules Rule 3 real-runtime evidence for the GEO floor).
 *
 * The home (/) and a Mirror route (/about) have deliberately different SEO shapes
 * (UX-DR10): every Mirror route is SELF-canonical (so /about carries a
 * <link rel="canonical">), while the home is the cinematic entry and does NOT
 * self-canonicalize (the build-output suite asserts canonical on the Mirror
 * routes, not on /). So the canonical assertion is scoped to /about; both routes
 * must carry the entity-first answer substance + the JSON-LD Person in the served
 * HTML with no JavaScript.
 */

/** Extract + JSON.parse every ld+json block; flatten array blocks. */
function parseLdJson(html: string): Array<Record<string, unknown>> {
  const blocks =
    html.match(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];
  const nodes: Array<Record<string, unknown>> = [];
  for (const block of blocks) {
    const inner = block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '');
    const parsed = JSON.parse(inner) as unknown;
    if (Array.isArray(parsed)) nodes.push(...(parsed as Array<Record<string, unknown>>));
    else nodes.push(parsed as Record<string, unknown>);
  }
  return nodes;
}

/** The text of the FIRST <p> whose text is non-trivial answer prose. */
function firstAnswerParagraph(html: string): string {
  const paras = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
    m[1]!
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
  // The first paragraph that actually leads with the entity name (the GEO lede).
  return paras.find((p) => p.startsWith('Joshua R. Brandt, MSE')) ?? '';
}

test.describe('view-source / (home) — the GEO substance is in the initial HTML (no JS)', () => {
  test('the served HTML carries an entity-first answer paragraph', async ({ request }) => {
    const res = await request.get('/');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    // The answer-first lede (the thesis scene) names the entity in its first
    // sentence — present in the raw bytes, before any JS.
    expect(firstAnswerParagraph(html)).toMatch(/^Joshua R\. Brandt, MSE/);
  });

  test('embeds a parseable JSON-LD Person node in the served HTML (DATA, not JS)', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["']/i);
    const person = parseLdJson(html).find((n) => n['@type'] === 'Person');
    expect(person).toBeDefined();
    expect(person!.name).toBe('Joshua R. Brandt, MSE');
  });
});

test.describe('view-source /about (Mirror route) — full SEO floor in the initial HTML (no JS)', () => {
  test('the answer-first lede names the entity in its first sentence', async ({ request }) => {
    const res = await request.get('/about');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(firstAnswerParagraph(html)).toMatch(/^Joshua R\. Brandt, MSE/);
  });

  test('is self-canonical — carries a <link rel="canonical"> to its own URL', async ({
    request,
  }) => {
    const html = await (await request.get('/about')).text();
    const canonical = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
    expect(canonical).not.toBeNull();
    expect(canonical![0]).toMatch(/href="[^"]*\/about\/?"/);
  });

  test('embeds a parseable JSON-LD Person node in the served HTML (DATA, not JS)', async ({
    request,
  }) => {
    const html = await (await request.get('/about')).text();
    expect(html).toMatch(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["']/i);
    const person = parseLdJson(html).find((n) => n['@type'] === 'Person');
    expect(person).toBeDefined();
    expect(person!.name).toBe('Joshua R. Brandt, MSE');
  });
});
