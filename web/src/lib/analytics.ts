/**
 * analytics.ts — the privacy-first analytics foundation (Story 1.10, AC2 / IAC-2;
 * FR-36; AR-10). The single typed seam every funnel surface uses to record an
 * event, so the event vocabulary lives in ONE place and stays consistent across
 * the whole funnel (architecture.md §Communication-Patterns).
 *
 * BACKING SERVICE: self-hosted, COOKIELESS Umami (AR-10). Its `<head>` script
 * (wired ENV-GATED in BaseLayout — see PUBLIC_UMAMI_SRC / PUBLIC_UMAMI_WEBSITE_ID)
 * exposes `window.umami.track(...)`. This module is the typed wrapper around it.
 *
 * TWO WAYS AN EVENT FIRES (both end up in Umami):
 *   1. 0-JS static surfaces  → a `data-umami-event="<name>"` attribute on the
 *      real <a>/<button>. Umami's own script handles the click; NO app JS, so the
 *      0-JS-by-default floor (NFR-1) is preserved. The ONE Stage-1 surface — the
 *      /about channel links (`channel-clicked`) — uses this form.
 *   2. Island / behavioral surfaces (Epics 3–4: the Guide, the invite form, the
 *      speaker reel) → call `track(event, data?)` from their island JS.
 *
 * PRIVACY (NFR-7 / §9.2): events carry NO PII and NO message bodies — only the
 * small, non-identifying props enumerated per event in later stories. `track`
 * cannot enforce this at the type level for arbitrary callers, so the contract is
 * documented and the `data` type is intentionally narrow (primitive values only).
 *
 * SSR-SAFE: this module touches `window` ONLY inside `track`'s body (never at
 * import time), so importing it during Astro's server build / SSR is safe. With
 * no Umami present (Umami not yet stood up, the default key-free build, or JS-off)
 * `track` is a silent no-op (NFR-5: the static runtime needs no analytics to work).
 */

/**
 * The complete, ordered set of analytics events — kebab `area-action`
 * (architecture.md §Communication-Patterns). This is the SINGLE source of truth
 * for the event vocabulary; every surface references a member of this list.
 *
 * Stage-1 wiring status (the rest fire as their surfaces land):
 *   • channel-clicked   — WIRED now: the /about channel links (this story).
 *   • guide-opened      — Epic 4 (the Guide island opens).
 *   • guide-query       — Epic 4 (a query is submitted to the Guide).
 *   • citation-followed — Epic 4 (a Guide citation link is followed).
 *   • invite-submitted  — Epic 3 (the Invite-Me form is submitted).
 *   • speaker-reel-played — Epic 3 (the speaker reel is played).
 */
export const ANALYTICS_EVENTS = [
  'guide-opened',
  'guide-query',
  'citation-followed',
  'invite-submitted',
  'channel-clicked',
  'speaker-reel-played',
] as const;

/** A valid analytics event name — one of the six kebab `area-action` events. */
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/**
 * Non-PII event properties. Primitive values only (string | number | boolean) —
 * matching what Umami's `data-umami-event-*` attributes and `umami.track` accept,
 * and a structural nudge AWAY from attaching objects/PII. NEVER include names,
 * emails, inquiry message bodies, or raw Guide query text (NFR-7).
 */
export type AnalyticsEventData = Record<string, string | number | boolean>;

/**
 * Minimal shape of the global Umami tracker the cookieless `<head>` script
 * installs. Declared as the OPTIONAL `window.umami` so every `track` call is
 * guarded — the property is absent until/unless the env-gated script loads.
 */
declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: AnalyticsEventData) => void;
    };
  }
}

/**
 * Record an analytics event. SSR-safe and no-op-safe:
 *   • returns immediately when there is no `window` (server build / SSR),
 *   • returns immediately when Umami is not present (`window.umami` undefined —
 *     the default key-free build, Umami not yet stood up, or JS disabled).
 *
 * The `event` param is the typed `AnalyticsEvent` union, so callers cannot invent
 * an off-vocabulary event name. Pass only non-PII `data` (see AnalyticsEventData).
 *
 * @example
 *   import { track } from '../lib/analytics';
 *   track('guide-query');                          // no props
 *   track('citation-followed', { position: 1 });   // non-PII props only
 */
export function track(event: AnalyticsEvent, data?: AnalyticsEventData): void {
  // SSR / no-DOM: nothing to do (and `window` does not exist).
  if (typeof window === 'undefined') return;
  // Umami absent (default key-free build, JS-off, or instance not yet up): no-op.
  if (data === undefined) {
    window.umami?.track(event);
  } else {
    window.umami?.track(event, data);
  }
}
