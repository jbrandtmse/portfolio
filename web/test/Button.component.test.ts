import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

import Button from '../src/components/common/Button.astro';

/**
 * Isolated component-render assertions for Button (Story 1.2, AC4).
 *
 * The build-output suite (build-output.test.ts) covers the home page, but
 * index.astro only ever renders Button WITH an `href` — so its default
 * `<button>` branch (the component's documented default element) ships
 * untested there. AC4 requires Button to render "a real <button> by default or
 * an <a> when `href` is passed"; this renders the component directly via Astro's
 * Container API to exercise BOTH branches in isolation. Real-runtime evidence
 * for a user-facing component (skill-rules Rule 3), discoverable under the
 * default suite (Rule 8: `*.test.ts`, included by vitest.config.ts).
 */
let container: Awaited<ReturnType<typeof AstroContainer.create>>;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('Button.astro — element semantics (AC4)', () => {
  it('renders a real <button> (type="button") when no href is passed', async () => {
    const html = await container.renderToString(Button, {
      props: { variant: 'primary' },
      slots: { default: 'Send' },
    });
    // Real <button>, not a div/anchor — and no stray href on it.
    expect(html).toMatch(/<button\b[^>]*type="button"[^>]*>/);
    expect(html).not.toMatch(/<button\b[^>]*\shref=/);
    expect(html).not.toMatch(/<a\b/);
    expect(html).toContain('Send');
  });

  it('renders an <a> carrying the href (not a <button>) when href is passed', async () => {
    const html = await container.renderToString(Button, {
      props: { variant: 'primary', href: '/browse' },
      slots: { default: 'Browse the work' },
    });
    expect(html).toMatch(/<a\b[^>]*href="\/browse"[^>]*>/);
    expect(html).not.toMatch(/<button\b/);
    expect(html).toContain('Browse the work');
  });

  it('honors an explicit native type on the <button> branch', async () => {
    const html = await container.renderToString(Button, {
      props: { variant: 'primary', type: 'submit' },
      slots: { default: 'Submit' },
    });
    expect(html).toMatch(/<button\b[^>]*type="submit"[^>]*>/);
  });

  it('applies the variant class for primary and secondary', async () => {
    const primary = await container.renderToString(Button, {
      props: { variant: 'primary' },
      slots: { default: 'Primary' },
    });
    const secondary = await container.renderToString(Button, {
      props: { variant: 'secondary' },
      slots: { default: 'Secondary' },
    });
    expect(primary).toMatch(/class="[^"]*\bbtn\b[^"]*\bbtn--primary\b[^"]*"/);
    expect(secondary).toMatch(/class="[^"]*\bbtn\b[^"]*\bbtn--secondary\b[^"]*"/);
  });

  it('contains no exclamation mark in a rendered label (positive-assertion voice)', async () => {
    const html = await container.renderToString(Button, {
      props: { variant: 'primary' },
      slots: { default: 'Get in touch' },
    });
    expect(html).not.toContain('!');
  });
});
