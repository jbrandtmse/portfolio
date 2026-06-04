# Brief → PRD Reconciliation (FINALIZE input-reconciliation pass)

**Inputs reconciled against the PRD:**
- `brief.md` (`status: final`)
- `addendum.md`

**Target document:** `prd.md` (`status: draft`)

**Purpose of this pass:** find only what the PRD DROPPED, WEAKENED, CONTRADICTED, or MISLABELED relative to the brief + addendum — so nothing important is silently lost before finalize. This is not a coverage audit; items the PRD already carries well are not listed.

**Overall:** The PRD is a faithful and unusually complete carry-forward of the brief. Coverage of FRs, stages, guardrails, platform constraints, and success metrics is strong. The gaps below are real but mostly qualitative/strategic-nuance losses plus a few specific dropped facts, not missing capabilities. One item rises to near-blocker because it is an emotionally load-bearing strategic frame that the PRD silently demotes.

---

## GAP 1 — The site's emotional through-line ("remarkable enough to SHARE", the "whoa", reputation-via-amplification) is structurally present but tonally flattened

**Severity: should-fix** (borderline blocker — it is THE thesis)

**Brief evidence:**
- Exec summary: "a craft artifact remarkable enough that practitioners **share** it (building reputation)" and "the **remarkable center of gravity** that makes the substance undeniable and shareable" (brief L14, L16, L22).
- Who This Serves: the practitioner experience is "immersive, deep, 'whoa'" and "**The default experience is tuned for them**" (brief L39).

**PRD treatment:** The PRD does carry "remarkable," "whoa," and "share" (e.g. §1 L29 "a recursive 'whoa' they want to share"; §3.1 L41 "the default experience is tuned for them"). But the FR structure decomposes the *whoa* into testable mechanics (FR-13 read-only artifacts, FR-16 seeded Dots) and the emotional payload survives only in the Vision and UJ prose. The "remarkable" quality — that Stage 1's Glass Box is explicitly "**The one *remarkable* element in Stage 1, giving practitioners a reason to share on day one**" (brief L66) — is not asserted anywhere as a binding product requirement or success-shaping principle in §5/§7.3. It reads as a nice-to-have rather than the load-bearing reason Stage 1 exists.

**Suggested fix:** Add one sentence to §7.3 (Glass Box description) stating verbatim from the brief: the Glass Box is *the one remarkable element in Stage 1, the day-one reason practitioners share* — i.e. its remarkability is a requirement, not a hope. Optionally reinforce in §5 Aesthetic.

---

## GAP 2 — "Engineering is creative" / range-as-evidence is present, but the brief's stronger claim that creative work must *reinforce, not dilute* the engineering story is softened

**Severity: nice-to-have**

**Brief/addendum evidence:** Brief: "**Engineering is creative** (`#43`): the creative work reinforces (not dilutes) the engineering story; range is evidence of a modern engineer" — this exact line IS in the PRD §5 L124. So the principle survives. *No gap here on the principle itself.*

**Actual residual gap:** The brief frames the Content Wanderer's creative delight (Suno, generative art, games) as feeding the *audience* compounding engine, and the addendum names the specific playables (`vector-wars`, `voyager`, `christmas-elves`) — all carried in FR-26. **Covered.** Downgrading this gap to "no material gap"; listed only to record it was checked.

**Suggested fix:** none required.

---

## GAP 3 — Brief's audience *priority ordering* nuance: practitioner sharing is the engine that DRIVES organizer conversions (causal chain), not two parallel goals

**Severity: should-fix**

**Brief evidence:** "their sharing is what compounds Josh's reputation and, **downstream, drives the awareness that produces speaking invitations**" (brief L39). The brief explicitly makes the practitioner→reputation→organizer a *causal funnel*: amplification is upstream of conversion.

**PRD treatment:** §3.1 presents the practitioner as "Primary design target" and organizer as "Primary conversion target" as two co-equal primaries (L41–42). The *causal dependency* (practitioner shares CAUSE the organizer to arrive "after hearing Josh's name … the buzz from UJ-1", which the PRD does hint at in UJ-2 L64) is implied but not stated as strategy in §3.1. A reader could treat them as independent targets to optimize separately, losing the "fund the engine first" logic.

**Suggested fix:** Add a one-line note to §3.1 making the chain explicit: *practitioner amplification is the upstream engine that produces the organizer's "already heard the name" arrival; design conflicts resolve in favor of the amplifier.*

---

## GAP 4 — "Honest strategy / explicitly NOT a cold-traffic lead-gen funnel" is preserved, but the brief's framing that *the strategy is honest* (and the moat is authenticity, not tech) loses its named "honest" emphasis

**Severity: nice-to-have**

**Brief evidence:** "**The strategy is honest.** The site's job is to be a craft artifact…" (brief L16). "**Honest about the moat:** there's no defensible *technology* here" (brief L35).

**PRD treatment:** §1 L31 carries "explicitly *not* a cold-traffic lead-gen funnel" and "no defensible *technology* moat; the advantage is **authenticity + novelty + a real track record**." The *substance* survives. What's lost is the brief's self-aware "honesty" framing as a stated value (the strategy openly disclaiming funnel intent). Minor.

**Suggested fix:** Optional — one clause in §1 or §2: *the strategy is deliberately honest about what the site is and isn't.* Low priority.

---

## GAP 5 — "The real risk is execution and taste, not competitors" — DROPPED

**Severity: should-fix**

**Brief evidence:** "The real risk is **execution and taste, not competitors**" (brief L35, closing the moat paragraph). Reinforced by anti-references in the addendum's spirit.

**PRD treatment:** The PRD carries the moat ("costly to imitate because it requires actually being Josh", §1 L31) but **omits the risk framing entirely**. Nowhere does the PRD state that the dominant project risk is execution/taste rather than competition. This matters for downstream UX/architecture priority-setting: it tells those phases that *polish and taste are the win condition*, which directly motivates §5's anti-references and the "unrefined AI-slop" warning. Without it, the anti-references read as style preferences rather than risk mitigations.

**Suggested fix:** Add to §2 (Why Now) or §5: *The dominant risk is execution and taste, not competitors — "AI-slop" or unrefined polish is the primary failure mode.*

---

## GAP 6 — Suno "made while subscribed" rights nuance is carried, but the brief's broader directive to **re-generate** featured tracks (not just upgrade) and the wording "existing free-tier songs are not retroactively licensed" — fully present; the generalization to "any paid AI tool" is a PRD ADDITION

**Severity: nice-to-have (note only)**

**Brief evidence:** "commercial use attaches *at generation time*; upgrade to a paid plan and **re-generate** any featured tracks (existing free-tier songs are not retroactively licensed)" (brief L88).

**PRD treatment:** §10 L438 carries this faithfully AND adds "Apply the same 'made while subscribed' check to **any paid AI tool** used for featured content." This is a reasonable, helpful generalization — not a contradiction. Flagging only because it is PRD content not in the brief; if the brief is the contract, confirm the generalization is intended.

**Suggested fix:** None; confirm the generalization is acceptable, or note it in the addendum as a PRD-originated extension.

---

## GAP 7 — Brief's "lean static fallback" is described as *the* organizer path; PRD splits "Lean Static Fallback" (no-JS/reduced-motion path) from "Static Mirror" (SEO HTML) — a useful refinement, but the brief's organizer wording ("all reachable without engaging the cinematic layer (the lean static fallback)") now maps to TWO PRD terms

**Severity: nice-to-have (traceability)**

**Brief evidence:** Organizer is "served via … all reachable **without engaging the cinematic layer (the lean static fallback)**" (brief L41).

**PRD treatment:** The PRD (correctly, and more precisely) distinguishes **Lean Static Fallback** (Glossary L93: no-JS/reduced-motion/non-chat browsable path) from **Static Mirror** (Glossary L94: crawlable SEO HTML). The organizer in UJ-2 actually reaches Speaker Surface "without engaging the cinematic layer" (the *sectioned* path), and Googles into the **Static Mirror**. This is a *better* model than the brief's single term — but a reader cross-walking the brief may be momentarily confused that "the lean static fallback" in the brief = "reach Speaker Surface without the cinematic layer," which the PRD models via FR-2 (sectioned scenes) + Static Mirror, not strictly via the Glossary's "Lean Static Fallback." No content lost.

**Suggested fix:** None required; optionally add a one-line Glossary note that the brief's umbrella phrase "lean static fallback" decomposes into Lean Static Fallback + Static Mirror + the sectioned (non-cinematic) shell.

---

## GAP 8 — Internal idea-number collision: `#31` is used for BOTH "Adaptive Soundtrack" and the "agentic ideal, graceful fallback" design pattern

**Severity: should-fix (correctness/traceability)**

**Evidence:**
- PRD §6 L135: "Design principle — 'agentic ideal, graceful fallback' (`#31`)".
- PRD Glossary L110 (Adaptive Soundtrack) and §7.7 FR-30 L341–342: cite `#29`, `#31`.

The same idea number `#31` is attached to two different concepts. The addendum lists the design pattern *without* a number ("Recurring design pattern: 'agentic ideal, graceful fallback'", addendum L26) and the soundtrack ducking under "#29/#31" territory in the brief Glossary mapping. Because idea numbers are explicitly used "for traceability" (PRD §0 L23), a duplicate number breaks that traceability.

**Suggested fix:** Verify against `brainstorming-session-2026-06-02-1723.md` which idea `#31` actually is, and correct one of the two usages (likely the design-pattern citation should be a different number or left unnumbered as in the addendum).

---

## GAP 9 — Brief's "small live backend … calls the VM's OpenAI-compatible LLM endpoint; Claude/GPT/Gemini models are available locally, **no external key**" — fully carried. Confirmed present.

**Severity: none**

PRD §10 L432–433 and NFR-5 carry "no external key needed," "no runtime API keys," model list incl. `claude-opus-4-8`. No gap.

---

## GAP 10 — Vision-horizon nuance: brief's "**a repeatable pattern others can adopt**" and "the site practitioners point to when they explain what BMAD … can really do" — weakened

**Severity: nice-to-have**

**Brief evidence:** Vision L98: "the canonical example of a portfolio built *as* a public agentic-engineering project — the site practitioners point to when they explain what BMAD and agentic engineering can really do … and **a repeatable pattern others can adopt**."

**PRD treatment:** §1 Vision (L25–31) is reframed around the present-tense product and does NOT carry the 2–3-year "canonical example / repeatable pattern others can adopt" aspiration. The PRD's §1 is more of a "what it is now" statement; the brief's forward vision (the deeper win: a repeatable pattern, the thing others point to) is absent. The PRD has no dedicated long-horizon Vision section mirroring the brief's. This is arguably fine for a decision-ready PRD, but the *strategic north star* ("others adopt this pattern") is a motivating frame the PRD drops.

**Suggested fix:** Add one sentence to §1 or §2: *North star — become the canonical, repeatable example others point to and adopt when explaining agentic engineering.*

---

## GAP 11 — "Ship discipline" anti-pattern naming ("anti-'never ships'", "not a perpetual WIP") is carried; but the brief's explicit independence clause "**independent of any other project (e.g., the podcast)**" is present in SM-4 — confirmed

**Severity: none**

Brief L54 "independent of any other project (e.g., the podcast)" → PRD SM-4 L474 "independent of any other project" and SM-C2. Carried.

---

## GAP 12 — Podcast "emotionally load-bearing" nuance — PRESERVED (good)

**Severity: none (positive note)**

The brief treats the podcast as deferred but real. The PRD §11 L449 explicitly flags "`[NOTE FOR PM: emotionally load-bearing — revisit if the podcast ships.]`" — this actually *strengthens* the brief's handling. No gap.

---

## GAP 13 — Addendum's specific GEO/accessibility implementation details — mostly carried; one item ("**aria-live updates batched per-message, not per-token**") is in PRD NFR-2; "do not block AI crawlers" carried in NFR-3; "brand/name present in short answers" carried. Confirmed present.

**Severity: none**

The addendum's research-derived a11y/SEO checklist (addendum L17) is faithfully expanded in PRD NFR-2/NFR-3. No gap.

---

## GAP 14 — Addendum Stage-2 semantic-zoom spec detail "**career arc → per-project dots for workflows/epics/course-corrections/retros**" — carried in FR-17 consequences. Confirmed.

**Severity: none**

PRD FR-17 L261 "A Dot reveals: workflow output, epic scope, why a correction happened, retro conclusions, and skills implemented at that stage." Matches addendum L10. No gap.

---

## GAP 15 — Brief "Architect's-Studio-**clean shell**" and "**confident and restrained**" hero copy "Seasoned, Not Stuck" — carried (FR-1). But the brief's hero label "**Seasoned, Not Stuck**" vs §5/Vision usage — consistent. Confirmed. NOTE: the brief Scope L61 also says hero = "Seasoned, Not Stuck", while elsewhere the positioning phrase appears; both docs use "Seasoned, Not Stuck" — consistent.

**Severity: none**

No gap.

---

## Summary Table

| # | Gap | Severity | Fix location |
|---|-----|----------|--------------|
| 1 | Glass Box's "the one remarkable element / day-one reason to share" not stated as a requirement | should-fix (borderline blocker) | §7.3 description (+§5) |
| 5 | "Real risk is execution & taste, not competitors" entirely dropped | should-fix | §2 or §5 |
| 3 | Practitioner→reputation→organizer causal funnel stated as two co-equal primaries | should-fix | §3.1 |
| 8 | Idea-number `#31` collision (Adaptive Soundtrack vs design pattern) | should-fix | §6 / Glossary / FR-30 |
| 10 | Long-horizon vision "repeatable pattern others adopt / canonical example" dropped | nice-to-have | §1 or §2 |
| 4 | "The strategy is honest" self-framing softened | nice-to-have | §1 |
| 6 | PRD generalizes Suno rights to "any paid AI tool" (addition vs brief) | nice-to-have (confirm) | §10 / addendum |
| 7 | Brief's umbrella "lean static fallback" now maps to two PRD terms | nice-to-have (traceability) | Glossary note |

Items checked and found faithfully carried (no action): GAP 2, 9, 11, 12, 13, 14, 15 — recorded above for completeness so the finalize reviewer can see the full sweep.
