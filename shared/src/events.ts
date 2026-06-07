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

/** Discriminated union of every Guide SSE event (keyed on `type`). */
export type GuideEvent = TokenEvent | CitationEvent | DoneEvent | ErrorEvent;

/** The set of valid Guide SSE event names. */
export type GuideEventType = GuideEvent['type'];
