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

export function isDatabaseConfigured(): boolean {
  return pool != null;
}

function getRequiredPool(): Pool {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured");
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = await getRequiredPool().connect();
  try {
    const result = await client.query(text, params);
    return { rows: (result.rows || []) as T[] };
  } finally {
    client.release();
  }
}

/** Run multiple queries in a single transaction. Rolls back on throw. */
export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>
): Promise<T> {
  const client = await getRequiredPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
