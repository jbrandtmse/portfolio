---
title: "Research Reconciliation — PRD vs Pre-Brief Research"
date: 2026-06-03
status: finalize-pass
source: _bmad-output/research/portfolio-pre-brief-research-2026-06-02.md
target: _bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md
purpose: Find research findings the PRD DROPPED, weakened, garbled, or mis-stated before finalization.
---

# Research → PRD Reconciliation

**Scope of this pass:** what the PRD *fails to carry* from `portfolio-pre-brief-research-2026-06-02.md`, not what it covers well. The PRD adopts the architecture/technical body of the research with high fidelity (see "Faithfully carried" at the end). The material gaps cluster in three places: (1) the **speaker-conversion playbook**, where several concrete checklist items are dropped from the Speaker-Surface FRs; (2) the **competitive/anti-reference scan**, where a few tone/differentiation insights didn't land; and (3) two **Suno licensing nuances**.

Severity legend: **blocker** (silently drops a launch-critical or #1-goal item) · **should-fix** (named, concrete research item dropped/weakened; cheap to add) · **nice-to-have** (enrichment, low risk if omitted).

---

## A. Speaker-Surface playbook gaps (Topic 3 — the #1 goal)

The research's "High-converting speaker surface should contain:" list (research line 43) is the single most prescriptive, goal-critical checklist in the document, because the **#1 goal is speaking invites**. The PRD's FR-19 / FR-20 / FR-21 carry the bio lengths (50 / 100-150w), abstract length (150-200w), takeaway count (3-5), signature-talk count (3-5), reel length (60-120s), full-talk count (2-3), social proof, and EPK well. But it **drops or weakens five concrete items** from that same sentence and the surrounding paragraph.

### A1. Logistics block (travel, formats, durations, tech) — DROPPED
- **should-fix.**
- **Research (line 43):** "…**logistics (travel, formats, tech)**…" and (line 43) signature talks should carry "**formats/durations**."
- **PRD:** `grep` for `logistic|travel|duration|formats|tech` across the whole PRD returns nothing in any Speaker FR. FR-19 lists "benefit-led title, audience level, a 150–200-word abstract, and 3–5 takeaways" — **formats/durations are missing**, and there is no logistics surface at all.
- **Why it matters:** Program committees explicitly weigh "reliability/low-hassle" (research line 41); logistics (will-travel, virtual/in-person, session formats/durations, A/V needs) is precisely the low-hassle signal. An organizer in UJ-2 deciding to invite needs it.
- **Suggested fix:** Add to FR-19 consequences: "Each signature talk states its **formats and durations**." Add a new consequence or short FR: "The Speaker Surface states **speaking logistics** (travel willingness, in-person/virtual, available formats, basic A/V needs)." `[S1]`.

### A2. Audience metrics / audience draw — DROPPED from the Speaker Surface
- **should-fix.**
- **Research:** speaker surface should contain "**audience metrics**" (line 43); and committees weigh "**audience draw** (subs/views/list size + willingness to promote)" (line 41).
- **PRD:** SM-3 tracks +500 subs as a *success metric*, and FR-36 measures outbound clicks — but **no FR puts audience metrics on the Speaker Surface as displayed proof**. FR-19/FR-20 social proof is limited to "logos, organizer/attendee testimonials, ratings." The "audience draw / willingness to promote" angle is absent.
- **Why it matters:** "Audience draw" is a named committee decision factor; showing subs/views/list size on the speaker page is a conversion lever for SM-1, distinct from measuring it for SM-3.
- **Suggested fix:** Add to FR-20 consequences: "The Speaker Surface displays **audience metrics** (e.g. subscriber/view counts, list size) where available, as audience-draw proof." Flag as `[ASSUMPTION: real numbers pending content inventory]`.

### A3. Headshot above the fold — DROPPED
- **should-fix.**
- **Research (line 43):** "**headshot** + one-line positioning + 'Invite me to speak' CTA **above the fold**."
- **PRD:** FR-1 says the hero conveys "identity (name, one-line positioning) and an Invite-Me-or-explore choice above the fold." `grep` for `headshot|photo|portrait` returns **nothing** anywhere in the PRD. Name + positioning + CTA are there; the **headshot is silently missing**.
- **Why it matters:** For a personal speaker brand, the face is a credibility/recognition cue the research calls out explicitly as an above-the-fold element. Easy to drop, meaningful to organizers.
- **Suggested fix:** Add "headshot/portrait" to the FR-1 above-the-fold identity consequence (and/or FR-19's Speaker Surface).

### A4. Talk-title & content quality guidance (outcome-oriented, war stories, real numbers) — UNDER-REPRESENTED
- **should-fix.**
- **Research (line 41):** committees weigh "**specific, outcome-oriented titles** ('From 1 to 50 Teams: Evolving Architecture Without a Rewrite' beats 'Modern Architecture')"; "**educational value & originality** (war stories, real numbers)"; "credibility framed specifically (not '30 years' alone, but 'led X used by Y')."
- **PRD:** FR-19 requires a "benefit-led title" — a partial echo — but the stronger, testable bar from the research ("**outcome-oriented**, specific, with real numbers; war stories") is not carried, and the **"don't say 30 years alone — say led-X-used-by-Y"** framing is dropped entirely. (Vision §1 and §2 lean on "30 years" repeatedly without the research's caution to frame it *specifically*.)
- **Why it matters:** This is direct guidance on the *content quality* of the very talk abstracts that drive SM-1. "Benefit-led" is softer than "outcome-oriented with real numbers."
- **Suggested fix:** Strengthen FR-19: titles are "**outcome-oriented and specific** (concrete result/number, not generic)"; abstracts should foreground "war stories / real numbers." Add a content-tone note that credibility is framed specifically ("led X used by Y") rather than tenure alone.

### A5. "Stated response time" garbled to "stated response expectation" — MINOR WEAKENING
- **nice-to-have.**
- **Research (line 43):** frictionless booking = "short form or Calendly, **stated response time**."
- **PRD:** consistently says "stated response **expectation**" (FR-31, FR-12, UJ-2). "Expectation" is vaguer than the research's "response **time**" (i.e. an actual SLA like "I reply within 3 business days").
- **Suggested fix:** Change "stated response expectation" → "**stated response time** (e.g. 'I reply within N business days')" in FR-31 so it's testable as a concrete time, not a mood.

*(Note: Calendly as a booking option IS reflected via FR-12's `[ASSUMPTION: propose/booking times]`, and "short form" is reflected in FR-31's "short, accessible contact form." Those are fine.)*

---

## B. Competitive / anti-reference insights that didn't land (Topic 2)

The PRD's §5 Aesthetic & Tone carries the **clichés-to-avoid** list almost verbatim (hacker/Matrix, floating brains, gimmick fonts, neon overload, scroll-jacking, AI-slop, human-curation-as-differentiator) — that is well done. But several **positive** principles from Topic 2 are dropped or under-stated.

### B1. The Codrops anti-reference's exact mechanism (low-pass/muffle on sub-scene entry) — DROPPED as validation
- **nice-to-have.**
- **Research (line 29):** the clearest reference is Codrops' "Building a Scroll-Driven 3D World," which has "audio that **muffles via low-pass filter when entering a sub-scene** (validates our auto-ducking soundtrack #29)."
- **PRD:** FR-30 ducks "when a video plays," which is correct but narrower than the research's mechanism: muffle/low-pass **on sub-scene entry**, not only under video. The "low-pass filter" technique and the Codrops citation are absent.
- **Suggested fix:** Broaden FR-30 to "ducks/low-pass-muffles under video **and on entering a sub-scene/Scene transition**," and cite the Codrops pattern as the reference in §5.

### B2. "4-6 scenes max / 3-6 deep case studies / trailer-not-resume" numeric discipline — UNDER-REPRESENTED
- **should-fix.**
- **Research (line 32):** "**4-6 scenes max**; **3-6 deep case studies** over many shallow ones"; "'**Trailer for my career**,' not 'resume with sections.'"
- **PRD:** §6 Default Scene Arc lists **9 scenes** (Hero → Thesis → Master Timeline → Speaker Surface → Flagship → Wings → Creative Lab → Glass Box → Close) with no stated cap; the Stage-1 trimmed arc is 6, which is fine. The research's explicit "4-6 max" ceiling and the "trailer not resume" framing are not stated as a constraint. (The "not a static CV/résumé" non-goal is present, which partially covers the spirit.)
- **Why it matters:** The research is warning against scene sprawl; the full-vision arc already exceeds the recommended max. Worth flagging so UX doesn't treat 9 as a target.
- **Suggested fix:** Add a §6 note: "**Scene budget: 4-6 focused scenes per cut** (research); the full-vision arc is a superset the Advocate Agent/Depth Dial collapses — it is not all shown at once." Reaffirm "trailer, not resume."

### B3. "WebGL in focused doses — one wow moment" + "editorial typography (1 display + 1-2 text styles), massive type for hero" — PARTIALLY CARRIED
- **nice-to-have.**
- **Research (lines 33-34):** "**WebGL in focused doses** — one hero 'wow' moment, not constant spectacle"; "**Editorial typography + restraint** (1 display + 1-2 text styles); **massive type for hero statements**."
- **PRD:** "at most one fixed WebGL canvas" (NFR-1) and "≈1 display + 1-2 text styles" (§5) ARE carried — good. The only dropped specifics are the **"massive type for hero statements"** instruction (a concrete UX cue, absent) and the explicit framing of the single WebGL piece as the *one* "wow moment" (the PRD frames it as merely "optional set-piece," losing the "this is the sanctioned wow" intent).
- **Suggested fix:** Add "massive display type for hero statements" to §5; note the single WebGL set-piece is the **one sanctioned 'wow' moment** (ties to §5's "the wow builds" line).

### B4. Veteran-IC vantage as a *pitchable differentiator* + "Patterns That Survive Hype Cycles: CORBA→Kubernetes" — DROPPED
- **should-fix.**
- **Research (line 41):** "**diverse perspective** (the **veteran-IC vantage is itself a pitchable angle**)"; (line 45) "Use the 30-year arc as a differentiator: *'Patterns That Survive Hype Cycles: from CORBA to Kubernetes.'*"
- **PRD:** `grep` for `veteran|diverse perspective|IC vantage|CORBA|Kubernetes|hype cycle` returns **nothing**. The PRD uses "30 years" as raw credibility but never frames the **veteran-IC angle as a differentiating talk-pitch positioning**, and the concrete example talk title (a ready-made signature-talk seed) is lost.
- **Why it matters:** This is positioning guidance for the #1 goal and a literal content seed for FR-19's signature talks. It also informs the site's differentiation thesis (§1's "authenticity + novelty + real track record" could name the veteran-IC angle explicitly).
- **Suggested fix:** Add to §1 (or FR-19 content note): "The **veteran-IC vantage** (deep track record *and* current agentic practice) is a first-class pitchable angle; e.g. a signature talk seed 'Patterns That Survive Hype Cycles: CORBA→Kubernetes.'" Surface in Open Questions/content inventory as a candidate talk.

### B5. "AI personalization / 'what are you here for?' early prompt → reorder content" — MECHANISM UNDER-STATED
- **nice-to-have.**
- **Research (line 36):** "**AI personalization / 'what are you here for?' early prompt** → reorder content. Validates Depth Dial (#23) + Agent-Adaptive (#20)."
- **PRD:** FR-10 (agent re-curation) and FR-5 (Depth Dial) cover the *capability*, but the specific **"ask 'what are you here for?' early, then reorder"** UX pattern — an explicit on-ramp behaviour — isn't named. Both are `[S2]`, so this is low-stakes, but the concrete early-prompt mechanic is a useful UX cue that's currently implicit.
- **Suggested fix:** Note in FR-10 (or §6 fast on-ramp) that the agent may open with a light "**what brings you here?**" prompt to drive re-curation.

---

## C. Suno / licensing nuances (Topic 1 / Action Item #1)

The PRD carries the **core** Suno prerequisite well (§10 launch prereq #2, FR-30, Guardrail §9.2, Open Q #6): commercial rights attach at generation time; upgrade + **re-generate**; free-tier not retroactively licensed; "made while subscribed" check applies to any paid AI tool. Two nuances from research line 15 are dropped:

### C1. "Fully AI-generated audio may have limited U.S. statutory copyright; 'ownership' = the contractual license Suno grants" — DROPPED
- **should-fix.**
- **Research (line 15):** "(Note: fully AI-generated audio may have **limited U.S. statutory copyright**; '**ownership**' = the **contractual license Suno grants**.)"
- **PRD:** `grep` for `copyright|statutory|license` shows §10/§9.2 speak only of "commercial rights" / "commercially licensed," never the caveat that there may be **no exclusive statutory copyright** in fully-AI audio — i.e. what Josh holds is a *contractual license*, not ownership, and others may not be barred from copying AI output. This matters if the site ever implies the tracks are exclusively "owned."
- **Why it matters:** Sets correct expectations for any "original music, ©" framing and for how the Glass Box / Creative Lab describe the tracks. Avoids a false ownership claim on the very site whose thesis is honesty/proof.
- **Suggested fix:** Add to §9.2 or §10 prereq #2: "Note: fully-AI audio may carry **limited U.S. statutory copyright**; what Josh holds is the **contractual license** Suno grants (commercial-use rights), not exclusive ownership — phrase any music-credit copy accordingly."

### C2. "Suno takes 0% revenue share on paid-plan commercial use" — DROPPED
- **nice-to-have.**
- **Research (line 15):** "Suno takes **0% revenue share** on paid-plan commercial use."
- **PRD:** absent. Minor (it's reassurance, not a constraint), but it's a concrete fact that closes a "what does Suno take?" question for the cost/§9.3 picture.
- **Suggested fix:** One clause in §9.3 or the Suno prereq: "(Suno takes 0% revenue share on paid-plan commercial use.)" Optional.

---

## D. Minor / precision items

### D1. "137 models" stated as fact vs research's "137 models" — OK, but model-list framing
- **nice-to-have / no action.** PRD §10 correctly says "137 models" and names the same models as research line 22. Fine. (Listed only to confirm it was checked — no gap.)

### D2. Image/audio models "could assist content generation" — DROPPED (intentional, fine)
- **nice-to-have.** Research line 22 notes the local image/audio/video models "could even assist content generation." PRD doesn't mention this. Reasonable omission (it's a build-process aid, not a product requirement) — list for completeness only; no fix needed unless Josh wants it as a maintenance note.

### D3. RAG "latency dominated by the LLM call anyway" rationale — DROPPED (fine)
- **nice-to-have.** Research line 71 justifies BM25-first partly because "latency is dominated by the LLM call anyway." PRD adopts BM25-first (FR-6, §10) but drops the rationale. The decision is carried; the reasoning isn't. Optional to add as a one-line justification in §10's RAG-index note. No material loss.

---

## Faithfully carried (NOT gaps — do not re-raise)

For the finalizer's confidence, these research items are carried with high fidelity and should **not** be flagged:

- **Perf budgets** (FCP < ~2s mid-mobile; main-page JS < ~200-250KB gz; one fixed WebGL canvas; lazy-load `client:visible`/`client:idle`; KTX2/Basis/Draco) → NFR-1 / §10. ✔
- **Accessibility ARIA patterns** (`role="dialog"`, `role="log"`, `aria-live="polite"` batched **per-message not per-token**, focus management, real `<button>`s, canvas `aria-hidden` with DOM equivalents, two-layer reduced-motion gate) → NFR-2. ✔ (Exemplary — even the per-message batching nuance survived.)
- **Lenis caveat** (avoid or gate behind reduced-motion) → NFR-2 and §10. ✔
- **"Do not block AI crawlers"** → NFR-3. ✔
- **JSON-LD schema names** (`Person` + `ProfilePage`, `Event`, `VideoObject`, `CreativeWork`, `FAQPage`) → FR-35 / NFR-3, with Rich Results Test validation. ✔ (Complete and exact.)
- **"If it matters for SEO/AI it must be in initial HTML" + agent=router-not-silo + `view-source` validation** → NFR-3 / FR-7. ✔
- **GEO specifics** (answer-first intros, heading hierarchy, Q&A blocks, plain-text key facts, brand in short answers) → NFR-3. ✔
- **RAG design** (curated MD source of truth; build-time indexer; **chunk at heading boundaries 300-800 tokens**; BM25-first; **top-k 3-6**; vectors only if logged misses justify; `sqlite-vec`/LanceDB/pgvector; score-threshold → canned answer skipping the model call; citation-required; strict context separation vs prompt injection; server-side persona never exposed; mid-tier model; streaming; single small backend behind nginx) → FR-6/FR-7/FR-8/FR-9, NFR-4/NFR-5, §10, Guardrail §9.1. ✔ (Thoroughly carried — chunk size, top-k, and the skip-the-model-call optimization all survived.)
- **`public_url_enabled` = OFF launch blocker** → §10 prereq #1. ✔
- **`github_connected` = OFF, not a blocker (no live GitHub reads)** → §10 prereq #3 / FR-23 / FR-33. ✔
- **Suno core: regenerate-while-subscribed; free-tier not retroactive; "made while subscribed" applies to any paid AI tool** → §10 prereq #2. ✔ (Only the statutory-copyright + 0%-revenue nuances dropped — see C1/C2.)
- **Astro SSG + React islands; CSS scroll-driven baseline (~80%); GSAP+ScrollTrigger cinematic; one optional R3F set-piece w/ static fallback** → §10 / NFR-1. ✔
- **Clichés-to-avoid list** (hacker/Matrix, floating brains/robots/neural stock, gimmick fonts, neon overload, scroll-jacking w/o skip, AI-slop, human-curation-as-differentiator) → §5 Anti-references. ✔ (Near-verbatim.)
- **Agent-as-guide is an on-trend 2026 pattern, not fringe** → §2 Why Now. ✔

---

## Summary of material gaps (most important first)

| # | Severity | Gap | Fix |
|---|----------|-----|-----|
| A1 | should-fix | Speaker logistics (travel, formats, durations, tech) dropped from FR-19/20 | Add formats/durations + logistics consequence to Speaker Surface `[S1]` |
| A2 | should-fix | Audience metrics / "audience draw" not shown on Speaker Surface | Add displayed audience-metrics consequence to FR-20 |
| B4 | should-fix | Veteran-IC "pitchable angle" + "CORBA→Kubernetes" talk seed dropped | Add veteran-IC differentiator + talk seed to §1/FR-19 |
| A4 | should-fix | Talk titles "outcome-oriented + real numbers/war stories" and "frame credibility specifically not '30 yrs'" weakened to "benefit-led" | Strengthen FR-19 title/abstract bar + tone note |
| A3 | should-fix | Headshot above-the-fold silently missing | Add headshot to FR-1/FR-19 above-fold identity |
| C1 | should-fix | Suno statutory-copyright caveat / "license not ownership" dropped | Add copyright caveat to §9.2/§10 |
| B2 | should-fix | "4-6 scenes max / trailer-not-resume" cap not stated (full arc = 9) | Add scene-budget note to §6 |
| B1 | nice-to-have | Soundtrack low-pass-muffle on sub-scene entry narrowed to "under video" | Broaden FR-30 + cite Codrops |
| A5 | nice-to-have | "stated response time" softened to "response expectation" | Make it a concrete time/SLA |
| B3 | nice-to-have | "Massive type for hero" + "one sanctioned wow" cues dropped | Add to §5 |
| B5 | nice-to-have | "'what are you here for?' early prompt" mechanic implicit | Name it in FR-10/§6 |
| C2 | nice-to-have | "Suno 0% revenue share" fact dropped | One clause in §9.3 |

No **blocker**-level omissions: every launch-critical research item (public_url, Suno-regenerate core, SEO/static-mirror, accessibility, RAG guardrails, perf budgets) is carried. The dropped items are concentrated in the speaker-conversion playbook and competitive-tone insights — important for the #1 goal but additive, not corrective.
