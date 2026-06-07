---
route: /glass-box/
label: How this was built
title: How this portfolio was built — the BMAD Method
---

# How This Portfolio Was Built

This portfolio was built entirely as a public agentic-engineering project, documented as it ships. Its curated planning artifacts are published and readable through the Glass Box (/glass-box/) — the Product Brief, the Brainstorm Session, the Pre-Brief Research, the PRD, and the two UX documents — with more de-ghosting as they ship.

## The BMAD Method

The BMAD Method is a disciplined multi-agent development workflow. It is the methodology used to build this portfolio and loandemo.

The core principle: agentic workflows are trustworthy when they are auditable. That means:

- Decisions recorded as they are made (not reconstructed after)
- Each feature specified before code is written
- Code reviewed by a separate agent pass (a different model with no memory of the author's reasoning)
- Integration tested against a real build, not a mocked environment
- Retrospectives are real, not curated post-hoc summaries

## Why Build in the Open?

Joshua R. Brandt, MSE works in the open, publishing the real, disciplined process behind his projects so the method is auditable, not asserted. The portfolio itself is the recursion proof: a portfolio built entirely as a public agentic-engineering project, using the same method it demonstrates.

This is one of two Stage-1 flagships alongside loandemo (/work/loandemo/). Together they demonstrate both vectors of the agentic turn: non-recursive engineering proof (loandemo) and recursion-proof portfolio (this site).

## The Pipeline

The build pipeline for this portfolio follows the BMAD Method phases:

1. Brainstorm / brief
2. PRD (Product Requirements Document)
3. Architecture decisions (recorded in the architecture document)
4. Epic planning
5. Story creation (each story has Dev Notes, ACs, and integration ACs)
6. Agentic dev (story implementation by dev agent)
7. Code review (separate agent pass, different model)
8. QA (test generation by dedicated QA agent)
9. Lead smoke gate (manual verification)
10. Retrospective (run at end of each epic; lessons codified as project rules)

Every stage is a gate. Nothing advances without satisfying the stage's acceptance criteria. The output of each stage is a file-based artifact — a story file, an architecture decision, a retrospective — that the next stage can inspect and verify.

## What's in the Glass Box

The Glass Box (/glass-box/) publishes the curated planning artifacts from this project. The published set today:

- The Product Brief
- The Brainstorm Session
- The Pre-Brief Research
- The PRD (Product Requirements Document)
- The UX Design
- The UX Experience

[ASSUMPTION] More artifacts de-ghost as they ship. The Glass Box also carries still-to-come "As it accrues" nodes — the architecture document, the epics and stories, and the retrospectives — which will become readable when they are published. The published artifacts are readable in full. The Glass Box is default-deny: only artifacts that reward reading are published. The method is auditable, not asserted.

## The Technology Stack

[ASSUMPTION] Specific technology stack — pending publication of the architecture document in the Glass Box.

[ASSUMPTION] This portfolio is a static site with a lightweight API and a build-time content pipeline. The specific technology choices (static-site generator, API framework, test tooling, package manager, and search engine) are recorded in the architecture document. That document is not yet published in the Glass Box — it is a still-to-come "As it accrues" artifact that will de-ghost when it ships. Until then, the specific stack is not asserted as confirmed public fact.

## The Guide

The Guide is an agentic assistant that answers questions about Joshua's work by grounding responses in the knowledge base — the same curated content published on this site. The Guide only speaks from blessed, deterministic source material. It cannot fabricate — every answer cites a real Mirror route.

The knowledge base is built from the same facts the Static Mirror exposes: /about/, /speaking/, /work/loandemo/, /faq/, and /glass-box/. The Guide's knowledge horizon is defined as "fresh as of the last build."
