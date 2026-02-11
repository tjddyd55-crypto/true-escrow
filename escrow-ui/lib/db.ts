/**
 * DB connection for escrow engine (PostgreSQL).
 * Requires DATABASE_URL. Used only in API routes (server).
 */

import { Pool } from "pg";

const pool =
  process.env.DATABASE_URL ?
    new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export type QueryResult<T = unknown> = { rows: T[] };

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (!pool) {
    return { rows: [] };
  }
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { rows: (result.rows || []) as T[] };
  } finally {
    client.release();
  }
}
