/**
 * speaking.ts — curated reel metadata + signature talks (Story 3.1) and
 * copy-paste bios, credibility-strip data (Story 3.2).
 *
 * This is a web-local data module: content consumed only by /speaking and
 * /speaking/reel. Not a cross-package or agent-reachable surface (Decision 1).
 *
 * Credibility floor: every unconfirmed value is a clearly-labeled [OPEN] or
 * [ASSUMPTION] string in visible DOM text — no fabrication. Seed content gives
 * the page real shape while being honestly flagged.
 *
 * Determinism (NFR-6): all dates are fixed constants (no new Date()), so two
 * clean builds stay byte-identical.
 */
import type { EventInput, VideoObjectInput } from '../lib/jsonld';
import { PERSON, SITE_ORIGIN } from '../lib/person';

/* ──────────────────────────────────────────────────────────────────────────
 * Shared shape types
 * ────────────────────────────────────────────────────────────────────────── */

export interface TalkFormat {
  label: string;
  duration: string;
}

export interface TalkLogistics {
  travel: string;
  av: string;
}

export interface TalkRecording {
  /** Hosted video URL — [OPEN] until the asset lands. */
  url: string;
  /** ISO-8601 upload date — fixed constant. */
  uploadDate: string;
  /** ISO-8601 duration. */
  duration: string;
  thumbnailUrl: string;
  embedUrl?: string;
}

export interface SignatureTalk {
  /** Stable kebab-case ID. */
  id: string;
  /** Outcome-oriented talk title. [OPEN] or [ASSUMPTION] until confirmed. */
  title: string;
  /** Audience level labels — drives the chip(s) on TalkCard. */
  audienceLevels: string[];
  /**
   * 150–200-word abstract. [OPEN] or [ASSUMPTION] where content is unconfirmed.
   * Full text always in the DOM for crawlers (first talk inline; others via
   * native <details>).
   */
  abstract: string;
  /** 3–5 outcome takeaways. [OPEN] where unconfirmed. */
  takeaways: string[];
  /** Format + duration pill tags. */
  formats: TalkFormat[];
  /** Travel + A/V logistics in meta text. */
  logistics: TalkLogistics;
  /**
   * When true, this talk's abstract renders expanded inline (no <details>).
   * Only the first talk is expanded per AC3 / Decision 3.
   */
  expanded: boolean;
  /** Optional recording — present means emit a VideoObject for this talk. */
  recording?: TalkRecording;
  /**
   * Deterministic [OPEN] start date for Event JSON-LD (fixed constant until
   * Josh confirms a real date).
   */
  eventStartDate: string;
  /**
   * [OPEN] event location name for JSON-LD (deterministic constant).
   */
  eventLocationName: string;
  /**
   * [OPEN] organizer name for JSON-LD (deterministic constant).
   */
  eventOrganizerName: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Reel metadata
 * ────────────────────────────────────────────────────────────────────────── */

export interface ReelMetadata {
  name: string;
  description: string;
  /** ISO-8601 approximate duration (~90s). */
  duration: string;
  /** Fixed constant upload date (NFR-6 determinism). */
  uploadDate: string;
  /** [OPEN] until the hosted video asset lands. */
  hostedVideoUrl: string;
  /** [OPEN] until the thumbnail asset lands. */
  thumbnailUrl: string;
  /** [OPEN] embed URL — optional. */
  embedUrl: string;
}

export const REEL: ReelMetadata = {
  name: 'Joshua R. Brandt, MSE — Speaker Reel, READY 2026',
  description:
    'A ~90-second speaker reel showing Joshua R. Brandt, MSE presenting live: voice, pacing, and command of complex technical ideas for practitioner and executive audiences. [OPEN: final reel pending production]',
  duration: 'PT1M30S',
  // Fixed constant — not new Date() (NFR-6 determinism).
  uploadDate: '2026-01-01',
  // [OPEN: reel video asset] — absolute URL at SITE_ORIGIN so JSON-LD validates.
  hostedVideoUrl: `${SITE_ORIGIN}/reel.mp4`,
  // [OPEN: reel thumbnail asset]
  thumbnailUrl: `${SITE_ORIGIN}/reel-thumbnail.jpg`,
  // [OPEN: reel embed URL]
  embedUrl: `${SITE_ORIGIN}/reel-embed`,
};

/* ──────────────────────────────────────────────────────────────────────────
 * Signature talks
 * ────────────────────────────────────────────────────────────────────────── */

export const SIGNATURE_TALKS: SignatureTalk[] = [
  {
    id: 'agentic-patterns-that-ship',
    // [ASSUMPTION: talk title] — working title pending Josh's confirmation.
    title: '[ASSUMPTION] Agentic Patterns That Ship: What 30 Years of Shipping Teaches the AI Era',
    audienceLevels: ['Senior IC', 'Engineering Lead'],
    // [ASSUMPTION: abstract] — seed content pending Josh's confirmation.
    abstract:
      'Most teams approach agentic systems with the same instincts they brought to microservices in 2015: build fast, patch in public, figure out reliability later. This talk draws a direct line from thirty years of shipping software — from embedded real-time systems to distributed enterprise infrastructure to frontier AI pipelines — to the small set of patterns that consistently separate software that stays in production from software that quietly gets retired. [ASSUMPTION] The session is structured around three concrete claims: that determinism is not optional in agentic workflows, that audit trails are the new unit tests, and that the most durable AI integrations are the ones that treat the model as a collaborator with a known failure envelope, not a magic resolver. Each claim is illustrated with a real before/after from production work. Attendees leave with a portable checklist for evaluating their own agentic designs — and a clear-eyed frame for which hype-cycle shortcuts tend to generate the most rework. [ASSUMPTION: all figures and specifics pending confirmation]',
    takeaways: [
      '[ASSUMPTION] A three-pattern checklist for evaluating agentic workflow reliability before production.',
      '[ASSUMPTION] How deterministic builds and audit trails change the failure-mode profile of AI systems.',
      '[ASSUMPTION] The two most common architectural shortcuts that generate rework in months 6–18.',
      '[ASSUMPTION] A mental model for treating LLMs as collaborators with a defined failure envelope.',
    ],
    formats: [
      { label: 'Conference keynote', duration: '45 min' },
      { label: 'Workshop', duration: '90 min' },
    ],
    logistics: {
      travel: '[OPEN: travel availability to be confirmed]',
      av: 'Slides + live terminal demo; laptop + HDMI required',
    },
    expanded: true,
    // No recording yet — [OPEN: reel/recording pending]
    eventStartDate: '2026-01-01', // [OPEN: real date pending — fixed constant for determinism]
    eventLocationName: '[OPEN: venue pending]',
    eventOrganizerName: '[OPEN: organizer pending]',
  },
  {
    id: 'disciplined-agent-workflows',
    // [ASSUMPTION: talk title] — working title pending Josh's confirmation.
    title: '[ASSUMPTION] Running Real Software Through Disciplined, Auditable Agent Workflows',
    audienceLevels: ['Staff Engineer', 'Principal Engineer', 'Engineering Manager'],
    // [ASSUMPTION: abstract] — seed content pending Josh's confirmation.
    abstract:
      'The move from "I used an AI assistant" to "we run production software through an agent pipeline" is a qualitative shift that most engineering teams discover mid-migration, usually when something breaks in a way they cannot easily reproduce. This talk is for practitioners already past the demo phase: teams who have shipped something agentic and are now confronting the real operational questions — how do you test it, how do you audit it, how do you hand it to an on-call engineer at 2 a.m. without a paragraph of context-setting. [ASSUMPTION] The session covers the BMAD Method as a worked example of a disciplined multi-agent development workflow, with particular attention to the gates, the file-based handoffs, and the retrospective structure that make the outputs auditable. The goal is not to sell a methodology but to extract the underlying principles — what makes any agentic workflow trustworthy enough for real operational use — and let attendees map those principles onto their own stacks. [ASSUMPTION: all specifics and figures pending confirmation]',
    takeaways: [
      '[ASSUMPTION] The three properties that make an agentic workflow auditable at 2 a.m.',
      '[ASSUMPTION] How file-based handoffs and gate structure reduce the blast radius of model errors.',
      '[ASSUMPTION] A retrospective pattern that prevents agentic anti-patterns from accumulating across sprints.',
      '[ASSUMPTION] A readiness checklist for promoting an agentic prototype to a production workflow.',
    ],
    formats: [
      { label: 'Deep-dive session', duration: '40 min' },
      { label: 'Half-day workshop', duration: '3 hr' },
    ],
    logistics: {
      travel: '[OPEN: travel availability to be confirmed]',
      av: 'Slides; live walkthrough of a real agent-generated artifact; laptop + HDMI required',
    },
    expanded: false,
    eventStartDate: '2026-01-01', // [OPEN: real date pending — fixed constant for determinism]
    eventLocationName: '[OPEN: venue pending]',
    eventOrganizerName: '[OPEN: organizer pending]',
  },
  {
    id: 'veteran-ic-vantage',
    // [ASSUMPTION: talk title + entire angle] — a pitchable vantage flagged as assumption.
    title:
      '[ASSUMPTION] The Veteran IC Vantage: What 30 Years of Shipping Looks Like From the Inside the AI Transition',
    audienceLevels: ['Senior IC', 'Engineering Lead', 'CTO'],
    // [ASSUMPTION: abstract] — seed content pending Josh's confirmation.
    abstract:
      'There is a specific kind of signal that only comes from a practitioner who shipped software before the internet was commercial, survived the dot-com unwinding, shipped again through the mobile revolution, and is now mid-flight through the agentic turn — not as a manager or analyst, but as an individual contributor still writing code and building systems. [ASSUMPTION] This talk is a structured reflection on what stays the same and what genuinely changes as AI reshapes the IC role. The framing is neither optimistic boosterism nor threat-narrative: it is an honest engineering accounting from someone who has been at the bench long enough to notice which signals repeat and which are genuinely new. The session is organized around three pairs: the things AI changes about daily craft and the things it does not; the skills that compound across technology generations and the ones that depreciate; and the questions a senior IC is best positioned to ask about AI adoption in their organization — and how to ask them productively. [ASSUMPTION: all specifics and framing pending Josh confirmation of this angle]',
    takeaways: [
      '[ASSUMPTION] The three engineering skills that compound across technology generations vs. those that depreciate.',
      '[ASSUMPTION] What the agentic transition looks like from inside daily IC work — not from the analyst tier.',
      '[ASSUMPTION] The questions a senior IC is uniquely positioned to ask about AI adoption — and how to ask them.',
      '[ASSUMPTION] A frame for distinguishing genuine paradigm shift from rebranded hype in daily practice.',
    ],
    formats: [
      { label: 'Keynote / fireside', duration: '30 min + Q&A' },
      { label: 'Panel anchor', duration: 'flexible' },
    ],
    logistics: {
      travel: '[OPEN: travel availability to be confirmed]',
      av: 'Slides optional; talk works without visuals',
    },
    expanded: false,
    eventStartDate: '2026-01-01', // [OPEN: real date pending — fixed constant for determinism]
    eventLocationName: '[OPEN: venue pending]',
    eventOrganizerName: '[OPEN: organizer pending]',
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * Bios — copy-paste ready (Story 3.2, AC1, Decision 1).
 *
 * SHORT: mirrors PERSON.description exactly (the 50-word canonical bio already
 * in the Person JSON-LD on / and /about). LONG: extends the short form with the
 * same facts, no new claims — [ASSUMPTION] until Josh confirms.
 *
 * Both bios end the running-sentence tail "seasoned, building at the frontier."
 * — lowercase + trailing period by design (NOT the Title-case hero <h1> form;
 * do not normalize). No exclamation marks. Positive-assertion voice.
 * ────────────────────────────────────────────────────────────────────────── */

export interface Bio {
  /** Display label — e.g. "Short bio · 50 words". */
  label: string;
  /** Approximate word count for the word-count sub-label. */
  wordCount: string;
  /**
   * The bio prose verbatim. Always rendered as selectable plain text in the DOM
   * (the JS-off copy path). [ASSUMPTION] flags remain until Josh confirms.
   */
  text: string;
}

/**
 * BIOS — the two copy-paste bio blocks for the /speaking page (Story 3.2).
 *
 * SHORT MUST equal PERSON.description (AC1/AC5 consistency — page text agrees
 * with the Person JSON-LD on / and /about). Sourced from the mockups/speaker-
 * surface.html promoted mock; [ASSUMPTION] until Josh confirms.
 */
export const BIOS: readonly Bio[] = [
  {
    // [ASSUMPTION: short bio text] — mirrors PERSON.description verbatim.
    label: 'Short bio',
    wordCount: '50 words',
    text: 'Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience, now building at the frontier of agentic engineering. He speaks on the patterns that outlast hype cycles and on running real software through disciplined, auditable agent workflows — seasoned, building at the frontier.',
  },
  {
    // [ASSUMPTION: long bio text] — extends the short form; same facts, no new claims.
    label: 'Long bio',
    wordCount: '126 words',
    text: 'Joshua R. Brandt, MSE is a software engineer with three decades of shipping experience who has gone deep on agentic engineering — seasoned, building at the frontier. Having engineered through every “this changes everything” wave from distributed objects to Kubernetes, he now focuses on what experienced ICs actually need: how to tell durable architecture from fashion, and how to make AI agents dependable teammates rather than party tricks. He works in the open, publishing the real, disciplined process behind his projects so the method is auditable, not asserted — including a portfolio built entirely as a public agentic-engineering project, documented as it ships. His talks pair a veteran’s skepticism with hands-on practice, and aim to leave senior audiences with patterns they can use the next morning.',
  },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
 * Metrics — audience-draw figures for the credibility strip (Story 3.2, AC2).
 *
 * All figures are [OPEN]/[ph] — pending Josh's confirmation. Keep displayed
 * values consistent with the Person/Event JSON-LD (no contradictions).
 * Determinism: fixed string constants, no wall-clock.
 * ────────────────────────────────────────────────────────────────────────── */

export interface MetricDatum {
  /** The large navy figure text — may include [ph] inline placeholder flag. */
  figure: string;
  /** UPPERCASE label below the figure (e.g. "YouTube subscribers"). */
  label: string;
  /** Italic source/attribution line below the label. */
  source: string;
}

/**
 * METRICS — four audience-draw figures for the /speaking credibility strip.
 * All values are [OPEN] placeholders until Josh confirms real figures.
 */
export const METRICS: readonly MetricDatum[] = [
  {
    figure: '[ph]',
    label: 'YouTube subscribers',
    source: '[OPEN: real figure pending]',
  },
  {
    figure: '[ph]',
    label: 'Total talk views',
    source: '[OPEN: real figure pending]',
  },
  {
    figure: '[ph]',
    label: 'Talks given',
    source: '[OPEN: real figure pending]',
  },
  {
    figure: '30',
    label: 'Years shipping software',
    source: 'veteran IC',
  },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
 * Testimonials — organizer / attendee quotes (Story 3.2, AC2).
 *
 * [OPEN] — placeholder attribution until real approved testimonials land.
 * The quote text is also clearly flagged as [OPEN] in visible DOM text.
 * ────────────────────────────────────────────────────────────────────────── */

export interface TestimonialDatum {
  /** The blockquote text — [OPEN] until approved. */
  quote: string;
  /** Credited name (bold in the attribution). */
  name: string;
  /** Role / position of the speaker. */
  role: string;
  /** Event name — [OPEN] until confirmed. */
  event: string;
}

/**
 * TESTIMONIALS — three placeholder quotes for the /speaking credibility strip.
 * All values are [OPEN] pending real approved testimonials.
 */
export const TESTIMONIALS: readonly TestimonialDatum[] = [
  {
    quote:
      '[OPEN: real testimonial pending] — one of the few talks where the senior engineers stayed for every question.',
    name: '[OPEN: name pending]',
    role: 'Program Chair',
    event: '[OPEN: event pending]',
  },
  {
    quote:
      '[OPEN: real testimonial pending] — came in skeptical about the AI hype; left with three patterns used the next week.',
    name: '[OPEN: name pending]',
    role: 'Attendee',
    event: '[OPEN: event pending]',
  },
  {
    quote:
      '[OPEN: real testimonial pending] — reliable, prepared, and the kind of speaker you re-invite.',
    name: '[OPEN: name pending]',
    role: 'Organizer',
    event: '[OPEN: event pending]',
  },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
 * Logos — conference/company logo wall (Story 3.2, AC2).
 *
 * [OPEN] — text-labeled placeholders until real logo assets land.
 * ────────────────────────────────────────────────────────────────────────── */

export interface LogoPlaceholder {
  /** Visible label text — not a real logo asset yet. */
  label: string;
}

/**
 * LOGOS — four labeled placeholder slots for the /speaking logo wall.
 * Real conference / company logos replace these when assets are confirmed.
 */
export const LOGOS: readonly LogoPlaceholder[] = [
  { label: 'Conf logo [ph]' },
  { label: 'Conf logo [ph]' },
  { label: 'Conf logo [ph]' },
  { label: 'Conf logo [ph]' },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
 * JSON-LD builders — typed inputs for eventJsonLd / videoObjectJsonLd.
 * Called by the route pages (not called here — kept in the data layer for
 * reuse and testability). Deterministic: all values are fixed constants.
 * ────────────────────────────────────────────────────────────────────────── */

/** Build the EventInput for one signature talk (used in /speaking). */
export function talkEventInput(talk: SignatureTalk): EventInput {
  return {
    name: talk.title,
    startDate: talk.eventStartDate,
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: PERSON.url,
      name: talk.eventLocationName,
    },
    performer: PERSON,
    organizer: {
      '@type': 'Organization',
      name: talk.eventOrganizerName,
    },
    description: talk.abstract,
  };
}

/** Build the VideoObjectInput for the reel (used in /speaking/reel). */
export function reelVideoObjectInput(): VideoObjectInput {
  return {
    name: REEL.name,
    description: REEL.description,
    thumbnailUrl: REEL.thumbnailUrl,
    uploadDate: REEL.uploadDate,
    duration: REEL.duration,
    contentUrl: REEL.hostedVideoUrl,
    embedUrl: REEL.embedUrl,
  };
}

/** Build a VideoObjectInput for a talk recording (used in /speaking for recorded talks). */
export function talkRecordingVideoObjectInput(talk: SignatureTalk): VideoObjectInput | null {
  if (!talk.recording) return null;
  return {
    name: `Recording: ${talk.title}`,
    description: talk.abstract,
    thumbnailUrl: talk.recording.thumbnailUrl,
    uploadDate: talk.recording.uploadDate,
    duration: talk.recording.duration,
    contentUrl: talk.recording.url,
    embedUrl: talk.recording.embedUrl,
  };
}
