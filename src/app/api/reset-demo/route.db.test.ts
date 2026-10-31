import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshTestDatabase } from "@/dev/fixtures";
import { closePool, query } from "@/lib/db";
import { GET } from "./route";

beforeEach(freshTestDatabase);
afterEach(() => {
  delete process.env.CRON_SECRET;
});
afterAll(closePool);

function request(authorization?: string): Request {
  return new Request("http://localhost/api/reset-demo", {
    headers: authorization ? { authorization } : {},
  });
}

describe("GET /api/reset-demo", () => {
  it("refuses every request when CRON_SECRET is not set", async () => {
    const response = await GET(request("Bearer anything"));

    expect(response.status).toBe(401);
  });

  it("refuses a wrong secret and leaves the database alone", async () => {
    process.env.CRON_SECRET = "right";

    const response = await GET(request("Bearer wrong"));

    expect(response.status).toBe(401);
    expect(await query("select 1 from voters")).toEqual([]);
  });

  it("reloads the demo data with the right secret", async () => {
    process.env.CRON_SECRET = "right";

    const response = await GET(request("Bearer right"));

    expect(response.status).toBe(200);
    const [{ count }] = await query<{ count: number }>("select count(*)::int as count from voters");
    expect(count).toBe(2397);
  });
});
