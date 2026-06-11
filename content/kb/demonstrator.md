---
route: /demonstrator/
label: The Demonstrator
title: The Demonstrator — how this portfolio was built via the BMAD Method
---

# The Demonstrator

The Demonstrator at /demonstrator/ is a curated, replayable step-through of how this portfolio was built via the BMAD Method — from a one-page brief to production software, with every stage grounded to a real, published artifact or a verifiable build event.

Joshua R. Brandt, MSE built this portfolio in the open. The Demonstrator makes the method literal: each stage in the build lifecycle is shown with what it produced and where you can read it. Nothing was reconstructed after the fact.

## Watch Mode and Learn Mode

The Demonstrator has two modes, selectable via the Watch / Learn toggle at the top of the replay panel.

**Watch mode** shows what actually happened at each stage of this build: the narration of what was produced, and where you can read the real artifact. This is the 9.1 lifecycle replay.

**Learn mode** shows what the BMAD Method prescribes at each stage and why — a step-by-step teaching of the methodology, grounded in the real process used to build this site. This is how you learn the method, not just see its trail.

Both modes are present as readable text for visitors without JavaScript. The toggle is a JavaScript enhancement that switches between them.

## The Eight Stages

The Demonstrator replays eight stages of the BMAD lifecycle:

1. **The brief** — the one-page argument that set the direction. Readable in the Glass Box at /glass-box/product-brief/. The method: a brief that cannot be written in one page has not found its thesis yet.

2. **Brainstorm and research** — 47 ideas and a grounded research pass before any requirements were written. Both documents are published: /glass-box/brainstorm/ and /glass-box/pre-brief-research/. The method: divergent brainstorming first, then a grounded research pass; decisions recorded at this stage can be traced when questioned later.

3. **The PRD** — every feature, every constraint, every "never." The full Product Requirements Document is published at /glass-box/prd/. The method: a PRD with explicit guardrails (a "never" list) is a scope-control contract; a PRD revised to accommodate work already done is a log.

4. **UX and architecture** — the visitor experience and visual identity, locked in two documents published at /glass-box/ux-design/ and /glass-box/ux-experience/. The architecture planning file is a ghost node in the Glass Box — it will appear when it is curated and ready. [ASSUMPTION] The method: UX and architecture are separate planning tracks that converge before implementation; written documents (not prototypes) enable separate-agent review for correctness.

5. **Epics and stories** — the sprint plan: a sequence of epics broken into BDD-shaped story files. The epics document is a ghost node in the Glass Box — it will appear when it is curated and ready. [ASSUMPTION] The method: each story file is a complete context document (Dev Notes, ACs, Integration ACs, task list) that an agent can implement correctly without asking questions.

6. **The build pipeline** — each story ran through four agent passes: dev, QA, code review, and lead smoke. The cycle-log telemetry records every stage event. The Master Timeline at /timeline/ shows the thirty-year arc of work this build joined. The method: each pass is a separate gate with a different agent; separation of passes (different agents, different roles, no shared memory) is the structural source of the pipeline's integrity.

7. **Review and retrospective** — every epic ends with a retrospective and codified project rules. A growing set of numbered rules is recorded in .claude/rules/project-rules.md. The retrospective documents are ghost nodes in the Glass Box — they will appear when they are curated and ready. [ASSUMPTION] The method: class-of-bugs lessons are written as numbered project rules visible to every future agent; one-off incidents stay in the retrospective document.

8. **Working software** — the result is the site you are reading. The full planning trail is in the Glass Box at /glass-box/; the complete timeline is at /timeline/. The method: working software whose provenance is traceable is the terminal output — every decision has a corresponding artifact, every artifact has a corresponding test, every defect class has a corresponding rule.

## How to Use the Demonstrator

Visit /demonstrator/ and use the Watch / Learn toggle to choose your mode, then use the "Play the replay" button to step through each stage one at a time (next/prev/Esc/start-over). With JavaScript off, the full lifecycle is readable as a static ordered list — every stage and both modes' content are present in the page.

## Relationship to the Glass Box and Master Timeline

The Glass Box (/glass-box/) holds the curated planning artifacts — the documents themselves. The Master Timeline (/timeline/) shows the thirty-year career arc. The Demonstrator connects them: it shows how the lifecycle stages produced the artifacts and resulted in the working software.

[ASSUMPTION] More Glass Box artifact readers will ship as they are published — the architecture, epics, and retrospective documents will de-ghost when they are curated and ready.
