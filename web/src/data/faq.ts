/**
 * faq.ts — the single web-side source for /faq Q&A (Story 4.2, Decision 1 /
 * Rule 8). ONE array (`FAQ_ITEMS`) feeds BOTH the visible server-rendered
 * <h3>/<p> pairs on /faq AND the FAQPage JSON-LD (`faqPageJsonLd(FAQ_ITEMS)`).
 *
 * Using a single source prevents the visible text and the JSON-LD `mainEntity`
 * from drifting — the exact class-of-bug that bit Story 3.2 AC5 (the whole-doc
 * toContain false positive; project-rules Rule 8).
 *
 * Credibility floor (Decision 2 / AC3):
 *   - Every factual claim traces to a Mirror source (person.ts, speaking.ts,
 *     /speaking, /work/loandemo, /about, /glass-box) or carries an [OPEN] /
 *     [ASSUMPTION] flag verbatim.
 *   - NO "every/all planning artifacts published in the Glass Box" — only the
 *     six allowlisted artifacts are published (content/glassbox.allowlist.ts).
 *   - NO portfolio "recorded in ADRs" — no docs/adr/ in this project.
 *   - NO invented BMAD acronym expansion — "BMAD Method" is the usage.
 *   - Bio carries the [ASSUMPTION] flag (same as content/kb/faq.md).
 *   - Channel URLs carry [OPEN] flags (same as person.ts / content/kb/faq.md).
 *
 * Decision 3: the three Guide starter prompts lead the list (the KB-answerable
 * questions Story 4.4 will render as panel chips). They are exported separately
 * as `STARTER_PROMPTS` so Story 4.4 reuses the EXACT same three — single source,
 * no drift between the /faq seed and the Guide panel chips.
 *
 * Voice: answer-first, no exclamation marks (project voice rule).
 * URL form: all internal routes in trailing-slash form (project-rules Rule 2).
 */

import type { FaqItem } from '../lib/jsonld';

/**
 * The six canonical FAQ questions, consistent with content/kb/faq.md (two-layer
 * model). The three Guide starter prompts lead (Decision 3); organizer/peer
 * questions follow.
 */
export const FAQ_ITEMS: FaqItem[] = [
  // ── Starter prompt 1 (Guide chip seed) ──────────────────────────────────
  {
    question: 'What does Joshua R. Brandt, MSE speak about?',
    answer:
      'Joshua R. Brandt, MSE speaks on the patterns that outlast hype cycles and on running real software through disciplined, auditable agent workflows. His three signature talks are aimed at senior ICs, engineering leads, staff engineers, principal engineers, and engineering managers. Topics include agentic engineering patterns that ship to production, the veteran IC perspective on the AI transition, and running real software through disciplined, auditable agent workflows. The full talk lineup is on /speaking/.',
  },
  // ── Starter prompt 2 (Guide chip seed) ──────────────────────────────────
  {
    question: 'How do I invite Joshua to speak?',
    answer:
      'To invite Joshua R. Brandt, MSE to speak at a conference, workshop, or panel, use the Invite Me form at /speaking/. He is available for conference keynotes (45 min), workshops (90 min to 3 hr), deep-dive sessions (40 min), and fireside/panel appearances. A/V requirements: slides plus a live terminal demo; laptop and HDMI required for the main agentic patterns talk. Travel availability: [OPEN: travel availability to be confirmed].',
  },
  // ── Starter prompt 3 (Guide chip seed) ──────────────────────────────────
  {
    question: 'What is loandemo?',
    answer:
      'loandemo is a real, end-to-end agentic-engineering case study — a live loan origination demo Joshua R. Brandt, MSE built using the BMAD Method. It proves that disciplined, auditable agent workflows can ship production software, not just prototypes. The case study is published at /work/loandemo/ with the code, build story, and retrospective.',
  },
  // ── Organizer / peer questions ───────────────────────────────────────────
  {
    question: 'What is the BMAD Method?',
    answer:
      'The BMAD Method is a disciplined multi-agent development workflow — the methodology Joshua R. Brandt, MSE uses to build real production software through auditable agent workflows, including this portfolio and loandemo. The method enforces discipline through gates: each feature is specified in a story file before any code is written, reviewed by a separate agent pass, and integrated against a real build. Retrospectives are real, not curated post-hoc summaries. The method is documented in the Glass Box (/glass-box/), where the curated planning artifacts for this portfolio are published — the Product Brief, the Brainstorm Session, the Pre-Brief Research, the PRD, and the two UX documents, with more de-ghosting as they ship.',
  },
  {
    question: "What is Joshua's background?",
    answer:
      "Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience, now building at the frontier of agentic engineering. He has engineered through every major technology wave from distributed objects to Kubernetes, and is now building at the frontier of agentic engineering. He speaks on the patterns that outlast hype cycles and on running real software through disciplined, auditable agent workflows — seasoned, building at the frontier. [ASSUMPTION] Bio copy pending Josh's confirmation.",
  },
  {
    question: "Where can I follow Joshua's work?",
    answer:
      'Joshua R. Brandt, MSE works in the open — the real, disciplined process behind his projects is auditable, not asserted. You can follow his work through YouTube [OPEN: YouTube channel URL], GitHub [OPEN: GitHub profile URL], Suno [OPEN: Suno profile URL], this portfolio site at https://joshuabrandt.abacusai.cloud/, and the Glass Box (/glass-box/) where the curated planning artifacts for this portfolio are published.',
  },
];

/**
 * The three Guide starter prompts — the exact questions Story 4.4 will render as
 * panel chips. Defined as a named export so Story 4.4 imports STARTER_PROMPTS
 * directly (single source; the /faq seed and the Guide chips can never drift).
 *
 * These are the first three entries in FAQ_ITEMS (the KB-answerable questions
 * that lead the list per Decision 3). They are a reference slice, not a copy.
 */
export const STARTER_PROMPTS: FaqItem[] = FAQ_ITEMS.slice(0, 3);
