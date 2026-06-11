/**
 * build-epk.ts — Speaker EPK (Electronic Press Kit) PDF generator (Story 9.3).
 *
 * Reads `web/src/data/speaking.ts` (PERSON, BIOS, SIGNATURE_TALKS, REEL) and
 * emits a 1–2 page EPK PDF to `web/public/epk/joshua-brandt-speaker-epk.pdf`.
 * The PDF is served from `web/dist/epk/...` after `astro build` copies
 * `web/public/` into `web/dist/`.
 *
 * INTERMEDIATE TEXT LAYER (Rule 8 testability):
 *   `buildEpkData()` assembles the structured `EpkData` object from the live
 *   speaking data — no PDF involved. Tests assert on this intermediate. The
 *   generator then calls `renderEpkToPdf(epkData)` to emit the PDF bytes.
 *   Tests: scripts/build-epk.test.ts (discoverable via the default vitest suite).
 *
 * DETERMINISM (NFR-6):
 *   - NO `new Date()` / `Date.now()` / `Math.random()` — uses FIXED_EPK_DATE.
 *   - PDF `/CreationDate` + `/ModDate` pinned to FIXED_EPK_DATE.
 *   - Document `/ID` array pinned to EPK_DOC_ID (a stable hex constant).
 *   - StandardFonts embedded deterministically by pdf-lib (same lib version →
 *     same font bytes → same hash every run).
 *   - Verified by `pnpm run check-deterministic` (two builds → byte-identical
 *     web/dist including epk/joshua-brandt-speaker-epk.pdf).
 *
 * CREDIBILITY (Rule 9):
 *   - `[ASSUMPTION]` / `[OPEN]` flags are PRESERVED (talk titles are
 *     representative/proposed — not confirmed-booked). See EpkData shape.
 *   - No invented contact email/phone. "How to book" → site + /invite/.
 *   - Bio is the REAL `BIOS[0].text` (short bio — same source as the page).
 *   - Talks/takeaways/formats are the REAL `SIGNATURE_TALKS`.
 *
 * HARD CONSTRAINTS (FR-33 / NFR-6):
 *   - NO network IO. No fetch, no HTTP.
 *   - DETERMINISTIC: same repo state → byte-identical PDF.
 *   - FAIL LOUD: throws (fails the build) if output directory is unwritable.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PDFArray, PDFDocument, PDFHexString, StandardFonts, rgb } from 'pdf-lib';

import { BIOS, REEL, SIGNATURE_TALKS } from '../web/src/data/speaking.ts';
import { PERSON, SITE_ORIGIN } from '../web/src/lib/person.ts';
import type { Generator } from './build-content.ts';

/* ──────────────────────────────────────────────────────────────────────────
 * Determinism constants — NEVER new Date() here (NFR-6).
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Fixed creation / modification date for the EPK PDF. Must NOT use new Date().
 * Chosen as 2026-01-01 to match the existing speaking data's deterministic date
 * convention (see REEL.uploadDate, talk.eventStartDate — all fixed constants).
 * NFR-6: same constant across builds → byte-identical PDF.
 */
export const FIXED_EPK_DATE = new Date('2026-01-01T00:00:00Z');

/**
 * Fixed PDF document ID (both ID1 and ID2 are the same stable hex constant).
 * 16 bytes of ASCII "PortfolioEPK    " in hex — memorable and collision-free.
 * Must be exactly 32 hex chars (16 bytes). Changing this would change the PDF hash.
 */
export const EPK_DOC_ID = '506f72746f6c696f45504b2020202020';

/**
 * Output path for the generated EPK PDF, relative to repo root.
 * `web/public/` is copied into `web/dist/` by `astro build`, so this file
 * is served at `/epk/joshua-brandt-speaker-epk.pdf` in production.
 */
export const EPK_OUTPUT_RELATIVE = 'web/public/epk/joshua-brandt-speaker-epk.pdf';

/* ──────────────────────────────────────────────────────────────────────────
 * EpkData — the deterministic intermediate text layer (Rule 8 testability)
 * ────────────────────────────────────────────────────────────────────────── */

export interface EpkTalk {
  /** Talk title — carries `[ASSUMPTION]` prefix when the title is unconfirmed. */
  title: string;
  /** e.g. ['Senior IC', 'Engineering Lead'] */
  audienceLevels: string[];
  /** 3–5 outcome takeaways — may carry `[ASSUMPTION]` flags. */
  takeaways: readonly string[];
  /** Format pills — label + duration. */
  formats: readonly { label: string; duration: string }[];
}

export interface EpkData {
  /** Canonical person name — from PERSON.name. */
  personName: string;
  /** Job title — from PERSON.jobTitle. */
  jobTitle: string;
  /**
   * Short bio text — verbatim from BIOS[0].text (byte-equal to source).
   * [ASSUMPTION] flags preserved as-is.
   */
  shortBio: string;
  /** Signature talks — 3 entries from SIGNATURE_TALKS (title/takeaways/formats). */
  talks: EpkTalk[];
  /** Reel name — from REEL.name. */
  reelName: string;
  /** Site URL — from SITE_ORIGIN. */
  siteUrl: string;
  /** Invite URL — SITE_ORIGIN + /invite/. No invented contact. */
  inviteUrl: string;
}

/**
 * Build the deterministic intermediate EPK data from the live speaking exports.
 *
 * Exported for testing (Rule 8): tests import this function and assert on the
 * structured `EpkData` — mutation-verified against the real `speaking.ts` source.
 * No PDF involved; pure data assembly.
 *
 * Credibility (Rule 9): flags are preserved; no new claims introduced; shortBio
 * is byte-equal to BIOS[0].text.
 */
export function buildEpkData(): EpkData {
  const shortBio = BIOS[0]?.text;
  if (!shortBio) throw new Error('[build-epk] BIOS[0] is missing — cannot build EPK.');

  return {
    personName: PERSON.name,
    jobTitle: PERSON.jobTitle ?? 'Software Engineer',
    shortBio,
    talks: SIGNATURE_TALKS.map((talk) => ({
      title: talk.title,
      audienceLevels: talk.audienceLevels,
      takeaways: talk.takeaways,
      formats: talk.formats,
    })),
    reelName: REEL.name,
    siteUrl: SITE_ORIGIN,
    inviteUrl: `${SITE_ORIGIN}/invite/`,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * PDF rendering — deterministic layout using pdf-lib
 * ────────────────────────────────────────────────────────────────────────── */

/** US Letter (points). */
const PAGE_W = 612;
const PAGE_H = 792;

/** Layout margins. */
const MARGIN_X = 54;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 48;
const USABLE_W = PAGE_W - MARGIN_X * 2;

/** Type scale. */
const SIZE_HEADING = 22;
const SIZE_SUBHEADING = 13;
const SIZE_LABEL = 10;
const SIZE_BODY = 9.5;
const SIZE_SMALL = 8.5;

/** Colors. */
const C_INK = rgb(0.1, 0.1, 0.1);
const C_ACCENT = rgb(0.1, 0.3, 0.7); // navy-blue accent
const C_MUTED = rgb(0.45, 0.45, 0.45);
const C_RULE = rgb(0.85, 0.85, 0.85);

/**
 * Wrap `text` to lines no wider than `maxWidth` using the given font/size.
 * Each word is placed on the current line; if it overflows, a new line starts.
 */
async function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
  maxWidth: number,
): Promise<string[]> {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const w = font.widthOfTextAtSize(candidate, size);
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Render the EPK data to a deterministic PDF byte array.
 *
 * Determinism guarantees:
 *   - FIXED_EPK_DATE for CreationDate + ModDate (no new Date()).
 *   - EPK_DOC_ID for the PDF /ID array (no random UUID).
 *   - StandardFonts (embedded by pdf-lib from its own bundled data — same bytes
 *     every run for the same pdf-lib version).
 *   - No Date.now(), no Math.random(), no external file reads.
 */
export async function renderEpkToPdf(data: EpkData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // ── Pin deterministic metadata ──────────────────────────────────────────
  doc.setCreationDate(FIXED_EPK_DATE);
  doc.setModificationDate(FIXED_EPK_DATE);
  doc.setTitle(`${data.personName} — Speaker One-Sheet`);
  doc.setAuthor(data.personName);
  doc.setSubject('Speaker EPK / one-sheet for conference organizers');
  doc.setKeywords(['speaker', 'EPK', 'one-sheet', 'agentic engineering', 'software']);
  doc.setProducer('Portfolio build-epk generator (Story 9.3)');
  doc.setCreator('Portfolio build-epk generator (Story 9.3)');

  // Pin /ID array — prevents pdf-lib from generating a random document ID.
  const ctx = doc.context;
  const idArr = PDFArray.withContext(ctx);
  idArr.push(PDFHexString.of(EPK_DOC_ID));
  idArr.push(PDFHexString.of(EPK_DOC_ID));
  ctx.trailerInfo.ID = idArr;

  // ── Embed fonts ─────────────────────────────────────────────────────────
  // StandardFonts are bundled inside pdf-lib — no external file reads.
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // ── Page 1 ───────────────────────────────────────────────────────────────
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN_TOP;

  // ── Header ───────────────────────────────────────────────────────────────
  page.drawText(data.personName, {
    x: MARGIN_X,
    y,
    font: fontBold,
    size: SIZE_HEADING,
    color: C_ACCENT,
  });
  y -= SIZE_HEADING * 1.3;

  page.drawText(data.jobTitle, {
    x: MARGIN_X,
    y,
    font: fontRegular,
    size: SIZE_SUBHEADING,
    color: C_INK,
  });
  y -= SIZE_SUBHEADING * 1.2;

  // Contact / booking line
  const bookingLine = `Book via: ${data.inviteUrl}   |   ${data.siteUrl}`;
  page.drawText(bookingLine, {
    x: MARGIN_X,
    y,
    font: fontRegular,
    size: SIZE_SMALL,
    color: C_MUTED,
  });
  y -= SIZE_SMALL * 1.5;

  // Horizontal rule below header
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_W - MARGIN_X, y },
    thickness: 0.5,
    color: C_RULE,
  });
  y -= 16;

  // ── Short Bio ─────────────────────────────────────────────────────────────
  page.drawText('Bio', {
    x: MARGIN_X,
    y,
    font: fontBold,
    size: SIZE_SUBHEADING,
    color: C_INK,
  });
  y -= SIZE_SUBHEADING * 1.4;

  const bioLines = await wrapText(data.shortBio, fontRegular, SIZE_BODY, USABLE_W);
  for (const line of bioLines) {
    if (y < MARGIN_BOTTOM + SIZE_BODY) break; // safety guard
    page.drawText(line, {
      x: MARGIN_X,
      y,
      font: fontRegular,
      size: SIZE_BODY,
      color: C_INK,
    });
    y -= SIZE_BODY * 1.45;
  }
  y -= 8;

  // Horizontal rule
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_W - MARGIN_X, y },
    thickness: 0.5,
    color: C_RULE,
  });
  y -= 14;

  // ── Signature Talks ───────────────────────────────────────────────────────
  page.drawText('Signature Talks (Representative — see site for current details)', {
    x: MARGIN_X,
    y,
    font: fontBold,
    size: SIZE_SUBHEADING,
    color: C_INK,
  });
  y -= SIZE_SUBHEADING * 1.4;

  // Note on representative nature (credibility floor — Rule 9)
  const credNote =
    'Talks marked [ASSUMPTION] are representative/proposed working titles, not yet confirmed bookings.';
  const credLines = await wrapText(credNote, fontOblique, SIZE_SMALL, USABLE_W);
  for (const line of credLines) {
    if (y < MARGIN_BOTTOM + SIZE_SMALL) break;
    page.drawText(line, {
      x: MARGIN_X,
      y,
      font: fontOblique,
      size: SIZE_SMALL,
      color: C_MUTED,
    });
    y -= SIZE_SMALL * 1.4;
  }
  y -= 6;

  for (let i = 0; i < data.talks.length; i++) {
    const talk = data.talks[i]!;

    // If we're too low, add a second page
    if (y < MARGIN_BOTTOM + 80) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN_TOP;
    }

    // Talk number + title
    const talkLabel = `${i + 1}. ${talk.title}`;
    const titleLines = await wrapText(talkLabel, fontBold, SIZE_BODY, USABLE_W);
    for (const line of titleLines) {
      if (y < MARGIN_BOTTOM + SIZE_BODY) {
        page = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN_TOP;
      }
      page.drawText(line, {
        x: MARGIN_X,
        y,
        font: fontBold,
        size: SIZE_BODY,
        color: C_INK,
      });
      y -= SIZE_BODY * 1.4;
    }

    // Audience levels
    const audienceStr = `Audience: ${talk.audienceLevels.join(', ')}`;
    if (y >= MARGIN_BOTTOM + SIZE_SMALL) {
      page.drawText(audienceStr, {
        x: MARGIN_X + 12,
        y,
        font: fontOblique,
        size: SIZE_SMALL,
        color: C_MUTED,
      });
      y -= SIZE_SMALL * 1.4;
    }

    // Formats
    const fmtStr = `Formats: ${talk.formats.map((f) => `${f.label} (${f.duration})`).join('; ')}`;
    const fmtLines = await wrapText(fmtStr, fontRegular, SIZE_SMALL, USABLE_W - 12);
    for (const line of fmtLines) {
      if (y < MARGIN_BOTTOM + SIZE_SMALL) break;
      page.drawText(line, {
        x: MARGIN_X + 12,
        y,
        font: fontRegular,
        size: SIZE_SMALL,
        color: C_INK,
      });
      y -= SIZE_SMALL * 1.35;
    }

    // Key takeaways (first 3 max to keep layout tight)
    const maxTakeaways = 3;
    page.drawText('Key takeaways:', {
      x: MARGIN_X + 12,
      y,
      font: fontBold,
      size: SIZE_LABEL,
      color: C_INK,
    });
    y -= SIZE_LABEL * 1.4;

    for (let ti = 0; ti < Math.min(talk.takeaways.length, maxTakeaways); ti++) {
      const takeaway = talk.takeaways[ti]!;
      const bullet = `• ${takeaway}`;
      const takeawayLines = await wrapText(bullet, fontRegular, SIZE_SMALL, USABLE_W - 24);
      for (const line of takeawayLines) {
        if (y < MARGIN_BOTTOM + SIZE_SMALL) break;
        page.drawText(line, {
          x: MARGIN_X + 20,
          y,
          font: fontRegular,
          size: SIZE_SMALL,
          color: C_INK,
        });
        y -= SIZE_SMALL * 1.35;
      }
    }

    y -= 6; // gap between talks
  }

  // ── Reel + Footer ─────────────────────────────────────────────────────────
  if (y < MARGIN_BOTTOM + 50) {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN_TOP;
  }

  // Rule before footer
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_W - MARGIN_X, y },
    thickness: 0.5,
    color: C_RULE,
  });
  y -= 14;

  // Reel
  page.drawText('Speaker Reel', {
    x: MARGIN_X,
    y,
    font: fontBold,
    size: SIZE_LABEL,
    color: C_INK,
  });
  y -= SIZE_LABEL * 1.4;

  const reelLines = await wrapText(data.reelName, fontRegular, SIZE_SMALL, USABLE_W);
  for (const line of reelLines) {
    if (y < MARGIN_BOTTOM + SIZE_SMALL) break;
    page.drawText(line, {
      x: MARGIN_X,
      y,
      font: fontRegular,
      size: SIZE_SMALL,
      color: C_MUTED,
    });
    y -= SIZE_SMALL * 1.35;
  }
  y -= 8;

  // How to book
  page.drawText('How to Book', {
    x: MARGIN_X,
    y,
    font: fontBold,
    size: SIZE_LABEL,
    color: C_INK,
  });
  y -= SIZE_LABEL * 1.4;

  const bookText =
    `Use the Invite form at ${data.inviteUrl} or visit ${data.siteUrl} for current availability.` +
    ' No email or phone listed — responses go through the site contact form.';
  const bookLines = await wrapText(bookText, fontRegular, SIZE_SMALL, USABLE_W);
  for (const line of bookLines) {
    if (y < MARGIN_BOTTOM + SIZE_SMALL) break;
    page.drawText(line, {
      x: MARGIN_X,
      y,
      font: fontRegular,
      size: SIZE_SMALL,
      color: C_INK,
    });
    y -= SIZE_SMALL * 1.35;
  }

  // ── Save with deterministic options ──────────────────────────────────────
  // useObjectStreams: false keeps the cross-reference table as a traditional
  // xref table rather than an xref stream — makes the output more stable across
  // pdf-lib minor versions and eliminates a source of layout nondeterminism.
  return doc.save({ useObjectStreams: false });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Generator registration
 * ────────────────────────────────────────────────────────────────────────── */

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '..');

/**
 * The EPK Generator for the CONTENT_GENERATORS registry.
 *
 * Reads `web/src/data/speaking.ts` → builds `EpkData` → renders to PDF →
 * writes `web/public/epk/joshua-brandt-speaker-epk.pdf`.
 *
 * Registered in `scripts/build-content.ts` as `buildEpkGenerator`.
 * Runs at `pnpm build:content` (before `astro build`).
 */
export const buildEpkGenerator: Generator = {
  name: 'build-epk',
  async run(): Promise<void> {
    const data = buildEpkData();
    const pdfBytes = await renderEpkToPdf(data);
    const outPath = join(repoRoot, EPK_OUTPUT_RELATIVE);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, pdfBytes);
    console.log(`[build-epk] wrote ${pdfBytes.length} bytes → ${EPK_OUTPUT_RELATIVE}`);
  },
};
