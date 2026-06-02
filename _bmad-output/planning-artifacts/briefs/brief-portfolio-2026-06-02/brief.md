---
title: "Product Brief: Josh Brandt Portfolio Site"
status: final
created: 2026-06-02
updated: 2026-06-02
---

# Product Brief: Josh Brandt Portfolio Site

_(Draft skeleton — being filled in collaboratively. Source material: brainstorming-session-2026-06-02-1723.md (47 ideas) and portfolio-pre-brief-research-2026-06-02.md.)_

## Executive Summary

`joshuabrandt.abacusai.cloud` is a personal portfolio that doesn't just describe Josh Brandt's work — it *demonstrates* it. Josh is a software engineer with 30 years of shipping experience who has gone deep on agentic engineering, but that work is scattered and invisible across GitHub, conference talks, YouTube, and Suno. This site is the **remarkable center of gravity** that makes the substance undeniable and shareable: a clean, confident experience navigated by a grounded "advocate" agent, built and maintained *as a public BMAD project* so the site itself is Exhibit A.

The strategy is honest. The site's job is to be a craft artifact remarkable enough that practitioners **share** it (building reputation) and a credible hub that **converts** that attention into speaking invitations and audience — explicitly *not* a cold-traffic lead-gen funnel. Success looks like a speaking inquiry the site influenced, a conference talk pitched *about* the site, +500 net-new followers, and above all a credible site that actually **ships**.

Delivery is staged: a credible hub (hero, speaker reel, two flagship projects, content links, a basic advocate agent, and a real Glass Box proving the site builds itself) ships first on a self-imposed **~end-of-June 2026** target; the cinematic timeline, adaptive soundtrack, and full agent-orchestration follow. It all runs on Josh's Abacus VM, static-built from one curated git repo, extended by running BMAD on itself. **Why now:** agentic engineering is the differentiator of the moment, Josh is doing standout work in it, and the most convincing way to prove that is to build the proof in public.

## The Problem

Josh has 30 years of shipping software and is now doing distinctive agentic-engineering work — live-on-stage BMAD demos, MCP infrastructure, a deep portfolio of projects, plus creative output (Suno, generative art, games). But that work is **scattered and invisible**: spread across GitHub repos, ephemeral talks, YouTube, and Suno with no center of gravity. Nothing proves, at a glance, that he's a credible agentic-engineering *thought-leader worth putting on a stage*. The consequence: reputation compounds slowly, speaking invitations depend on who already happens to know him, and his growing body of content never consolidates into an audience. The gap isn't a lack of substance — it's the absence of a single, **remarkable** place that makes the substance undeniable and shareable.

## The Solution

A single site at `joshuabrandt.abacusai.cloud` that is *itself* a working demonstration of agentic engineering. Visitors meet a confident, restrained hero, then choose their path: explore a guided, increasingly cinematic journey, or simply **talk to a grounded "advocate" agent** that knows Josh's work and routes them to what they care about. Projects are presented as *proof-as-process* — not just screenshots, but the record of how disciplined agentic engineering produced them, surfaced through the **Glass Box** of the site's own build artifacts. Technical work, creative work (Suno, generative art, playable games), talks, and content all live in one place.

## What Makes This Different

- **Proof-as-process, not claims.** Most portfolios *assert* skill; this one *demonstrates* it — built and maintained agentically, in public, showing its own work. The medium is the message.
- **A living, recursive artifact.** Extended via `/bmad-correct-course`, the site appears on its own timeline. Hard to fake: you can't retrofit an authentic public build history.
- **The agent is the interface.** Visitors don't read that Josh builds agentic systems — they *use one* to navigate the site.
- **Veteran + agentic at once.** 30 years of shipping *plus* cutting-edge practice — a rare, credible combination.

**Honest about the moat:** there's no defensible *technology* here. The advantage is **authenticity + novelty + a real 30-year track record** — costly to imitate because it requires actually being Josh and actually doing the work. The real risk is execution and taste, not competitors.

## Who This Serves

**Primary design target — the Practitioner / agentic-engineering peer (the amplifier).** A fellow engineer or AI-curious builder who arrives from social or community channels. Wants depth, surprise, and credibility-among-peers: the Glass Box, the BMAD timeline, the meta-recursion of a site that builds itself. **The default experience is tuned for them** — immersive, deep, "whoa" — because their sharing is what compounds Josh's reputation and, downstream, drives the awareness that produces speaking invitations. _Success: they share it and follow._

**Primary conversion target — the Conference Organizer / Program-Committee member.** Arrives *after* hearing Josh's name (referral, a talk, the buzz above). Busy, a little skeptical, may not want to chat. Served via a **guaranteed fast-credible path** — a prominent speaker reel (READY 2026 front and center), specific talk topics, and a frictionless "invite me," all reachable without engaging the cinematic layer (the lean static fallback). _Success: they reach out to book Josh._

**Secondary — the Content Wanderer.** Found a YouTube video or Suno track and came for delight, not evaluation. _Success: they subscribe/follow_, feeding the audience goal.

**Latent — Hiring managers / clients.** Explicitly *not* a current target. The site must not repel them and is architected to support a future "open to work" mode (#44).

## Success Criteria

_(12-month horizon unless noted.)_

- **Speaking (outcome):** ≥ 1 speaking inquiry via the site's "invite me" path, or ≥ 1 invitation where the site demonstrably played a role.
- **Reputation (engine):** Josh pitches ≥ 1 new conference — ideally *a talk about the site itself* ("I built my portfolio as a public, agentic BMAD project"). Leading signal: the site is shared/mentioned in the agentic-engineering community.
- **Audience (compounding):** +500 net-new subscribers/follows across Josh's channels (YouTube today; additional channels as they launch), 6–12 months.
- **Ship discipline (anti-"never ships"):** Stage 1 is **live and publicly shareable by a self-imposed soft target (~end of June 2026)** — independent of any other project (e.g., the podcast). A credible, shareable site, not a perpetual WIP.

## Scope

**Staged delivery — every stage is committed MVP scope (#47), shipped incrementally so a credible site is always live.** Stage 1 stands alone; later stages add the "magic" without re-platforming.

**Stage 1 — Credible Hub** _(first shippable cut; soft target ~end of June 2026)_
- Architect's-Studio-clean shell; fast hero ("Seasoned, Not Stuck"), confident and restrained.
- **Speaker surface:** reel (READY 2026 front and center), specific talk topics, frictionless "invite me" path.
- **Two flagship projects done well:** this portfolio itself (seeds the Glass Box) + `loandemo` (live-on-stage proof).
- Curated links/embeds to **YouTube, Suno, GitHub**.
- **Basic grounded advocate agent:** BM25-first RAG over curated markdown, citation guardrails, fixed advocate persona — plus a **lean static fallback** so every piece of content is reachable without chatting.
- **The Glass Box (signature hook):** a real, navigable view showing the site was built as a public BMAD project — surfaced from the artifacts that already exist (this brief, the brainstorm, research, retros as they accrue). The one *remarkable* element in Stage 1, giving practitioners a reason to share on day one. (Guided-tour polish deepens in Stage 2.)
- **SEO static-mirroring** — the "credible-when-Googled" baseline.

**Stage 2 — The Magic**
- Cinematic continuous canvas + scene transitions; zoomable BMAD **master timeline**; **adaptive Suno soundtrack**; agent-adaptive reordering + **depth dial**; playable project embeds; video-synced repo; the **Creative Lab** movement.

**Stage 3 — Full Richness**
- Site-wide semantic zoom; agent capturing/booking speaking inquiries; remaining content fully imported.

**Explicitly out (for now)**
- **Podcast integration** — concept-phase; site ships regardless; synergy scoped later if/when it launches.
- **CMS / admin panel** — code-as-CMS via git (#34).
- **Live runtime reads** from GitHub/YouTube/Suno — all content curated into the repo (#37).
- **Public live agentic execution** — demonstrations are pre-recorded/curated (#35).
- **Job-seeking / "open to work" mode** — latent/future (#44).

## Constraints, Prerequisites & Open Questions

**Platform.** Runs on Josh's Abacus VM — a static build served by an nginx vhost at `joshuabrandt.abacusai.cloud`, plus a small live backend for the grounded agent (calls the VM's OpenAI-compatible LLM endpoint; Claude/GPT/Gemini models are available locally, no external key). One curated git repo is the sole source of truth (no CMS, no live external reads).

**Prerequisites to launch (clear before/at deploy):**
- **Enable public URL access** — `public_url_enabled` is currently **OFF** on the VM; it must be turned on in the Abacus Cloud Services UI or nothing routes publicly.
- **Suno commercial rights** — commercial use attaches *at generation time*; upgrade to a paid plan and **re-generate** any featured tracks (existing free-tier songs are not retroactively licensed).

**Open questions (resolve in architecture):**
- Exact frontend stack — research recommends **Astro SSG + CSS-scroll baseline + GSAP hero + (optional) one R3F set-piece**; confirm during the architecture phase.
- Podcast synergy — deferred until/if the podcast ships.

_Full design rationale lives in the companion brainstorm (47 ideas) and pre-brief research docs; technical depth is parked in `addendum.md`._

## Vision

In 2–3 years, `joshuabrandt.abacusai.cloud` is the canonical example of a portfolio built *as* a public agentic-engineering project — the site practitioners point to when they explain what BMAD and agentic engineering can really do. It has grown into a living, zoomable record of Josh's craft: every new project flows in through `/bmad-correct-course` and takes its place on the timeline, so the site is never "finished" and never stale. The advocate agent has matured into a genuinely impressive guide; the cinematic journey is complete and distinctly Josh. Along the way it has done its job — earned speaking invitations (including talks *about the site itself*), consolidated a real audience across Josh's channels, and built a reputation that compounds. If Josh ever chooses, the same foundation flips on an "open to work" mode. The deeper win: a public, undeniable, ever-current proof of who Josh is as an engineer — and a repeatable pattern others can adopt.
