// Dev and test tooling. Never imported by the app.
import { readFileSync } from "node:fs";
import path from "node:path";
import { getPool } from "@/lib/db";

const TABLES = "contacts, list_voters, lists, voters, volunteers";

/** Drops every table and recreates them from db/schema.sql. Deletes all data. */
export async function resetDatabase(): Promise<void> {
  const schema = readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  await getPool().query(`drop table if exists ${TABLES} cascade;\n${schema}`);
}

/** Tests wipe the database, so they refuse to run against one whose name doesn't end in _test. */
export function assertTestDatabase(url = process.env.DATABASE_URL): void {
  const name = url ? new URL(url).pathname.slice(1) : "";
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to wipe database "${name || "(DATABASE_URL not set)"}": ` +
        "test database names must end in _test. Set TEST_DATABASE_URL (see .env.example).",
    );
  }
}
