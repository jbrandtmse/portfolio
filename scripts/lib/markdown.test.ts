/**
 * markdown.test.ts — unit tests for the shared markdown utilities (Story 4.0 AC2/AC3).
 *
 * Tests assert:
 *  (a) stripFrontmatter removes a genuine leading YAML frontmatter block
 *      (`---\n<key>: …\n---\nbody`) and returns only the body.
 *  (b) stripFrontmatter does NOT over-strip a body that OPENS with a bare
 *      `---` thematic break followed by content and a later `---` — the
 *      between-content is preserved.
 *  (c) stripFrontmatter leaves content unchanged when no leading `---` is
 *      present.
 *  (d) The tests are mutation-verified (old `/^---[\s\S]*?---\n?/` regex
 *      would red on test (b) — asserting against the REAL module per Rule 8).
 *
 * Rule 8 compliance: every test imports the REAL stripFrontmatter from
 * scripts/lib/markdown.ts (not an inline copy) and scopes assertions to
 * the exact behavior the function claims.
 */
import { describe, expect, it } from 'vitest';

import { stripFrontmatter } from './markdown.ts';

// ─── AC2/AC3 (a): real YAML frontmatter is stripped ──────────────────────────

describe('Story 4.0 AC2/AC3 — stripFrontmatter: real YAML frontmatter is removed', () => {
  it('strips a simple single-key frontmatter block (title: …)', () => {
    const md = '---\ntitle: Hello\n---\n# Body heading\n\nParagraph.';
    const result = stripFrontmatter(md);
    expect(result).toBe('# Body heading\n\nParagraph.');
    // Frontmatter tokens must not appear.
    expect(result).not.toContain('title: Hello');
    expect(result).not.toMatch(/^---/);
  });

  it('strips a multi-key frontmatter block (brainstorm-style)', () => {
    const md =
      '---\nstepsCompleted: [1, 2, 3]\nideas_generated: 47\nworkflow_completed: true\n---\n\n# Brainstorming Session Results\n\nParagraph.';
    const result = stripFrontmatter(md);
    expect(result).toBe('\n# Brainstorming Session Results\n\nParagraph.');
    expect(result).not.toContain('stepsCompleted');
    expect(result).not.toContain('ideas_generated');
  });

  it('strips frontmatter with a status key (product-brief-style)', () => {
    const md =
      '---\ntitle: "Product Brief"\nstatus: final\ncreated: 2026-06-02\n---\n\n# Brief\n\nBody.';
    const result = stripFrontmatter(md);
    expect(result).toBe('\n# Brief\n\nBody.');
    expect(result).not.toContain('status: final');
    expect(result).not.toContain('created: 2026-06-02');
  });

  it('handles a frontmatter block followed by no trailing newline', () => {
    const md = '---\nkey: value\n---';
    const result = stripFrontmatter(md);
    // Nothing left (the closing --- was the last char, optional trailing newline consumed).
    expect(result).toBe('');
  });

  it('handles a frontmatter block with \r\n line endings', () => {
    const md = '---\r\ntitle: CRLF\r\n---\r\n# Body';
    const result = stripFrontmatter(md);
    expect(result).toBe('# Body');
    expect(result).not.toContain('title: CRLF');
  });

  // Mutation-verification anchor for AC3: the six real seeded artifacts all have
  // genuine YAML frontmatter (key: value lines). The test below uses the
  // brainstorm fixture's distinctive frontmatter token — if stripFrontmatter
  // stops stripping, 'stepsCompleted:' leaks back, reddening this test.
  it('strips the brainstorm-style frontmatter (mirrors the real seeded artifact)', () => {
    const brainstormFrontmatter =
      '---\nstepsCompleted: [1, 2, 3, 4]\nideas_generated: 47\ntechnique_execution_complete: true\nworkflow_completed: true\nsession_active: false\n---\n\n# Brainstorming Session Results\n';
    const result = stripFrontmatter(brainstormFrontmatter);
    expect(result).toBe('\n# Brainstorming Session Results\n');
    expect(result).not.toContain('stepsCompleted:');
  });
});

// ─── AC2/AC3 (b): bare `---` hr at body start is NOT over-stripped ───────────
//
// Mutation-check: the OLD regex `/^---[\s\S]*?---\n?/` would match here and
// STRIP the content between the two `---` fences (over-strip). The hardened
// `stripFrontmatter` must NOT strip when the line after `---` is NOT a key: line.
// Reverting to the old regex reds these tests — non-vacuous per Rule 8.

describe('Story 4.0 AC2/AC3 — stripFrontmatter: hr-opened body is NOT over-stripped', () => {
  it('preserves content when body opens with a bare `---` thematic break (hr)', () => {
    // Classic case: `---` followed by plain prose (not a key: line).
    const md =
      '---\nThis is NOT frontmatter — the line after --- has no key: shape.\n---\nMore content.';
    const result = stripFrontmatter(md);
    // The content between the two --- fences must be preserved.
    expect(result).toBe(md);
    expect(result).toContain('This is NOT frontmatter');
    expect(result).toContain('More content.');
  });

  it('preserves content when body opens with --- then a heading (not a key: line)', () => {
    const md = '---\n# This is a heading, not a YAML key\n---\nBody content.';
    const result = stripFrontmatter(md);
    expect(result).toBe(md);
    expect(result).toContain('# This is a heading');
  });

  it('preserves content when the hr-opened body has multiple --- dividers', () => {
    // Section-divider pattern: `---` as thematic break between sections.
    const md = '---\nSection one content.\n---\nSection two content.\n---\nSection three.';
    const result = stripFrontmatter(md);
    expect(result).toBe(md);
    expect(result).toContain('Section one content.');
    expect(result).toContain('Section two content.');
    expect(result).toContain('Section three.');
  });

  it('preserves content when body opens with --- then a bullet (not a key: line)', () => {
    const md = '---\n- item one\n- item two\n---\nAfter the break.';
    const result = stripFrontmatter(md);
    expect(result).toBe(md);
    expect(result).toContain('- item one');
    expect(result).toContain('After the break.');
  });

  it('does NOT over-strip when the opening --- is followed by a numeric value (not key:)', () => {
    // "42" is not a `key:` shaped line — no colon follows word chars.
    const md = '---\n42\n---\nBody.';
    const result = stripFrontmatter(md);
    expect(result).toBe(md);
  });

  it('does NOT over-strip when the second line starts with a colon (not a YAML key)', () => {
    // ": value" starts with a colon — not a YAML key (which must start with a
    // word character). The lookahead requires the line to START with [a-zA-Z_].
    const md = '---\n: value\n---\nbody';
    const result = stripFrontmatter(md);
    expect(result).toBe(md);
  });
});

// ─── AC2/AC3 (c): no leading --- → content unchanged ─────────────────────────

describe('Story 4.0 AC2/AC3 — stripFrontmatter: no frontmatter → content unchanged', () => {
  it('returns the full string when no leading --- is present', () => {
    const md = '# A plain document\n\nNo frontmatter here.\n';
    expect(stripFrontmatter(md)).toBe(md);
  });

  it('returns empty string for empty input', () => {
    expect(stripFrontmatter('')).toBe('');
  });

  it('returns the string unchanged when --- appears only mid-document (not at start)', () => {
    const md = '# Title\n\nFirst paragraph.\n\n---\n\nSecond paragraph after an hr.';
    expect(stripFrontmatter(md)).toBe(md);
  });
});

// ─── Boundary: key: lookahead is required (just `word:` is enough) ───────────

describe('Story 4.0 AC2/AC3 — stripFrontmatter: key: lookahead boundary', () => {
  it('strips when the second line is a simple `key: value` (minimum valid frontmatter)', () => {
    const md = '---\nk: v\n---\nbody';
    expect(stripFrontmatter(md)).toBe('body');
  });

  it('strips when the second line is `key:` with no value (bare key, colon present)', () => {
    const md = '---\nkey:\n---\nbody';
    expect(stripFrontmatter(md)).toBe('body');
  });
});
