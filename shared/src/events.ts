// GuideEvent SSE contract finalized in Story 4.3 (retro A5 / [1.1]).
// This is the wire shape the api (Story 4.3) emits and the GuidePanel island
// (Story 4.4) consumes. `shared/` is the single source for both api and web;
// CitationEvent reconciled to architecture §Format Patterns: {type,route,label}
// matching Story 4.1 RetrievedChunk.{route,label} (drops placeholder {id,title,url}).

/** A chunk of streamed answer text. */
export interface TokenEvent {
  type: 'token';
  value: string;
}

/**
 * A source/citation surfaced during the stream.
 * `route` is a Mirror route (e.g. `/about/`); `label` is human-readable
 * (e.g. `About Joshua`). Matches Story 4.1 RetrievedChunk.{route,label}.
 * Architecture §Format Patterns: `citation {route, label}`.
 */
export interface CitationEvent {
  type: 'citation';
  route: string;
  label: string;
}

/** Terminal success marker — the stream finished normally. */
export interface DoneEvent {
  type: 'done';
}

/** Terminal error marker — the stream failed or degraded gracefully. */
export interface ErrorEvent {
  type: 'error';
  message: string;
}

/**
 * Agent re-curation directive emitted when the Guide classifies visitor intent
 * and maps it to a home Scene ordering (Story 5.3, FR-10).
 *
 * `intent`  — the classified bucket: one of the 4-intent SM-C1-guarded enum.
 * `order`   — the full Scene sequence (a permutation of all 7 SceneIds) that
 *              the web controller should apply via CSS `order`.
 * `deepen`  — (Story 5.4, FR-4) OPTIONAL. SceneIds to render at deep detail
 *              via the Story 5.2 `$depth` mechanism. The api owns this; the
 *              model NEVER emits it. Absent = no deepening (backward-compat).
 * `skip`    — (Story 5.4, FR-4) OPTIONAL. SceneIds the camera tour should
 *              omit. SKIP IS TOUR-OMISSION ONLY — the scene STAYS in the DOM,
 *              scroll, scene-rail, Mirror, and JS-off (FR-8 HARD guard). The
 *              api owns this set (SM-C1-guarded); the model NEVER emits it.
 *              Absent = no skipping (backward-compat).
 *
 * The api owns the fixed intent→order/deepen/skip TABLES (the model NEVER
 * emits raw ordering, deepen sets, or skip sets). This event is ADDITIVE — a
 * 5.3-era client that ignores deepen/skip still works (backward-compatible).
 */
export interface RecurationEvent {
  type: 'recuration';
  /** The classified visitor intent bucket. */
  intent: 'organizer' | 'builder' | 'explorer' | 'default';
  /**
   * The home Scene ordering — a permutation of all 7 SceneIds with `hero`
   * always first (SM-C1 hard guard). Values are the section `id` attributes.
   */
  order: string[];
  /**
   * (Story 5.4) SceneIds to render at deep detail (Story 5.2 `$depth`).
   * Server-owned; the model never emits this. Absent = [] (no deepening).
   */
  deepen?: string[];
  /**
   * (Story 5.4) SceneIds the camera tour omits (guided-tour omission only).
   * The scenes stay in the DOM + scroll + rail + Mirror + JS-off (FR-8).
   * Server-owned + SM-C1-guarded; the model never emits this. Absent = [].
   */
  skip?: string[];
}

/** Discriminated union of every Guide SSE event (keyed on `type`). */
export type GuideEvent = TokenEvent | CitationEvent | DoneEvent | ErrorEvent | RecurationEvent;

/** The set of valid Guide SSE event names. */
export type GuideEventType = GuideEvent['type'];
