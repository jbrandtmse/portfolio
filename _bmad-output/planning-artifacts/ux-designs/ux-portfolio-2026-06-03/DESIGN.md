---
name: Joshua R. Brandt — Portfolio
description: A warm, structured, editorial gallery for a 30-year engineer building at the frontier — ink-on-cream, all Source Serif 4, hairline rules over a faint drafting grid, flat but for one elevated surface. The site is its own proof.
status: final
sources:
  - '{planning_artifacts}/prds/prd-portfolio-2026-06-02/prd.md'
  - '{planning_artifacts}/briefs/brief-portfolio-2026-06-02/brief.md'
  - '{output_folder}/brainstorming/brainstorming-session-2026-06-02-1723.md'
  - '{output_folder}/research/portfolio-pre-brief-research-2026-06-02.md'
updated: 2026-06-04

# ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
# Locked at Finalize from .decision-log.md + the approved mocks (promoted to
# mockups/; see the Components → Visual reference line). One base mode only
# (warm light); light/dark TOGGLE is out of v1 scope per the PRD.
# EXPERIENCE.md references these by name via {path.to.token}; this spine wins on
# conflict with any mock, wireframe, or import.

colors:
  # 8 core locked semantic tokens (color-themes-1.html · accent = Prussian, .decision-log)
  # + 2 AA-safe muted-ink variants (ink-ghost, ink-meta-min) for meaningful quiet text.
  # AA contrast on surface-base noted per-token in the Colors prose below.
  surface-base: '#F6F0E6'      # warm ivory / cream paper — the page & stage, edge to edge
  surface-raised: '#FBF7EF'    # slightly lifted cream — cards, panels, mats, header sheets
  ink-primary: '#211B14'       # warm espresso near-black — headlines & body (15.04:1 on base)
  ink-secondary: '#6B5D4A'     # muted warm gray-brown — meta, captions, ledes, kickers (5.63:1)
  border-hairline: '#D8CAB3'   # warm hairline — rules, borders, button outlines, the rail edge
  grid-line: '#ECE3D3'         # very faint drafting-grid ruling — decorative order, never content
  accent: '#1E3A5F'            # Prussian navy — primary action, links, ticks, nodes, citations (10.15:1)
  accent-hover: '#162B47'      # deeper navy — hover / pressed / active (12.76:1 on base)
  ink-ghost: '#776B55'         # muted warm ink for MEANINGFUL "still to come" / upcoming-node text — 4.61:1 on base, 4.89:1 on raised (AA; quieter than ink-secondary but never below 4.5)
  ink-meta-min: '#756B56'      # quietest ink for meaningful fine print (metric source, runway span) — 4.64:1 on base, 4.92:1 on raised (AA floor; reads muted, still legible)

typography:
  # ALL Source Serif 4 — display + headings + body + meta (type system LOCKED,
  # .decision-log 2026-06-03). Roman only; the rare italic (ledes, pull-quotes,
  # captions) is the loaded italic where available. Optical-size (opsz) axis
  # exercised: pushed to display for the headline, eased toward text for reading.
  # Build: subset to Latin + weights 400 / 600 / 700, font-display: swap.
  font-family-base: "'Source Serif 4', 'Spectral', Georgia, 'Times New Roman', serif"
  display:
    fontFamily: "'Source Serif 4', serif"   # opsz 60 (display optical), -webkit optical-sizing auto
    fontSize: 'clamp(46px, 6.6vw, 96px)'    # mobile compact lockup: 33px
    fontWeight: '700'
    lineHeight: '0.99'                       # mobile: 1.0
    letterSpacing: '-0.014em'                # mobile: -0.012em
  h1:
    fontFamily: "'Source Serif 4', serif"
    fontSize: 'clamp(34px, 4.4vw, 52px)'     # page titles: Glass Box, Timeline, Speaking (mobile ~26–27px)
    fontWeight: '700'
    lineHeight: '1.05'
    letterSpacing: '-0.012em'
  h2:
    fontFamily: "'Source Serif 4', serif"
    fontSize: 'clamp(24px, 3.0vw, 40px)'     # scene thesis beat / invite-close (mobile ~21–24px)
    fontWeight: '700'
    lineHeight: '1.07'
    letterSpacing: '-0.01em'
  h3:
    fontFamily: "'Source Serif 4', serif"
    fontSize: 'clamp(21px, 2.2vw, 28px)'     # card & talk titles (mobile 19–20px)
    fontWeight: '700'
    lineHeight: '1.13'
    letterSpacing: '-0.006em'
  body:
    fontFamily: "'Source Serif 4', serif"    # opsz eased toward text (~18)
    fontSize: '18px'                          # long-form reading (mobile 17px); UI body 14.5–15px
    fontWeight: '400'
    lineHeight: '1.62'
  lede:
    fontFamily: "'Source Serif 4', serif"    # opening deck under a title; one notch up from body
    fontSize: 'clamp(17px, 1.5vw, 19px)'
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  meta:
    fontFamily: "'Source Serif 4', serif"    # dates, captions, labels, logistics
    fontSize: '11.5px'                        # range 10.5–13.5px by density
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0.12em'
  kicker:
    fontFamily: "'Source Serif 4', serif"    # small-caps eyebrow over titles; navy hairline lead-tick
    fontSize: '12px'                          # range 10.5–15px; true small-caps via font-variant in long-form
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: '0.30em'                   # tracked-out, UPPERCASE (or font-variant: small-caps in reader)
  # Drop-cap (long-form artifact reader only): float left, ~3.5em, lineHeight 0.78,
  # fontWeight 700, color {colors.ink-primary}. Pull-quote: italic, clamp(20px,2.4vw,25px),
  # lineHeight 1.4, navy left rule. Both are reserved for /glass-box/{artifact} & case studies.

rounded:
  # Derived from the mocks. The scale climbs with surface size; navy nodes & the
  # Guide pill are the only fully-round forms. Imagery follows container corners.
  sm: '2px'        # type/level chips, small-caps tags (artifact card, talk card)
  md: '6px'        # inputs, CTAs, secondary controls, zoom/format affordances
  lg: '8px'        # cards, panels, recursion aside, metric grid, posters (8–10px family)
  panel: '12px'    # the Guide panel — the one elevated surface
  full: '9999px'   # the Guide pill, citation chips, format pills, all dot nodes (perfect circles)

spacing:
  # 8px base unit; component padding and section rhythm derived from the mocks.
  # Reading measure for long-form is fixed (see Layout & Spacing).
  unit: '8px'
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '20px'
  '6': '24px'
  '7': '32px'
  card-pad: '20px 24px'                       # artifact / talk / bio card interior
  gutter: '26px'                              # grid / arc gutter
  margin-mobile: '16px'                       # phone side margins
  margin-desktop: 'clamp(20px, 4vw, 56px)'    # page side margins
  section-band: 'clamp(38px, 4.2vw, 64px)'    # gap between major content bands
  reading-measure: '680px'                    # long-form column max (Glass Box reader, case studies)
  content-measure: '1040px'                   # standard page content column (Glass Box, Timeline)

elevation:
  # FLAT / hairline system. There is exactly ONE soft shadow site-wide, on the
  # Guide panel & its pill (the single elevated surface, .decision-log 2026-06-03).
  flat: 'none'                                # every other surface — cards, rails, posters, bands
  shadow-float: '0 18px 44px -22px rgba(33,27,20,0.42), 0 4px 12px -8px rgba(33,27,20,0.20)'

components:
  wordmark:
    text: 'Joshua R. Brandt, MSE'             # canonical name string (hero, headers, labels, JSON-LD)
    fontFamily: '{typography.kicker.fontFamily}'
    fontWeight: '600'
    fontSize: '13px'                          # mobile 10.5–11px; sticky speaking header 14px/700
    letterSpacing: '0.30em'                   # hero-top; 0.06–0.16em in compact page tops
    textTransform: 'uppercase'
    color: '{colors.ink-primary}'

  kicker:
    fontFamily: '{typography.kicker.fontFamily}'
    fontSize: '{typography.kicker.fontSize}'
    fontWeight: '{typography.kicker.fontWeight}'
    letterSpacing: '{typography.kicker.letterSpacing}'
    textTransform: 'uppercase'
    color: '{colors.ink-secondary}'
    lead-tick: '26px × 1px bar in {colors.accent}, gap 12–14px before the label'  # the single navy accent on the eyebrow

  button-primary:
    background: '{colors.accent}'
    color: '{colors.surface-base}'            # cream reversed out of navy (10.15:1 AA)
    border: '1px solid {colors.accent}'
    radius: '{rounded.md}'                     # 6–7px (hero uses 7px)
    padding: '13px 22px'                       # hero fork: 14px 30px
    fontFamily: '{typography.body.fontFamily}'
    fontSize: '15px'
    fontWeight: '600'
    letterSpacing: '0.01em'
    hover: 'background & border → {colors.accent-hover}'
    focus: '2px solid {colors.accent} outline, 2px offset'

  button-secondary:
    background: 'transparent'
    color: '{colors.ink-primary}'              # navy variant: {colors.accent}
    border: '1px solid {colors.ink-primary}'   # quieter variant: 1px {colors.border-hairline}
    radius: '{rounded.md}'
    padding: '13px 22px'
    fontWeight: '600'
    hover: 'background rgba(30,58,95,0.06); border & text → {colors.accent}'

  citation-chip:
    # The Guide's receipt — every claim carries one; links to a Mirror route.
    background: '{colors.surface-base}'
    color: '{colors.accent}'
    border: '1px solid {colors.border-hairline}'
    radius: '{rounded.full}'                    # pill (999px)
    padding: '7px 11px'
    fontSize: '12px'
    route-label: "monospace 10.5px in {colors.ink-secondary}"  # the only permitted mono — tiny route/timestamp meta
    arrow: '↗ in {colors.accent}'
    hover: 'border → {colors.accent}; text → {colors.accent-hover}'

  citation-link:
    # Inline accent link in prose / long-form — hairline underline, not full text-decoration.
    color: '{colors.accent}'
    textDecoration: 'none'
    borderBottom: '1px solid {colors.border-hairline}'
    paddingBottom: '1px'
    hover: 'color → {colors.accent-hover}; border-bottom → {colors.accent}'

  scene-rail:
    # Persistent home-arc progress + jump + skip. Desktop: slim right rail on
    # {colors.surface-raised}. Mobile: collapses to a sticky top progress bar + Jump menu.
    background: '{colors.surface-raised}'
    border-left: '1px solid {colors.border-hairline}'
    width: '208px'
    tick: '9px circle, 1px {colors.accent} ring, transparent fill — each of the 7 ticks is a real in-page anchor (jump-to-scene, e.g. <a href="#thesis">), NOT decorative text'
    tick-current: 'filled {colors.accent} + 3px rgba(30,58,95,0.20) halo; 3px navy edge-bar; label weight 700; carries aria-current'
    tick-hit-area: 'each tick+label is one clickable target ≥44×44px (full rail-row width, vertical padding pads the 9px dot up to the touch minimum)'
    tick-focus: 'focus-visible → 2px solid {colors.accent} outline, 2px offset around the tick-row (keyboard reveals which scene is targeted)'
    meter: '5px track in {colors.grid-line}, fill {colors.accent}, radius 3px'
    label: '{typography.meta} uppercase in {colors.ink-secondary}'
    skip-button: 'outline button, 1px {colors.accent}, radius 7px'
    elevation: '{elevation.flat}'

  guide-pill:
    # The persistent bottom-right entry to the Guide. Minimized form of the panel.
    background: '{colors.accent}'
    color: '#FFFFFF'
    border: 'none'                              # collapsed pill; expanded panel uses 1px hairline
    radius: '{rounded.full}'                    # ~22–24px
    padding: '11px 18px'
    fontSize: '12.5px'
    fontWeight: '600'
    letterSpacing: '0.03em'
    glyph: '15px circle, 2px #FFFFFF ring (the Guide monogram mark)'
    elevation: '{elevation.shadow-float}'       # ONE of only two places the shadow appears
    label: 'Ask my Guide'

  guide-panel:
    # THE single elevated surface site-wide. Floating, bottom-anchored, NON-modal.
    # role="dialog" aria-modal="false"; focus moves in but is not trapped.
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-hairline}'
    radius: '{rounded.panel}'                    # 12px
    width: '380px'                               # desktop ~400px floating card, max ~65vh; mobile = partial bottom sheet ~55–65vh
    elevation: '{elevation.shadow-float}'        # the one soft shadow that justifies the token
    head: 'navy monogram in a 1px {colors.accent} hairline circle + title + "Grounded · cites its sources" status; real minimize/close <button>s. Assurance is the measured "Grounded · cites its sources" only — no absolute "zero ungrounded claims" boast; the per-message citation chips carry the honesty (matches EXPERIENCE.md).'
    body: 'role="log", aria-live="polite", batched per message (never per token)'
    input: '{components.input}'
    thinking-state: 'designed retrieval moment — a calm "Reading the record" line + hairline progress sweep, role=status; NOT a spinner'

  artifact-card:
    # Glass Box build-story node payload (also the resting case-study card).
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-hairline}'
    radius: '{rounded.lg}'                       # 8px
    padding: '{spacing.card-pad}'
    chip: '{components.kicker} as a 1px {colors.accent} outlined tag, radius {rounded.sm}'
    title: '{typography.h3}'
    note: 'italic {typography.body} in {colors.ink-secondary} (one-line curator note)'
    read-link: "{typography.meta} weight 600 in {colors.accent} + arrow that nudges 3px on hover"
    hover: 'border → #C6B89E (warm-deepened hairline)'
    elevation: '{elevation.flat}'
    ghost-variant: 'transparent fill, 1px DASHED {colors.border-hairline}, muted ink {colors.ink-ghost} (AA-safe, 4.61:1) — "still to come" upcoming nodes'
    live-pill: 'filled {colors.accent}, #FFFFFF text, radius {rounded.sm}, white blip — "Live · in progress"'

  timeline-dot:
    # The "BMAD Method Dot" — one shared node visual across Glass Box & Master
    # Timeline. Foreshadows the Timeline from the Glass Box spine.
    resting: '13px circle, {colors.surface-raised} fill, 1.5px {colors.accent} ring'
    filled: 'fill {colors.accent} (a shipped / curated milestone)'
    live: 'filled + 4px rgba(30,58,95,0.16) static halo (no animation)'
    upcoming: '{colors.surface-base} fill, 1.5px DASHED {colors.accent}, opacity 0.7'
    faint: '11px circle, 1.5px #C0B49B ring — the quiet 30-year runway ticks'
    milestone: '17px filled {colors.accent} node (a flagship career milestone on the spine)'
    spine: '1px {colors.border-hairline} hairline rule the dots ride on'

  era-band:
    # A labeled region along the Master Timeline spine (horizontal desktop arc).
    label: '{components.kicker} — runway era in {colors.ink-secondary}, the agentic turn in {colors.accent}'
    span: 'italic 11.5px in {colors.ink-meta-min} (the muted runway/ghost ink — AA-safe, 4.64:1)'
    divider: '1px DASHED {colors.border-hairline} between the runway era and the dense turn era'
    note: '{typography.meta} weight 400 reading note, ink graded by emphasis'

  talk-card:
    # Speaker Surface signature talk.
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-hairline}'
    radius: '9px'                                # lg family
    padding: 'clamp(20px, 2.2vw, 28px)'
    levels: '{components.artifact-card.chip} (audience-level chips, stacked top-right)'
    title: '{typography.h3} (outcome-oriented)'
    abstract: '{typography.body}; one expanded, others a real <details>/<summary> collapse (works JS-off)'
    takeaways: 'hairline-tick list (11px × 1px {colors.accent} lead rule per item)'
    formats: 'pill tags — {rounded.full}, 1px {colors.border-hairline}, {colors.accent} text on {colors.surface-base}'
    logistics: '{typography.meta} weight 400 in {colors.ink-secondary}, key terms in {colors.ink-primary}'
    elevation: '{elevation.flat}'

  bio-block:
    # Copy-paste organizer bios (50w + 100–150w).
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-hairline}'
    radius: '9px'
    padding: '22px 24px'
    head: 'word-count label ({typography.meta}) + copy <button>, divided by a hairline'
    copy-button: 'outline, 1px {colors.accent}, radius {rounded.md}; hover fills {colors.accent}/#FFFFFF'
    copied-state: 'filled {colors.accent} + #FFFFFF check glyph — "Copied ✓" (selectable-text fallback always present)'
    text: '{typography.body} in {colors.ink-primary}'

  metric:
    # Audience-draw figure in the credibility strip (hairline-gridded 4-up / 2-up).
    background: '{colors.surface-raised}'
    figure: 'Source Serif 700, clamp(26px,3vw,34px), {colors.accent}, lineHeight 1'
    label: '{typography.meta} uppercase in {colors.ink-secondary}'
    source: 'italic 11.5px in {colors.ink-meta-min} (AA-safe, 4.64:1)'
    grid: '1px {colors.border-hairline} cell gaps, 1px outer border, radius {rounded.lg}'

  testimonial:
    background: '{colors.surface-raised}'
    border: '1px solid {colors.border-hairline}'
    border-left: '2px solid {colors.accent}'    # the navy quote rule
    radius: '0 8px 8px 0'
    padding: '18px 20px'
    quote: 'italic {typography.body} in {colors.ink-primary}'
    attribution: '{typography.meta} weight 400 in {colors.ink-secondary}, name in {colors.ink-primary}'

  reel-poster:
    # READY 2026 speaker reel — the one rich visual element. Editorial navy
    # gradient + faint registration grid; NOT a hacker/AI/terminal cliché.
    aspect-ratio: '16 / 9'                       # mobile 16 / 10
    background: 'linear-gradient(155deg, #24456B 0%, {colors.accent} 34%, #16263F 70%, #101D31 100%)'
    overlay-grid: 'rgba(246,240,230,0.06) 1px ruling — the drafting-grid signature, restrained, over navy'
    border: '1px solid {colors.border-hairline}'
    radius: '{rounded.lg}'                        # 10px
    play: '88px circle, 1.5px cream ring, translucent cream fill, cream play triangle (no autoplay)'
    corner-labels: 'cream ({colors.surface-base}) reversed out of navy — "Speaker reel · READY 2026" + "90s"'
    caption: '{typography.meta} weight 400 + a static link fallback to the hosted video'
    elevation: '{elevation.flat}'

  input:
    # The Guide composer field (and any future text input).
    background: '{colors.surface-base}'
    border: '1px solid {colors.border-hairline}'
    radius: '9px'                                 # md–lg family
    padding: '10px 12px'
    fontFamily: '{typography.body.fontFamily}'
    fontSize: '14px'
    color: '{colors.ink-secondary}'               # placeholder & resting text
    focus: 'border → {colors.accent}; 2px rgba(30,58,95,0.12) ring'
    label: 'always present (visually-hidden where the design omits a visible label)'
---

<!-- Visual identity spine (DESIGN.md) — owns *how it looks*. Distilled at Finalize
from .decision-log.md, the promoted mockups/ mocks, and the four sources.
EXPERIENCE.md references these tokens by name via {path.to.token}. This spine wins
on conflict with any mock, wireframe, or import. -->

## Brand & Style

This is a **warm, structured, editorial Gallery** — the visual posture of an *Architect's Studio*. Spare, confident, type-led; ink set on warm cream paper, ordered by a faint drafting grid and separated by hairline rules; whitespace is generous and load-bearing. The governing instinct is that **restraint is the flex, and the wow builds**: the opening beat is calm and credible, and the site earns its few moments of spectacle rather than front-loading them. Nothing here shouts.

The product is a personal portfolio that **demonstrates rather than describes**. It is built in the open as a BMAD Method project, so the site is its own evidence — *the medium is the message*. The positioning it dresses is **"Seasoned, building at the frontier"**: thirty years of shipping software, now all-in on agentic engineering. That duality — deep experience *and* working at the cutting edge — is asserted positively and actively, never defensively. The aesthetic has to read as the work of someone with nothing to prove and everything to show: a curator's confidence, not a salesperson's pitch.

Three influences are blended, by decision, into one identity. From the **Gallery** direction: austere ink-on-paper, the lowest density, a single restrained accent. From the **Literary** direction: *warmth* — warm cream and espresso ink rather than cool white and black — plus the editorial devices (small-caps kickers, drop-cap ledes, pull-quotes) reserved for long-form reading. From the **Architect** direction: underlying *structure* — a faint drafting grid and hairline registration marks that signal order beneath the calm. (The Architect's monospace metadata was deliberately declined; there is no monospace craft-signature on the base — mono appears only for tiny route labels and timestamps inside the Guide.) The result is austere and confident, warmed with cream and ink, lightly gridded, with editorial flourish held back for where reading actually happens.

## Colors

The palette is two ideas: **warm cream paper** and **Prussian navy**, over a warm-neutral ink-and-hairline spine. It is restrained on purpose — a portfolio that argues for taste cannot itself be loud. Eight core semantic tokens carry the system — still **one accent, one ink family** — joined by two AA-safe muted-ink variants ({colors.ink-ghost}, {colors.ink-meta-min}) for deliberately quiet text that must stay readable; color is never the sole carrier of meaning (status is always also stated in text and weight).

- **{colors.surface-base}** `#F6F0E6` — warm ivory / cream paper. The page and stage, edge to edge. Warm rather than clinical white because the whole identity steals the Literary direction's warmth; this single choice is what keeps the austere Gallery from reading cold.
- **{colors.surface-raised}** `#FBF7EF` — a slightly brighter cream. The *only* way most surfaces lift off the page: cards, panels, portrait mats, header sheets, the scene-rail. Distinguished from {colors.surface-base} by **tone, not shadow** — this is how the flat system creates hierarchy.
- **{colors.ink-primary}** `#211B14` — warm espresso near-black. Headlines and body. **15.04:1** on {colors.surface-base} — far past AA, an intentionally rich, readable black-brown rather than pure `#000`.
- **{colors.ink-secondary}** `#6B5D4A` — muted warm gray-brown. Metadata, captions, ledes, kickers, curator notes. **5.63:1** on {colors.surface-base} — passes AA for normal text, so secondary copy is never a contrast compromise.
- **{colors.border-hairline}** `#D8CAB3` — the warm hairline. Rules, card borders, button outlines, the rail edge. Heavier than this reads as "UI"; this weight reads as "paper."
- **{colors.grid-line}** `#ECE3D3` — the faint drafting-grid ruling. Decorative order only — a barely-there column/row grid behind heroes and pages. **No information ever lives only in the grid;** it is `aria-hidden` in spirit.
- **{colors.accent}** `#1E3A5F` — Prussian navy. *Classic, trusted* — a cool counterpoint that makes the warm cream sing. The single chromatic color: primary actions, links, scene-rail ticks, BMAD Method Dots, citation chips, metric figures. **10.15:1** on {colors.surface-base}, and cream reversed out of navy is the same 10.15:1 — both directions clear AA comfortably. Chosen over oxblood, terracotta, petrol, forest, and ochre because trust and calm authority beat heat or nostalgia for this brand.
- **{colors.accent-hover}** `#162B47` — deeper navy. Hover, pressed, and active states. **12.76:1** on {colors.surface-base}.
- **{colors.ink-ghost}** `#776B55` — the muted "quiet" ink for text that is deliberately ghosted but still **carries meaning**: the "still to come" upcoming-node label and curator copy. **4.61:1** on {colors.surface-base} (**4.89:1** on {colors.surface-raised}) — reads clearly quieter than {colors.ink-primary}, yet stays past AA so low-vision readers still get the status word.
- **{colors.ink-meta-min}** `#756B56` — the quietest ink, for meaningful fine print: the metric source-attribution line and the runway/ghost era span. **4.64:1** on {colors.surface-base} (**4.92:1** on {colors.surface-raised}) — the floor for muted text, never below it.

Muted, ghosted, and "quiet" text that **carries meaning still meets AA (≥4.5:1)** — that is why {colors.ink-ghost} and {colors.ink-meta-min} exist instead of a lighter wash; only **purely decorative** marks (the drafting grid, faint runway ticks) may drop below the contrast floor.

Avoid: any second chromatic accent, gradient *surfaces* (the lone navy gradient is the reel poster, a deliberate single rich element), neon, and sentiment/category color-coding. The discipline is **cream, ink, navy, and stop.**

## Typography

**One family does everything: Source Serif 4** — display, headings, body, and meta. Chosen live over Fraunces and over a Fraunces+Source pairing (*"I really like the way Source Serif 4 looks"*): the lightest web-font payload of the options, the simplest to maintain, and the strongest sustained long-form read for the Glass Box and case studies. Source Serif does double duty as the display face, its **optical-size axis** pushed toward display for the big headline ({typography.display}, `opsz 60`, weight 700) and eased back toward text for reading ({typography.body}, ~`opsz 18`). Build discipline: subset to Latin + weights **400 / 600 / 700**, `font-display: swap` to protect the FCP budget; roman is the workhorse, the loaded italic carries ledes, pull-quotes, and captions.

The ramp, all in Source Serif 4:

- **{typography.display}** — the focal element. `clamp(46px, 6.6vw, 96px)`, weight 700, line-height 0.99, letter-spacing −0.014em. The positioning line is the page `<h1>`. Mobile compresses to ~33px in a name+headshot lockup to hold the fold.
- **{typography.h1} / {typography.h2} / {typography.h3}** — page titles, scene/section beats, and card/talk titles. Weight 700, line-heights tightening as size drops (1.05 → 1.07 → 1.13), with small negative tracking for a cohesive set block.
- **{typography.body}** — long-form reading at 18px / line-height 1.62 (UI body eases to 14.5–15px). The measure is held tight (see Layout).
- **{typography.lede}** — the opening deck under a title, one notch up from body.
- **{typography.meta}** — dates, labels, captions, logistics; small and tracked, often UPPERCASE.
- **{typography.kicker}** — the **small-caps eyebrow** over titles: tracked out (~0.30em), uppercase, in {colors.ink-secondary}, introduced by a short navy hairline lead-tick. In long-form it is set with true `font-variant: small-caps`.

Two editorial devices are **reserved for long-form only** (the `/glass-box/{artifact}` reader and case studies), never the index or chrome: a **drop-cap** opening the first paragraph (float left, ~3.5em, weight 700, {colors.ink-primary}) and **pull-quotes** (italic, `clamp(20px,2.4vw,25px)`, line-height 1.4, with a 2–3px navy left rule). They are the flourish that signals "this is where you read," and their scarcity is the point.

No exclamation marks anywhere. No gimmick or display faces, no all-caps body, no monospace as craft-signature.

## Layout & Spacing

The layout reads like a well-set page. A **faint drafting grid** ({colors.grid-line}) sits behind heroes and pages as decorative order; **hairline rules** ({colors.border-hairline}) separate regions; **whitespace is generous** and does the work that boxes and shadows would do in a busier system. The spacing scale is an **8px base** ({spacing.unit}) with derived steps ({spacing.1}–{spacing.7}); major content bands are separated by {spacing.section-band} (`clamp(38px, 4.2vw, 64px)`), the editorial pause that lets each beat land.

Reading is protected by a fixed measure: long-form holds to {spacing.reading-measure} (**~680px**), and standard pages center on {spacing.content-measure} (~1040px). Side margins are {spacing.margin-mobile} (16px) on phones and {spacing.margin-desktop} (`clamp(20px, 4vw, 56px)`) on desktop, so content always feels framed like a page rather than bleeding to the edge.

The home is **scroll-native** with a persistent **{components.scene-rail}**: on desktop a slim right rail (ticks + a progress meter + a skip-to-end and jump-to-speaking affordance); on mobile it collapses to a sticky top progress bar plus a "Jump to section" menu — this is the FR-2 skip/progress affordance. The hero is a two-column composition on desktop (copy + portrait) and a stacked, compact name+headshot lockup on mobile. The Master Timeline is one semantic ordered list **reflowed by orientation**: a horizontal left→right craft-arc on desktop, vertical top→bottom on mobile (presentation only — the DOM order is identical). Everything ships clean under JS-off and `prefers-reduced-motion`.

## Elevation & Depth

This is a **flat / hairline** system. Depth comes from **tonal layering** ({colors.surface-raised} on {colors.surface-base}) and **hairline borders**, not from shadow. Cards, the scene-rail, posters, metric grids, timeline spines, and bands are all flat ({elevation.flat}).

There is exactly **one soft shadow site-wide**, and it is reserved for the **{components.guide-panel}** (and its minimized **{components.guide-pill}**) — the single elevated surface. It floats, non-modal, over the page, and the shadow is what makes "floating" legible: {elevation.shadow-float} (`0 18px 44px -22px rgba(33,27,20,0.42), 0 4px 12px -8px rgba(33,27,20,0.20)`). If any other element grows a shadow, the system is broken. This scarcity is deliberate: when only the Guide lifts, the Guide reads as the product's one live, ambient presence.

## Shapes

Corner radii climb with surface size, and only nodes and the Guide read as fully round:

- **{rounded.sm}** `2px` — small-caps type/level chips and tags. Almost square; reads as a printed stamp, not a button.
- **{rounded.md}** `6px` — inputs, CTAs, secondary controls, and affordances (the hero fork buttons sit at 7px, within this family).
- **{rounded.lg}** `8px` — cards, panels, the recursion aside, the metric grid, posters (an 8–10px family). The tactile, object-like surfaces.
- **{rounded.panel}** `12px` — the Guide panel only, a touch softer than the cards to suit the one floating surface.
- **{rounded.full}** `9999px` — the Guide pill, citation chips, format pills, and **every dot node** (perfect circles). Roundness is rationed: it marks either *the live conversational layer* or *a node on a spine*, nothing else.

Imagery and posters follow their container's radius exactly.

## Components

Each component below references the locked tokens; values are pinned from the approved mocks.

**Visual reference (promoted mocks).** The locked look is rendered in [`mockups/hero.html`](mockups/hero.html) (wordmark, kicker, the fork, scene-rail Scene-1 state), [`mockups/guide.html`](mockups/guide.html) (the Guide pill + panel — the one elevated surface; the mock still labels the agent "Advocate"), [`mockups/glass-box.html`](mockups/glass-box.html) (artifact card, BMAD Method Dot, ghost/live states — the spine adds the non-ghosted shipping node, which the mock predates), [`mockups/master-timeline.html`](mockups/master-timeline.html) (timeline-dot, era-band, the milestone spine), and [`mockups/speaker-surface.html`](mockups/speaker-surface.html) (talk-card, bio-block, metric, testimonial, reel-poster). This spine wins on conflict with any mock.

- **Wordmark** — `Joshua R. Brandt, MSE` (the canonical name string for hero, page headers, the headshot label, bios, and JSON-LD; in context in [`mockups/hero.html`](mockups/hero.html)). Set in {typography.kicker.fontFamily} at weight 600, tracked uppercase, in {colors.ink-primary}. The conversational short form "Joshua" is the Guide's voice only (resolved in microcopy).
- **Kicker** — the small-caps eyebrow ({components.kicker}): {colors.ink-secondary}, uppercase, tracked ~0.30em, preceded by a 26px × 1px {colors.accent} lead-tick. The one place the accent touches a label.
- **Button — primary** ({components.button-primary}) — filled {colors.accent}, {colors.surface-base} text (10.15:1), {rounded.md}; hover → {colors.accent-hover}; navy focus ring.
- **Button — secondary** ({components.button-secondary}) — transparent with a 1px outline ({colors.ink-primary} for the hero fork, or the quieter {colors.border-hairline}); hover warms to a faint navy wash and {colors.accent} text/border.
- **Citation chip & link** ({components.citation-chip} / {components.citation-link}) — the Guide's receipts. The chip is a {rounded.full} pill on {colors.surface-base} with {colors.accent} label, a tiny **monospace route label** in {colors.ink-secondary} (the only sanctioned mono), and an ↗. The inline link is {colors.accent} with a hairline underline that deepens to {colors.accent} on hover. Following a citation navigates the page behind while the conversation persists.
- **Scene-rail** ({components.scene-rail}) — the home progress/jump/skip affordance on {colors.surface-raised} with a left hairline. Each of the 7 scene ticks is an **interactive jump-to-scene** target — a real in-page anchor with a ≥44×44px hit area (the tick+label row) and a `:focus-visible` navy outline — so a keyboard or pointer user can jump to any scene, not just skip-to-end. The current tick is a filled {colors.accent} dot with a soft halo and a navy edge-bar; the label is bold and carries `aria-current` (status never depends on the lit tick alone). Flat.
- **Guide pill** ({components.guide-pill}) — the persistent bottom-right entry, filled {colors.accent}, white label "Ask my Guide", a 2px white-ring monogram glyph, {rounded.full}. Carries {elevation.shadow-float} (one of the only two shadowed elements).
- **Guide panel** ({components.guide-panel}) — **the single elevated surface** ([`mockups/guide.html`](mockups/guide.html)). A floating, NON-modal {colors.surface-raised} card ({rounded.panel}, {elevation.shadow-float}); navy monogram in a hairline circle, a measured **"Grounded · cites its sources"** status (the persistent panel-head assurance — it does *not* over-assert "zero ungrounded claims"; the per-message citation chips carry the honesty), real minimize/close buttons, a `role="log"` transcript announced per message, and the {components.input} composer. Its thinking state is a *designed* retrieval moment — a calm "Reading the record" line and a hairline progress sweep — not a spinner.
- **Artifact card** ({components.artifact-card}) — the Glass Box node payload and resting case-study card ([`mockups/glass-box.html`](mockups/glass-box.html); the mock predates the non-ghosted shipping node): {colors.surface-raised}, hairline border, {rounded.lg}; a {colors.accent}-outlined small-caps type chip, an {typography.h3} title, an italic one-line curator note in {colors.ink-secondary}, and a navy "Read →" link whose arrow nudges on hover. Hover deepens the border. The **ghost variant** (transparent, dashed hairline, muted {colors.ink-ghost} ink — AA-safe so the status word stays readable) marks "still to come" upcoming nodes; a filled-navy **"Live · in progress"** pill marks the in-flight one.
- **Timeline-dot** ({components.timeline-dot}) — the shared **"BMAD Method Dot"** across Glass Box and Master Timeline ([`mockups/master-timeline.html`](mockups/master-timeline.html)). Resting: 13px, {colors.surface-raised} fill, 1.5px {colors.accent} ring. Filled for shipped/curated; **live** adds a 4px static navy halo (no animation); **upcoming** is dashed at 0.7 opacity; **faint** (11px, `#C0B49B` ring) marks the quiet 30-year runway; a 17px filled **milestone** node anchors a flagship. All ride a 1px {colors.border-hairline} spine and degrade to a plain ordered list.
- **Era-band** ({components.era-band}) — a labeled region on the Timeline spine: a small-caps era label ({colors.ink-secondary} for the runway, {colors.accent} for the agentic turn), an italic muted span, and a dashed hairline dividing the long quiet runway from the dense recent era.
- **Talk-card** ({components.talk-card}) — {colors.surface-raised}, hairline border, 9px radius; stacked audience-level chips, an outcome-oriented {typography.h3} title, an abstract that collapses via a real `<details>` (works JS-off), a hairline-tick takeaways list, {rounded.full} format pills, and logistics in {typography.meta}. Flat.
- **Bio-block** ({components.bio-block}) — a bordered {colors.surface-raised} block with a word-count label and a real copy `<button>`; the **copied state** fills navy with a white check ("Copied ✓"), and selectable text is always the fallback.
- **Metric** ({components.metric}) — an audience-draw figure in Source Serif 700 in {colors.accent}, a tracked uppercase label, and an italic source, laid in a hairline-gridded 4-up (2-up on mobile) panel.
- **Testimonial** ({components.testimonial}) — an italic quote on {colors.surface-raised} with a 2px {colors.accent} left rule (radius `0 8px 8px 0`) and a quiet attribution.
- **Reel-poster** ({components.reel-poster}) — the one rich visual ([`mockups/speaker-surface.html`](mockups/speaker-surface.html)): an editorial **navy gradient** with a faint cream registration grid, a cream play ring (no autoplay), and corner labels reversed out in {colors.surface-base}. Given visual weight, never spectacle; a static link fallback always accompanies it. Flat.
- **Input** ({components.input}) — {colors.surface-base} field, hairline border, ~9px radius, Source Serif text; focus brings a {colors.accent} border and a soft navy ring; always labeled (visually-hidden where the design omits a visible label).

## Do's and Don'ts

| Do | Don't |
|---|---|
| Treat **restraint as the flex** — calm, credible opening; let the wow build | Front-load spectacle or try to impress on contact |
| One chromatic accent: **{colors.accent} navy**, used sparingly | Add a second accent, neon, or any saturated decoration |
| Warm cream + espresso ink ({colors.surface-base} / {colors.ink-primary}) | Cool clinical white or pure-black `#000` |
| Create depth with **tone + hairlines**; keep everything {elevation.flat} | Add card shadows or gradient surfaces — the Guide is the ONLY elevated surface |
| Reserve **drop-cap & pull-quotes** for the long-form reader | Decorate the index/chrome with editorial flourish |
| All **Source Serif 4**, with the opsz axis doing display vs. text | Gimmick/display fonts, neon type, or all-caps body |
| Mono **only** for tiny route labels / timestamps in the Guide | A monospace "craft-signature" anywhere on the base (Architect mono was declined) |
| Show the work as **proof-as-process** — cite receipts, demonstrate | Hype, "trust me," or unbacked superlatives (the Guide says only what it can back up) |
| Curate to a **polished build-story**; keep backstage docs backstage | Dump raw files, decision logs, or a static-CV grid |
| Carry status in **text + weight + shape**, not color alone | Let a lit tick or a colored dot be the only signal of state |
| Honor JS-off, `prefers-reduced-motion`, and AA at every surface | Make meaning depend on the drafting grid, animation, or the WebGL moment |
| Keep AI references **tasteful and literal-free** (the recursion beat is quiet prose) | Matrix/terminal/"glowing brain" or any literal-AI metaphor |

> [OPEN: headshot asset] The hero portrait and headshot label are a refined styled placeholder (a "JRB" monogram mat with a museum label) — the real headshot asset and its meaningful `alt` are not yet supplied. Not stock / not AI imagery.
> [OPEN: Guide monogram mark] The Guide's avatar/pill glyph is a navy "JB"/ring monogram in the mocks; the final mark is not pinned.
> [OPEN: Speaker Surface real content] The reel video + poster, audience-draw metric figures, conference logos, testimonials, exact signature-talk titles ([ASSUMPTION] in the mock), and the stated response-time N ([TBD]) are placeholders pending real content (content-inventory gap).
> [OPEN: italic web-font weight] The mocks synthesize/borrow italic in places; whether to ship a true Source Serif 4 **italic** file (≈+190KB) or accept synthesized italic for ledes/pull-quotes/captions is a build-time perf call, not yet decided.
> [OPEN: case-study card] The flagship case study (`/work/loandemo`) reuses the {components.artifact-card} pattern by inference from the Timeline flagship + Glass Box; a dedicated case-study layout has not been mocked.
