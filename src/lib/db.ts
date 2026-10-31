import { Pool, type PoolClient, type QueryResultRow } from "pg";

// One pool per process. Next's dev server re-evaluates modules on every edit,
// so the pool lives on globalThis instead of a module variable.
const globalForDb = globalThis as unknown as { pool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
    }
    globalForDb.pool = new Pool({ connectionString, max: 5 });
  }
  return globalForDb.pool;
}

/** Runs one parameterized query and returns its rows. Never build SQL from user input. */
export async function query<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

/** Runs fn inside BEGIN/COMMIT; any thrown error rolls the whole thing back. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await globalForDb.pool?.end();
  globalForDb.pool = undefined;
}

/**
 * An error whose message is safe to show the person using the app
 * (bad input, a missing record). Server Actions return these messages;
 * any other error is a bug and is rethrown.
 */
export class UserError extends Error {}
