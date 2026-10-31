// npm run seed: wipes DATABASE_URL and loads demo data.
import { seedDemoData } from "@/dev/seed";
import { closePool } from "@/lib/db";

const url = new URL(process.env.DATABASE_URL ?? "postgres://missing");
console.log(`Seeding database "${url.pathname.slice(1)}" on ${url.host}. This deletes everything in it.`);

await seedDemoData();
await closePool();
