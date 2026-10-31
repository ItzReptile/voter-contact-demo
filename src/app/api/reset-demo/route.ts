import { seedDemoData } from "@/dev/seed";

// Vercel Cron calls this once a night (see vercel.json) with "Authorization: Bearer <CRON_SECRET>".
// It wipes the demo database and reloads the generated data, undoing whatever visitors changed.
// Without CRON_SECRET set, it refuses every request.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const log: string[] = [];
  await seedDemoData((message) => log.push(message));
  return Response.json({ ok: true, log });
}
