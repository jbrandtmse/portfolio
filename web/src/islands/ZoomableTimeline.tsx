/**
 * ZoomableTimeline — deferred semantic-zoom island for /timeline/ (Story 6.2).
 *
 * Interaction model (owner decision 1 — CLICK/CONTROL semantic zoom):
 *   Overview: era bands + flagship milestone Dots, cluster Dots collapsed.
 *   Detail:   a focused flagship's cluster Dots expanded, other eras dimmed.
 *   Transition: click/tap/keyboard (Enter/Space) on a flagship, or the explicit
 *   overview↔detail control button. Esc dismisses detail. GSAP animates under
 *   motionAllowed only; reduced-motion = instant level switch.
 *
 * Dot-detail content (owner decision 2 — reuse + link):
 *   Opens the harvested label/date/description + /glass-box/{slug}/ link where one
 *   exists. OPEN Dots show harvested summary + "full reader (6.3/6.4)" affordance.
 *   ZERO fabricated content (Rule 9).
 *
 * Deferred load (NFR-1 / AC5):
 *   This module is dynamically imported by timeline.astro's inline <script> inside
 *   onMotionAllowed, so it and the GSAP chunk are NEVER fetched under reduced-motion.
 *
 * Accessibility:
 *   - All interactive controls are real <button>/<a> with aria-expanded / aria-controls.
 *   - Esc dismisses detail, focus returns to the opener.
 *   - Decorative TimelineDot spans stay aria-hidden in the static baseline.
 *
 * Rule 12: every useCallback/useEffect that captures motionAllowed or focusedId
 *   lists BOTH in its deps array (react-hooks/exhaustive-deps is an ERROR on islands).
 * Rule 13: assertions verify visible cluster Dots + readable detail panel text.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';

import { onMotionAllowed } from '../lib/motion';
import { $timelineFocus } from '../lib/store';
import {
  cleanDescription,
  isOpenStatusHref,
  isRealReaderHref,
  readerAffordance,
} from '../lib/timeline-display';

// ---------------------------------------------------------------------------
// Types — mirror web/src/lib/timeline.ts (browser-safe; no Node fs import)
// ---------------------------------------------------------------------------

export interface TimelineDotEntry {
  label: string;
  date: string;
  state: string;
  href: string;
  description?: string;
}

export interface FlagshipData {
  id: string;
  label: string;
  date: string;
  description: string;
  /**
   * Optional reader href for the flagship itself (Story 6.2). Harvested
   * epics/retros/course-corrections carry `[OPEN]` here → the clean
   * "full reader coming (6.3/6.4)" affordance (never the raw sentinel).
   */
  href?: string;
  cluster: TimelineDotEntry[];
}

export interface EraData {
  id: string;
  label: string;
  entries: FlagshipData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A `/glass-box/…` or full HTTPS link is a "real reader" (resolves today).
 *
 * Delegates to the shared `timeline-display` module so the island and the static
 * `FlagshipNode.astro` make the IDENTICAL reader decision (no drift). Re-exported
 * so the unit test (web/test/timeline-zoom.test.ts) exercises the REAL module
 * export, not an inline copy (skill-rules Rule 8).
 */
export function isRealReader(href: string): boolean {
  return isRealReaderHref(href);
}

/**
 * An [OPEN] href or description means the reader is coming in a future story.
 *
 * Delegates to the shared `timeline-display` module (single source of truth).
 * Exported for the same Rule-8 reason as isRealReader (real export under test).
 */
export function isOpenHref(href: string): boolean {
  return isOpenStatusHref(href);
}

/**
 * Format a date string for display (mirrors formatDotDate in timeline.ts).
 * Exported for the Rule-8 real-module unit test.
 */
export function fmtDate(raw: string): string {
  if (!raw || raw.startsWith('[') || raw.startsWith('~')) return raw;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DotDetailProps {
  dot: TimelineDotEntry;
  onClose: () => void;
  openerRef: React.RefObject<HTMLElement | null>;
  panelId: string;
}

function DotDetail({ dot, onClose, openerRef, panelId }: DotDetailProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the panel on open (AC2 / accessibility).
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Esc dismisses and returns focus to opener (AC2).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        // Focus return is handled by the parent (openerRef).
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Shared reader decision (web/src/lib/timeline-display.ts) — identical to the
  // static FlagshipNode.astro so the two surfaces never diverge. Strip any leaked
  // internal `[OPEN: …]` sentinel from the visible description (belt-and-suspenders:
  // the data is already clean, but this guarantees the raw sentinel can't reach prose).
  const desc = cleanDescription(dot.description);
  const affordance = readerAffordance(dot.href);
  const isExternal = dot.href.startsWith('https://');

  return (
    <div
      id={panelId}
      className="zt-detail-panel"
      role="dialog"
      aria-modal="false"
      aria-label={`Details: ${dot.label}`}
    >
      <button
        ref={closeRef}
        className="zt-detail-panel__close"
        onClick={() => {
          onClose();
          (openerRef.current as HTMLElement | null)?.focus();
        }}
        aria-label="Close detail panel"
      >
        ×
      </button>

      <div className="zt-detail-panel__content">
        <span className="zt-detail-panel__label">{dot.label}</span>
        {dot.date && !dot.date.startsWith('[') && (
          <time className="zt-detail-panel__date" dateTime={dot.date}>
            {fmtDate(dot.date)}
          </time>
        )}
        {desc && <p className="zt-detail-panel__desc">{desc}</p>}

        {affordance.kind === 'link' && (
          <a
            className="zt-detail-panel__reader-link"
            href={affordance.href}
            {...(isExternal ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
          >
            {affordance.label}
          </a>
        )}

        {affordance.kind === 'coming' && (
          <p className="zt-detail-panel__open-note">{affordance.text}</p>
        )}

        {affordance.kind === 'none' && dot.href && dot.href !== '[OPEN]' && (
          <a className="zt-detail-panel__reader-link" href={dot.href}>
            View →
          </a>
        )}
      </div>
    </div>
  );
}

interface FlagshipZoomProps {
  flagship: FlagshipData;
  isExpanded: boolean;
  onToggle: () => void;
  /** Reserved for future GSAP transitions gated on motion permission. */
  motionAllowed: boolean;
  flagshipRef: React.RefObject<HTMLElement | null>;
}

function FlagshipZoom({ flagship, isExpanded, onToggle, flagshipRef }: FlagshipZoomProps) {
  const clusterId = `zt-cluster-${flagship.id}`;
  const [openDot, setOpenDot] = useState<TimelineDotEntry | null>(null);
  const openDotRef = useRef<HTMLElement | null>(null);
  const panelId = useId();

  // Close dot detail on flagship collapse.
  useEffect(() => {
    if (!isExpanded) setOpenDot(null);
  }, [isExpanded]);

  const handleDotOpen = useCallback((dot: TimelineDotEntry, el: HTMLElement) => {
    openDotRef.current = el;
    setOpenDot(dot);
  }, []);

  const handleDotClose = useCallback(() => {
    setOpenDot(null);
    (openDotRef.current as HTMLElement | null)?.focus();
  }, []);

  return (
    <div
      ref={flagshipRef as React.RefObject<HTMLDivElement>}
      className={`zt-flagship${isExpanded ? ' zt-flagship--expanded' : ''}`}
      data-flagship-id={flagship.id}
    >
      {/* Flagship milestone row — the toggle trigger */}
      <button
        className="zt-flagship__trigger"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={clusterId}
        data-testid={`flagship-trigger-${flagship.id}`}
      >
        <span className="zt-flagship__dot-visual" aria-hidden="true" />
        <span className="zt-flagship__title">{flagship.label}</span>
        <time className="zt-flagship__date" dateTime={flagship.date}>
          {fmtDate(flagship.date)}
        </time>
        <span className="zt-flagship__chevron" aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Story 6.2: strip any leaked `[OPEN: …]` sentinel from the flagship's
          description and render the shared clean "reader coming (6.3/6.4)"
          affordance for harvested epics/retros ([OPEN] flagship href) — identical
          decision to the static FlagshipNode.astro (web/src/lib/timeline-display.ts). */}
      {(() => {
        const desc = cleanDescription(flagship.description);
        const affordance = readerAffordance(flagship.href);
        return (
          <>
            {desc && <p className="zt-flagship__desc">{desc}</p>}
            {affordance.kind === 'coming' && (
              <p className="zt-flagship__reader-note">{affordance.text}</p>
            )}
            {affordance.kind === 'link' && (
              <a className="zt-flagship__reader-link" href={affordance.href}>
                {affordance.label}
              </a>
            )}
          </>
        );
      })()}

      {/* Cluster — only visible when expanded (AC1 / AC4: always in DOM for JS-off) */}
      <ol
        id={clusterId}
        className={`zt-cluster${isExpanded ? ' zt-cluster--visible' : ''}`}
        aria-label={`Dots in ${flagship.label}`}
        data-testid={`cluster-${flagship.id}`}
      >
        {flagship.cluster.map((dot, i) => {
          const isOpen = isOpenHref(dot.href);
          const hasRealReader = isRealReader(dot.href);
          const dotBtnId = `zt-dot-${flagship.id}-${i}`;
          return (
            <li key={dot.label} className="zt-cluster__item">
              <span className="zt-dot-visual" aria-hidden="true" data-state={dot.state} />
              <div className="zt-cluster__label">
                <button
                  id={dotBtnId}
                  className="zt-dot-btn"
                  onClick={(e) => handleDotOpen(dot, e.currentTarget)}
                  aria-haspopup="dialog"
                  aria-expanded={openDot?.label === dot.label}
                  aria-controls={openDot?.label === dot.label ? panelId : undefined}
                  data-testid={`dot-btn-${flagship.id}-${i}`}
                >
                  {dot.label}
                  {isOpen && <span className="zt-open-flag"> [reader coming]</span>}
                  {hasRealReader && !isOpen && (
                    <span className="zt-reader-hint" aria-hidden="true">
                      {' '}
                      ↗
                    </span>
                  )}
                </button>
                {dot.date && !dot.date.startsWith('[') && (
                  <time className="zt-cluster__date" dateTime={dot.date}>
                    {fmtDate(dot.date)}
                  </time>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Dot detail panel (dialog) */}
      {openDot && (
        <DotDetail
          dot={openDot}
          onClose={handleDotClose}
          openerRef={openDotRef}
          panelId={panelId}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main island
// ---------------------------------------------------------------------------

export interface ZoomableTimelineProps {
  /** Serialised EraBand[] from the <script type="application/json"> data island. */
  eras: EraData[];
}

export function ZoomableTimeline({ eras }: ZoomableTimelineProps) {
  // ── Motion gate (Rule 12) ────────────────────────────────────────────────
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => {
    onMotionAllowed(() => setMotionAllowed(true));
  }, []);

  // ── Focus / zoom state ────────────────────────────────────────────────────
  const focusedId = useStore($timelineFocus);
  const flagshipRefs = useRef<Map<string, HTMLElement>>(new Map());

  // ── GSAP zoom transition (gated on motionAllowed — Rule 12) ──────────────
  // We use a ref to track the previous focusedId so we can animate transitions.
  const prevFocusedId = useRef<string | null>(null);

  useEffect(() => {
    // Rule 12: motionAllowed and focusedId are BOTH captured — both in deps.
    if (!motionAllowed) {
      prevFocusedId.current = focusedId;
      return;
    }

    // When focus changes with motionAllowed, animate the focused flagship in.
    if (focusedId && focusedId !== prevFocusedId.current) {
      const el = flagshipRefs.current.get(focusedId);
      if (el) {
        // Dynamic import GSAP only when motionAllowed (NFR-1: GSAP already pinned
        // as cinematic-gsap manualChunk — it lands in the deferred chunk, same budget).
        void import('gsap').then(({ gsap }) => {
          gsap.fromTo(
            el,
            { opacity: 0.7, y: 8 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
          );
        });
      }
    }
    prevFocusedId.current = focusedId;
  }, [motionAllowed, focusedId]);

  // ── Keyboard: Esc is a SINGLE-LEVEL dismiss ──────────────────────────────
  // If a Dot detail panel is open, Esc closes ONLY that panel (handled by the
  // DotDetail's own keydown handler, which also returns focus to the opener —
  // AC2). The flagship must STAY expanded in that case, so this top-level
  // handler must NOT also collapse the flagship: collapsing would unmount the
  // opener button and drop focus to <body>, breaking AC2's focus-return promise.
  // Only when NO detail panel is open does Esc step back from detail → overview.
  useEffect(() => {
    // Rule 12: focusedId captured → in deps.
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape' || focusedId === null) return;
      // A Dot detail panel open? Let DotDetail handle this Esc (close panel +
      // focus-return); do not collapse the flagship on the same keystroke.
      const detailOpen = document.querySelector('.zt-detail-panel') !== null;
      if (detailOpen) return;
      $timelineFocus.set(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedId]);

  // ── Overview control ──────────────────────────────────────────────────────
  const controlId = useId();
  const spineId = 'zt-spine';

  const handleOverviewBtn = useCallback(() => {
    // Rule 12: focusedId captured → in deps.
    $timelineFocus.set(null);
  }, []);

  // ── Flagship toggle ───────────────────────────────────────────────────────
  const handleFlagshipToggle = useCallback(
    (id: string) => {
      // Rule 12: focusedId captured → in deps.
      $timelineFocus.set(focusedId === id ? null : id);
    },
    [focusedId],
  );

  // ── Flatten flagships from eras ───────────────────────────────────────────
  const allFlagships: FlagshipData[] = eras.flatMap((era) => era.entries);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="zt-root" id={spineId} aria-label="Zoomable timeline" data-testid="zt-root">
      {/* Overview↔Detail control (AC1 — explicit control) */}
      {focusedId !== null && (
        <div className="zt-nav-bar">
          <button
            id={controlId}
            className="zt-overview-btn"
            onClick={handleOverviewBtn}
            aria-label="Back to timeline overview"
            data-testid="zt-overview-btn"
          >
            ← All milestones
          </button>
          <span className="zt-nav-bar__focused-label" aria-live="polite">
            {allFlagships.find((f) => f.id === focusedId)?.label ?? ''}
          </span>
        </div>
      )}

      {/* Timeline body — one entry per flagship.
          Accessibility: <ol> → <li> (era) → <ol> (entries) → <li> (flagship).
          Each level is a proper list — axe `listitem` rule requires <li> inside <ul>/<ol>. */}
      <ol className="zt-spine" aria-label="Timeline milestones">
        {eras.map((era) => (
          <li key={era.id} className={`zt-era zt-era--${era.id}`} aria-label={`Era: ${era.label}`}>
            <ol className="zt-era__entries" aria-label={`Entries in ${era.label}`}>
              {era.entries.map((flagship) => {
                const isExpanded = focusedId === flagship.id;
                const isOther = focusedId !== null && !isExpanded;
                const flagshipRef: React.RefObject<HTMLElement | null> = {
                  get current() {
                    return flagshipRefs.current.get(flagship.id) ?? null;
                  },
                  set current(el: HTMLElement | null) {
                    if (el) flagshipRefs.current.set(flagship.id, el);
                    else flagshipRefs.current.delete(flagship.id);
                  },
                };

                return (
                  <li
                    key={flagship.id}
                    className={`zt-entry${isExpanded ? ' zt-entry--expanded' : ''}${isOther ? ' zt-entry--dimmed' : ''}`}
                    data-testid={`zt-entry-${flagship.id}`}
                  >
                    <FlagshipZoom
                      flagship={flagship}
                      isExpanded={isExpanded}
                      onToggle={() => handleFlagshipToggle(flagship.id)}
                      motionAllowed={motionAllowed}
                      flagshipRef={flagshipRef}
                    />
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
