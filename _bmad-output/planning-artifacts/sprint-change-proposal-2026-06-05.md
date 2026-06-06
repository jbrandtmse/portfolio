---
type: sprint-change-proposal
project: portfolio
user: Josh
date: 2026-06-05
trigger: Doc-hygiene sync from implementation-readiness-report-2026-06-05
scope_classification: Minor (documentation only — no code, no story restructuring)
mode: Batch
status: applied
appliedOn: 2026-06-06
appliedBy: Developer agent (bmad-correct-course)
---

> **APPLIED 2026-06-06** — Josh approved all five syncs (including the optional #5). Verified: PRD has 0 stray "Advocate Agent" (the one remaining instance is the intentional glossary rename record); EXPERIENCE.md both stale flags cleared; architecture.md all three island-count spots fixed; epics §7.2 header simplified. No story/FR scope changed; Stage-1 readiness preserved.

# Sprint Change Proposal — Doc-Hygiene Sync

## 1. Issue Summary

The implementation-readiness check (2026-06-05) returned **READY for Stage 1** with four low-severity, non-blocking doc-hygiene findings. This proposal resolves them in one pass.

**Note on the hook:** an earlier idea to change the hero hook to "Experienced, …" was **reverted** — Josh confirmed (2026-06-05) the canonical positioning line **stays "Seasoned, building at the frontier"**. No copy propagation is needed; that change is dropped. (This actually *reinforces* Sync 2 below — the stale "sync the positioning to the PRD" flags can now be cleared cleanly, since the PRD already carries the line.)

## 2. Impact Analysis

- **Epic / Story impact:** None. No stories change scope, order, or acceptance criteria. (Stage-1 readiness is unaffected.)
- **Artifact conflicts resolved:** PRD ↔ UX/Epics/Architecture vocabulary ("Advocate Agent" vs "the Guide"); stale upstream-sync flags in EXPERIENCE.md; an island-count wording slip in architecture.md.
- **Technical impact:** None — these are planning-document edits.

## 3. Recommended Approach

**Direct Adjustment** — edit the four artifacts in place. No rollback, no MVP-scope change. Effort: minutes. Risk: minimal (mechanical rename + flag removal + wording fix). Timeline impact: none.

## 4. Detailed Change Proposals

### Sync 1 — PRD: canonicalize **"the Guide"** (rename from "Advocate Agent", 25 instances)

`prds/prd-portfolio-2026-06-02/prd.md` — the PRD §4 glossary still declares **"Advocate Agent"** as the canonical term while UX/Epics/Architecture all use **"the Guide"**; the PRD's own rule ("introducing a synonym anywhere is a discipline violation," §4) makes this worth fixing at the source.

**(1a) Global mechanical rename** — replace the proper noun **`Advocate Agent` → `Guide`** throughout the PRD (25 occurrences on lines 27, 29, 62, 70, 87, 95, 96, 106, 111, 124, 126, 127, 136, 138, 139, 152, 172, 183, 188, 197, 420, 430, 445, 467, 492). Because the existing text reads "the/The Advocate Agent", this yields "the Guide"/"The Guide" correctly, and the §7.2 header becomes "### 7.2 The Guide". Lowercase descriptive words ("confident-advocate persona", "confident advocate") are **left untouched** (they describe the voice, they aren't the term).

**(1b) Glossary entry — record the rename (custom touch-up on line 95):**

```
OLD:  - **Advocate Agent** — The grounded conversational agent that is the site's primary
        navigation/curation interface (`#7`, `#22`, `#36`). Answers only from the **Knowledge
        Base**, cites sources, holds a fixed confident-advocate persona, and routes visitors to
        **Static Mirror** pages (router, not silo). Runs as a small live backend; everything else is static.

NEW:  - **The Guide** (the grounded conversational agent; renamed from *Advocate Agent* during UX
        design, 2026-06-04) — The site's primary navigation/curation interface (`#7`, `#22`, `#36`).
        Answers only from the **Knowledge Base**, cites sources, holds a fixed confident-advocate
        persona, and routes visitors to **Static Mirror** pages (router, not silo). Runs as a small
        live backend; everything else is static.
```

**(1c) Voice header — grammar fix (custom touch-up on line 127):** after the mechanical rename this line reads "**Guide voice — …**"; tidy to **"The Guide's voice — confident advocate, never hype."** (keeps the descriptive "confident advocate").

### Sync 2 — EXPERIENCE.md: clear two now-stale upstream-sync flags

`ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md` — both flags ask to propagate "Seasoned, building at the frontier" back to the PRD, but the **PRD already carries it** (§1 + FR-1, updated 2026-06-04). The flags are obsolete.

```
LINE 120
OLD:  …"building" ties to the demonstrate-don't-describe thesis. ⚠ Upstream-sync flag carried from
      the decision log: the PRD's resolving positioning is still "Seasoned, Not Stuck" → flow this
      change back to the PRD via `/bmad-correct-course`.
NEW:  …"building" ties to the demonstrate-don't-describe thesis. (Synced to the PRD 2026-06-05:
      PRD §1 and FR-1 carry "Seasoned, building at the frontier".)
```

```
LINE 356
OLD:  - ⚠ **Upstream sync:** propagate the new positioning line ("Seasoned, building at the
      frontier") back to the PRD (`/bmad-correct-course`).
NEW:  - ✅ **Upstream sync (resolved 2026-06-05):** the positioning line "Seasoned, building at
      the frontier" is in the PRD (§1 + FR-1).
```

### Sync 3 — architecture.md: "two islands" → **three** (match the structure)

`architecture.md` — the prose under-counts the React islands as two, but the directory tree (`islands/GuidePanel.tsx`, `GuidePill.tsx`, `InviteForm.tsx`) and Architectural Boundaries ("the three React islands", line 596) correctly say three. Fixing the prose so island hydration/perf budgeting isn't under-scoped.

```
LINE 162
OLD:  hydrate React only for the two interactive surfaces (hero affordances + the Guide panel).
NEW:  hydrate React only for the three island surfaces (the Guide pill, the Guide panel, and the Invite-Me form).
```

```
LINE 296
OLD:  - **Islands:** React only for the hero affordances + the Guide panel (`client:visible`/
      `client:idle`); everything else ships 0 JS — holds the ~200–250KB budget (NFR-1).
NEW:  - **Islands:** React only for the three islands — the Guide pill, the Guide panel, and the
      Invite-Me form (`client:visible`/`client:idle`); everything else ships 0 JS — holds the
      ~200–250KB budget (NFR-1).
```

```
LINE 469
OLD:  - Keep the NFR-1 budget: 0-JS by default, hydrate only the two islands, no token hardcoding.
NEW:  - Keep the NFR-1 budget: 0-JS by default, hydrate only the three islands, no token hardcoding.
```

### Sync 4 — Mockup string drift: **NO ACTION REQUIRED**

The promoted mocks carry pre-rename strings ("Advocate", "Josh Brandt", "Seasoned, Not Stuck", bare "BMAD"), but both spines already declare the canonical strings govern and **"spine wins on conflict"** (DESIGN.md §Components; EXPERIENCE.md lines 16, 80, 294). Mocks are reference-only and non-authoritative. *Optional future task (out of scope here): refresh the mock HTML strings.*

### Sync 5 (optional) — epics.md: simplify the bridged header

`epics.md` line 41 — once the PRD canonicalizes "the Guide", the bridging parenthetical is redundant:

```
OLD:  **7.2 The Advocate Agent (the "Guide")**
NEW:  **7.2 The Guide**
```

## 5. Implementation Handoff

- **Scope classification:** **Minor** — direct implementation (documentation edits only).
- **Recipient:** Developer agent (this session) applies the edits on approval.
- **Success criteria:** PRD uses "the Guide" throughout with the rename recorded in §4; EXPERIENCE.md carries no open positioning-sync flag; architecture.md prose consistently says "three islands"; (optional) epics §7.2 header simplified. No FR/story scope changes; Stage-1 readiness preserved.
- **Follow-on:** none required. Next workflow step remains **Sprint Planning** (`bmad-sprint-planning`).
