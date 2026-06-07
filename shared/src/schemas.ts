import { z } from 'zod';

// TODO(Story 4.3): finalize GuideQuery fields.
// This is a PLACEHOLDER contract schema. The real shape lands with its
// first consumer:
//   - GuideQuery → Story 4.3 (POST /api/guide) + Story 4.4 (GuidePanel island)
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

/** Placeholder Guide query contract (finalized in Story 4.3). */
export const GuideQuery = z.object({
  question: z.string().min(1),
});
export type GuideQuery = z.infer<typeof GuideQuery>;
