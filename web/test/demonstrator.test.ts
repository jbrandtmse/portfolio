/**
 * Unit tests for the Story 9.1 DemonstratorReplay island machinery and the
 * content/demonstrator.ts manifest.
 *
 * Rule 8 (real module, scoped, mutation-verified):
 *   - Tests import the REAL `$demoStep` atom from `store.ts`.
 *   - Tests import the REAL exported helpers from `DemonstratorReplay.tsx`.
 *   - Tests import the REAL `DEMONSTRATOR_STAGES` from `content/demonstrator.ts`.
 *   - Each assertion is scoped to the specific export under test.
 *   - Mutation verification: includes negation checks that would fail if
 *     the module were initialized to the wrong value or the logic were wrong.
 *
 * Rule 9 (credibility — every stage is real):
 *   - Every stage in DEMONSTRATOR_STAGES traces to a real published artifact
 *     or carries status='open' for not-yet-published artifacts.
 *   - Only the 6 published Glass Box readers are linked as 'live'.
 *   - No fabricated build stats, no ADR references, no exclamation marks.
 *
 * Covered:
 *   (a) $demoStep atom — initial value, open, close, step, reset
 *   (b) stepStage helper — correct mapping, boundary conditions
 *   (c) DEMONSTRATOR_STAGES credibility — published artifacts, no fabrications
 *   (d) content/kb/demonstrator.md — no ADR claims, references /demonstrator/
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { $demoStep } from '../src/lib/store.ts';
// Rule 8: import the REAL island exports (not inline copies).
import { stepStage, type ReplayStage } from '../src/islands/DemonstratorReplay.tsx';
// Rule 8: import the REAL manifest.
import {
  DEMONSTRATOR_STAGES,
  DEMONSTRATOR_STAGE_COUNT,
  findStage,
} from '../../content/demonstrator.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const kbPath = join(repoRoot, 'content', 'kb', 'demonstrator.md');
const kbContent = readFileSync(kbPath, 'utf8');

// The 6 published Glass Box readers (from glassbox.json — confirmed in Story 9.1).
// Any 'live' artifact href OUTSIDE this set is a fabrication (Rule 9).
const PUBLISHED_GLASS_BOX_READERS = new Set([
  '/glass-box/product-brief/',
  '/glass-box/brainstorm/',
  '/glass-box/pre-brief-research/',
  '/glass-box/ux-design/',
  '/glass-box/ux-experience/',
  '/glass-box/prd/',
]);

// Honest fallback hrefs permitted for 'open' artifacts.
const ALLOWED_OPEN_HREFS = new Set(['/glass-box/']);

// The live site absolute URL.
const LIVE_SITE_URL = 'https://joshuabrandt.abacusai.cloud/';

// ---------------------------------------------------------------------------
// Fixture — a small replay stages array for island-helper testing
// ---------------------------------------------------------------------------

const FIXTURE_STAGES: ReplayStage[] = [
  {
    id: 1,
    stage: 'The brief',
    narration: 'A brief narration for the brief.',
    teaching: 'A brief teaching for the brief stage.',
    artifacts: [{ label: 'Product Brief →', href: '/glass-box/product-brief/', status: 'live' }],
    observable: 'A published brief.',
  },
  {
    id: 2,
    stage: 'Brainstorm and research',
    narration: 'A brief narration for brainstorm.',
    teaching: 'A brief teaching for the brainstorm stage.',
    artifacts: [
      { label: 'Brainstorm Session →', href: '/glass-box/brainstorm/', status: 'live' },
      { label: 'Pre-Brief Research →', href: '/glass-box/pre-brief-research/', status: 'live' },
    ],
    observable: 'Two published artifacts.',
  },
  {
    id: 3,
    stage: 'The PRD',
    narration: 'A brief narration for the PRD.',
    teaching: 'A brief teaching for the PRD stage.',
    artifacts: [
      { label: 'Product Requirements Document →', href: '/glass-box/prd/', status: 'live' },
    ],
    observable: 'A published PRD.',
  },
];

// ---------------------------------------------------------------------------
// (a) $demoStep atom — replay lifecycle
// ---------------------------------------------------------------------------

describe('$demoStep atom (Story 9.1)', () => {
  beforeEach(() => {
    // Reset to closed between tests.
    $demoStep.set(null);
  });

  it('is initialized to null (replay closed) — mutation check: not a number', () => {
    const val = $demoStep.get();
    // Mutation verification: if initialized to anything else this fails.
    expect(val).toBeNull();
    expect(val).not.toBe(0);
    expect(val).not.toBe(1);
  });

  it('transitions closed → step 0 when replay is started', () => {
    $demoStep.set(0);
    expect($demoStep.get()).toBe(0);
    // Not null (not closed).
    expect($demoStep.get()).not.toBeNull();
  });

  it('transitions step 0 → step 1 (next)', () => {
    $demoStep.set(0);
    expect($demoStep.get()).toBe(0);
    $demoStep.set(1);
    expect($demoStep.get()).toBe(1);
    // Not still on step 0.
    expect($demoStep.get()).not.toBe(0);
  });

  it('transitions step 1 → step 0 (prev)', () => {
    $demoStep.set(1);
    expect($demoStep.get()).toBe(1);
    $demoStep.set(0);
    expect($demoStep.get()).toBe(0);
  });

  it('transitions any step → null (replay closed)', () => {
    $demoStep.set(3);
    expect($demoStep.get()).toBe(3);
    $demoStep.set(null);
    expect($demoStep.get()).toBeNull();
  });

  it('accepts the last valid step index (totalSteps - 1)', () => {
    const lastStep = FIXTURE_STAGES.length - 1;
    $demoStep.set(lastStep);
    expect($demoStep.get()).toBe(lastStep);
    expect($demoStep.get()).not.toBeNull();
  });

  it('round-trips: open → walk → close', () => {
    $demoStep.set(0);
    expect($demoStep.get()).toBe(0);
    $demoStep.set(1);
    $demoStep.set(2);
    expect($demoStep.get()).toBe(2);
    $demoStep.set(null);
    expect($demoStep.get()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// (b) stepStage helper — step index → stage mapping
// ---------------------------------------------------------------------------

describe('stepStage helper (Story 9.1)', () => {
  it('returns null when step is null (replay closed)', () => {
    const result = stepStage(FIXTURE_STAGES, null);
    // Mutation check: if the function returned the first stage instead of null,
    // this assertion would fail.
    expect(result).toBeNull();
  });

  it('returns the first stage at step 0', () => {
    const result = stepStage(FIXTURE_STAGES, 0);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect(result?.stage).toBe('The brief');
    // Mutation check: not the second stage.
    expect(result?.stage).not.toBe('Brainstorm and research');
  });

  it('returns the second stage at step 1', () => {
    const result = stepStage(FIXTURE_STAGES, 1);
    expect(result?.id).toBe(2);
    expect(result?.stage).toBe('Brainstorm and research');
    // Mutation check: not the first.
    expect(result?.stage).not.toBe('The brief');
  });

  it('returns the last stage at step N-1', () => {
    const lastIdx = FIXTURE_STAGES.length - 1;
    const result = stepStage(FIXTURE_STAGES, lastIdx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(FIXTURE_STAGES[lastIdx]!.id);
  });

  it('returns null when step is out of range (>= length)', () => {
    const result = stepStage(FIXTURE_STAGES, FIXTURE_STAGES.length);
    expect(result).toBeNull();
  });

  it('returns null when step is negative', () => {
    const result = stepStage(FIXTURE_STAGES, -1);
    expect(result).toBeNull();
  });

  it('returns null when stages array is empty', () => {
    const result = stepStage([], 0);
    expect(result).toBeNull();
  });

  it('each step maps to the correct stage id (full walk, lifecycle order)', () => {
    const expectedIds = FIXTURE_STAGES.map((s) => s.id);
    for (let i = 0; i < FIXTURE_STAGES.length; i++) {
      const result = stepStage(FIXTURE_STAGES, i);
      expect(result?.id, `step ${i} should map to id ${expectedIds[i]}`).toBe(expectedIds[i]);
    }
  });
});

// ---------------------------------------------------------------------------
// (c) DEMONSTRATOR_STAGES — credibility + grounding (Rule 9)
// ---------------------------------------------------------------------------

describe('DEMONSTRATOR_STAGES manifest credibility (Story 9.1 / Rule 9)', () => {
  it('defines exactly 8 stages (the lifecycle arc)', () => {
    expect(DEMONSTRATOR_STAGES).toHaveLength(8);
    // Mutation check: not fewer, not more.
    expect(DEMONSTRATOR_STAGES.length).not.toBe(7);
    expect(DEMONSTRATOR_STAGES.length).not.toBe(9);
  });

  it('DEMONSTRATOR_STAGE_COUNT equals DEMONSTRATOR_STAGES.length', () => {
    expect(DEMONSTRATOR_STAGE_COUNT).toBe(DEMONSTRATOR_STAGES.length);
  });

  it('stage ids are 1..8 in order (stable ids, no gaps)', () => {
    const ids = DEMONSTRATOR_STAGES.map((s) => s.id);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('findStage(1) returns the first stage (The brief)', () => {
    const stage = findStage(1);
    expect(stage).toBeDefined();
    expect(stage?.stage).toBe('The brief');
    // Mutation check: not a different stage.
    expect(stage?.stage).not.toBe('Brainstorm and research');
  });

  it('findStage(8) returns the last stage (Working software)', () => {
    const stage = findStage(8);
    expect(stage).toBeDefined();
    expect(stage?.stage).toBe('Working software');
  });

  it('findStage(0) returns undefined (ids are 1-based)', () => {
    expect(findStage(0)).toBeUndefined();
  });

  it('every stage has a non-empty stage label, narration, and observable', () => {
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        stage.stage.trim().length,
        `stage ${stage.id} must have a non-empty label`,
      ).toBeGreaterThan(0);
      expect(
        stage.narration.trim().length,
        `stage ${stage.id} must have a non-empty narration`,
      ).toBeGreaterThan(0);
      expect(
        stage.observable.trim().length,
        `stage ${stage.id} must have a non-empty observable`,
      ).toBeGreaterThan(0);
    }
  });

  it('every stage has at least one artifact', () => {
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        stage.artifacts.length,
        `stage ${stage.id} must have at least one artifact`,
      ).toBeGreaterThan(0);
    }
  });

  it('every live artifact href resolves to a real published Glass Box reader or the live site', () => {
    // Rule 9: only the 6 published Glass Box readers may be marked 'live',
    // plus the live site absolute URL and the /timeline/ route (a real live Mirror route).
    // Any other 'live' href is a fabrication.
    const allowedLiveHrefs = new Set([...PUBLISHED_GLASS_BOX_READERS, LIVE_SITE_URL, '/timeline/']);
    for (const stage of DEMONSTRATOR_STAGES) {
      for (const artifact of stage.artifacts) {
        if (artifact.status === 'live') {
          expect(
            allowedLiveHrefs.has(artifact.href),
            `stage ${stage.id} artifact "${artifact.label}" href "${artifact.href}" must be a known live URL`,
          ).toBe(true);
        }
      }
    }
  });

  it('every open artifact href is an allowed honest fallback (/glass-box/)', () => {
    // Rule 9: 'open' artifacts must link to the Glass Box index as the honest fallback.
    for (const stage of DEMONSTRATOR_STAGES) {
      for (const artifact of stage.artifacts) {
        if (artifact.status === 'open') {
          expect(
            ALLOWED_OPEN_HREFS.has(artifact.href),
            `stage ${stage.id} artifact "${artifact.label}" open href "${artifact.href}" must be /glass-box/ (honest fallback)`,
          ).toBe(true);
        }
      }
    }
  });

  it('no stage narration or observable contains an exclamation mark (positive-assertion voice)', () => {
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(stage.narration, `stage ${stage.id} narration must not contain "!"`).not.toContain(
        '!',
      );
      expect(stage.observable, `stage ${stage.id} observable must not contain "!"`).not.toContain(
        '!',
      );
    }
  });

  it('no stage narration references ADRs (no docs/adr/ in this project — Rule 9 fabrication class)', () => {
    const ADR_CLASS = /\bADRs?\b|architecture decision records?|\bdocs\/adr\//i;
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        ADR_CLASS.test(stage.narration),
        `stage ${stage.id} narration must not mention ADRs (no docs/adr/ exists)`,
      ).toBe(false);
    }
  });

  it('no stage narration invents a BMAD acronym expansion (no "Build, Measure, Adapt, Deliver" etc.)', () => {
    // Rule 9 fabrication class (Epic 4 retro): invented BMAD acronym.
    // The canonical name is "BMAD Method" — no acronym expansion.
    const INVENTED_EXPANSION = /Build,?\s+Measure|build[- ]measure[- ]adapt/i;
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        INVENTED_EXPANSION.test(stage.narration),
        `stage ${stage.id} narration must not invent a BMAD acronym expansion`,
      ).toBe(false);
    }
  });

  it('stage 1 (The brief) links to /glass-box/product-brief/ as a live artifact', () => {
    // Mutation-verified: removing this link from stage 1 reds this test.
    const stage = findStage(1)!;
    const brief = stage.artifacts.find((a) => a.href === '/glass-box/product-brief/');
    expect(brief, 'stage 1 must link to /glass-box/product-brief/').toBeDefined();
    expect(brief?.status, 'stage 1 product-brief link is live').toBe('live');
  });

  it('stage 2 (Brainstorm and research) links to both brainstorm and pre-brief-research as live', () => {
    const stage = findStage(2)!;
    const brainstorm = stage.artifacts.find((a) => a.href === '/glass-box/brainstorm/');
    const research = stage.artifacts.find((a) => a.href === '/glass-box/pre-brief-research/');
    expect(brainstorm, 'stage 2 must link to /glass-box/brainstorm/').toBeDefined();
    expect(brainstorm?.status, 'stage 2 brainstorm link is live').toBe('live');
    expect(research, 'stage 2 must link to /glass-box/pre-brief-research/').toBeDefined();
    expect(research?.status, 'stage 2 pre-brief-research link is live').toBe('live');
  });

  it('stage 3 (The PRD) links to /glass-box/prd/ as a live artifact', () => {
    const stage = findStage(3)!;
    const prd = stage.artifacts.find((a) => a.href === '/glass-box/prd/');
    expect(prd, 'stage 3 must link to /glass-box/prd/').toBeDefined();
    expect(prd?.status, 'stage 3 prd link is live').toBe('live');
  });

  it('stage 4 (UX and architecture) has live ux-design + ux-experience and open architecture', () => {
    const stage = findStage(4)!;
    const uxd = stage.artifacts.find((a) => a.href === '/glass-box/ux-design/');
    const uxe = stage.artifacts.find((a) => a.href === '/glass-box/ux-experience/');
    const arch = stage.artifacts.find((a) => a.status === 'open');
    expect(uxd, 'stage 4 must link to /glass-box/ux-design/').toBeDefined();
    expect(uxd?.status).toBe('live');
    expect(uxe, 'stage 4 must link to /glass-box/ux-experience/').toBeDefined();
    expect(uxe?.status).toBe('live');
    // Architecture is not yet published — honest open flag.
    expect(arch, 'stage 4 architecture artifact is open (not yet published)').toBeDefined();
    expect(arch?.href, 'architecture open href is /glass-box/').toBe('/glass-box/');
  });

  it('stage 6 (The build pipeline) links to /timeline/ as a live artifact', () => {
    // The cycle logs are real telemetry; /timeline/ is a real live route.
    const stage = findStage(6)!;
    const timeline = stage.artifacts.find((a) => a.href === '/timeline/');
    expect(timeline, 'stage 6 must link to /timeline/').toBeDefined();
    expect(timeline?.status, 'stage 6 timeline link is live').toBe('live');
  });

  it('stage 8 (Working software) links to the live site URL', () => {
    const stage = findStage(8)!;
    const liveSite = stage.artifacts.find((a) => a.href === LIVE_SITE_URL);
    expect(liveSite, 'stage 8 must link to the live site').toBeDefined();
    expect(liveSite?.status, 'stage 8 live site link is live').toBe('live');
  });

  it('no stage links to a non-published Glass Box reader (/glass-box/architecture/, /glass-box/epics/, /glass-box/retrospective/, /glass-box/shipping/) as live', () => {
    // Rule 9: these readers are ghost nodes in the Glass Box — they have NO published
    // readers. Linking them as 'live' would be a fabrication (the href would 404).
    const GHOST_READER_HREFS = [
      '/glass-box/architecture/',
      '/glass-box/epics/',
      '/glass-box/retrospective/',
      '/glass-box/shipping/',
    ];
    for (const stage of DEMONSTRATOR_STAGES) {
      for (const artifact of stage.artifacts) {
        if (artifact.status === 'live') {
          expect(
            GHOST_READER_HREFS.includes(artifact.href),
            `stage ${stage.id} artifact "${artifact.label}" must not link to a ghost reader as 'live' (href: ${artifact.href})`,
          ).toBe(false);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// (d) content/kb/demonstrator.md — Guide-grounding KB entry
// ---------------------------------------------------------------------------

describe('content/kb/demonstrator.md — Guide-grounding KB entry (Story 9.1 / Rule 9)', () => {
  it('references /demonstrator/ (the route the Guide should cite)', () => {
    expect(kbContent, 'demonstrator.md must reference /demonstrator/').toContain('/demonstrator/');
  });

  it('references /glass-box/ (the Glass Box planning artifacts)', () => {
    expect(kbContent, 'demonstrator.md must reference /glass-box/').toContain('/glass-box/');
  });

  it('references /timeline/ (the Master Timeline)', () => {
    expect(kbContent, 'demonstrator.md must reference /timeline/').toContain('/timeline/');
  });

  it('makes no ADR / architecture-decision-record claim (no docs/adr/ exists)', () => {
    const ADR_CLASS = /\bADRs?\b|architecture decision records?|\bdocs\/adr\//i;
    expect(
      ADR_CLASS.test(kbContent),
      'demonstrator.md must not claim decisions are recorded in ADRs (there is no docs/adr/)',
    ).toBe(false);
  });

  it('makes no "every planning artifact is published" fabrication (only 6 readers exist)', () => {
    // Rule 9 fabrication class (Epic 4 retro): "every/all planning artifacts are published
    // in the Glass Box" when only an allowlisted set is published.
    const ALL_PUBLISHED_CLAIM =
      /every.*planning artifact.*published|all.*planning artifact.*published|all.*artifacts.*in the glass box/i;
    expect(
      ALL_PUBLISHED_CLAIM.test(kbContent),
      'demonstrator.md must not claim every planning artifact is published (only 6 Glass Box readers exist)',
    ).toBe(false);
  });

  it('contains no exclamation marks (positive-assertion voice)', () => {
    expect(kbContent, 'demonstrator.md must not contain "!"').not.toContain('!');
  });

  it('has required frontmatter: route, label, title', () => {
    expect(kbContent, 'must have route frontmatter').toMatch(/^route:\s+\/demonstrator\//m);
    expect(kbContent, 'must have label frontmatter').toMatch(/^label:\s+/m);
    expect(kbContent, 'must have title frontmatter').toMatch(/^title:\s+/m);
  });

  // Story 9.2 additions — teaching layer documentation
  it('references Watch mode and Learn mode (9.2 teaching layer)', () => {
    expect(kbContent, 'demonstrator.md must describe Learn mode').toMatch(/\bLearn\b/);
    expect(kbContent, 'demonstrator.md must describe Watch mode').toMatch(/\bWatch\b/);
  });
});

// ---------------------------------------------------------------------------
// (e) DEMONSTRATOR_STAGES teaching field — credibility (Story 9.2 / Rule 9)
// ---------------------------------------------------------------------------

describe('DEMONSTRATOR_STAGES teaching field credibility (Story 9.2 / Rule 9)', () => {
  it('every stage has a non-empty teaching field', () => {
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        stage.teaching.trim().length,
        `stage ${stage.id} must have a non-empty teaching field`,
      ).toBeGreaterThan(0);
    }
  });

  it('teaching is distinct from narration for every stage (not a copy)', () => {
    // Mutation-verified: if teaching === narration for any stage, the toggle would
    // show no visible content change (Rule 13 violation).
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        stage.teaching.trim(),
        `stage ${stage.id} teaching must differ from narration`,
      ).not.toBe(stage.narration.trim());
    }
  });

  it('no stage teaching contains an exclamation mark (positive-assertion voice)', () => {
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(stage.teaching, `stage ${stage.id} teaching must not contain "!"`).not.toContain('!');
    }
  });

  it('no stage teaching references ADRs (no docs/adr/ in this project — Rule 9)', () => {
    const ADR_CLASS = /\bADRs?\b|architecture decision records?|\bdocs\/adr\//i;
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        ADR_CLASS.test(stage.teaching),
        `stage ${stage.id} teaching must not mention ADRs`,
      ).toBe(false);
    }
  });

  it('no stage teaching invents a BMAD acronym expansion — Rule 9 fabrication class (AC3)', () => {
    // Rule 9: the BMAD acronym is NOT expanded in this project.
    // "BMAD Method" is the correct reference; any invented expansion is a fabrication.
    // Mutation-verified: adding "Build, Measure, Adapt, Deliver" to any teaching field
    // reds this test.
    const INVENTED_EXPANSION =
      /Build,?\s+Measure[- ,]|build[- ]measure[- ]adapt|Agile[- ]Driven|Method[- ]Agile[- ]Driven/i;
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        INVENTED_EXPANSION.test(stage.teaching),
        `stage ${stage.id} teaching must not invent a BMAD acronym expansion`,
      ).toBe(false);
    }
  });

  it('no stage teaching claims every planning artifact is published (Rule 9)', () => {
    // Rule 9: only 6 Glass Box readers exist; claiming all artifacts are published is fabrication.
    const ALL_PUBLISHED_CLAIM =
      /every.*planning artifact.*published|all.*planning artifact.*published|all.*artifacts.*in the glass box/i;
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        ALL_PUBLISHED_CLAIM.test(stage.teaching),
        `stage ${stage.id} teaching must not claim every planning artifact is published`,
      ).toBe(false);
    }
  });

  it('no stage teaching refers to "the BMAD Method" by an invented multi-word acronym expansion', () => {
    // AC3 acronym-expansion guard: the project uses "the BMAD Method" — no expansion.
    // Guard the class broadly: any "B___ M___ A___ D___" four-word expansion pattern.
    const FOUR_WORD_EXPANSION = /\bB\w+\s+M\w+\s+A\w+\s+D\w+\b/;
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        FOUR_WORD_EXPANSION.test(stage.teaching),
        `stage ${stage.id} teaching must not expand BMAD as a four-word acronym`,
      ).toBe(false);
    }
  });

  it('no stage teaching describes a step or role not in the real BMAD pipeline (Rule 9 — no fabricated methodology)', () => {
    // Guard against invented roles/steps not in the real pipeline
    // (brief → brainstorm/research → PRD → UX/architecture → epics → dev/QA/code-review/smoke → retro).
    // Known real roles: dev, QA, code review, lead smoke, retrospective.
    // Invented roles to forbid as fabrication signals (not in the real method).
    const INVENTED_ROLES = /\bscrum master\b|\bproduct owner\b|\bsprint review\b|\bvelocity\b/i;
    for (const stage of DEMONSTRATOR_STAGES) {
      expect(
        INVENTED_ROLES.test(stage.teaching),
        `stage ${stage.id} teaching must not introduce invented methodology roles`,
      ).toBe(false);
    }
  });
});
