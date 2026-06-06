/**
 * person.ts — the single canonical Person facts used by the home `/` and
 * `/about` JSON-LD (Story 1.6, AC1; EXPERIENCE §"SEO/GEO floor"). One source so
 * both routes emit byte-identical Person data (NFR-6 determinism) and the name
 * stays EXACTLY "Joshua R. Brandt, MSE" everywhere (DESIGN locks the casing).
 *
 * The `description` is the approved short bio (mirrors /about's BIO_SHORT; the
 * canonical 50-word form, [ASSUMPTION] until Josh confirms). The `sameAs`
 * channels and `image` are `[OPEN]` placeholders that mirror the same /about
 * channels (Story 1.5) — when the real channel URLs + headshot land, update them
 * HERE and both routes follow. No exclamation marks (positive-assertion voice).
 */
import type { PersonInput } from './jsonld';

/** Canonical production origin (matches astro.config.mjs `site`). */
export const SITE_ORIGIN = 'https://joshuabrandt.abacusai.cloud';

/**
 * `[OPEN]` channel URLs for Person.sameAs. These mirror the /about channel links
 * (Story 1.5), which themselves are `[OPEN]` placeholders. Replace with the real
 * profile URLs when supplied; the /about visible links should be updated to
 * match in the same change. Using the canonical channel home pages as the
 * placeholder targets (valid absolute URLs so the JSON-LD validates) until the
 * exact handles are confirmed.
 */
export const CHANNEL_SAMEAS: string[] = [
  // [OPEN: YouTube channel URL] — exact channel handle pending.
  'https://www.youtube.com/',
  // [OPEN: GitHub profile URL] — exact profile handle pending.
  'https://github.com/',
  // [OPEN: Suno profile URL] — exact profile handle pending.
  'https://suno.com/',
];

/**
 * [OPEN: headshot asset] — the real headshot URL is pending (the /about portrait
 * is a CSS placeholder, Story 1.5). Points at the site origin as a valid
 * absolute placeholder until the asset lands.
 */
export const HEADSHOT_URL = `${SITE_ORIGIN}/headshot.jpg`;

/**
 * The canonical Person facts (REAL data; `image`/`sameAs` are `[OPEN]`
 * placeholders flagged above). `url` is the site root — the person's canonical
 * home on this site.
 */
export const PERSON: PersonInput = {
  name: 'Joshua R. Brandt, MSE',
  jobTitle: 'Software Engineer',
  // Mirrors /about BIO_SHORT (the approved 50-word short bio; [ASSUMPTION]).
  description:
    'Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience, now building at the frontier of agentic engineering. He speaks on the patterns that outlast hype cycles and on running real software through disciplined, auditable agent workflows — seasoned, building at the frontier.',
  url: `${SITE_ORIGIN}/`,
  image: HEADSHOT_URL,
  sameAs: CHANNEL_SAMEAS,
  knowsAbout: ['agentic engineering', 'software architecture'],
};
