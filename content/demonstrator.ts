/**
 * content/demonstrator.ts — the curated Demonstrator lifecycle manifest (Story 9.1; FR-11).
 *
 * An ordered list of the BMAD build STAGES for this portfolio, each grounded to a real,
 * already-published artifact. This is the SINGLE source the /demonstrator/ route reads
 * (mirrors the content/wings.ts pattern).
 *
 * PLACEMENT: repo-root content/ (not web/src/content/ — the Astro content-collections
 * footgun, deferred-work [2.3]).
 *
 * CREDIBILITY FLOOR (Rule 9):
 *  - Every artifact href in this file must resolve to a real, reachable URL.
 *  - Only the 6 published Glass Box readers exist today:
 *      /glass-box/product-brief/, /glass-box/brainstorm/, /glass-box/pre-brief-research/,
 *      /glass-box/ux-design/, /glass-box/ux-experience/, /glass-box/prd/
 *  - Artifacts not yet published (architecture, epics, retrospective) link to the Glass Box
 *    index (/glass-box/) with an honest status 'open' and an [OPEN] note.
 *  - Stage 6 grounds to the cycle logs (real build telemetry) + /timeline/ (a live route).
 *  - Stage 8 grounds to the live site itself (https://joshuabrandt.abacusai.cloud/).
 *  - No invented build stats, no non-published artifact, no "ADRs" (none exist).
 *
 * DISTINCT FROM THE GLASS BOX TOUR (6.3):
 *  The Glass Box tour walks the artifacts. The Demonstrator replays the lifecycle
 *  (intent → working software), using artifacts as evidence. Different framing,
 *  different route, different island.
 */

/** A single artifact link within a Demonstrator stage. */
export interface DemonstratorArtifact {
  /** Link label — shown as the anchor text. */
  label: string;
  /**
   * The href for this artifact.
   * A real resolving URL for published artifacts.
   * '/glass-box/' for artifacts not yet published (honest index fallback).
   * An absolute URL for the live site.
   */
  href: string;
  /**
   * 'live'  — published; the href resolves to a real reader or live URL.
   * 'open'  — not yet published; honest [OPEN] flag; href points to /glass-box/ index.
   */
  status: 'live' | 'open';
}

/** A single stage in the Demonstrator lifecycle replay. */
export interface DemonstratorStage {
  /** Stable 1-based stage index. */
  id: number;
  /** Short stage label — shown as the heading. */
  stage: string;
  /**
   * One-paragraph narration of what happened at this stage.
   * Grounded ONLY to real artifact content / cycle-log facts / the live result.
   * No exclamation marks. No invented stats. No ADR references.
   */
  narration: string;
  /**
   * Step-by-step BMAD Method teaching for this stage (Story 9.2).
   * What the method prescribes at this stage and why — grounded to the real
   * methodology (content/kb/bmad-method.md + the real pipeline + project rules).
   * No invented acronym expansion; no fabricated steps/roles/guarantees.
   * No exclamation marks. Positive-assertion voice.
   */
  teaching: string;
  /**
   * The real artifact(s) this stage is grounded to.
   * Every 'live' href must resolve. Every 'open' href is an honest flag.
   */
  artifacts: DemonstratorArtifact[];
  /**
   * The user-observable result of this stage — what actually exists in the world.
   * One calm, concrete sentence.
   */
  observable: string;
}

/**
 * The curated Demonstrator lifecycle stages for this portfolio.
 *
 * Lifecycle order: brief → brainstorm/research → PRD → UX/architecture →
 * epics → build pipeline → retrospective → working software.
 *
 * IMPORTANT: Every 'live' artifact href was verified against the published
 * Glass Box readers before shipping (Story 9.1, Rule 9). The 6 live readers
 * are: product-brief, brainstorm, pre-brief-research, ux-design, ux-experience, prd.
 * Architecture, epics, and retrospective are ghost nodes in the Glass Box —
 * no readers exist yet; their hrefs are set to '/glass-box/' (the index) with
 * status 'open'.
 */
export const DEMONSTRATOR_STAGES: DemonstratorStage[] = [
  {
    id: 1,
    stage: 'The brief',
    narration:
      'Every project starts with a brief — the one-page argument that sets the direction before any code is written. For this portfolio, the brief defined the thesis: build a craft artifact first, a conversion funnel never. It named the audience (practitioners and organizers), the early positioning hero ("Seasoned, Not Stuck" — later refined in the PRD), and the first constraint: the site IS the work, built in the open via the BMAD Method.',
    teaching:
      'The BMAD Method begins with a brief: a short, written argument that names the problem, the intended audience, and the primary constraint — before any design or code is attempted. The brief is not a roadmap; it is a gate. Its job is to make the direction explicit enough that every subsequent decision can be tested against it. A brief that cannot be written in one page is a brief that has not found its thesis yet. Writing it first means the product requirements that follow can be evaluated for coherence, not just completeness.',
    artifacts: [
      {
        label: 'Product Brief →',
        href: '/glass-box/product-brief/',
        status: 'live',
      },
    ],
    observable:
      'A published, readable one-page brief that set the direction for everything that followed.',
  },
  {
    id: 2,
    stage: 'Brainstorm and research',
    narration:
      'Before writing requirements, the process diverges deliberately. The brainstorm session generated 47 distinct ideas in a single session — raw, unedited, covering every possible direction. The pre-brief research grounded those ideas against reality: what practitioners actually share about portfolios, what 30-year engineers overlook, and what this site had to avoid. Both documents are published in full.',
    teaching:
      'Before requirements are written, the BMAD Method prescribes two distinct passes: divergent brainstorming and grounded research. The brainstorm is deliberately unconstrained — the goal is quantity and range, not quality. Editing during a brainstorm collapses the possibility space too early. The research pass then grounds the raw ideas against reality: what is actually true, what has already been tried, what the audience cares about. Decisions recorded before writing requirements are decisions that can be traced when they are questioned later. Decisions that are assumed rather than recorded are invisible — and invisible constraints accumulate into unexamined scope.',
    artifacts: [
      {
        label: 'Brainstorm Session →',
        href: '/glass-box/brainstorm/',
        status: 'live',
      },
      {
        label: 'Pre-Brief Research →',
        href: '/glass-box/pre-brief-research/',
        status: 'live',
      },
    ],
    observable:
      'Two published artifacts: 47 ideas and a grounded research pass — the divergent thinking that shaped the brief.',
  },
  {
    id: 3,
    stage: 'The PRD',
    narration:
      'The Product Requirements Document turned the brief into a buildable specification: every feature, every constraint, every "never." It defined the two-layer IA (the cinematic Stage and the static Mirror), the 0-JS NFR, the positive-assertion voice rule, and the guardrails that govern what the site can and cannot do. The PRD is the contract the build pipeline executes against.',
    teaching:
      'The Product Requirements Document is the BMAD Method\'s primary scope-control mechanism. It does not describe a vision; it specifies acceptance criteria — the measurable conditions each feature must satisfy before it is considered complete. Its most important content is its "never" list: explicit guardrails that name what the product will not do. Without a "never" list, scope is defined only by what was thought of during planning, not by what the method prohibits. The PRD is written once and treated as a contract: the build pipeline executes against it, and every subsequent decision is testable against it. A PRD that is revised to accommodate work already done is not a contract; it is a log.',
    artifacts: [
      {
        label: 'Product Requirements Document →',
        href: '/glass-box/prd/',
        status: 'live',
      },
    ],
    observable:
      'A published PRD with functional requirements, non-functional requirements, and the guardrails that constrain every subsequent decision.',
  },
  {
    id: 4,
    stage: 'UX and architecture',
    narration:
      'Two UX documents defined the visitor experience and the visual identity: the UX Design locked the ink-on-cream palette, the Source Serif 4 typeface, and the flat token-driven system; the UX Experience choreographed every interaction, from the cinematic hero to the Glass Box. The architecture document (not yet published in the Glass Box) recorded the technical decisions — static-site generator, API framework, monorepo structure, and the build-output invariants that the test suite enforces.',
    teaching:
      'The BMAD Method separates UX design from technical architecture, treating them as parallel planning tracks that converge before implementation begins. The UX planning track answers "what does the visitor experience?" — locking visual identity, interaction patterns, and content hierarchy. The architecture track answers "how will this be built?" — selecting the technology stack, monorepo structure, and the invariants the build must preserve. Both tracks produce documents, not mockups or prototypes. The reason for written documents rather than prototypes: a document can be reviewed for correctness by a separate agent; a prototype can only be evaluated for feel. Architecture decisions recorded at this stage become auditable constraints — every story that follows can be checked against them.',
    artifacts: [
      {
        label: 'UX Design →',
        href: '/glass-box/ux-design/',
        status: 'live',
      },
      {
        label: 'UX Experience →',
        href: '/glass-box/ux-experience/',
        status: 'live',
      },
      {
        label: 'Architecture — coming in the Glass Box',
        href: '/glass-box/',
        status: 'open',
      },
    ],
    observable:
      'Two published UX documents that lock the visual identity and visitor journey; the architecture decisions are recorded in the planning artifact and enforced by the build-output test suite.',
  },
  {
    id: 5,
    stage: 'Epics and stories',
    narration:
      'The PRD and architecture fed into a sprint plan: a sequence of epics, each broken into BDD-shaped user stories. Each story carries a full context document — Dev Notes, Acceptance Criteria, Integration ACs, and a grounded task list. The stories are the work orders the build pipeline runs from. The epics document (which records the full story breakdown) is not yet published in the Glass Box.',
    teaching:
      'Epic planning is how the BMAD Method converts a PRD into executable work. Epics group related features into cohesive deliverable units. Each epic is then broken into stories: narrowly scoped, BDD-shaped work orders that name a specific user, a specific action, and a specific outcome. The BDD shape (Given/When/Then) matters because it forces the story author to state the acceptance criterion before any code is written — not afterward. Each story file carries Dev Notes (architectural context from upstream planning), Acceptance Criteria (the measurable completion conditions), Integration ACs (the cross-component or cross-service tests that prove integration), and a task list. The story file is a complete context document, not a ticket. An agent implementing a story should be able to do so correctly from the file alone — without asking questions or reading other planning artifacts.',
    artifacts: [
      {
        label: 'Epics — coming in the Glass Box',
        href: '/glass-box/',
        status: 'open',
      },
    ],
    observable:
      'A sprint plan of sequenced epics and the story files that implement them — the work orders for every feature on this site.',
  },
  {
    id: 6,
    stage: 'The build pipeline',
    narration:
      'Each story ran through four separate agent passes: dev (implementation), QA (test generation), code review (adversarial review by a different model), and the lead smoke (manual verification against the real build). Every pass is recorded in the cycle log telemetry. The Master Timeline shows the thirty-year arc of work this build joined.',
    teaching:
      "The BMAD Method build pipeline is a four-pass gate sequence for each story. The dev pass implements the story from its acceptance criteria. The QA pass generates automated tests — these are not written by the same agent that wrote the code. The code review pass runs adversarially using a different model with no memory of the author's reasoning, so it cannot rationalize the author's choices. The lead smoke pass manually verifies the real built artifact against the acceptance criteria. Each pass is a separate gate. A story does not advance until its current gate is satisfied. The separation of passes — different agents, different roles, no shared memory — is the structural source of the pipeline's integrity. An agent reviewing its own code is not reviewing; it is confirming.",
    artifacts: [
      {
        label: 'Master Timeline →',
        href: '/timeline/',
        status: 'live',
      },
    ],
    observable:
      'A completed, tested, reviewed, and smoke-verified build — with cycle-log telemetry recording every dev/QA/review/smoke event across all stories.',
  },
  {
    id: 7,
    stage: 'Review and retrospective',
    narration:
      'Every epic ends with a retrospective: what went well, what could have been better, and — the step that makes the lessons durable — the codified project rules. Each retrospective surfaces a class of bugs or anti-patterns and adds a numbered rule to the project rules file that every future agent sees before writing any code. The retrospective documents are not yet published in the Glass Box.',
    teaching:
      "The BMAD Method closes every epic with a retrospective. The retrospective has three sections: what went well, what could have been better, and — the step that distinguishes the BMAD Method from informal process — the codification step. Each lesson identified in the retrospective is tested for whether it is a class-of-bugs pattern (something that would prevent a recurrence of a type of problem across future epics) or a one-off incident (specific to what already happened). Class-of-bugs lessons are written as numbered project rules and added to a file that every future agent sees before writing any code. One-off incidents stay in the retrospective document. A retrospective without a codification step produces lessons that age. The next epic re-learns them. The rules file is what makes the retrospective's value compound across time.",
    artifacts: [
      {
        label: 'Retrospectives — coming in the Glass Box',
        href: '/glass-box/',
        status: 'open',
      },
    ],
    observable:
      'A growing set of project rules codified from retrospectives — durable lessons visible to every future agent in .claude/rules/project-rules.md.',
  },
  {
    id: 8,
    stage: 'Working software',
    narration:
      'The result is the site you are reading. The full planning trail is in the Glass Box; the complete timeline is on the Master Timeline; the Guide agent answers questions about the work. Every stage documented above produced a real, published artifact or a verifiable cycle-log event — no stage was reconstructed after the fact.',
    teaching:
      "Working software is the terminal output of the BMAD Method — but it is not its goal. The goal is a build in which the planning is auditable, the tests are grounded to real acceptance criteria, the code has been reviewed by a separate agent, and the retrospective lessons are codified for the next epic. Working software that arrived at that state without the planning, the separation of passes, or the retrospective is a result, not a method. The BMAD Method's value is not that it produces software; it is that it produces software whose provenance is traceable. Every decision has a corresponding artifact. Every artifact has a corresponding test. Every defect class has a corresponding rule. The method is auditable, not asserted.",
    artifacts: [
      {
        label: 'The live site →',
        href: 'https://joshuabrandt.abacusai.cloud/',
        status: 'live',
      },
    ],
    observable:
      'A live, production portfolio site — built in the open via the BMAD Method, with every planning stage documented and the build pipeline auditable.',
  },
];

/** Total number of Demonstrator stages. */
export const DEMONSTRATOR_STAGE_COUNT = DEMONSTRATOR_STAGES.length;

/** Look up a stage by its 1-based id. Returns undefined if not found. */
export function findStage(id: number): DemonstratorStage | undefined {
  return DEMONSTRATOR_STAGES.find((s) => s.id === id);
}

/**
 * Return the stage at the given 0-based step index, or null if out of range.
 * Mirrors the GlassBoxTour's stepArtifact pattern (pure helper for unit testing).
 */
export function stepStage(
  stages: DemonstratorStage[],
  step: number | null,
): DemonstratorStage | null {
  if (step === null || step < 0 || step >= stages.length) return null;
  return stages[step] ?? null;
}
