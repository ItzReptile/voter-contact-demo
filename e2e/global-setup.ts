import { assertTestDatabase } from "@/dev/reset";
import { seedDemoData } from "@/dev/seed";
import { closePool } from "@/lib/db";

// Runs once before the tests: reset the test database and load the demo data,
// so the app starts in the same state as `npm run seed`.
export default async function globalSetup() {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  assertTestDatabase();
  await seedDemoData(() => {});
  await closePool();
}
