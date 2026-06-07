/**
 * Drizzle Kit configuration (Story 3.3).
 *
 * Commands (from api/package.json):
 *   pnpm --filter @portfolio/api db:generate   → generate SQL migration files
 *   pnpm --filter @portfolio/api db:migrate    → apply pending migrations to Postgres
 *
 * The DATABASE_URL is read from the gitignored api/.env file (which is never
 * committed). drizzle-kit reads it via dotenv at CLI time.
 *
 * Migrations live under src/db/migrations/ (checked into git so the
 * migration history is versioned alongside the schema — production-safe).
 */
import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for drizzle-kit commands');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Verbose output so migration runs are visible in the deploy log.
  verbose: true,
  strict: true,
});
