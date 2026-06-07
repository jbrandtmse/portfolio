import { z } from 'zod';

// GuideQuery contract finalized in Story 4.3 (retro A5 / [1.1]).
// First consumer: Story 4.3 (POST /api/guide) + Story 4.4 (GuidePanel island).
// `shared/` is the only cross-package surface (AR-15) — never import package
// internals across web/api; import from @portfolio/shared/schemas instead.

/**
 * Invite request contract — finalized in Story 3.3.
 * Consumed by:
 *   - api (Story 3.3): POST /api/invite body validation
 *   - web (Story 3.4): InviteForm island client-side validation
 * Zod 4: use top-level z.email() (z.string().email() is deprecated).
 * Honeypot and server-set fields (source/status/mail_status) are NOT here
 * — the client never sets those.
 */
export const InviteInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  org: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  topic: z.string().trim().max(200).optional(),
  attribution: z.string().trim().min(1).max(200),
});
export type InviteInput = z.infer<typeof InviteInput>;

/**
 * Guide query contract — finalized in Story 4.3 (retro A5 / [1.1]).
 * Consumed by:
 *   - api (Story 4.3): POST /api/guide body validation
 *   - web (Story 4.4): GuidePanel island client-side construction
 *
 * `query` is trimmed (leading/trailing whitespace stripped) and bounded to
 * prevent runaway prompt injection via query length.
 * `threadContext` carries prior turns for multi-turn continuity (optional,
 * capped in the handler to bound prompt size — count cap: MAX_THREAD_TURNS=6
 * in api/src/lib/grounding.ts; per-turn content cap: .max(2000) below).
 * Per-turn content is bounded at 2000 chars (Story 5.0, [4.3]): 6 turns ×
 * 2000 + query 1000 is a sane prompt ceiling; prevents a client from inflating
 * the assembled prompt well beyond the query.max(1000) cap suggests.
 */
export const GuideQuery = z.object({
  query: z.string().trim().min(1).max(1000),
  threadContext: z
    .array(
      z.object({
        role: z.enum(['user', 'guide']),
        content: z.string().max(2000),
      }),
    )
    .optional(),
});
export type GuideQuery = z.infer<typeof GuideQuery>;
