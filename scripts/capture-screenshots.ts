// npm run screenshots: captures the dashboard for the intro page and the social preview image.
// Needs the app running on BASE_URL (default http://localhost:3000) with seeded data.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
mkdirSync("public/screenshots", { recursive: true });

const browser = await chromium.launch();

async function capture(options: { scheme: "light" | "dark"; width: number; height: number; scale: number; path: string }) {
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
    colorScheme: options.scheme,
    deviceScaleFactor: options.scale,
    reducedMotion: "reduce",
  });
  await page.goto(`${base}/dashboard`);
  await page.getByRole("table", { name: "By precinct" }).waitFor();
  // Hide the Next.js dev badge if this is the dev server.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.screenshot({ path: options.path });
  await page.close();
  console.log(`Wrote ${options.path}`);
}

await capture({ scheme: "light", width: 1280, height: 880, scale: 2, path: "public/screenshots/dashboard-light.png" });
await capture({ scheme: "dark", width: 1280, height: 880, scale: 2, path: "public/screenshots/dashboard-dark.png" });
await capture({ scheme: "dark", width: 1200, height: 630, scale: 1, path: "public/og.png" });

await browser.close();
