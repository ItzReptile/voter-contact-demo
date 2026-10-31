// npm run screenshots: captures the dashboard for the intro page and the social preview image.
// Needs the app running on BASE_URL (default http://localhost:3000) with seeded data.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
mkdirSync("public/screenshots", { recursive: true });

const browser = await chromium.launch();

async function capture(options: { path: string; url: string; width: number; height: number; scale: number; waitFor: string; settle?: number }) {
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: options.scale,
  });
  await page.goto(`${base}${options.url}`);
  await page.locator(options.waitFor).first().waitFor();
  // Hide the Next.js dev badge if this is the dev server.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForTimeout(options.settle ?? 500);
  await page.screenshot({ path: options.path });
  await page.close();
  console.log(`Wrote ${options.path}`);
}

await capture({ path: "public/screenshots/dashboard.png", url: "/dashboard", width: 1440, height: 900, scale: 2, waitFor: "table[aria-label='By precinct']" });
// The intro hero, after the door hanger has stopped swinging (200ms delay + 1600ms swing).
await capture({ path: "public/og.png", url: "/", width: 1200, height: 630, scale: 1, waitFor: "h1", settle: 2000 });

await browser.close();
