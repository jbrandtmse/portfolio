/**
 * jsonld.ts — typed schema.org JSON-LD builders + a safe serializer (Story 1.6,
 * AC1; architecture §AR-9 build-time JSON-LD; EXPERIENCE §"SEO/GEO floor").
 *
 * The Mirror is the answer-first, machine-readable layer of the two-layer IA
 * (UX-DR10). These builders emit the structured data that lets search and answer
 * engines state Josh's identity and speaker facts before a human ever clicks
 * (NFR-3, FR-35). Each builder returns a plain schema.org object carrying
 * `@context: "https://schema.org"` and its `@type`; pages pass one-or-many of
 * them through BaseLayout's `jsonld` slot (Story 1.2), which renders them
 * server-side in <head>. JSON-LD is DATA inside `<script type="application/ld+json">`
 * — it ships NO executable JS and does not touch the 0-JS budget (NFR-1).
 *
 * The owners (EXPERIENCE §"SEO/GEO floor"):
 *   • Person + ProfilePage — home `/` and `/about` (REAL data).
 *   • Event — `/speaking` (placeholder until Epic 3).
 *   • VideoObject — `/speaking/reel` (placeholder until Epic 3).
 *   • CreativeWork — `/work/loandemo` (placeholder until Epic 2).
 *   • FAQPage — `/faq` (placeholder until Epic 4).
 *
 * Consumed by: every JSON-LD-emitting route in this story, then Epics 2–4 as the
 * real talks/reel/case-study/Q&A land (see story §Consumed-by).
 */

/** The schema.org context literal every node carries. */
export const SCHEMA_CONTEXT = 'https://schema.org' as const;

/* ──────────────────────────────────────────────────────────────────────────
 * Shared shapes
 * ────────────────────────────────────────────────────────────────────────── */

/** Common head every top-level JSON-LD node carries. */
interface JsonLdBase {
  '@context': typeof SCHEMA_CONTEXT;
  '@type': string;
}

/** A nested schema.org node (no own @context — it inherits the parent's). */
interface SchemaNode {
  '@type': string;
  [key: string]: unknown;
}

/**
 * Strip the top-level `@context` from a built node so it can be embedded inside
 * another node (e.g. a Person as a ProfilePage's `mainEntity`). Per JSON-LD
 * rules, an embedded node inherits its parent's context and must not re-declare
 * one. Returns a SchemaNode (always retains `@type`).
 */
function embed(node: JsonLdBase): SchemaNode {
  const copy: Record<string, unknown> = { ...node };
  delete copy['@context'];
  return copy as SchemaNode;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Person (home + /about — REAL)
 * ────────────────────────────────────────────────────────────────────────── */

export interface PersonInput {
  /** Full name — EXACTLY "Joshua R. Brandt, MSE" (DESIGN locks this casing). */
  name: string;
  /** e.g. "Software Engineer". */
  jobTitle: string;
  /** The short-bio description sentence(s). */
  description: string;
  /** The canonical site/profile URL for the person. */
  url: string;
  /** Headshot URL (`[OPEN]` until the asset lands). Optional. */
  image?: string;
  /** Profile/channel URLs that corroborate identity (YouTube/GitHub/Suno …). */
  sameAs?: string[];
  /** Topics the person is known for. Optional. */
  knowsAbout?: string[];
}

export interface PersonJsonLd extends JsonLdBase {
  '@type': 'Person';
  name: string;
  jobTitle: string;
  description: string;
  url: string;
  image?: string;
  sameAs?: string[];
  knowsAbout?: string[];
}

/** Build a schema.org Person node (top-level, with @context). */
export function personJsonLd(input: PersonInput): PersonJsonLd {
  const node: PersonJsonLd = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Person',
    name: input.name,
    jobTitle: input.jobTitle,
    description: input.description,
    url: input.url,
  };
  if (input.image) node.image = input.image;
  if (input.sameAs && input.sameAs.length > 0) node.sameAs = input.sameAs;
  if (input.knowsAbout && input.knowsAbout.length > 0) node.knowsAbout = input.knowsAbout;
  return node;
}

/* ──────────────────────────────────────────────────────────────────────────
 * ProfilePage (home + /about — wraps the Person as mainEntity)
 * ────────────────────────────────────────────────────────────────────────── */

export interface ProfilePageInput {
  /** The Person this profile page is about (becomes mainEntity). */
  mainEntity: PersonInput;
  /** Canonical URL of the profile page itself. Optional. */
  url?: string;
  /** ISO-8601 last-modified date. Optional (omit to keep output deterministic). */
  dateModified?: string;
}

export interface ProfilePageJsonLd extends JsonLdBase {
  '@type': 'ProfilePage';
  url?: string;
  dateModified?: string;
  mainEntity: SchemaNode;
}

/**
 * Build a schema.org ProfilePage whose `mainEntity` is the Person. The nested
 * Person drops its own `@context` (it inherits the page node's), per JSON-LD
 * embedding rules.
 */
export function profilePageJsonLd(input: ProfilePageInput): ProfilePageJsonLd {
  // Build the Person, then strip its @context for embedding as mainEntity.
  const node: ProfilePageJsonLd = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'ProfilePage',
    mainEntity: embed(personJsonLd(input.mainEntity)),
  };
  if (input.url) node.url = input.url;
  if (input.dateModified) node.dateModified = input.dateModified;
  return node;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Event (/speaking — PLACEHOLDER until Epic 3)
 * ────────────────────────────────────────────────────────────────────────── */

export interface EventInput {
  name: string;
  /** ISO-8601 start date/time. */
  startDate: string;
  /** schema.org enum, e.g. "https://schema.org/MixedEventAttendanceMode". */
  eventAttendanceMode: string;
  /** A Place or VirtualLocation node. */
  location: SchemaNode;
  /** The performer (the speaker) — a Person. */
  performer: PersonInput;
  /** The organizer (e.g. an Organization). */
  organizer: SchemaNode;
  description?: string;
}

export interface EventJsonLd extends JsonLdBase {
  '@type': 'Event';
  name: string;
  startDate: string;
  eventAttendanceMode: string;
  location: SchemaNode;
  performer: SchemaNode;
  organizer: SchemaNode;
  description?: string;
}

/** Build a schema.org Event node (the speaker's talk). */
export function eventJsonLd(input: EventInput): EventJsonLd {
  const node: EventJsonLd = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Event',
    name: input.name,
    startDate: input.startDate,
    eventAttendanceMode: input.eventAttendanceMode,
    location: input.location,
    performer: embed(personJsonLd(input.performer)),
    organizer: input.organizer,
  };
  if (input.description) node.description = input.description;
  return node;
}

/* ──────────────────────────────────────────────────────────────────────────
 * VideoObject (/speaking/reel — PLACEHOLDER until Epic 3)
 * ────────────────────────────────────────────────────────────────────────── */

export interface VideoObjectInput {
  name: string;
  description: string;
  /** Thumbnail URL (`[OPEN]` until the asset lands). */
  thumbnailUrl: string;
  /** ISO-8601 upload date. */
  uploadDate: string;
  /** ISO-8601 duration, e.g. "PT1M30S" (~90s reel). */
  duration: string;
  /** Direct media URL (`[OPEN]`). Optional. */
  contentUrl?: string;
  /** Embeddable player URL (`[OPEN]`). Optional. */
  embedUrl?: string;
}

export interface VideoObjectJsonLd extends JsonLdBase {
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl?: string;
  embedUrl?: string;
}

/** Build a schema.org VideoObject node (the speaker reel). */
export function videoObjectJsonLd(input: VideoObjectInput): VideoObjectJsonLd {
  const node: VideoObjectJsonLd = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl,
    uploadDate: input.uploadDate,
    duration: input.duration,
  };
  if (input.contentUrl) node.contentUrl = input.contentUrl;
  if (input.embedUrl) node.embedUrl = input.embedUrl;
  return node;
}

/* ──────────────────────────────────────────────────────────────────────────
 * CreativeWork (/work/loandemo — PLACEHOLDER until Epic 2)
 * ────────────────────────────────────────────────────────────────────────── */

export interface CreativeWorkInput {
  name: string;
  /** The author — a Person. */
  author: PersonInput;
  description: string;
  url: string;
  /** ISO-8601 creation date. */
  dateCreated: string;
}

export interface CreativeWorkJsonLd extends JsonLdBase {
  '@type': 'CreativeWork';
  name: string;
  author: SchemaNode;
  description: string;
  url: string;
  dateCreated: string;
}

/** Build a schema.org CreativeWork node (a flagship project). */
export function creativeWorkJsonLd(input: CreativeWorkInput): CreativeWorkJsonLd {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'CreativeWork',
    name: input.name,
    author: embed(personJsonLd(input.author)),
    description: input.description,
    url: input.url,
    dateCreated: input.dateCreated,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * FAQPage (/faq — PLACEHOLDER until Epic 4)
 * ────────────────────────────────────────────────────────────────────────── */

export interface FaqItem {
  /** The question text. */
  question: string;
  /** The accepted answer text. */
  answer: string;
}

export interface FaqPageJsonLd extends JsonLdBase {
  '@type': 'FAQPage';
  mainEntity: SchemaNode[];
}

/** Build a schema.org FAQPage whose `mainEntity` is an array of Q&A. */
export function faqPageJsonLd(items: FaqItem[]): FaqPageJsonLd {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Safe serializer
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Serialize one-or-many JSON-LD objects into the exact text that goes INSIDE a
 * `<script type="application/ld+json">` element.
 *
 * The output is escaped so it can never break out of, or inject into, the
 * surrounding tag:
 *   • `<`  → `<`  (prevents `</script>` and any `<…>` from closing the tag
 *                       or being parsed as markup — the critical XSS vector)
 *   • `>`  → `>`  (defensive; pairs with `<`)
 *   • `&`  → `&`  (defensive; avoids HTML entity ambiguity)
 *
 * These `\uXXXX` sequences are still valid JSON (so the block parses) AND inert
 * as HTML (so the tag stays intact). A single object is emitted as-is; an array
 * is emitted as a JSON array (each entry a self-contained node with its own
 * `@context`). Output is stable for a given input (deterministic — NFR-6).
 */
export function serializeJsonLd(data: JsonLdBase | JsonLdBase[]): string {
  return JSON.stringify(data).replace(/[<>&]/g, (char) => {
    switch (char) {
      case '<':
        return '\\u003c';
      case '>':
        return '\\u003e';
      case '&':
        return '\\u0026';
      /* c8 ignore next 2 — the regex only ever matches the three cases above. */
      default:
        return char;
    }
  });
}
