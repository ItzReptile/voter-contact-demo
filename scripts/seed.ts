// npm run seed: wipes DATABASE_URL and loads demo data.
// A database that isn't on this machine needs --yes, so a stray DATABASE_URL can't be wiped by accident.
import { seedDemoData } from "@/dev/seed";
import { closePool } from "@/lib/db";

const url = new URL(process.env.DATABASE_URL ?? "postgres://missing");
const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

if (!local && !process.argv.includes("--yes")) {
  console.error(`"${url.host}" is not a local database. Run again with --yes to wipe and reseed it.`);
  process.exit(1);
}

console.log(`Seeding database "${url.pathname.slice(1)}" on ${url.host}. This deletes everything in it.`);
await seedDemoData();
await closePool();
