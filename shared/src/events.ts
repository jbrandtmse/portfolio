// TODO(Story 4.3): align with /api/guide.
// PLACEHOLDER SSE event contract for the Guide stream. The discriminated union
// below is the wire shape the api emits and the GuidePanel island (Story 4.4)
// consumes. Finalize field details alongside the /api/guide implementation.

/** A chunk of streamed answer text. */
export interface TokenEvent {
  type: 'token';
  value: string;
}

/** A source/citation surfaced during the stream. */
export interface CitationEvent {
  type: 'citation';
  id: string;
  title: string;
  url: string;
}

/** Terminal success marker — the stream finished normally. */
export interface DoneEvent {
  type: 'done';
}

/** Terminal error marker — the stream failed. */
export interface ErrorEvent {
  type: 'error';
  message: string;
}

/** Discriminated union of every Guide SSE event (keyed on `type`). */
export type GuideEvent = TokenEvent | CitationEvent | DoneEvent | ErrorEvent;

/** The set of valid Guide SSE event names. */
export type GuideEventType = GuideEvent['type'];
