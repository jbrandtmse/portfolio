/**
 * render-glassbox.security.test.ts — QA adversarial tier for the Glass Box
 * publish gate (Story 2.1). Complements the dev's render-glassbox.test.ts.
 *
 * WHY A SEPARATE FILE: the dev tests prove the happy-path contract + a basic
 * default-deny "no-leak" assertion. This file is the ADVERSARIAL, SECURITY-
 * CRITICAL tier — it attacks the gate the way a future internal-doc leak would
 * happen, and pins the load-bearing INVARIANTS so the suite FAILS if the gate
 * ever regresses:
 *
 *   1. MUTATION-RESISTANCE (AC3, the red-team "internal-doc leak"): the render
 *      iterates the ALLOWLIST, never the filesystem. Proven two ways:
 *        (a) NEGATIVE — the FULL real never-render corpus (every .decision-log.md,
 *            review-*.md, reconcile-*.md, addendum.md present in the repo today)
 *            never appears in the output, by ARTIFACT IDENTITY (slug + sourceFile
 *            + body), not raw substring (allowlisted bodies legitimately *mention*
 *            the words "decision-log"/"addendum"/"reconcile" in prose — that is
 *            NOT a leak; we assert on identity).
 *        (b) POSITIVE CONTROL — a synthetic allowlist pointing at a REAL
 *            .decision-log.md DOES render it. This proves the ONLY reason those
 *            files are absent from the real output is that they are NOT LISTED —
 *            i.e. the gate IS the allowlist. Without this, the negative test
 *            could pass for the wrong reason (e.g. a hard-coded skip).
 *        (c) STRUCTURAL — render(allowlist) ⊆ allowlist exactly: every rendered
 *            slug traces back to an allowlist entry and vice-versa; |out| == |in|
 *            for a unique-slug allowlist. An unlisted file cannot enter the set.
 *
 *   2. GIT-DATE DETERMINISM (AC2 / NFR-6): each artifact's `date` equals the
 *      INDEPENDENTLY-computed `git log -1 --format=%cI` of its sourceFile — i.e.
 *      the date is git-derived, NOT wall-clock (`Date.now`/argless `new Date`).
 *      A pure two-call deep-equal (dev test) proves purity but NOT the source of
 *      the timestamp; this pins the mechanism.
 *
 *   3. GENERATOR REAL-RUNTIME TIER (Rule 3 for a build pipeline — actual
 *      invocation + produced-file assertions): run the registered Generator,
 *      read back the emitted web/src/generated/glassbox.json, and assert the
 *      written artifact (a) deep-equals the pure renderGlassbox() output,
 *      (b) is plain serializable JSON (every field a string — no Date objects,
 *      no functions), and (c) STILL satisfies default-deny at the serialization
 *      boundary. Note (skill-rules Rule 3): Story 2.1 ships a build-time
 *      pipeline/library, NOT a browser surface, so the browser/Playwright tier
 *      is EXEMPT; this generator-invocation tier is the correct real runtime.
 *
 * The output write is idempotent at a fixed git state (deterministic) — running
 * the generator here reproduces the same bytes `pnpm build` already wrote, so
 * this test does not dirty the working tree (glassbox.json is gitignored).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { GLASSBOX_ALLOWLIST, type GlassboxEntry } from '../content/glassbox.allowlist.ts';
import {
  getRepoRoot,
  gitCommitterDate,
  renderGlassbox,
  renderGlassboxGenerator,
  type GlassboxArtifact,
} from './render-glassbox.ts';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '..');

/**
 * FULL never-render corpus — discovered by scanning the real repo for every
 * file in a never-render family (a `find` for *.decision-log.md / review-*.md /
 * reconcile-*.md / addendum.md). This is INTENTIONALLY broader than the dev's
 * corpus, which omitted ALL three .decision-log.md files (AC3 names
 * .decision-log.md as the FIRST never-render family) and the ux-designs
 * review-rubric.md. If a never-render family grows, add it here.
 *
 * Each path is verified to exist below (so an accidental typo here surfaces as
 * a test error, not a silent skip).
 */
const NEVER_RENDER_CORPUS: readonly string[] = [
  // .decision-log.md family (the AC3-named family the dev corpus MISSED entirely)
  '_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/.decision-log.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/.decision-log.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/.decision-log.md',
  // addendum.md family
  '_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/addendum.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/addendum.md',
  // review-*.md family (PRD)
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-adversarial.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-downstream.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-rubric.md',
  // review-*.md family (UX) — incl. the review-rubric.md the dev corpus MISSED
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-accessibility.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-peer-credibility.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-rubric.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-seo-geo.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-voice.md',
  // reconcile-*.md family
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-brief.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-brainstorm.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-research.md',
];

const rendered: GlassboxArtifact[] = renderGlassbox(GLASSBOX_ALLOWLIST, repoRoot);

describe('render-glassbox SECURITY — corpus integrity (the test must test real files)', () => {
  it('every never-render corpus path actually exists in the repo (no silent-skip typos)', () => {
    // If this fails, a corpus path is wrong — fix the path, do NOT delete the
    // assertion. A non-existent "never-render" file would make the leak tests
    // vacuously pass.
    const missing = NEVER_RENDER_CORPUS.filter((p) => !existsSync(join(repoRoot, p)));
    expect(missing, `never-render corpus paths missing from repo: ${missing.join(', ')}`).toEqual(
      [],
    );
  });

  it('the never-render corpus includes ALL three .decision-log.md files (AC3-named family)', () => {
    const decisionLogs = NEVER_RENDER_CORPUS.filter((p) => p.endsWith('.decision-log.md'));
    expect(decisionLogs.length).toBe(3);
  });
});

describe('render-glassbox SECURITY — default-deny is MUTATION-RESISTANT (AC3)', () => {
  it('NEGATIVE: no never-render artifact appears in the output (by IDENTITY: slug + sourceFile + body)', () => {
    const renderedSlugs = new Set(rendered.map((a) => a.slug));
    const renderedBodies = new Set(rendered.map((a) => a.body));
    const allowlistedPaths = new Set(GLASSBOX_ALLOWLIST.map((e) => e.sourceFile));

    for (const neverPath of NEVER_RENDER_CORPUS) {
      // (1) the path is not an allowlist sourceFile
      expect(
        allowlistedPaths.has(neverPath),
        `never-render path leaked into the allowlist: ${neverPath}`,
      ).toBe(false);

      // (2) its derived slug (basename-ish) is not a rendered slug — identity, not substring
      const baseSlug = neverPath.split('/').pop()!.replace(/^\./, '').replace(/\.md$/, '');
      expect(renderedSlugs.has(baseSlug), `never-render slug leaked into output: ${baseSlug}`).toBe(
        false,
      );

      // (3) its exact body is not a rendered body (full content identity)
      const body = readFileSync(join(repoRoot, neverPath), 'utf8');
      expect(renderedBodies.has(body), `never-render body leaked into output: ${neverPath}`).toBe(
        false,
      );
    }
  });

  it('POSITIVE CONTROL: a synthetic allowlist pointing at a REAL .decision-log.md DOES render it — proving the gate IS the allowlist (not a hard-coded skip)', () => {
    // This is the load-bearing mutation-resistance proof. If the render had a
    // built-in "never render decision-log" filter, THIS would fail — and that
    // would be a false sense of safety (the real gate must be the allowlist
    // itself). We prove: listing a never-render file IS the only thing that
    // would surface it; absence from real output == absence from the allowlist.
    const decisionLog =
      '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/.decision-log.md';
    const synthetic: GlassboxEntry = {
      sourceFile: decisionLog,
      type: 'brief',
      slug: 'synthetic-leak-probe',
      title: 'Synthetic Leak Probe',
      curatorNote: 'Only present because explicitly listed in THIS synthetic allowlist.',
    };

    const out = renderGlassbox([synthetic], repoRoot);
    expect(out).toHaveLength(1);
    expect(out[0]!.slug).toBe('synthetic-leak-probe');
    // It rendered the REAL decision-log body — confirming the render reads
    // whatever the allowlist points at (so the gate is solely the allowlist).
    const realBody = readFileSync(join(repoRoot, decisionLog), 'utf8');
    expect(out[0]!.body).toBe(realBody);
    expect(out[0]!.body.length).toBeGreaterThan(0);

    // And critically: this slug is NOT in the production output (because the
    // REAL allowlist does not list it). The two facts together = mutation-resistant.
    expect(rendered.some((a) => a.slug === 'synthetic-leak-probe')).toBe(false);
  });

  it('STRUCTURAL: render(allowlist) is EXACTLY the allowlist set — render iterates the allowlist, not the filesystem', () => {
    // |output| == |allowlist| (unique slugs) and the slug sets are identical.
    // An unlisted file structurally cannot enter; a listed file cannot be dropped.
    const allowlistSlugs = [...GLASSBOX_ALLOWLIST].map((e) => e.slug).sort();
    const outputSlugs = rendered.map((a) => a.slug).sort();
    expect(outputSlugs).toEqual(allowlistSlugs);
    expect(rendered.length).toBe(GLASSBOX_ALLOWLIST.length);

    // Every rendered artifact's identity (slug/type/title/curatorNote) is carried
    // verbatim from an allowlist entry — output is a projection of the allowlist.
    for (const art of rendered) {
      const entry = GLASSBOX_ALLOWLIST.find((e) => e.slug === art.slug);
      expect(entry, `rendered slug "${art.slug}" has no allowlist entry`).toBeDefined();
      expect(art.type).toBe(entry!.type);
      expect(art.title).toBe(entry!.title);
      expect(art.curatorNote).toBe(entry!.curatorNote);
    }
  });

  it('adding ANY never-render file to a (synthetic) allowlist is the ONLY way it surfaces — sweep the whole corpus', () => {
    // Parameterized positive control across the entire corpus: each never-render
    // file, when listed, renders; when NOT listed (the real allowlist), is absent.
    for (const neverPath of NEVER_RENDER_CORPUS) {
      const probe: GlassboxEntry = {
        sourceFile: neverPath,
        type: 'retrospective',
        slug: `probe-${neverPath.length}`,
        title: 'probe',
        curatorNote: 'probe',
      };
      const out = renderGlassbox([probe], repoRoot);
      expect(out, `listing ${neverPath} should render exactly 1 artifact`).toHaveLength(1);
      // ...yet it is absent from the REAL render because the REAL allowlist omits it.
      expect(
        rendered.some((a) => a.body === out[0]!.body),
        `never-render body present in REAL output: ${neverPath}`,
      ).toBe(false);
    }
  });
});

describe('render-glassbox SECURITY — date is GIT-DERIVED, not wall-clock (AC2 / NFR-6)', () => {
  it("every artifact's date equals the independently-computed git committer date of its sourceFile", () => {
    for (const entry of GLASSBOX_ALLOWLIST) {
      const art = rendered.find((a) => a.slug === entry.slug)!;
      // Independently recompute via raw git — must match the rendered date exactly.
      const independent = execFileSync(
        'git',
        ['log', '-1', '--format=%cI', '--', entry.sourceFile],
        { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
      expect(
        art.date,
        `date for "${entry.slug}" is not the git committer date of ${entry.sourceFile}`,
      ).toBe(independent);
      // And it equals the module's own helper (no drift between helper and render).
      expect(art.date).toBe(gitCommitterDate(entry.sourceFile, repoRoot));
    }
  });

  it('dates are historical commit dates (predate or equal HEAD), never a future/now stamp', () => {
    // A wall-clock `new Date()` would tend to drift to "now" and could exceed the
    // latest commit; a git-committer date never exceeds HEAD's committer date.
    const headDate = execFileSync('git', ['log', '-1', '--format=%cI'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    for (const art of rendered) {
      expect(
        art.date.localeCompare(headDate),
        `artifact "${art.slug}" date ${art.date} is AFTER HEAD ${headDate} (smells like wall-clock)`,
      ).toBeLessThanOrEqual(0);
    }
  });

  it('the date sort tie-break is real: at least two artifacts share a date (slug is the secondary key)', () => {
    // Guards the secondary sort key from rotting into dead code: the launch set
    // has same-day artifacts, so a stable slug tie-break is actually exercised.
    const dateCounts = new Map<string, number>();
    for (const a of rendered) dateCounts.set(a.date, (dateCounts.get(a.date) ?? 0) + 1);
    const hasTie = [...dateCounts.values()].some((n) => n >= 2);
    expect(hasTie, 'expected at least one shared date so the slug tie-break is exercised').toBe(
      true,
    );
  });
});

describe('render-glassbox SECURITY — generator REAL-RUNTIME tier (Rule 3: invoke + assert produced file)', () => {
  // Story 2.1 ships a build-time pipeline/library, NOT a browser surface — the
  // browser/Playwright tier of Rule 3 is EXEMPT. Actual generator invocation
  // with produced-file assertions is the correct real-runtime evidence.
  it('renderGlassboxGenerator.run() writes glassbox.json that deep-equals the pure render output', async () => {
    await renderGlassboxGenerator.run();

    const repoRootFromHelper = getRepoRoot();
    const outputPath = join(repoRootFromHelper, 'web', 'src', 'generated', 'glassbox.json');
    expect(existsSync(outputPath), 'generator did not write glassbox.json').toBe(true);

    const written = JSON.parse(readFileSync(outputPath, 'utf8')) as GlassboxArtifact[];
    // The shipped artifact equals the pure function's output (single source of truth).
    expect(written).toEqual(renderGlassbox(GLASSBOX_ALLOWLIST, repoRootFromHelper));
  });

  it('the WRITTEN artifact is plain serializable JSON — every field a string (no Date objects, no functions)', async () => {
    await renderGlassboxGenerator.run();
    const outputPath = join(getRepoRoot(), 'web', 'src', 'generated', 'glassbox.json');
    const written = JSON.parse(readFileSync(outputPath, 'utf8')) as GlassboxArtifact[];

    expect(Array.isArray(written)).toBe(true);
    expect(written.length).toBeGreaterThan(0);
    const REQUIRED = ['slug', 'type', 'title', 'date', 'curatorNote', 'body'] as const;
    for (const art of written) {
      for (const key of REQUIRED) {
        expect(typeof (art as Record<string, unknown>)[key], `field "${key}" not a string`).toBe(
          'string',
        );
      }
    }
  });

  it('default-deny STILL holds at the serialization boundary — no never-render body in the written file', async () => {
    await renderGlassboxGenerator.run();
    const outputPath = join(getRepoRoot(), 'web', 'src', 'generated', 'glassbox.json');
    const writtenBodies = new Set(
      (JSON.parse(readFileSync(outputPath, 'utf8')) as GlassboxArtifact[]).map((a) => a.body),
    );
    for (const neverPath of NEVER_RENDER_CORPUS) {
      const body = readFileSync(join(repoRoot, neverPath), 'utf8');
      expect(
        writtenBodies.has(body),
        `never-render body present in written glassbox.json: ${neverPath}`,
      ).toBe(false);
    }
  });

  it('the generator is the FIRST registered entry in the pipeline (wired into pnpm build)', async () => {
    const { CONTENT_GENERATORS } = await import('./build-content.ts');
    expect(CONTENT_GENERATORS.length).toBeGreaterThanOrEqual(1);
    expect(CONTENT_GENERATORS[0]!.name).toBe('render-glassbox');
  });
});

describe('render-glassbox SECURITY — no-network guard extends to the allowlist data module (FR-33)', () => {
  it('content/glassbox.allowlist.ts contains no network primitive (single git source of truth)', () => {
    const src = readFileSync(join(repoRoot, 'content', 'glassbox.allowlist.ts'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    expect(code).not.toMatch(/\bfetch\s*\(/);
    expect(code).not.toMatch(/\b(?:axios|got|undici|node-fetch)\b/);
    expect(code).not.toMatch(/https?:\/\//);
  });
});
