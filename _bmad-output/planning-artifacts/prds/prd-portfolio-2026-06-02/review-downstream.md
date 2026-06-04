# Downstream-Readiness Review — PRD: Josh Brandt Portfolio Site

**Reviewer role:** adversarial downstream-readiness auditor.
**Question:** can each of the three consumers — `bmad-ux`, `bmad-create-architecture`, `bmad-create-epics-and-stories` — consume this PRD cleanly, or will they get stuck / have to invent?
**Inputs reviewed:** `prd.md` (524 lines), `addendum.md` (25 lines).
**Date:** 2026-06-03.

---

## Verdict

This is a genuinely strong, downstream-aware PRD. It was written *for* these three consumers and it shows: a verbatim Glossary, globally-stable FR IDs, per-FR `Consequences (testable)` blocks, an explicit stage→FR map, NFRs that already name the WCAG/perf/SEO mechanics, and a disciplined `[ASSUMPTION]` index. **All three consumers can start.** None is blocked. The defects are localized and mostly Stage-2/3 or cosmetic, not foundational.

The headline issues are: (1) one Stage-3 FR (**FR-18**) has no testable done at all — its sole consequence is an `[ASSUMPTION]`; (2) the **"Thesis" Scene** named in the Scene Arc is an orphan — no FR, no Glossary entry — so `bmad-ux` hits an undefined surface; (3) **FR-6** smuggles prescriptive retrieval mechanics ("BM25-first; top-k 3–6") into a *testable acceptance criterion*, which over-reaches into architecture and contradicts §10/§14's own "architecture confirms the stack / add vectors if justified" stance; (4) a handful of FRs (**FR-10, FR-4, FR-25**) lean on soft qualifiers ("demonstrably different", "sensible default") that need a concrete bound before they can be acceptance-tested.

**Per-consumer:** ux = **gaps** (startable; Thesis orphan + a few hand-waved surfaces) · architecture = **ready** (one over-reach to trim, one flagged schema gap) · epics-stories = **ready** (clean slice from §12; fix FR-18 and 2–3 soft criteria before those specific stories).

---

## Cross-cutting integrity (checked mechanically)

| Check | Result |
|---|---|
| FR IDs defined | FR-1…FR-36, contiguous, no gaps, no duplicates. |
| FR references ≤ max defined | No reference to any FR > 36; every referenced FR exists. |
| NFR IDs | NFR-1…NFR-7, all defined and resolvable. |
| SM / SM-C IDs | SM-1…SM-4, SM-C1…SM-C4 — all defined, all resolvable. |
| UJ IDs | UJ-1…UJ-4, all defined, each referenced by FRs. |
| §N cross-references | Every §-reference used (§3.3, §4, §6, §7.x, §8, §9.x, §10–§15, §12.1) resolves to a heading that exists. No reference to a moved/renamed section. |
| §12 stage map vs per-FR inline `[Sn]` tags | **Perfect agreement** — diff of all 36 FRs shows zero mismatch. Stage 1 = 19 FRs, Stage 2 = 14, Stage 3 = 3; union = 36, no FR unassigned, none double-assigned. |
| Upstream-cited paths exist | brief dir, brief.md (`status: final` — claim accurate), brief addendum, brainstorm, research, and PRD-level `.decision-log.md` all present on disk. No dangling pointer. |

**No cross-cutting ID/reference defects found.** This is the cleanest part of the PRD and a green light for all three consumers on traceability. A backlog can be sliced from §12's stage→FR mapping with **zero ambiguity** at the assignment level (the ambiguity, where it exists, is *inside* individual FRs — see below — not in the mapping).

---

## A. `bmad-create-epics-and-stories` — can a backlog be sliced?

**Overall: READY.** The §12 map is unambiguous; most FRs carry acceptance-grade consequences. Fix the items below before story-izing those *specific* FRs.

### A1. [high] FR-18 (Site-wide semantic zoom) has no testable done — its only consequence IS an assumption
§7.4, line 269–272. The entire `Consequences (testable):` block is:
> - `[ASSUMPTION: zoom level changes the granularity of content shown across Scenes consistently; exact behavior defined in UX.]`
This is a placeholder, not a requirement. There is nothing to write an acceptance test against, and nothing to slice a story from beyond "build whatever UX decides." It is correctly Stage 3 (impact bounded, not on the MVP critical path), but as written it cannot be story-ized — the epics workflow would have to invent the entire behavior. **Fix:** either give it at least one concrete consequence (e.g. "at zoom level Z, Scene X collapses to its headline + N child items; the static path exposes the same hierarchy") or explicitly mark it *deferred-pending-UX* so the backlog skips it rather than guessing.

### A2. [medium] FR-10 (Agent-adaptive re-curation): "demonstrably different" is not a bound
§7.2, line 215: *"Two visitors stating different intents receive demonstrably different orderings/surfacings."* "Different" is checkable in principle, but there's no floor on *what* differs or *how much*, so a story author can't write a deterministic acceptance test (is reordering one card "demonstrably different"? swapping which Wing leads?). **Fix:** bound it — e.g. "an 'organizer' intent surfaces Speaker Surface first; a 'show me something cool' intent surfaces a playable embed first; the two leading surfaces differ." Stage 2, so not urgent, but flag it for the story.

### A3. [medium] FR-4 (Director's-mode reordering): "a sensible default cut always exists"
§7.2, line 171. "Sensible" is an adjective, not a consequence. The *default arc itself* is well-defined (§6), so the fix is trivial — the consequence should reference it: "a visitor who does nothing gets the §6 Default Scene Arc verbatim." (The second consequence, line 173, already says this; the description prose just uses the softer word — minor.) Low-risk; tighten when writing the story.

### A4. [low] FR-25 (Greatest-hits, relevance-ordered): "responds to stated interest" + "defaults to a curated order"
§7.6, line 322. Testable-ish (there IS a negative bound: "no static reverse-chronological CV as the primary surface" — good, that's acceptance-grade). The positive side ("ordering responds to stated interest") lacks a concrete check. Pair it with a named example like FR-10's fix. Stage 2.

### A5. [low] FR-15 (Guided tour + explorable map) is thin but acceptable
§7.3. One consequence covering both modes. It's the *minimum* story-izable — "narrated path through selected artifacts" + "free browsing of the same set" is enough to slice two stories (tour, map), though "selected" and "narrated" leave curation/copy to UX. Acceptable for Stage 2; no action required beyond noting UX owns the content.

### A6. Stage-2/3 thinness — verdict: mostly fine, two exceptions
The brief feared Stage-2/3 FRs would be "too thin / carry more `[ASSUMPTION]` tags." Audited: of the 14 Stage-2 + 3 Stage-3 FRs, only **FR-18** is genuinely un-story-izable (A1), and **FR-10/FR-25** need a bound (A2/A4). The rest (FR-3, FR-5, FR-11, FR-17, FR-21, FR-24, FR-26, FR-27, FR-28, FR-29, FR-30, FR-12) carry concrete, acceptance-grade consequences (e.g. FR-26 "loads lazily + static poster/fallback"; FR-30 "off by default, ducks under video, commercially licensed"; FR-17 enumerates exactly what a Dot reveals). **The staging-depth concern is largely unfounded** — the later stages are specified well enough to story-ize when their turn comes, with the three exceptions above.

### A7. Positive — the §12 slice is clean
Stage 1's 19-FR list (line 463) is internally consistent with every inline `[S1]` tag (verified by diff). An epics agent can take §12.1 verbatim as the MVP epic set without reconciling against the FR bodies.

---

## B. `bmad-ux` — concrete enough to design from?

**Overall: GAPS (startable).** UJs are excellent; the Scene Arc / aesthetic section is rich; one named Scene is undefined and a few surfaces are hand-waved to "defined in UX" (which is fine — that's UX's job — *except* where the PRD also gives UX no constraints to work within).

### B1. [high] "Thesis" Scene is an orphan in the Scene Arc — no FR, no Glossary entry
§6, line 135. The Default Scene Arc is **Hero → Thesis → Master Timeline → Speaker Surface → Flagship Case Study → Wings → Creative Lab → Glass Box → Close**. Every other Scene in that arc anchors to something: Hero→FR-1, Master Timeline→FR-16/17, Speaker Surface→FR-19/20, Flagship Case Study→FR-22, Wings→FR-24, Creative Lab→FR-29, Glass Box→FR-13/15, Close→FR-32. **"Thesis" anchors to nothing** — it is not in the Glossary §4, has no FR, no consequences, and is silently *dropped* from the Stage-1 trimmed arc (line 136). `bmad-ux` will reach this Scene in the arc and have to invent its entire purpose and content. (Contrast: §1 Vision and §5 Aesthetic talk about the "Seasoned, Not Stuck" thesis as a *concept*, but no Scene spec ties that to the "Thesis" stop.) **Fix:** add a one-line Glossary entry + a Stage-tag note for the Thesis Scene (what it asserts, what it shows), or rename/merge it into Hero if it was meant to be the hero's positioning beat. Currently the single biggest "downstream agent must guess" in the document.

### B2. [low] "Hero" and "Close" are also not Glossary entries, but are FR-anchored — acceptable
For completeness: Hero and Close likewise lack Glossary lines, but unlike Thesis they each have a defining FR (FR-1, FR-32) with consequences, so UX has a spec to design from. No action required; noting for the record so the Thesis gap isn't dismissed as "the arc just doesn't glossarize Scene names."

### B3. [low] "Flagship Case Study" (singular, §6 arc) vs "two flagship case studies" (FR-22) — reconcile the count
The full arc (line 135) and trimmed arc (line 136, "one deep Flagship") speak of a single Flagship *Scene*, while FR-22 ships *two* flagships (portfolio + loandemo). This is reconcilable (one Scene, two case studies inside it; or the arc shows the lead flagship and the second lives in Wings), but the PRD never says which. UX has to decide whether the Scene Arc has one Flagship stop or two. **Fix:** one sentence clarifying "the Flagship Scene presents the lead case study (loandemo); the portfolio-self case study lives in/links from the Glass Box." Minor.

### B4. UJs — verdict: strong, design-ready
UJ-1…UJ-4 each have named protagonist, persona+context, **entry state** (auth/device/intent), explicit **path beats**, a **climax**, a **resolution tied to an SM**, and an **edge case** (degraded/reduced-motion). This is exactly what `bmad-ux` needs to design scenes and flows. The `[ASSUMPTION: name]` tags on protagonists are correctly flagged and the PRD explicitly says beats > names. **No gap.** UJ-4 (Josh extends the site) is a builder/maintenance journey, not a visitor flow — UX should note it's an architecture/CI journey, but it's correctly captured.

### B5. Aesthetic/IA — verdict: sufficient to start, with intentional UX-owned blanks
§5 (Aesthetic & Tone) and §6 (IA) are unusually complete for a PRD: visual register (Architect's Studio), the "wow builds, not front-loaded" principle, the two designed-wow surfaces (agent-thinking + Creative Lab), agent voice, a thorough **anti-reference list** (no Matrix terminals, no floating-brain AI clichés, no scroll-jacking-without-skip), and the two-navigation-modes rule. The deliberate blanks — exact palette/typeface (line 124, flagged `[ASSUMPTION: chosen in UX]`), and "exact behavior defined in UX" on semantic zoom — are *correctly delegated*, not hand-waved, because UX is the right owner and the PRD gives bounds (≈1 display + 1–2 text styles; restrained palette). **One genuine hand-wave: the Thesis Scene (B1).** Everything else is either specified or properly delegated with constraints.

### B6. Glossary discipline — verdict: disciplined, with the Thesis hole
§4 defines 24 domain nouns and the PRD uses them consistently (Advocate Agent, Knowledge Base, Static Mirror, Lean Static Fallback, Glass Box, BMAD Dot, Master Timeline, Speaker Surface/Reel, Invite-Me, Wing, Creative Lab, Architect's Studio, Continuous Canvas, Scene, Scene Arc, Depth Dial, Demonstrator, etc.). Spot-check for synonym drift: clean — e.g. "Static Mirror" is used identically throughout; "Lean Static Fallback" is never swapped for "static fallback" as a *defined* term (lowercase "static fallback" appears in NFR-1 for WebGL posters, a different concept, arguably fine but worth a glance). The one discipline violation is structural, not lexical: **a Scene is referenced in the canonical arc that the Glossary never defines (Thesis).**

---

## C. `bmad-create-architecture` — enough to design a system, without over-stepping?

**Overall: READY.** Platform, agent/RAG, NFRs, and the Invite-Me path are specified to the right depth. There is exactly one over-reach to trim and one (already-flagged) schema gap.

### C1. [low — OVER-REACH] FR-6 hard-codes retrieval mechanics into a *testable acceptance criterion*
§7.2, line 189: *"The agent retrieves only from the build-time KB index **(BM25-first; top-k 3–6)** and never uses outside knowledge."* The "grounded, retrieve-only, cite, skip-model-on-empty-context" behavior is properly a PRD concern. But **"BM25-first; top-k 3–6"** is an architecture decision baked into an FR's *done* condition. This contradicts the PRD's own posture two ways: §10 RAG-index line 444 frames BM25/chunking as **"(input)"** that "architecture confirms," and explicitly says "add vectors only if logged retrieval misses justify it" — i.e. embeddings-first is an *allowed* outcome. An architect who legitimately chooses an embeddings/hybrid retriever would find FR-6's acceptance test self-contradictory ("BM25-first" fails by construction). **Fix:** move "BM25-first; top-k 3–6" out of the *testable consequence* into §10 as the recommended-input it already is; the FR-6 consequence should read "retrieves only from the build-time KB index" (mechanism-agnostic). Low severity (architect can read intent), but it's the one place the PRD genuinely over-steps into prescriptive architecture *inside an acceptance criterion*.

### C2. [low] Invite-Me data path: behavior specified, schema delegated (flagged) — acceptable
FR-31 (line 361–367) + Glossary + §9.2 give the architect: persist a row to a **site-owned Postgres table**, **email Josh**, confirm receipt with a **stated response time (N TBD)**, **minimum necessary fields**, **no account**, accessible/validated form, access-controlled inquiry data. What's *not* specified: the exact field list/schema, and the email transport (VM-local mailer vs SMTP — §14 Q5, retention policy §9.2 TBD). For a PRD this is the right altitude — the architect designs the schema — and crucially the gaps are **surfaced as Open Questions (§14 Q5)**, not silently missing. **Verdict: not a blocker.** The architect proceeds and resolves transport/retention as architecture decisions. If anything, FR-31 is *more* specified than typical (it names Postgres + email + response-time-promise as hard consequences). No fix required; noting the schema is theirs to define.

### C3. Agent / RAG design — verdict: well-bounded, design-ready
The architect has everything needed to design the agent subsystem: single small backend behind nginx (NFR-4/5), VM OpenAI-compatible endpoint, no external key (§9.3/§10), mid-tier model (flagged assumption, §10/§14), streaming, **retrieval from build-time index only**, **empty/low-score → skip the model call** (FR-6, NFR-4 — a real, testable reliability behavior), **prompt-injection separation** (FR-9), **server-side persona never returned to client** (FR-6/§9.1), build-time markdown indexer chunked at heading boundaries (≈300–800 tokens, §10). pgvector noted as available-if-justified. **No gap** — and note §10 correctly frames the retrieval stack as input pending confirmation; the *only* leak is C1 (FR-6's acceptance line).

### C4. Perf / a11y / SEO NFRs — verdict: concrete and testable
- **NFR-1 (perf):** FCP < ~2s mid-mobile; main-page JS < ~200–250KB gzipped; ≤1 fixed WebGL canvas; lazy-load heavy stack; KTX2/Basis/Draco. The "~" and ranges are *budgets with numbers* — testable bounds, not adjectives (an architect can set a CI perf budget from these). Flagged `[ASSUMPTION: confirm]` — correct.
- **NFR-2 (a11y):** Names the exact mechanics — reduced-motion gated at CSS *and* JS layers, `role="dialog"`/`role="log"`/`aria-live="polite"` **batched per-message not per-token**, focus management, real `<button>`s, WebGL `aria-hidden` + DOM equivalents, avoid Lenis. WCAG 2.1 AA target (flagged). This is implementation-grade and reconciles the "visible agent thinking" wow with screen-reader sanity (per-message announce). **Excellent.**
- **NFR-3 (SEO/GEO):** SSG-prerender enumerated routes; Static Mirror verifiable via `view-source`+find with JS off; JSON-LD per FR-35 (Person/ProfilePage/Event/VideoObject/CreativeWork/FAQPage); don't block AI crawlers. Testable (Rich Results Test named in FR-35). **No gap.**

### C5. Platform constraints — verdict: specified, with launch prerequisites called out
§10 gives nginx vhost + port + hostname, Postgres attached, the launch prerequisites (public-URL access **currently OFF**, Suno commercial-rights regeneration, github_connected OFF but not-a-blocker). These are real, actionable deploy constraints. The stack is correctly framed as "(input)… architecture confirms," and §14 Q1 reopens Astro-vs-Next — so the PRD does **not** over-mandate the frontend framework. Good separation of concerns (the one exception is C1).

---

## D. Severity-ranked findings (worst first)

| # | Sev | Consumer | Finding | Location | Fix |
|---|-----|----------|---------|----------|-----|
| 1 | high | ux | **"Thesis" Scene** named in the canonical Scene Arc has no FR and no Glossary entry — UX must invent it | §6 line 135; §4 | Add Glossary entry + Scene spec (what it asserts/shows) or merge into Hero |
| 2 | high | epics | **FR-18** has no testable done — sole consequence is an `[ASSUMPTION]`; cannot be story-ized | §7.4 line 269–272 | Add ≥1 concrete consequence, or mark deferred-pending-UX so backlog skips it |
| 3 | medium | epics | **FR-10** "demonstrably different orderings" — no bound on what/how-much differs | §7.2 line 215 | Bound with a named example (organizer→Speaker first; "cool"→playable first) |
| 4 | low | arch | **FR-6** OVER-REACH: "BM25-first; top-k 3–6" baked into a *testable acceptance criterion*, contradicting §10/§14's "architecture confirms / vectors if justified" | §7.2 line 189 vs §10 line 444 | Move mechanism to §10 input; FR-6 consequence → mechanism-agnostic |
| 5 | low | epics | **FR-4** "a sensible default cut" (adjective) — though line 173 already implies the §6 arc | §7.2 line 171 | Reference §6 Default Scene Arc explicitly in the consequence |
| 6 | low | epics | **FR-25** positive ordering criterion ("responds to stated interest") lacks a concrete check (negative bound is fine) | §7.6 line 322 | Add a named example like #3 |
| 7 | low | ux | **Flagship**: arc says one Flagship Scene; FR-22 ships two flagships — count unreconciled | §6 lines 135–136 vs FR-22 | One sentence: lead flagship = the Scene; second lives in/links from Glass Box |
| 8 | low | arch | Invite-Me **field schema + email transport** undefined — but correctly surfaced as Open Question, not silently missing | FR-31; §14 Q5 | None required; architect owns schema; resolve transport/retention in arch phase |

**Counts:** critical = 0 · high = 2 · medium = 1 · low = 5.

---

## E. What this PRD does notably well (so the consumers can lean on it)

- **Traceability is airtight** — FR/NFR/SM/UJ IDs unique and resolvable; §12 stage map matches every inline tag (diff-verified); upstream-cited paths all exist on disk. Downstream agents can cite FR-N and trust it.
- **`Consequences (testable)` as a discipline** — 33 of 36 FRs carry acceptance-grade, mostly-bounded consequences. The exceptions are enumerated above and are few.
- **UJs are design-ready** — protagonist + entry state + beats + climax + resolution-tied-to-SM + degraded edge case, for all four.
- **NFR-2 (a11y) and NFR-3 (SEO) are implementation-grade**, not aspirational — the architect can build CI checks directly from them.
- **Proper delegation vs over-reach is mostly right** — the stack is framed as "(input), architecture confirms," palette/typeface deferred to UX with bounds, retrieval-vectors left to "if justified." The single leak is FR-6's acceptance line (finding #4).
- **`[ASSUMPTION]` index (§15) + Open Questions (§10)** mean the *known unknowns* (content inventory, email transport, retention, analytics tool, model tier, response-time value) are surfaced for confirmation rather than silently guessed — the architecture and epics workflows know exactly where they must wait on Josh vs may proceed.

---

## F. Recommendation

Ship to all three consumers now. Before story-izing the *specific* FRs, close findings **#1 (Thesis Scene)** and **#2 (FR-18)** — both are one-paragraph fixes and both are the only items that force a downstream agent to *invent* rather than *interpret*. Findings #3–#8 are tighten-on-touch: resolve them when the relevant story/scene/subsystem is picked up, not as a gate. No finding blocks the MVP (Stage 1) critical path — #2 and several others are Stage 2/3.
