/**
 * Drizzle client — pg Pool + drizzle (Story 3.3, Decision 2).
 *
 * The Pool is a singleton so the service reuses one connection pool
 * (architecture §Database: "max 25 connections; reuse one pool").
 *
 * `DATABASE_URL` is read through env.ts (fail-fast Zod validation).
 *
 * This module is safe to import in test files — it does NOT call serve()
 * or bind any port; it only creates the Pool. Tests that need the real DB
 * can import this; tests that mock deps never import it at all.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { env } from '../env.js';
import * as schema from './schema.js';

const { Pool } = pg;

// One shared pool for the service lifetime.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Architecture: max 25 connections; leave headroom for other clients / Umami.
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

// Drizzle instance with the full schema so we get type-safe query builders.
export const db = drizzle(pool, { schema });
