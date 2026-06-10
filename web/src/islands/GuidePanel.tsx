/**
 * GuidePanel — the Guide conversational panel (Story 4.4, the FINAL Epic-4 island).
 *
 * Accessibility model (AC2, Decision 4 — the a11y heart):
 *   - NON-modal dialog: role="dialog" aria-modal="false". Focus MOVES IN on open
 *     but is NOT trapped. No scrim/backdrop. The page stays interactive behind it.
 *   - role="log" aria-live="polite" transcript — announced per COMPLETED message,
 *     NEVER per token (NFR-2).
 *   - role="status" for the per-message thinking state — announced ONCE on
 *     transition (never per token). NFR-2.
 *   - All controls are real <button> / <a>, keyboard-operable, visible :focus-visible.
 *
 * SSE consumption (AC3, Decision 5):
 *   - POSTs {query, threadContext} to /api/guide.
 *   - Renders the GuideEvent union: token / citation{route,label} / done / error.
 *   - Citation chips route the page BEHIND while the conversation persists (FR-7).
 *   - error → the in-voice fallback message (not a raw error string).
 *
 * Focus management (AC4, Decision 6):
 *   - On open: focus moves into the panel (composer input).
 *   - On close/minimize (Esc OR button): focus RETURNS to the pill (thread preserved).
 *   - On citation follow: focus STAYS in panel; "Opened: <label>" announced via aria-live.
 *   - Skip-link to the routed Mirror <h1> available after citation navigation.
 *
 * Analytics (Decision 7): guide-opened / guide-query / citation-followed via track().
 * No PII (no query/answer text; counts/booleans only). No-op when Umami unset (NFR-5).
 *
 * Reduced motion (Decision 7): panel motion behind onMotionAllowed (NFR-2).
 *
 * Voice: no exclamation marks. Positive-assertion, no hype.
 *
 * NFR-1: This component is LAZILY imported by GuidePill — it does NOT load on a
 * content route's initial page load. The React runtime is shared; only this chunk
 * is deferred until the Guide is first opened. Content routes ship only the small
 * GuidePill control on initial load.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';

import type { GuideEvent, CitationEvent, RecurationEvent } from '@portfolio/shared/events';
import { STARTER_PROMPTS } from '../data/faq';
import { track } from '../lib/analytics';
import { onMotionAllowed } from '../lib/motion';
import { applyRecuration, initRecuration } from '../lib/recuration';
import { $depth, $guideOpen } from '../lib/store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TurnMessage {
  role: 'user' | 'guide';
  content: string;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'guide';
  text: string;
  citations: CitationEvent[];
  isStreaming: boolean;
  isError: boolean;
}

type ThinkingState = 'idle' | 'reading' | 'reading-sources';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GREETING = "I'm your guide to Joshua's work. I only say what it can back up.";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GuidePanel({ pillRef }: { pillRef?: React.RefObject<HTMLButtonElement | null> }) {
  const isOpen = useStore($guideOpen);
  // Story 5.2: read the visitor's chosen depth from the nanostore.
  // Passed in every /api/guide request to tune answer verbosity/detail only.
  // The grounding/fail-closed/citation contract is unchanged (FR-6/7/9).
  const currentDepth = useStore($depth);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  const navAnnounceRef = useRef<HTMLDivElement>(null);

  // Restore transcript from sessionStorage (persists across citation-driven navigations).
  // This is the mechanism that lets "conversation persists" after a citation routes
  // the page behind to a Mirror route (AC4, FR-7). Without sessionStorage, a full
  // page navigation would destroy React state entirely.
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(() => {
    if (typeof sessionStorage === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem('guide-transcript');
      return saved ? (JSON.parse(saved) as TranscriptEntry[]) : [];
    } catch {
      return [];
    }
  });

  const [inputValue, setInputValue] = useState('');
  const [thinkingState, setThinkingState] = useState<ThinkingState>('idle');
  const [thinkingSources, setThinkingSources] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [skipTarget, setSkipTarget] = useState<string | null>(null);
  const [navAnnouncement, setNavAnnouncement] = useState('');

  const idPrefix = useId();
  const dialogId = `${idPrefix}-guide-dialog`;
  const transcriptId = `${idPrefix}-transcript`;
  const statusId = `${idPrefix}-status`;
  const navAnnounceId = `${idPrefix}-nav-announce`;

  // Persist transcript to sessionStorage whenever it changes (AC4 FR-7 — conversation
  // persists across citation-driven page navigations; sessions scoped to the tab).
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    try {
      // Only persist completed entries (not streaming placeholders)
      const toSave = transcript.filter((t) => !t.isStreaming);
      sessionStorage.setItem('guide-transcript', JSON.stringify(toSave));
    } catch {
      // sessionStorage quota exceeded — ignore silently (still functional in-session)
    }
  }, [transcript]);

  // ---------------------------------------------------------------------------
  // Focus management (AC4)
  // ---------------------------------------------------------------------------

  // Track whether we had focus inside the panel before it was closed
  const hadFocusInsideRef = useRef(false);

  // Focus into panel when it opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let Astro's island re-render settle
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Return focus to pill on close (thread preserved — state not reset)
  const closePanel = useCallback(() => {
    $guideOpen.set(false);
    // Return focus to pill after the DOM settles
    setTimeout(() => {
      pillRef?.current?.focus();
    }, 50);
  }, [pillRef]);

  // Esc key handler — only when focus is inside the panel (non-modal: must not
  // intercept Esc when the panel is not focused, per standard non-modal behavior)
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      // Only close if focus is inside the panel (non-modal — don't steal Esc
      // from the page when panel isn't focused)
      if (panelRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        closePanel();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closePanel]);

  // Track focus inside panel
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    function onFocusIn() {
      hadFocusInsideRef.current = true;
    }
    function onFocusOut(e: FocusEvent) {
      if (!panel!.contains(e.relatedTarget as Node)) {
        hadFocusInsideRef.current = false;
      }
    }

    panel.addEventListener('focusin', onFocusIn);
    panel.addEventListener('focusout', onFocusOut);
    return () => {
      panel.removeEventListener('focusin', onFocusIn);
      panel.removeEventListener('focusout', onFocusOut);
    };
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Re-curation (Story 5.3, FR-10)
  // ---------------------------------------------------------------------------

  // Initialize the home page for re-curation on first mount (sets CSS order to
  // canonical source order; marks main.home as data-recuration-ready).
  useEffect(() => {
    initRecuration();
  }, []);

  // ---------------------------------------------------------------------------
  // Reduced motion (Decision 7)
  // ---------------------------------------------------------------------------

  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => {
    onMotionAllowed(() => setMotionAllowed(true));
  }, []);

  // ---------------------------------------------------------------------------
  // SSE / send (AC3)
  // ---------------------------------------------------------------------------

  const sendQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || isStreaming) return;

      const userEntryId = `${idPrefix}-msg-${Date.now()}-user`;
      const guideEntryId = `${idPrefix}-msg-${Date.now()}-guide`;

      // Add user turn to transcript
      setTranscript((prev) => [
        ...prev,
        {
          id: userEntryId,
          role: 'user',
          text: query,
          citations: [],
          isStreaming: false,
          isError: false,
        },
      ]);

      // Build threadContext from prior turns (capped to last 10 turns)
      const priorTurns: TurnMessage[] = transcript
        .slice(-10)
        .map((t) => ({ role: t.role, content: t.text }));

      // Thinking state start
      setThinkingState('reading');
      setThinkingSources([]);
      setIsStreaming(true);

      // Initialize guide turn placeholder
      setTranscript((prev) => [
        ...prev,
        {
          id: guideEntryId,
          role: 'guide',
          text: '',
          citations: [],
          isStreaming: true,
          isError: false,
        },
      ]);

      // Fire analytics (no PII — no query text)
      track('guide-query');

      try {
        const res = await fetch('/api/guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            threadContext: priorTurns.length > 0 ? priorTurns : undefined,
            // Story 5.2: include the visitor's chosen depth to tune answer verbosity.
            // The api tunes verbosity/detail ONLY; grounding/safety contract unchanged.
            depth: currentDepth,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        const collectedCitations: CitationEvent[] = [];
        let collectedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });

          // Parse SSE blocks (double-newline delimited)
          const blocks = buf.split('\n\n');
          buf = blocks.pop() ?? '';

          for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split('\n');
            let eventName = '';
            let dataStr = '';
            for (const line of lines) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              if (line.startsWith('data:')) dataStr = line.slice(5).trim();
            }
            if (!eventName || !dataStr) continue;

            let parsed: GuideEvent;
            try {
              parsed = JSON.parse(dataStr) as GuideEvent;
            } catch {
              continue;
            }

            if (parsed.type === 'recuration') {
              // Story 5.3 / 5.4, FR-10: apply the re-curation directive in place.
              // GuidePanel → recuration controller → CSS `order` (DOM unchanged, FR-8).
              // Story 5.4: pass deepen/skip + motionAllowed so the controller
              // can apply depth tiers + drive the camera inside the motion gate.
              // Story 7.2: pass featuredOrder (OPTIONAL) so the controller
              // reorders the home featured-work items via CSS `order`. A client
              // receiving a 5.x event (no featuredOrder) still works — absent = no reorder.
              const rec = parsed as RecurationEvent;
              applyRecuration(
                {
                  intent: rec.intent,
                  order: rec.order,
                  deepen: rec.deepen,
                  skip: rec.skip,
                  featuredOrder: rec.featuredOrder,
                },
                motionAllowed,
              );
            } else if (parsed.type === 'token') {
              collectedText += parsed.value;
              setTranscript((prev) =>
                prev.map((t) => (t.id === guideEntryId ? { ...t, text: collectedText } : t)),
              );
            } else if (parsed.type === 'citation') {
              // Update thinking state with named source
              setThinkingSources((prev) => {
                const next = [...prev, parsed.label];
                setThinkingState('reading-sources');
                return next;
              });
              collectedCitations.push(parsed);
              setTranscript((prev) =>
                prev.map((t) =>
                  t.id === guideEntryId ? { ...t, citations: [...collectedCitations] } : t,
                ),
              );
            } else if (parsed.type === 'done') {
              // Announce completed message ONCE via aria-live (per-message, NFR-2)
              setTranscript((prev) =>
                prev.map((t) => (t.id === guideEntryId ? { ...t, isStreaming: false } : t)),
              );
              setThinkingState('idle');
              setIsStreaming(false);
              // Scroll transcript into view
              setTimeout(() => {
                transcriptRef.current?.scrollTo({
                  top: transcriptRef.current.scrollHeight,
                  behavior: 'smooth',
                });
              }, 50);
            } else if (parsed.type === 'error') {
              // In-voice fallback (not a raw error string)
              const fallback =
                parsed.message ||
                "I couldn't retrieve that right now. Try rephrasing your question.";
              setTranscript((prev) =>
                prev.map((t) =>
                  t.id === guideEntryId
                    ? { ...t, text: fallback, isStreaming: false, isError: true }
                    : t,
                ),
              );
              setThinkingState('idle');
              setIsStreaming(false);
            }
          }
        }
      } catch {
        setTranscript((prev) =>
          prev.map((t) =>
            t.id === guideEntryId
              ? {
                  ...t,
                  text: "I couldn't retrieve that right now. Try rephrasing your question.",
                  isStreaming: false,
                  isError: true,
                }
              : t,
          ),
        );
        setThinkingState('idle');
        setIsStreaming(false);
      }
    },
    // currentDepth MUST be a dependency: sendQuery is memoized, and a depth-only
    // change (the dial) re-renders this component WITHOUT touching the other deps.
    // Omitting currentDepth would memoize a STALE closure that posts the depth as
    // of the previous query/mount — not the dial's current value — breaking AC2
    // (the GuidePanel must include the CHOSEN depth in /api/guide). (Story 5.2 CR)
    //
    // motionAllowed MUST be a dependency: sendQuery captures motionAllowed in its
    // closure and passes it to applyRecuration (line ~326). motionAllowed is
    // useState(false) flipped to true by the onMotionAllowed mount effect. Without
    // this dep, the closure stales at false — the entire motionAllowed-gated block
    // (data-skip marking + goToScene camera driving) is inert, so SKIP and
    // camera-driving never fire on a real motion-enabled visit. (Story 5.4 QA HIGH)
    [isStreaming, transcript, idPrefix, currentDepth, motionAllowed],
  );

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      const q = inputValue.trim();
      if (!q) return;
      setInputValue('');
      void sendQuery(q);
    },
    [inputValue, sendQuery],
  );

  const handleChipClick = useCallback(
    (question: string) => {
      if (isStreaming) return;
      void sendQuery(question);
    },
    [isStreaming, sendQuery],
  );

  // ---------------------------------------------------------------------------
  // Citation follow (AC4, FR-7)
  // ---------------------------------------------------------------------------

  const handleCitationClick = useCallback(
    (_e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
      // Do NOT e.preventDefault() — let the browser navigate normally.
      // The citation IS an <a href> so the page routes behind while the panel stays.
      // Fire analytics (no PII)
      track('citation-followed');

      // Announce the navigation via aria-live (focus stays in panel)
      setNavAnnouncement(`Opened: ${label}`);
      setTimeout(() => setNavAnnouncement(''), 3000);

      // Set skip target so the skip-link can route to the Mirror <h1>
      setSkipTarget('#guide-skip-target');

      // Keep focus in the panel (don't move it to the new page content automatically)
      // The <a> click will navigate the page; focus stays here per non-modal pattern
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Thinking state text
  // ---------------------------------------------------------------------------

  let thinkingText = '';
  if (thinkingState === 'reading') thinkingText = 'Reading the record';
  else if (thinkingState === 'reading-sources')
    thinkingText = `Reading: ${thinkingSources.join(', ')}`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!isOpen) return null;

  const hasTranscript = transcript.length > 0;
  const showStarterChips = !hasTranscript && !isStreaming;

  return (
    <>
      {/* Skip-link: available after a citation routes the page behind */}
      {skipTarget && (
        <a ref={skipLinkRef} href={skipTarget} className="guide-skip-link" tabIndex={0}>
          Skip to page content
        </a>
      )}

      {/* Navigation announcement (aria-live, focus stays in panel) */}
      <div
        ref={navAnnounceRef}
        id={navAnnounceId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="guide-sr-only"
      >
        {navAnnouncement}
      </div>

      {/* NON-MODAL DIALOG — the a11y heart (AC2, Decision 4)
          aria-modal="false": focus moves in but is NOT trapped.
          No scrim/backdrop. The page stays interactive behind it. */}
      <div
        ref={panelRef}
        id={dialogId}
        role="dialog"
        aria-modal="false"
        aria-label="Ask my Guide"
        aria-labelledby={`${dialogId}-title`}
        className={`guide-panel${motionAllowed ? ' guide-panel--animated' : ''}`}
        data-testid="guide-panel"
      >
        {/* Head: monogram + status line + controls */}
        <div className="guide-panel__head">
          <div className="guide-panel__head-left">
            <span className="guide-panel__monogram" aria-hidden="true">
              JRB
            </span>
            <div>
              <span id={`${dialogId}-title`} className="guide-panel__title">
                Guide
              </span>
              <span className="guide-panel__status-badge">Grounded · cites its sources</span>
            </div>
          </div>
          <div className="guide-panel__head-controls">
            <button
              type="button"
              className="guide-panel__head-btn"
              aria-label="Minimize Guide"
              onClick={closePanel}
            >
              <span aria-hidden="true">−</span>
            </button>
            <button
              type="button"
              className="guide-panel__head-btn"
              aria-label="Close Guide"
              onClick={closePanel}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        {/* Thinking state — announced ONCE via role="status" (NFR-2, per-message) */}
        <div
          id={statusId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`guide-panel__thinking${thinkingState !== 'idle' ? ' guide-panel__thinking--active' : ''}`}
          aria-hidden={thinkingState === 'idle' ? 'true' : undefined}
        >
          {thinkingState !== 'idle' && (
            <span className="guide-panel__thinking-text">{thinkingText}</span>
          )}
        </div>

        {/* Transcript — role="log" aria-live="polite", announced per completed
            message, NEVER per token (NFR-2). aria-busy is set WHILE a guide turn
            streams so assistive tech holds polite announcements until the message
            completes (isStreaming → false), then announces the settled answer
            once. Without aria-busy, the streaming entry's text mutates on every
            token inside this live region and AT may announce per-token (the
            anti-pattern NFR-2 forbids) — relying on AT coalescing is not a stable
            contract (W3C live-region semantics). */}
        <div
          ref={transcriptRef}
          id={transcriptId}
          role="log"
          aria-live="polite"
          aria-busy={isStreaming}
          aria-label="Conversation transcript"
          className="guide-panel__transcript"
          data-testid="guide-transcript"
        >
          {/* Greeting — always present as the first entry (in-voice, no exclamation) */}
          <div className="guide-panel__entry guide-panel__entry--guide guide-panel__greeting">
            <p className="guide-panel__text">{GREETING}</p>
          </div>

          {/* Starter chips — shown when there's no transcript yet */}
          {showStarterChips && (
            <div className="guide-panel__chips" role="group" aria-label="Starter questions">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt.question}
                  type="button"
                  className="guide-panel__chip"
                  onClick={() => handleChipClick(prompt.question)}
                  data-testid="guide-chip"
                >
                  {prompt.question}
                </button>
              ))}
            </div>
          )}

          {/* Transcript entries */}
          {transcript.map((entry) => (
            <div
              key={entry.id}
              className={`guide-panel__entry guide-panel__entry--${entry.role}${entry.isStreaming ? ' guide-panel__entry--streaming' : ''}${entry.isError ? ' guide-panel__entry--error' : ''}`}
            >
              <p
                className="guide-panel__text"
                aria-label={entry.role === 'user' ? 'Your question' : 'Guide answer'}
              >
                {entry.text}
                {entry.isStreaming && <span className="guide-panel__cursor" aria-hidden="true" />}
              </p>

              {/* Citation chips — from citation events (FR-7) */}
              {entry.citations.length > 0 && (
                <div className="guide-panel__citations" role="list" aria-label="Sources cited">
                  {entry.citations.map((cite, idx) => (
                    <a
                      key={`${cite.route}-${idx}`}
                      href={cite.route}
                      role="listitem"
                      className="guide-panel__citation-chip"
                      aria-label={`Source: ${cite.label}`}
                      onClick={(e) => handleCitationClick(e, cite.label)}
                      data-testid="guide-citation"
                    >
                      {cite.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Composer: labeled input + send button */}
        <form className="guide-panel__composer" onSubmit={handleSubmit} aria-label="Ask a question">
          <label htmlFor={`${idPrefix}-input`} className="guide-sr-only">
            Ask a question
          </label>
          <input
            ref={inputRef}
            id={`${idPrefix}-input`}
            type="text"
            className="guide-panel__input"
            placeholder="Ask about the work…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isStreaming}
            autoComplete="off"
            maxLength={1000}
            aria-autocomplete="none"
            data-testid="guide-input"
          />
          <button
            type="submit"
            className="guide-panel__send"
            disabled={isStreaming || !inputValue.trim()}
            aria-label="Send question"
            data-testid="guide-send"
          >
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>

      <style>{`
        /* Guide skip-link — visible on focus, screen-reader-accessible after citation nav */
        .guide-skip-link {
          position: fixed;
          top: 8px;
          left: 8px;
          z-index: 9999;
          padding: 8px 16px;
          background: var(--color-accent);
          color: var(--color-surface-base);
          font-family: var(--font-family-base);
          font-size: 14px;
          font-weight: 600;
          border-radius: var(--radius-md);
          text-decoration: none;
          transform: translateY(-120%);
          transition: transform 0.15s ease;
        }
        .guide-skip-link:focus {
          transform: translateY(0);
          outline: 2px solid var(--color-surface-base);
          outline-offset: 2px;
        }

        /* SR-only utility */
        .guide-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }

        /* NON-MODAL PANEL — the single elevated surface (--shadow-float is the
           reserved token for the Guide; applied here, nowhere else in the flat system) */
        .guide-panel {
          position: fixed;
          bottom: 80px;
          right: 20px;
          z-index: 1000;
          width: min(400px, calc(100vw - 40px));
          /* Definite height (not just max-height) so the column flex resolves and
             the transcript (flex:1 1 0; min-height:0; overflow-y:auto) fills the
             remaining space and SCROLLS. With only max-height + a flex-basis:0
             transcript, the panel never grows past its non-transcript children, so
             only ~one line of an answer showed and nothing scrolled. */
          height: min(600px, calc(100vh - 100px));
          display: flex;
          flex-direction: column;
          background: var(--color-surface-base);
          border: 1px solid var(--color-border-hairline);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-float);
          overflow: hidden;
          /* No backdrop/scrim — non-modal (Decision 4) */
        }

        /* Desktop home only: the SceneRail is a fixed 208px right sidebar, so
           anchor the panel to the LEFT of it (clear of the rail) — matches the
           pill's offset so the two stay aligned. body:has(.rail-d) targets the
           home page (the only page that renders the SceneRail); the rail is the
           right sidebar at >=1024px. */
        @media (min-width: 1024px) {
          body:has(.rail-d) .guide-panel {
            right: 228px;
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .guide-panel--animated {
            animation: guide-panel-in 180ms ease both;
          }
          @keyframes guide-panel-in {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }

        /* Head */
        .guide-panel__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          padding: 12px 14px 10px;
          border-bottom: 1px solid var(--color-border-hairline);
          flex-shrink: 0;
        }

        .guide-panel__head-left {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .guide-panel__monogram {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border-hairline);
          border-radius: 50%;
          font-family: var(--font-family-base);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--color-ink-secondary);
          flex-shrink: 0;
        }

        .guide-panel__title {
          display: block;
          font-family: var(--font-family-base);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-ink-primary);
          line-height: 1.2;
        }

        .guide-panel__status-badge {
          display: block;
          font-family: var(--font-family-base);
          font-size: 11px;
          color: var(--color-ink-secondary);
          letter-spacing: 0.02em;
          line-height: 1.2;
        }

        .guide-panel__head-controls {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .guide-panel__head-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid var(--color-border-hairline);
          border-radius: var(--radius-sm);
          font-family: var(--font-family-base);
          font-size: 16px;
          color: var(--color-ink-secondary);
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: background-color 0.1s ease, color 0.1s ease;
        }

        .guide-panel__head-btn:hover {
          background: var(--color-surface-raised);
          color: var(--color-ink-primary);
        }

        .guide-panel__head-btn:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        /* Thinking state — role="status", announced once (NFR-2) */
        .guide-panel__thinking {
          min-height: 0;
          overflow: hidden;
          transition: min-height 0.15s ease;
          flex-shrink: 0;
        }

        .guide-panel__thinking--active {
          min-height: 28px;
          padding: 5px 14px;
          border-bottom: 1px solid var(--color-border-hairline);
          background: var(--color-surface-raised);
        }

        .guide-panel__thinking-text {
          font-family: var(--font-family-base);
          font-size: 11px;
          font-style: italic;
          color: var(--color-ink-secondary);
          letter-spacing: 0.02em;
        }

        /* Transcript — role="log" aria-live="polite" */
        .guide-panel__transcript {
          flex: 1 1 0;
          /* min-height:0 lets this flex item shrink below its content size so
             overflow-y:auto actually scrolls (the flex min-height:auto default
             would otherwise keep it as tall as its content — no scroll). */
          min-height: 0;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
        }

        .guide-panel__entry {
          max-width: 100%;
        }

        .guide-panel__entry--user {
          align-self: flex-end;
        }

        .guide-panel__entry--guide {
          align-self: flex-start;
        }

        .guide-panel__greeting {
          align-self: flex-start;
        }

        .guide-panel__text {
          font-family: var(--font-family-base);
          font-size: 14px;
          line-height: 1.55;
          color: var(--color-ink-primary);
          margin: 0;
          padding: 10px 12px;
          background: var(--color-surface-raised);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-hairline);
          word-break: break-word;
        }

        .guide-panel__entry--user .guide-panel__text {
          background: var(--color-accent);
          color: var(--color-surface-base);
          border-color: var(--color-accent);
        }

        .guide-panel__entry--error .guide-panel__text {
          border-color: #d97706;
          background: #fffbeb;
        }

        .guide-panel__cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--color-ink-secondary);
          margin-left: 2px;
          vertical-align: text-bottom;
        }

        @media (prefers-reduced-motion: no-preference) {
          .guide-panel__cursor {
            animation: guide-cursor-blink 1s step-end infinite;
          }
          @keyframes guide-cursor-blink {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0; }
          }
        }

        /* Starter chips */
        .guide-panel__chips {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-top: 4px;
        }

        .guide-panel__chip {
          text-align: left;
          padding: 9px 12px;
          background: transparent;
          border: 1px solid var(--color-border-hairline);
          border-radius: var(--radius-md);
          font-family: var(--font-family-base);
          font-size: 13px;
          color: var(--color-ink-secondary);
          cursor: pointer;
          transition: background-color 0.1s ease, color 0.1s ease, border-color 0.1s ease;
          line-height: 1.4;
        }

        .guide-panel__chip:hover {
          background: var(--color-surface-raised);
          color: var(--color-ink-primary);
          border-color: var(--color-accent);
        }

        .guide-panel__chip:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .guide-panel__chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Citation chips — real <a> links (FR-7) */
        .guide-panel__citations {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }

        .guide-panel__citation-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: transparent;
          border: 1px solid var(--color-accent);
          border-radius: 20px;
          font-family: var(--font-family-base);
          font-size: 12px;
          font-weight: 500;
          color: var(--color-accent);
          text-decoration: none;
          transition: background-color 0.1s ease;
          line-height: 1.3;
        }

        .guide-panel__citation-chip:hover {
          background: rgba(30, 58, 95, 0.06);
        }

        .guide-panel__citation-chip:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        /* Composer */
        .guide-panel__composer {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 10px 12px;
          border-top: 1px solid var(--color-border-hairline);
          flex-shrink: 0;
          background: var(--color-surface-base);
        }

        .guide-panel__input {
          flex: 1 1 0;
          padding: 8px 10px;
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border-hairline);
          border-radius: var(--radius-md);
          font-family: var(--font-family-base);
          font-size: 14px;
          color: var(--color-ink-primary);
          min-width: 0;
          outline: none;
          transition: border-color 0.1s ease, box-shadow 0.1s ease;
        }

        .guide-panel__input::placeholder {
          color: var(--color-ink-secondary);
          opacity: 0.7;
        }

        .guide-panel__input:focus-visible {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.12);
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .guide-panel__input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .guide-panel__send {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--color-accent);
          border: none;
          border-radius: var(--radius-md);
          font-size: 16px;
          color: var(--color-surface-base);
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color 0.1s ease;
          padding: 0;
        }

        .guide-panel__send:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }

        .guide-panel__send:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }

        .guide-panel__send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive — narrower panel on small viewports */
        @media (max-width: 480px) {
          .guide-panel {
            bottom: 70px;
            right: 12px;
            left: 12px;
            width: auto;
          }
        }
      `}</style>
    </>
  );
}

export default GuidePanel;
