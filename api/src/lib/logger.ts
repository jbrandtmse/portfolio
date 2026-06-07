/**
 * logger.ts — Structured JSON event logger for the api service (Story 4.3).
 *
 * Emits newline-delimited JSON log events to stdout (compatible with log
 * aggregators). Used by the Guide endpoint for:
 *   - `retrieval_miss` events (NFR-7/AR-11): logged when retrieval is empty
 *     or below threshold. Contains {query, topScore, threshold} — the query
 *     string IS logged here (the one diagnostic place where it is permitted;
 *     no other PII is included — no IP, no email, no user identifier).
 *   - `injection_attempt` events: logged when a visitor message matches a
 *     known injection pattern. Contains the matched pattern (not the raw
 *     visitor text — no PII beyond the pattern category).
 *
 * NFR-7 / AR-11 compliance:
 *   - No PII beyond the query string in retrieval_miss (documented exception).
 *   - No visitor message content in injection_attempt (only matched pattern).
 *   - No IP, no email, no user identifier in any event.
 *
 * Exports a plain object `logger` with typed event methods (easy to spy in tests).
 */

export interface RetrievalMissEvent {
  event: 'retrieval_miss';
  query: string; // Permitted: the one diagnostic place the query is logged (NFR-7).
  topScore: number;
  threshold: number;
  timestamp: string;
}

export interface InjectionAttemptEvent {
  event: 'injection_attempt';
  matchedPattern: string; // The regex pattern — no raw visitor text (no PII).
  timestamp: string;
}

export interface StreamFailureEvent {
  event: 'stream_failure';
  reason: string; // A fixed category ('llm-unavailable' | 'stream-error') — no PII, no query.
  timestamp: string;
}

export type LogEvent = RetrievalMissEvent | InjectionAttemptEvent | StreamFailureEvent;

function emit(event: LogEvent): void {
  // Structured JSON to stdout (process.stdout.write to avoid console's extra \n handling)
  process.stdout.write(JSON.stringify(event) + '\n');
}

export const logger = {
  /**
   * Log a retrieval miss.
   * Called when empty/below-threshold retrieval prevents a model call (FR-6).
   * The query is logged here as the diagnostic signal (the one permitted PII-adjacent
   * field per architecture AR-11/NFR-7 — documented in the story ACs).
   */
  retrievalMiss(query: string, topScore: number, threshold: number): void {
    emit({
      event: 'retrieval_miss',
      query,
      topScore,
      threshold,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log a detected prompt-injection attempt.
   * Logs the matched pattern category only — NOT the raw visitor text.
   */
  injectionAttempt(matchedPattern: string): void {
    emit({
      event: 'injection_attempt',
      matchedPattern,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log a grounded-path stream failure (LLM unavailable / upstream error /
   * stream error). Records only a fixed reason category — NO query, NO PII,
   * NO raw error message (the in-voice fallback is what reaches the client).
   */
  streamFailure(reason: string): void {
    emit({
      event: 'stream_failure',
      reason,
      timestamp: new Date().toISOString(),
    });
  },
} as const;
