/**
 * markdown.ts — Shared markdown-processing utilities (Story 4.0).
 *
 * Extracted from `web/src/components/glassbox/ArtifactReader.astro` and
 * hardened so the same logic can be reused by the Story 4.1 KB indexer
 * (`scripts/build-kb-index.ts`) without duplicating a fragile regex.
 *
 * This module is intentionally dependency-free: plain TypeScript, no
 * imports, so it can be imported at build time from both the `web` Astro
 * component and the `scripts` build pipeline without introducing a
 * cross-package coupling.
 */

/**
 * Strip a leading YAML frontmatter block from `md` and return the body.
 *
 * The strip is intentionally conservative:
 *   • The opening `---` fence MUST be followed immediately (same line or
 *     next line) by a `key:` shaped line — i.e. at least one word character
 *     followed by a colon. A bare thematic break (`---`) that is NOT
 *     followed by a key-value line is therefore NOT treated as frontmatter.
 *   • The closing `---` fence terminates the block; everything after it
 *     is the body.
 *
 * Edge cases:
 *   (a) Real YAML frontmatter (`---\nkey: value\n...\n---\nbody`)
 *       → only the frontmatter block is removed; the body is returned intact.
 *   (b) Body that opens with a bare `---` thematic break followed by
 *       content and a later `---` (e.g. a section divider)
 *       → the regex does NOT match because the line after `---` is not a
 *          `key:` line; the full content is returned unchanged (no over-strip).
 *   (c) No leading `---` at all → the full content is returned unchanged.
 *
 * @param md  Raw markdown string (may or may not have a frontmatter block).
 * @returns   The markdown body with any leading YAML frontmatter removed.
 */
export function stripFrontmatter(md: string): string {
  // Pattern breakdown:
  //   ^---\r?\n                           — opening fence at start of string
  //   (?=[a-zA-Z_][\w-]*\s*:(?:\s|$))   — lookahead: the very next line must
  //                                         BEGIN with a YAML key shape:
  //                                         word-start char, optional word/dash
  //                                         chars, optional spaces, then a colon
  //                                         followed by whitespace or end-of-line.
  //                                         A bare `---` thematic break (followed
  //                                         by plain prose that may happen to
  //                                         contain "key: " somewhere in the line)
  //                                         does NOT match because the lookahead
  //                                         is anchored to the position immediately
  //                                         after the opening-fence newline — i.e.
  //                                         to the START of the second line.
  //   [\s\S]*?                            — non-greedy body
  //   \r?\n---\r?\n?                      — closing fence
  return md.replace(/^---\r?\n(?=[a-zA-Z_][\w-]*\s*:(?:\s|$))[\s\S]*?\r?\n---\r?\n?/, '');
}
