import { z } from 'zod';

// TODO(Story 3.3 / 4.3): finalize fields.
// These are PLACEHOLDER contract schemas. The real shapes land with their
// first consumers:
//   - InviteInput  → Story 3.3 (POST /api/invite) + Story 3.4 (InviteForm island)
//   - GuideQuery   → Story 4.3 (POST /api/guide)  + Story 4.4 (GuidePanel island)
// `shared/` is the only cross-package surface (AR-15) — never import package
// internals across web/api; import from @portfolio/shared/schemas instead.

/** Placeholder invite request contract (finalized in Story 3.3). */
export const InviteInput = z.object({
  // Zod 4: top-level `z.email()` (the `z.string().email()` form is deprecated).
  email: z.email(),
});
export type InviteInput = z.infer<typeof InviteInput>;

/** Placeholder Guide query contract (finalized in Story 4.3). */
export const GuideQuery = z.object({
  question: z.string().min(1),
});
export type GuideQuery = z.infer<typeof GuideQuery>;
