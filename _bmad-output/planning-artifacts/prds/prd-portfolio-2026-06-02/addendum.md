# Addendum — PRD: Josh Brandt Portfolio Site

Downstream depth and decisions that support the PRD but don't belong in its main narrative. Audit/override information lives in `.decision-log.md`, not here.

## PRD-originated decisions (no single upstream source)

- **Stage 1 = discrete fast Scenes, not the full Continuous Canvas.** The brief's "fast hero, confident and restrained" was read as: Stage 1 ships clean sectioned Scenes (the trimmed arc); the **Continuous Canvas + camera-path transitions** (`#32`/`#33`) land in Stage 2 (FR-3). This is consistent with `#47` ("staged delivery — the full vision *is* committed scope, delivered in a sequence, not cut"): the canvas is committed, just sequenced into S2. Approved by Josh on 2026-06-03.
- **Counter-metrics SM-C1…4 are PRD-authored** (not in the brief): don't bury the organizer behind the cinematics; don't slip the ~end-of-June ship; zero ungrounded agent claims; quality-of-shares over raw traffic. They encode what *not* to optimize so downstream work doesn't game the wrong target.
- **"Made while subscribed" license check generalized** from Suno to any paid AI tool used for featured content. Rationale: the same generation-time licensing trap applies to other generative tools; cheaper to state the rule once.

## Rejected / calibrated alternatives (full rationale preserved upstream)

The complete rejected-alternatives matrix lives in the **brief addendum** (`…/briefs/brief-portfolio-2026-06-02/addendum.md`) and the **brainstorm** (`_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md`). The ones the PRD depends on:

- **Live arbitrary agentic execution → curated Demonstrations** (`#8`→`#35`): keeps the "live agentic work" wow without exposing a public execution engine; nothing unapproved is ever shown.
- **CMS → code-as-CMS via git** (`#34`): on-brand for the audience; the maintenance model *is* the engineering story.
- **Live external reads → git single source of truth** (`#37`): fully static, key-free, rate-limit-free runtime; total editorial control.
- **Ungrounded chat → grounded + cited + fixed persona** (`#36`): "spontaneity in phrasing, control over substance."
- **Warts-and-all narrative → highlight reel** (`#11`): process transparency (Glass Box, honest) is kept distinct from narrative curation (story shown at its best).

## Deferred items with revisit conditions

- **Podcast synergy** — revisit if/when the podcast ships (PRD §11).
- **"Open to work" mode** — latent; the site is architected to support it, built only when Josh chooses (`#44`).
