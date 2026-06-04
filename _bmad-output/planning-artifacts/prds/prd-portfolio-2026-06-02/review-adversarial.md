# Adversarial Red-Team Review — PRD: Josh Brandt Portfolio Site

**Reviewer stance:** hostile. Assume the author is too close to the work and the upstream brief charmed the gate open. Every finding cites a location and quotes the offending phrase. No praise.

**Reviewed:** `prd.md` + `addendum.md`, both dated 2026-06-02 (status `draft`).

**Headline:** This is a beautifully written document, and that is its central risk. The prose quality buys credibility that the metrics, scope, and risk sections have not earned. The PRD has internalized its own marketing voice ("remarkable center of gravity", "the medium is the message", "proof-as-process") to the point where several success metrics are essentially unfalsifiable, the Stage-1 cut quietly depends on Stage-2/Stage-3 machinery, and the single hardest dependency on the whole project (Suno "locked-at-birth" licensing) is demoted to a parenthetical. A document this fluent should be held to a *higher* evidentiary bar, not a lower one.

---

## CRITICAL FINDINGS

### C1 — SM-1, the primary success metric, is unfalsifiable by design
**Location:** §13, SM-1.
**Quote:** *"≥ 1 speaking inquiry via Invite-Me, **or** ≥ 1 invitation where the site demonstrably played a role. Method: Invite-Me submissions (FR-31) + agent capture (FR-12) + manual attribution."*

This is the #1 primary metric and it cannot fail. The disjunction means *any* speaking invitation Josh receives over 12 months — referral, prior reputation, a hallway conversation, an existing relationship — can be retroactively logged as "the site demonstrably played a role" via "manual attribution." Josh has 30 years of track record and is already getting conference attention (READY 2026 exists); he will almost certainly get at least one invitation in a year *regardless of whether this site is ever built*. The word **"demonstrably"** is doing the opposite of its job: it sounds rigorous while licensing pure hand-wave. There is no defined evidence standard for what counts as "played a role" (referrer header? form field "how did you hear about me"? Josh's gut?). A metric whose null hypothesis ("the site did nothing") can never be observed is not a metric — it is a comfort object.

**Why critical:** the primary KPI of the entire project provides zero decision pressure. If the site is mediocre, SM-1 still passes. If it's never shared, SM-1 still passes. You cannot run a project off a target that is structurally incapable of registering failure.

**Fix:** split the channel-attributable signal from the speculative one. Make the *measurable* primary: "≥1 Invite-Me / agent-captured inquiry where the submitter indicates the site as the discovery/decision source (required form field)." Demote "invitation where the site played a role" to a soft narrative note, not a pass/fail SM. Add an explicit attribution rule (e.g., "counts only if the inquiry arrives through an instrumented site path *or* the inviter names the site unprompted").

---

### C2 — The Suno "locked-at-birth" dependency is mis-classified as one launch item among several; it is a hard, irreversible, time-sensitive blocker that SM-3 silently depends on
**Location:** §10 Launch prerequisites #2; restated as a parenthetical in FR-30 consequence ("Featured tracks are commercially licensed"); SM-3.
**Quote (§10):** *"upgrade to a paid plan and **re-generate** any featured tracks (free-tier tracks are not retroactively licensed)."*
**Quote (FR-30):** *"a fixed Scene→track mapping is the fallback for the agent-curated ideal."*

I verified the underlying fact against current (2026) sources: Suno's "locked at birth" rule is real — a track's commercial status is **fixed at generation time by account tier and cannot be retroactively upgraded** by later subscribing. The PRD gets the fact right. The problem is *placement and consequence*:

1. It is listed as bullet #2 in a flat list, peer to "enable public URL access" and "github_connected is OFF — not a blocker." Burying an irreversible, must-redo-from-scratch creative-asset dependency in a flat list understates it. If Josh has *already* generated the soundtrack on a free tier (likely — that's how people prototype), every featured track must be regenerated under a paid plan, and **regeneration is non-deterministic** — the new track will not sound identical. This is creative rework, not a checkbox.
2. The PRD's own §10 note concedes Josh holds only a **contractual license, not copyright** in fully-AI audio. Correct — but then FR-30 ships "Original Suno instrumentals" as a *branded differentiator* ("**Original** Suno instrumentals") and the Aesthetic section leans on the creative work as "evidence of a modern engineer." A differentiator you cannot stop anyone else from copying is a weak differentiator, and the PRD never reconciles "this is my original creative work, evidence of my range" with "I don't actually own it and anyone can reuse the audio."
3. **SM-3 (audience, +500 follows) cites FR-29/FR-30 as validated FRs.** So a *secondary success metric* is partially gated on a creative-licensing chore the PRD treats as a footnote. Adaptive Soundtrack is Stage 2 anyway — but if the soundtrack is a follow-driver per SM-3, and the soundtrack requires paid-tier regeneration, that cost/effort belongs in scope discussion, not a prerequisite bullet.

**Why critical:** this is the one dependency that is (a) irreversible, (b) non-deterministic to redo, (c) factually constrained by a third party's TOS, and (d) load-bearing for a success metric — and it's formatted like a chore.

**Fix:** promote the Suno regeneration to its own scoped work item with effort estimate, not a prerequisite bullet. State explicitly whether existing soundtrack assets are free-tier (if so, they are dead and must be regenerated). Decide *now* whether "original Suno instrumental" is honestly claimable given the no-copyright reality, and soften the "Original" framing if not. Sever or qualify SM-3's dependence on FR-30.

---

### C3 — Stage 1 is not actually a coherent standalone cut; it secretly imports Stage-2 vocabulary and Stage-2/3 plumbing
**Location:** §12.1; §12.3; §6 Stage-1 trimmed arc; FR-14; FR-16; FR-34.
**Quote (§12.3):** *"Stage 1 stands alone and later stages add magic without re-platforming."*
**Quote (§12.1):** *"a seeded Master Timeline"* (Stage 1) — but the Master Timeline proper (FR-17, zoomable) is Stage 2.

The PRD insists Stage 1 "stands alone," then ships a **Master Timeline that doesn't exist yet**. What Stage 1 actually ships (FR-14 + FR-16) is a *"chronological teaser"* and *"BMAD Dots harvested"* with "no manual re-entry" — i.e., the timeline data model and harvest pipeline, the single hardest unsolved technical problem in the whole PRD (it's literally Open Question #10, "how BMAD Dots are deterministically harvested from git artifacts at build time"). So Stage 1 depends on solving the deterministic-harvest problem that the PRD admits is unsolved. That is not "stands alone"; that is "Stage 1 contains the riskiest R&D and calls it a teaser."

Further coupling:
- **FR-34 (Project Import + `/bmad-correct-course`) is tagged `[S1]`** and its consequence requires the project to "appear on the Timeline (FR-16) and retrievable by the agent (FR-6)." So the Stage-1 maintenance story depends on the Stage-1 timeline harvest *and* the Stage-1 agent retrieval all working together. The "no CMS, just run a BMAD epic and it appears on the timeline" story (UJ-4) is the *climax* of the demo and it's the least-proven pipeline in the build.
- The Glossary defines **Master Timeline** as *"The single continuous, zoomable timeline"* — but Stage 1 ships a non-zoomable teaser and §12.1 still calls it "a seeded Master Timeline." Using the Glossary term for a thing that, by the Glossary's own definition, is not that thing (it's not zoomable yet). Either the teaser is the Master Timeline (then "zoomable" is wrong in the definition) or it isn't (then §12.1 shouldn't call it one).

**Why critical:** the "Stage 1 stands alone / no re-platforming" claim is the load-bearing assumption that lets the project ship by end-of-June. If the riskiest pipeline (deterministic git→Dot harvest) is in Stage 1 and is also an open question, the ship date is resting on unproven R&D while the PRD reassures the reader it's a clean standalone cut.

**Fix:** be honest that Stage 1's critical path *is* the harvest pipeline + agent grounding, and resource accordingly. Either (a) close OQ#10 with a concrete data-model decision before declaring Stage-1 scope final, or (b) downgrade FR-14/FR-16 to a hand-curated static ordered list for Stage 1 (no automated harvest), and move "deterministic harvest" to Stage 2 where it belongs. Stop calling the teaser "a seeded Master Timeline" — call it the Glass Box teaser.

---

### C4 — "All three stages at full FR depth" + a ~4-week solo Stage-1 target is over-ambition dressed as discipline
**Location:** §0; §2; §12.1; SM-4; SM-C2.
**Quote (§0):** *"all three delivery stages are specified at full FR depth"* + **Quote (§12.1):** *"targeting ~end-of-June-2026"* (PRD dated 2026-06-02 → ~4 weeks, solo builder).

Stage 1 alone is **19 FRs** (FR-1, 2, 6, 7, 8, 9, 13, 14, 16, 19, 20, 22, 23, 31, 32, 33, 34, 35, 36) for *one person* in ~4 weeks, and that set includes: a grounded RAG agent with prompt-injection resistance (FR-6/9), a build-time KB indexer, a deterministic git-artifact harvest pipeline (FR-16, unsolved per OQ#10), an SSG static-mirror with five JSON-LD schema types (FR-35), a Postgres-backed + emailed contact pipeline (FR-31, transport still TBD per OQ#5), privacy-first analytics (FR-36, tool still TBD per OQ#4), two full case studies, a Speaker Surface needing real content that doesn't exist yet (OQ#3), and the "soul-tier" Glass Box held to the highest craft bar. Each of those is individually a few days of careful work. Nineteen of them, plus *content production* (talk abstracts, bios, reel, testimonials — all flagged as not-yet-existing in OQ#3 and FR-20), in four weeks, solo, while also being the PM, is not a credible plan.

The PRD pre-emptively defends this with SM-C2 ("Don't slip the ship") and the framing "Stage = delivery sequence, not priority cut" — but a counter-metric that says "ship on time even if magic is incomplete" does **not** make 19 FRs of real engineering fit in four weeks; it just pre-writes the excuse. And the date hedge — *"~end-of-June"*, *"soft target"* — appears five-plus times, which is itself a tell: the author already knows the date is soft and is laundering that uncertainty into the metric (SM-4 then "validates" ship discipline against a target that was defined as slippable). A ship-discipline metric measured against a self-described soft, ~-prefixed target is not ship discipline.

**Why critical:** the central thesis of "Why Now" is *"a credible site that actually ships, not a perpetual WIP."* If the Stage-1 scope is unshippable in the stated window, the project becomes exactly the perpetual-WIP it defines itself against — and the PRD has armored that outcome with hedges instead of cutting scope.

**Fix:** either (a) drastically cut Stage 1 to a genuinely shippable spine (static hero + static mirror + Speaker Surface + Invite-Me + a hand-curated Glass Box, with the agent and the harvest pipeline moved to a "Stage 1.5"), or (b) drop the date pretense and give a real estimate. Pick one. The current "full depth on all three stages AND a four-week MVP AND it's only a soft target" is having it three ways.

---

## HIGH FINDINGS

### H1 — SM-2 measures Josh's intention, not the site's effect
**Location:** §13, SM-2.
**Quote:** *"Josh pitches ≥ 1 new conference — ideally a talk about the site itself."*

The pass condition is *"Josh pitches"* — an action entirely within Josh's own control that requires the site to do nothing. Josh can pitch a conference the day after launch, from a coffee shop, with the site offline. This validates motivation, not the "reputation engine." The actual effect-of-the-site signal is buried as a *"leading signal"* ("the site is shared/mentioned in the agentic-engineering community") with **no count, no baseline, no instrument** beyond "manual." So the headline KPI is self-fulfilling and the real signal is unquantified.

**Fix:** make the measurable target the *share/mention* signal with a concrete count and an instrument (e.g., "≥N inbound referrers from community channels", or "≥N unprompted public mentions logged"). "Josh pitches a talk" is an input, not an outcome.

### H2 — SM-3 (+500 follows) has no baseline and the counter-metric doesn't constrain it
**Location:** §13, SM-3 + SM-C4.
**Quote:** *"+500 net-new subscribers/follows across Josh's channels (6–12 months)."*

"+500 net-new" across *all* channels (YouTube + Suno + X/social + GitHub) with **no stated current baseline and no counterfactual**. Josh already publishes; some baseline growth happens with or without this site. Attributing net follower delta to the site requires isolating the site's contribution, and the only method offered is "channel counts + outbound-click analytics" — outbound clicks measure *clicks leaving the site*, not whether those clicks became follows, and channel counts can't separate site-driven from organic. SM-C4 ("quality of shares over volume") is presented as the guard but it doesn't actually constrain SM-3 — it just says "don't count cold traffic," which is unmeasurable without exactly the attribution SM-3 lacks. A counter-metric that can't be evaluated counter-balances nothing.

**Fix:** record the current per-channel baseline *now* (in the PRD), define "net-new" against it, and target only the *attributable* slice (outbound-click→channel landing, instrumented where possible). Or downgrade +500 to a directional aspiration and stop calling it a metric.

### H3 — The Glass Box exposes *real* repo artifacts and the PRD never audits what that leaks
**Location:** §7.3 FR-13; Glossary "BMAD Artifact"; §9 Guardrails.
**Quote (FR-13):** *"The rendered artifacts are the real repo artifacts (sourced from git at build time), not hand-written facsimiles."*

The signature "remarkable element" ships the project's *actual* `_bmad-output/` — brief, PRD, brainstorm, research, retros, stories. The PRD's safety section (§9.1) worries extensively about the *agent* (prompt injection, no live execution, no external reads) but **never once asks what the Glass Box itself might leak**. Real BMAD artifacts routinely contain: internal cost/effort estimates, candid competitive trash-talk, rejected-alternative rationale naming real people or vendors, `[ASSUMPTION]` admissions of what's faked/placeholder, retro "what went wrong" candor, and — critically — *this very PRD's own §1 line* "There is no defensible technology moat" and "the real risk is execution and taste." Shipping the literal repo means an organizer or competitor can read Josh openly stating he has no moat, plus every internal hedge. FR-13 says "curated/framed ('polished glass')" but **"curated" is asserted, not specified** — there is no FR or guardrail defining a redaction/allowlist step, no "what must never appear in the Glass Box" list. The `.decision-log.md` is explicitly excluded from the addendum but nothing says it's excluded from the Glass Box render.

The contradiction is sharp: §5 distinguishes *"process transparency (the Glass Box, honest)"* from *"narrative curation (highlight reel, not warts-and-all)"* — but the Glass Box renders the retros, and retros **are** the warts. You cannot promise an honest process view of the real artifacts *and* a no-warts highlight reel when the artifacts contain the warts. One of those promises is getting broken at render time and the PRD doesn't say which.

**Fix:** add an explicit FR + guardrail: an allowlist (not blocklist) of which artifacts/sections render in the Glass Box, a mandatory pre-publish redaction pass, and an enumerated "never render" set (decision logs, cost estimates, competitor-named rationale, unredacted assumptions). Resolve the honesty-vs-highlight-reel contradiction explicitly for the Glass Box specifically.

### H4 — "Build-time only / no live external reads" contradicts a live agent backend, and the freshness/"never-stale" promise fights the static model
**Location:** NFR-5; FR-33; §9.1; UJ-4 ("never-stale promise"); FR-6.
**Quote (FR-33):** *"with no CMS and no runtime external reads"* vs **Quote (NFR-5):** *"the only dynamic components are the agent backend and the Invite-Me endpoint."*

These are reconcilable in principle (the agent reads a *build-time* index, not live external sources) but the PRD asserts the harmony without addressing the seam: the agent is a *live* service answering in real time (FR-6 streaming, NFR-4 latency) yet may only speak from a **build-time-frozen** KB index. So between deploys, the "living, never-stale" site (UJ-4 resolution: *"the living-artifact vision and never-stale promise"*) is in fact **frozen** until the next build. A visitor who asks the agent about a project Josh shipped yesterday gets "I don't have that documented" (FR-6's canned response) until a rebuild. "Never-stale" is contradicted by "build-time index only." The site is exactly as stale as the gap between deploys, which for a solo builder could be weeks.

**Fix:** drop or qualify "never-stale" — it's "fresh-as-of-last-build," which is fine, but say so. Reconcile the agent's real-time persona with its build-time knowledge horizon explicitly (e.g., agent states its knowledge cutoff = last build date).

### H5 — Accessibility (WCAG 2.1 AA) vs the cinematic "wow" is asserted as harmonious but the hardest cases are dodged
**Location:** NFR-2; FR-3; FR-5; §5.
**Quote (NFR-2):** *"`prefers-reduced-motion` gated at two layers ... do not init GSAP/ScrollTrigger/WebGL; show static hero."*

The reduced-motion handling is genuinely well-specified — but it only covers the *binary* case (motion on vs off). The genuinely hard accessibility problems for a "directed camera path" cinematic canvas are unaddressed: (1) **the Depth Dial (FR-5)** — a novel custom control with three semantic levels; there is zero spec for its ARIA semantics, keyboard model, or how a screen-reader user perceives "depth"; (2) **agent-driven Scene reordering (FR-4/FR-10)** that changes content *in place* — for a screen-reader user, content silently rearranging based on a chat is a focus-management and announcement nightmare, and NFR-2 only addresses the chat *widget*, not the canvas reordering underneath it; (3) **`aria-hidden` WebGL "with DOM equivalents"** is asserted but no FR requires the DOM-equivalent to actually carry the same information the visual set-piece conveys. The PRD lists *"accessibility vs cinematic tension"* nowhere as a risk; it assumes the reduced-motion switch resolves it. It resolves motion, not cognitive/semantic access to a reorderable, depth-dialed, agent-curated canvas.

**Fix:** add accessibility acceptance criteria for the *novel* controls (Depth Dial, in-place reordering) — not just "reduced motion shows static hero." Require that DOM equivalents carry equivalent *information*, not just exist. Name the cinematic-vs-AA tension as an explicit risk.

### H6 — The "honest about the moat" framing is strategic self-soothing, not strategy
**Location:** §1.
**Quote:** *"There is no defensible technology moat; the advantage is authenticity + novelty + a real track record ... so the real risk is execution and taste, not competitors."*

This reads as admirable candor but functions as risk-denial. "The real risk is execution and taste, not competitors" is a *convenient* conclusion because execution-and-taste is the thing the author is confident about, and it waves away the actual competitive threat: **novelty is the most perishable moat there is.** The PRD's own §2 says scroll-driven 3D camera sites and agent-as-guide are *already* "recognized 2026 trends, not fringe." If it's already a recognized trend, the "novelty" advantage is depreciating *now*, fastest of all the listed advantages, and by the time a solo builder ships all three stages it may be table stakes. "Authenticity + a real track record" are durable; "novelty" is not — and the PRD bundles them as if equally defensible. Declaring "the real risk is not competitors" is precisely what someone close to the work tells themselves to avoid pricing in the depreciation of their cleverest idea.

**Fix:** separate the durable advantages (track record, authenticity, the *public-build-history* which genuinely can't be retrofitted) from the perishable one (cinematic/agent novelty). Acknowledge novelty decay as a real risk with a clock on it, and tie it to the ship-date urgency honestly ("ship before the novelty is table stakes") rather than dismissing competitors wholesale.

---

## MEDIUM FINDINGS

### M1 — "Not a lead-gen funnel" is contradicted by the actual conversion machinery
**Location:** §1; §3.2; §11; FR-31; FR-32; FR-12.
**Quote (§11):** *"Not a cold-traffic lead-gen funnel — success is qualified peer shares + organizer conversions, not raw volume."*

The site has: a Close Scene with "convert" CTAs (FR-32), a persisted-+-emailed inquiry capture (FR-31), an *agent that books speaking inquiries* (FR-12), funnel analytics measuring "the Invite-Me conversion" (FR-36), and §3.1 literally labels the organizer **"the converter"** and the path a "guaranteed fast-credible path ... served by a guaranteed fast-credible path" to conversion. That **is** a lead-gen funnel — a *qualified, warm* one, but a funnel. The repeated insistence that it's "explicitly not" one is the author drawing a moral distinction the architecture doesn't honor. The honest statement is "this is a qualified-conversion funnel, not a cold-traffic-volume funnel" — but the PRD keeps saying "not a funnel," which will mislead downstream UX/architecture into under-building the very conversion path SM-1 depends on.

**Fix:** restate as "a qualified-conversion surface, optimized for warm/referred traffic, not cold-traffic volume." Stop denying it's a funnel; specify what *kind*.

### M2 — Vanity/hand-wavy language masquerading as requirements
**Location:** multiple FRs and the Aesthetic section.
**Quotes:** Glossary/FR-13 *"Polished glass, not raw guts"*; §5 *"the Advocate Agent and Proof-as-Process are the soul ... cinematic polish and content are the body ... maintainability is the skeleton"*; UJ climaxes *"a recursive 'whoa'"*, *"a genuinely enjoyable moment"*, *"the realization ... proof-as-process, hard to fake."*

These are evocative and *unbuildable as written*. "Polished glass, not raw guts" appears as the entire acceptance bar for the curation quality of the signature feature — it is not testable; "polished" is in the eye of the author. "Soul / body / skeleton" is a nice mnemonic but downstream `bmad-ux`/architecture cannot derive a single acceptance criterion from "protect the soul first." The UJ "climax" beats ("whoa", "genuinely enjoyable") are emotional targets with no instrument. The PRD *labels* its consequences "(testable)" — and several aren't: FR-13's "curated/framed ('polished glass') — it is not a raw, unframed file dump" tests a negative against an undefined positive. To the PRD's partial credit it does carry real testable consequences elsewhere (FCP budgets, JSON-LD passes Rich Results, 100% static reachability) — which makes the soft ones stand out more, not less.

**Fix:** for every "(testable)" label, ensure at least one consequence is mechanically checkable. Replace "polished glass" as an acceptance bar with concrete curation rules (max length per artifact view, required framing/intro per artifact, redaction list per H3). Move emotional targets ("whoa") to the Vision/narrative, out of the FR consequence slots.

### M3 — Counter-metric SM-C1 collides with the IA's deliberate Speaker-Surface placement
**Location:** §6 Default Scene Arc; SM-C1; §3.1.
**Quote (§6):** *"the Master Timeline is the showpiece one click in, not the literal front door"* and the arc places **Hero → Thesis → Master Timeline → Speaker Surface** — i.e., the organizer must pass the Thesis and the Master Timeline showpiece to reach Speaker Surface in the *default* arc, yet **SM-C1** demands *"time-to-Speaker-Surface ... must not regress"* and §3.1 promises the organizer a *"guaranteed fast path."* In the default Scene Arc, Speaker Surface is the **4th** scene. The deep-link escape (FR-2: "reachable directly via a stable URL") only helps organizers who *arrive on a deep link* (UJ-2's edge case), not the ones who land on the hero — and §3.1's whole point is the organizer who "heard Josh's name" and Googles him, landing on home. For that organizer the "guaranteed fast path" is four scenes deep behind the practitioner-tuned showpiece. The PRD asserts both "default experience is tuned for the practitioner" (§3.1) and "guaranteed fast path for the organizer" — those fight unless the hero itself carries a one-tap Speaker jump, which no FR requires (FR-1 only requires "an Invite-Me-or-explore choice," not a Speaker-Surface jump).

**Fix:** require (in FR-1) a persistent, above-the-fold "For organizers → Speaker Surface" affordance on the hero, independent of the Scene Arc order, so the organizer's "guaranteed fast path" doesn't depend on a deep link. Otherwise SM-C1 is unsatisfiable for home-landing organizers.

### M4 — FR-9 prompt-injection consequence is a single spot-test, not a requirement
**Location:** FR-9.
**Quote:** *"does not succeed (spot-tested against a standard injection set)."*

"Spot-tested against a standard injection set" is the *entire* acceptance criterion for the security boundary of a public LLM endpoint. Which set? Pass threshold (100%? best-effort?)? Prompt injection is not solved by a one-time spot check — new injections appear constantly, and "a standard injection set" passing once tells you nothing about the long tail. The PRD elsewhere (NFR-7) commits to logging retrieval misses but there is **no** commitment to logging or monitoring injection attempts in production. So the boundary is tested once at build and never watched again.

**Fix:** specify the injection set (name it), the pass bar (e.g., 100% of the named set blocked), *and* a production monitoring/logging requirement for attempted overrides. "Spot-tested" is not an acceptance criterion for a security control.

### M5 — The agent's "I don't have that documented" failure mode is under-specified and collides with the "confident advocate" persona
**Location:** FR-6; §5; SM-C3.
**Quote (FR-6):** *"the agent returns a canned 'I don't have that documented' response and does not call the model."*

The threshold that triggers this ("retrieval score below threshold or context empty") is undefined, and the failure mode is brittle in exactly the demo scenario the PRD is built around. UJ-1's hero question is *"is this site actually built with BMAD?"* — if the KB chunking/BM25 retrieval (FR-6: "BM25-first; top-k 3–6") misses on phrasing, the *signature* first interaction returns "I don't have that documented" about the site's entire premise. A keyword-first retriever (no vectors until "logged retrieval misses justify it," per §10) is *especially* prone to vocabulary-mismatch misses. The "confident advocate" persona (§5: "like a sharp recruiter who knows the work cold") faceplanting into "I don't have that documented" on the core pitch is a worse first impression than no agent at all. The PRD treats the canned fallback as a safety win (it is, for hallucination) but never weighs it as a *demo-failure* risk, and SM-C3 ("zero ungrounded claims") actively *increases* the pressure toward over-triggering the canned response. There is tension between SM-C3 (never over-claim → fail closed) and the entire reason-for-being (a confident advocate that sells) and the PRD resolves it only by asserting both.

**Fix:** require the Stage-1 KB to be hand-validated against a fixed list of "must-answer" questions (starting with "is this built with BMAD?") with a passing retrieval guarantee, before launch. Consider vectors in Stage 1 *specifically* for the core-pitch questions rather than deferring all vector work. Acknowledge the fail-closed vs confident-advocate tension as a real design risk.

### M6 — "Public URL access is OFF" is a launch blocker filed as a checkbox, with no owner-action confirmation
**Location:** §10 Launch prerequisites #1.
**Quote:** *"`public_url_enabled` is currently OFF; nothing routes publicly until it is enabled."*

The single hard gate between "built" and "live" — and SM-4's entire ship-discipline metric — is a UI toggle the PRD notes is currently off and never assigns/verifies. It's correctly identified but, like the Suno item, flattened into a list. For a project whose thesis is *"a credible site that actually ships,"* the literal on/off switch being currently-off and unowned is worth more than one bullet.

**Fix:** trivial, but: confirm Josh can/will flip it, and gate the SM-4 ship definition on it explicitly ("live" = public_url_enabled AND deployed AND reachable at the hostname).

---

## LOW FINDINGS

### L1 — Duplicated phrase betrays a fold/reconciliation seam
**Location:** §3.1.
**Quote:** *"a guaranteed fast-credible path. ... served by a guaranteed fast-credible path."* — the phrase "guaranteed fast-credible path" appears twice in adjacent bullets describing the organizer. Cosmetic, but it's a tell that the reconciliation pass copy-merged rather than edited, and it's exactly the kind of seam to check for elsewhere (see M3, where the same over-promised phrase creates a real contradiction).

### L2 — "137 models" vs "137 models incl..." vs "exposes 137 models" — false precision, and it'll rot
**Location:** §10 LLM; §10 prerequisite text references "137 models."
**Quote:** *"exposes 137 models incl. `claude-opus-4-8` ..."* A hard count of available models is (a) irrelevant to the PRD (the agent needs *one* mid-tier model) and (b) guaranteed to be wrong next month. Precision theater. Cut to "many models including a mid-tier class suitable for the agent."

### L3 — `[ASSUMPTION]` overload dilutes the ones that matter
**Location:** throughout; §15 index.
There are ~17 indexed assumptions and many inline. Several are trivial (protagonist names) and a few are load-bearing (mid-tier model choice gates NFR-4 latency/cost; email transport gates FR-31; the Stage-1-is-discrete-Scenes assumption underpins the whole ship plan). Burying the load-bearing assumptions in a flat list with the cosmetic ones (names) understates which ones can sink the ship. Mark assumptions by blast radius, not just list them.

### L4 — SM-4 "validates" itself
**Location:** §13 SM-4.
**Quote:** *"Method: deploy date of the §12.1 FR set."* SM-4 measures whether the §12.1 set shipped by checking the deploy date of the §12.1 set. It's tautological-but-fine as a milestone, but it's not a *success metric* in the outcome sense — it's a project-management checkpoint mislabeled as an SM, which inflates the apparent rigor of the metrics section (4 SMs + 4 counter-metrics looks robust; really it's ~2 attempted outcome metrics, both compromised per C1/H1).

### L5 — "no re-platforming" is an architecture promise the PRD can't make
**Location:** §12.3.
**Quote:** *"later stages add magic without re-platforming."* The PRD itself (§14 OQ#1) leaves "Astro vs Next" *open* and tags the Continuous Canvas/WebGL set-piece as not-yet-decided. Promising "no re-platforming" before the platform is chosen, and before it's known whether the Stage-2 Continuous Canvas can sit on the Stage-1 sectioned shell, is writing a guarantee the architecture phase hasn't earned. This belongs as a *goal* ("architect Stage 1 so Stage 2 doesn't force a re-platform"), not a stated property.

---

## Things the reconciliation/fold pass papered over (cross-cut)

1. **The honesty-vs-highlight-reel split (§5) is asserted as "kept distinct" but the Glass Box renders the warts (retros) — the two promises overlap at render time and nobody decided which wins.** (See H3.) The fold pass kept both nice sentences and never noticed they touch.
2. **"Stands alone / no re-platforming / soft target / full depth on all three stages"** — four reassurances that are individually soothing and jointly incompatible for a solo four-week build. (See C3, C4, L5.) The reconciliation smoothed the tone; it didn't reconcile the math.
3. **The metrics section reads as 8 measures (4 SM + 4 counter) but is really ~2 compromised outcome metrics, 1 self-fulfilling, 1 milestone-mislabeled, and 4 counter-metrics that mostly can't be evaluated.** (C1, H1, H2, L4, and SM-C4's unmeasurability.) The *appearance* of measurement discipline exceeds the substance — the most dangerous kind of polish in a PRD whose own thesis is "proof, not claims."

---

## Severity tally

| Severity | Count | IDs |
|---|---|---|
| Critical | 4 | C1, C2, C3, C4 |
| High | 6 | H1, H2, H3, H4, H5, H6 |
| Medium | 6 | M1, M2, M3, M4, M5, M6 |
| Low | 5 | L1, L2, L3, L4, L5 |

**The single sharpest problem:** the metrics section *performs* rigor (8 measures, cross-referenced FRs, counter-metrics) while its primary KPI (SM-1) is structurally incapable of registering failure and its second (SM-2) measures Josh's own intention. A PRD whose entire thesis is "prove it, don't claim it" cannot validate itself with metrics that can't fail. Fix the metrics first; they are the part most likely to let a mediocre execution declare victory.
