/**
 * build-epk.test.ts — EPK generator tests (Story 9.3, Tasks 3 + 4).
 *
 * Tests:
 *   AC2 — EPK content is DERIVED from speaking.ts (mutation-verified, Rule 8):
 *     buildEpkData() sources PERSON/BIOS/SIGNATURE_TALKS/REEL from the REAL module.
 *     Mutation: swapping a talk title or bio text changes EpkData (not a hand-copy).
 *
 *   AC3 — Credibility (Rule 9): [ASSUMPTION]/[OPEN] flags preserved; no invented
 *     contact; bio byte-equal to BIOS[0].text; no fabricated credentials/stats.
 *
 *   AC4 — Determinism: renderEpkToPdf() called twice with the same EpkData →
 *     byte-identical Uint8Array; FIXED_EPK_DATE constant is not new Date().
 *
 * Rule 8: tests assert on the REAL exported module functions (buildEpkData,
 *   renderEpkToPdf) + scoped EpkData fields — NOT an inline copy of the logic.
 *   Mutation-verification is noted inline; break the source → the test reds.
 *
 * Discoverable via the default vitest suite (scripts/vitest.config.ts → **\/*.test.ts).
 */

import { inflateSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { BIOS, SIGNATURE_TALKS } from '../web/src/data/speaking.ts';
import { PERSON, SITE_ORIGIN } from '../web/src/lib/person.ts';
import { EPK_DOC_ID, FIXED_EPK_DATE, buildEpkData, renderEpkToPdf } from './build-epk.ts';

/* ──────────────────────────────────────────────────────────────────────────
 * Rendered-PDF text extractor (QA hardening — Rule 8/13: assert the
 * USER-OBSERVABLE artifact, not only the intermediate EpkData).
 *
 * pdf-lib writes the page content as FlateDecode-compressed streams and encodes
 * each shown string as a hex literal `<...> Tj`. To audit what the PDF ACTUALLY
 * renders (the file a conference organizer downloads), we inflate every content
 * stream and decode the hex Tj operands back to text. This catches a regression
 * that strips a flag or injects a fabrication-class string DURING rendering —
 * which a test on EpkData alone would miss (the gap between data and output).
 * ────────────────────────────────────────────────────────────────────────── */
function extractPdfText(bytes: Uint8Array): string {
  const buf = Buffer.from(bytes);
  const streamKw = Buffer.from('stream');
  const endKw = Buffer.from('endstream');
  const parts: string[] = [];
  let idx = 0;
  for (;;) {
    const s = buf.indexOf(streamKw, idx);
    if (s === -1) break;
    let start = s + streamKw.length;
    // The stream keyword is followed by CRLF or LF before the raw bytes.
    if (buf[start] === 0x0d) start++;
    if (buf[start] === 0x0a) start++;
    const e = buf.indexOf(endKw, start);
    if (e === -1) break;
    const rawStream = buf.subarray(start, e);
    let content: string;
    try {
      content = inflateSync(rawStream).toString('latin1');
    } catch {
      // Not a FlateDecode stream — read the bytes as-is.
      content = rawStream.toString('latin1');
    }
    // pdf-lib emits shown strings as `<HEX> Tj`. Decode each hex operand.
    const re = /<([0-9A-Fa-f]+)>\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      parts.push(Buffer.from(m[1]!, 'hex').toString('latin1'));
    }
    idx = e + endKw.length;
  }
  return parts.join(' ');
}

/* ──────────────────────────────────────────────────────────────────────────
 * AC2 — EPK content is derived from the REAL speaking.ts data (Rule 8)
 * ────────────────────────────────────────────────────────────────────────── */

describe('buildEpkData — AC2: derived from REAL speaking.ts (mutation-verified)', () => {
  it('personName matches PERSON.name from the REAL person.ts module', () => {
    // Mutation: change PERSON.name in person.ts → this test reds.
    const data = buildEpkData();
    expect(data.personName).toBe(PERSON.name);
    // Sanity-check the value is the canonical one, not a hand-copy.
    expect(data.personName).toBe('Joshua R. Brandt, MSE');
  });

  it('shortBio is byte-equal to BIOS[0].text (the REAL short bio — AC3, Rule 9)', () => {
    // Mutation: change BIOS[0].text in speaking.ts → this test reds.
    // This also covers AC3: bio is sourced verbatim, not paraphrased.
    const data = buildEpkData();
    const realShortBio = BIOS[0]!.text;
    expect(data.shortBio).toBe(realShortBio);
    // Confirm the actual string content (against fabrication — Rule 9).
    expect(data.shortBio).toContain('Joshua R. Brandt, MSE');
    expect(data.shortBio).toContain('30 years of shipping experience');
  });

  it('talks count equals SIGNATURE_TALKS.length (all talks are included)', () => {
    // Mutation: add/remove a talk from SIGNATURE_TALKS → this test reds.
    const data = buildEpkData();
    expect(data.talks).toHaveLength(SIGNATURE_TALKS.length);
    expect(data.talks).toHaveLength(3);
  });

  it('talk titles match the REAL SIGNATURE_TALKS titles (mutation-verified)', () => {
    // Mutation: change SIGNATURE_TALKS[0].title in speaking.ts → this test reds.
    const data = buildEpkData();
    for (let i = 0; i < SIGNATURE_TALKS.length; i++) {
      expect(data.talks[i]!.title).toBe(SIGNATURE_TALKS[i]!.title);
    }
  });

  it('talk takeaways match the REAL SIGNATURE_TALKS takeaways (mutation-verified)', () => {
    // Mutation: change SIGNATURE_TALKS[1].takeaways in speaking.ts → this test reds.
    const data = buildEpkData();
    for (let i = 0; i < SIGNATURE_TALKS.length; i++) {
      const realTakeaways = SIGNATURE_TALKS[i]!.takeaways;
      const epkTakeaways = data.talks[i]!.takeaways;
      expect(epkTakeaways).toHaveLength(realTakeaways.length);
      for (let ti = 0; ti < realTakeaways.length; ti++) {
        expect(epkTakeaways[ti]).toBe(realTakeaways[ti]);
      }
    }
  });

  it('siteUrl is SITE_ORIGIN from person.ts (not an invented URL)', () => {
    const data = buildEpkData();
    expect(data.siteUrl).toBe(SITE_ORIGIN);
  });

  it('inviteUrl is SITE_ORIGIN + /invite/ (no invented email/phone — AC3, Rule 9)', () => {
    const data = buildEpkData();
    expect(data.inviteUrl).toBe(`${SITE_ORIGIN}/invite/`);
    // Credibility guard: the inviteUrl must start with SITE_ORIGIN.
    expect(data.inviteUrl.startsWith(SITE_ORIGIN)).toBe(true);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * AC3 — Credibility floor (Rule 9): flags preserved, no fabrication
 * ────────────────────────────────────────────────────────────────────────── */

describe('buildEpkData — AC3: credibility floor (Rule 9)', () => {
  it('[ASSUMPTION] flags are preserved in all three talk titles', () => {
    // Rule 9: talk titles are representative/proposed — not confirmed-booked.
    // The [ASSUMPTION] flag MUST NOT be stripped to look more booked.
    const data = buildEpkData();
    for (const talk of data.talks) {
      expect(
        talk.title,
        `talk "${talk.title.slice(0, 40)}…" must carry [ASSUMPTION] flag`,
      ).toContain('[ASSUMPTION]');
    }
  });

  it('[ASSUMPTION] flags are preserved in talk takeaways', () => {
    // The takeaways in SIGNATURE_TALKS carry [ASSUMPTION] flags.
    const data = buildEpkData();
    // At least the first talk's takeaways should all carry the flag.
    const firstTalkTakeaways = data.talks[0]!.takeaways;
    for (const takeaway of firstTalkTakeaways) {
      expect(
        takeaway,
        `takeaway "${takeaway.slice(0, 40)}…" must carry [ASSUMPTION] flag`,
      ).toContain('[ASSUMPTION]');
    }
  });

  it('no invented contact email or phone number in EpkData', () => {
    // Rule 9: PUBLIC_CONTACT_EMAIL is deferred. No @ or phone patterns.
    const data = buildEpkData();
    const allText = [
      data.personName,
      data.shortBio,
      data.siteUrl,
      data.inviteUrl,
      data.reelName,
      ...data.talks.map((t) => t.title),
    ].join(' ');
    // No email address (@ outside URL context — siteUrl/inviteUrl are URLs not emails)
    // Strip URLs before checking for @.
    const noUrls = allText.replace(/https?:\/\/[^\s]+/g, '');
    expect(noUrls).not.toMatch(/@/);
    // No phone number pattern (10+ digits grouped with dashes/parens/dots).
    expect(allText).not.toMatch(/\(?\d{3}\)?[\s.]\d{3}[\s.]\d{4}/);
  });

  it('no invented credentials or stats (no made-up numbers beyond known "30 years")', () => {
    // Rule 9: bio must not claim invented audience numbers or fake credentials.
    const data = buildEpkData();
    // The short bio is sourced from BIOS[0].text — it should mention "30 years"
    // (the one real figure), but NOT any [ph] audience stat.
    expect(data.shortBio).toContain('30 years');
    expect(data.shortBio).not.toContain('[ph]');
  });

  it('shortBio does not contain invented BMAD acronym expansion', () => {
    // Rule 9 class from Epic 4: no invented "BMAD = ..." expansion in prose.
    const data = buildEpkData();
    expect(data.shortBio).not.toMatch(/BMAD\s*=\s*/);
    expect(data.shortBio).not.toMatch(/BMAD stands for/i);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * AC3 — Credibility floor on the RENDERED PDF (QA hardening, Rule 8/13)
 *
 * The existing AC3 tests assert on EpkData (the intermediate). These assert on
 * the text the PDF ACTUALLY renders — the artifact the organizer downloads —
 * so a regression in renderEpkToPdf that drops a flag or injects a fabrication
 * is caught. Mutation-verified inline.
 * ────────────────────────────────────────────────────────────────────────── */

describe('renderEpkToPdf — AC3: credibility floor on the RENDERED PDF (Rule 8/13)', () => {
  it('the rendered PDF text preserves every [ASSUMPTION] talk title (not stripped to look booked)', async () => {
    // Mutation: have renderEpkToPdf strip "[ASSUMPTION] " from titles → this reds.
    const data = buildEpkData();
    const text = extractPdfText(await renderEpkToPdf(data));
    // The PDF must contain the [ASSUMPTION] marker once per flagged source title.
    const flaggedTitleCount = SIGNATURE_TALKS.filter((t) =>
      t.title.includes('[ASSUMPTION]'),
    ).length;
    expect(flaggedTitleCount).toBe(3); // guard: source preconditions hold
    const renderedAssumptionCount = (text.match(/\[ASSUMPTION\]/g) ?? []).length;
    // ≥ one per flagged title + one per flagged takeaway rendered. The titles
    // alone require at least 3; the framing line + takeaways push it higher.
    expect(renderedAssumptionCount).toBeGreaterThanOrEqual(flaggedTitleCount);
    // And — the load-bearing assertion — each flagged title's flag must remain
    // ATTACHED to its title in the rendered PDF: the text must contain
    // "[ASSUMPTION] <distinctive title fragment>". Stripping the flag from the
    // title (to make it look booked) reds here even though flagged takeaways
    // would keep the bare count ≥ 3.
    for (const talk of SIGNATURE_TALKS) {
      if (!talk.title.includes('[ASSUMPTION]')) continue;
      // Distinctive non-flag fragment of the title (skip the "[ASSUMPTION] " prefix).
      const fragment = talk.title.replace('[ASSUMPTION] ', '').slice(0, 24);
      expect(
        text,
        `rendered PDF must keep the [ASSUMPTION] flag attached to title "${fragment}"`,
      ).toContain(`[ASSUMPTION] ${fragment}`);
    }
  }, 30000);

  it('the rendered PDF carries the honest representative-talks framing line', async () => {
    // Rule 9: the PDF must explicitly frame [ASSUMPTION] talks as proposed, not
    // confirmed. Mutation: remove the framing line in renderEpkToPdf → this reds.
    const data = buildEpkData();
    const text = extractPdfText(await renderEpkToPdf(data));
    expect(text).toContain('representative');
    expect(text).toMatch(/not yet confirmed/i);
  }, 30000);

  it('the rendered PDF contains the real short bio text (byte-derived, not paraphrased)', async () => {
    // Mutation: paraphrase the bio in renderEpkToPdf → this reds.
    const data = buildEpkData();
    const text = extractPdfText(await renderEpkToPdf(data));
    // A distinctive bio phrase that is unique to BIOS[0].text.
    expect(text).toContain('30 years of shipping experience');
    expect(text).toContain('disciplined, auditable agent workflows');
  }, 30000);

  it('the rendered PDF has NO fabricated contact email or phone number', async () => {
    // Rule 9: PUBLIC_CONTACT_EMAIL is deferred — booking is the site + /invite/.
    // Mutation: inject "book@example.com" in renderEpkToPdf → this reds.
    const data = buildEpkData();
    const text = extractPdfText(await renderEpkToPdf(data));
    // Strip URLs before checking for an "@" (the only legitimate text is URLs).
    const noUrls = text.replace(/https?:\/\/[^\s]+/g, '');
    expect(noUrls, 'rendered PDF must not contain an email address').not.toMatch(/@/);
    // No phone-number pattern.
    expect(text).not.toMatch(/\(?\d{3}\)?[\s.]\d{3}[\s.]\d{4}/);
    // Booking points to the real surfaces.
    expect(text).toContain('/invite/');
    expect(text).toContain(SITE_ORIGIN);
  }, 30000);

  it('the rendered PDF carries no invented credentials/stats or BMAD expansion', async () => {
    // Rule 9: the only number is the real "30 years". No invented audience figures
    // (e.g. "[ph]" placeholders must not leak), no invented BMAD acronym expansion.
    const data = buildEpkData();
    const text = extractPdfText(await renderEpkToPdf(data));
    expect(text).not.toContain('[ph]');
    expect(text).not.toMatch(/BMAD\s*=\s*/);
    expect(text).not.toMatch(/BMAD stands for/i);
    // The person name renders correctly (sanity that the extractor sees real text).
    expect(text).toContain(PERSON.name);
  }, 30000);
});

/* ──────────────────────────────────────────────────────────────────────────
 * AC4 — Determinism: renderEpkToPdf called twice → byte-identical output
 * ────────────────────────────────────────────────────────────────────────── */

describe('renderEpkToPdf — AC4: byte-deterministic PDF (NFR-6)', () => {
  it('two renderEpkToPdf calls with the same EpkData produce byte-identical output', async () => {
    // This is the core determinism assertion.
    // Mutation: introduce new Date() or Math.random() in renderEpkToPdf → this reds.
    const data = buildEpkData();
    const bytes1 = await renderEpkToPdf(data);
    const bytes2 = await renderEpkToPdf(data);
    expect(bytes1.length).toBe(bytes2.length);
    expect(Buffer.from(bytes1).equals(Buffer.from(bytes2))).toBe(true);
  }, 30000); // pdf-lib font embedding can take a moment

  it('FIXED_EPK_DATE is a fixed constant (not new Date() — NFR-6)', () => {
    // Rule: build-time wall-clock is forbidden. FIXED_EPK_DATE must be a fixed value.
    // Mutation: swap FIXED_EPK_DATE to new Date() in build-epk.ts → the
    // "two calls byte-identical" test above reds because the timestamp differs.
    expect(FIXED_EPK_DATE).toBeInstanceOf(Date);
    // Must equal the pinned constant ISO string (2026-01-01T00:00:00Z).
    expect(FIXED_EPK_DATE.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    // The year is fixed: 2026. A new Date() would produce a different year
    // once the system clock advances beyond 2026. Use this as the canary.
    expect(FIXED_EPK_DATE.getUTCFullYear()).toBe(2026);
  });

  it('EPK_DOC_ID is the expected fixed hex constant', () => {
    // Mutation: change EPK_DOC_ID → PDF /ID changes → check-deterministic reds.
    expect(EPK_DOC_ID).toBe('506f72746f6c696f45504b2020202020');
    expect(EPK_DOC_ID).toHaveLength(32); // 16 bytes as hex
  });

  it('generated PDF bytes begin with the %PDF magic bytes', async () => {
    const data = buildEpkData();
    const bytes = await renderEpkToPdf(data);
    const magic = Buffer.from(bytes).toString('ascii', 0, 4);
    expect(magic).toBe('%PDF');
  }, 30000);

  it('generated PDF is 1–2 pages (size constraint)', async () => {
    // The PDF must be 1–2 pages per AC1. We check the page count via a simple
    // PDF marker count (/Page objects) rather than a full parse.
    const data = buildEpkData();
    const bytes = await renderEpkToPdf(data);
    const pdfStr = Buffer.from(bytes).toString('binary');
    // Count occurrences of the /Type /Page dictionary marker.
    const pageMatches = pdfStr.match(/\/Type\s*\/Page\b/g) ?? [];
    // At least 1 page, at most 2 pages.
    expect(pageMatches.length).toBeGreaterThanOrEqual(1);
    expect(pageMatches.length).toBeLessThanOrEqual(2);
  }, 30000);
});

/* ──────────────────────────────────────────────────────────────────────────
 * AC1 — EPK text content assertions (from EpkData + rendered PDF text cues)
 * ────────────────────────────────────────────────────────────────────────── */

describe('EpkData — AC1: EPK contains required content', () => {
  it('EpkData contains person name, bio, 3 talks, reel, and booking info', () => {
    const data = buildEpkData();
    expect(data.personName).toBeTruthy();
    expect(data.shortBio.length).toBeGreaterThan(50);
    expect(data.talks).toHaveLength(3);
    expect(data.reelName).toBeTruthy();
    expect(data.inviteUrl).toContain('/invite/');
  });

  it('each talk has at least one format (format + duration)', () => {
    const data = buildEpkData();
    for (const talk of data.talks) {
      expect(talk.formats.length).toBeGreaterThanOrEqual(1);
      for (const fmt of talk.formats) {
        expect(fmt.label).toBeTruthy();
        expect(fmt.duration).toBeTruthy();
      }
    }
  });

  it('each talk has 3–5 takeaways', () => {
    const data = buildEpkData();
    for (const talk of data.talks) {
      expect(talk.takeaways.length).toBeGreaterThanOrEqual(3);
      expect(talk.takeaways.length).toBeLessThanOrEqual(5);
    }
  });

  it('EPK does not contain confirmed-booking language for [ASSUMPTION] talks', () => {
    // Rule 9: talks must NOT be presented as confirmed bookings.
    // Check that the titles carry the [ASSUMPTION] flag (already checked above)
    // and that the data does not contain fabricated confirmed-booking language.
    const data = buildEpkData();
    const allTitles = data.talks.map((t) => t.title).join(' ');
    // None of these "confirmed booking" phrases should appear:
    expect(allTitles).not.toMatch(/confirmed booking/i);
    expect(allTitles).not.toMatch(/confirmed talk/i);
    expect(allTitles).not.toMatch(/booked at/i);
  });
});
