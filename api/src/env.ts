/**
 * Zod-validated, fail-fast env module for the api package (Story 3.3).
 *
 * Centralizes ALL env-var parsing; anything that reads process.env in the api
 * service imports from here, NEVER directly from process.env.
 *
 * Resolves deferred [1.1] items:
 *   - [1.1] API_PORT no validation  → validated as a positive integer here.
 *   - [1.1] API_PORT duplicated default → DEFAULT is 8787, declared ONCE here;
 *     api/src/index.ts reads it through this module (no raw process.env.API_PORT).
 *
 * Rule 4 (project-rules.md): RESEND_API_KEY is optional; when unset, the email
 * path is a no-op returning 'skipped'. Tests/CI need no live Resend to run.
 *
 * NFR-5: secrets are server-side only; nothing here is exported to the web client.
 */
import { z } from 'zod';

const envSchema = z.object({
  /**
   * Postgres connection string — required for the invite endpoint and
   * the DB integration test. The integration test skips-with-warning when unset.
   */
  DATABASE_URL: z.string().min(1),

  // ---------------------------------------------------------------------------
  // Guide LLM config (Story 4.3, Rule 4 env-gate).
  // All optional/defaulted — the service starts without a live LLM; tests use
  // the deterministic stub (GUIDE_LLM_STUB=1 or auto when no key resolves).
  // NFR-5: these are server-side only; never exported to web.
  // ---------------------------------------------------------------------------

  /**
   * OpenAI-compatible LLM base URL for the Guide endpoint.
   * Default: VM's routellm endpoint.
   */
  GUIDE_LLM_BASE_URL: z.string().url().default('https://routellm.abacus.ai/v1'),

  /**
   * LLM model ID to use for the Guide stream.
   * Default: gpt-5-mini (current mid-tier streaming model on the VM's RouteLLM
   * endpoint; confirmed available + verified live on /api/guide). Override per
   * deployment via GUIDE_LLM_MODEL in api/.env.
   */
  GUIDE_LLM_MODEL: z.string().default('gpt-5-mini'),

  /**
   * When set to "1", the llm-client uses a deterministic stub — no live LLM
   * calls. Automatically engaged when no API key resolves. Used in tests/CI.
   */
  GUIDE_LLM_STUB: z.string().optional(),

  /**
   * ABACUS_API_KEY — may be set directly, or resolved from IMDSv2 at runtime.
   * Optional here: the llm-client resolves it lazily (env → IMDSv2 → none).
   * NFR-5: server-side only. Never committed or returned to the client.
   */
  ABACUS_API_KEY: z.string().optional(),

  /**
   * Hono service listen port.
   * Validated as a positive integer; default 8787 is the ONE canonical default
   * in this repo (resolves [1.1] API_PORT duplicated default / no validation).
   * Uses refine + transform (Zod 4: throw in transform is not caught by safeParse).
   */
  API_PORT: z
    .string()
    .default('8787')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
      message: 'API_PORT must be a positive integer',
    })
    .transform((v) => Number(v)),

  /**
   * Resend API key — OPTIONAL (Rule 4 env-gate).
   * Unset (default/CI/test) → email is a no-op returning 'skipped'.
   * Set on the VM for production → Nodemailer sends via Resend.
   */
  RESEND_API_KEY: z.string().min(1).optional(),

  /**
   * Owner notification email addresses — [OPEN]: set on the VM before launch.
   * Optional with placeholder defaults so the service starts without them
   * (emails are skipped unless RESEND_API_KEY is also set).
   */
  MAIL_FROM: z.string().default('noreply@example.com'),
  MAIL_TO: z.string().default('owner@example.com'),
});

// Fail fast at startup if required vars are missing or malformed.
// This parse runs once at module-load time.
const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('[api] Fatal: invalid environment configuration');
  console.error(_parsed.error.format());
  process.exit(1);
}

export const env = _parsed.data;
