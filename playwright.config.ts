import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the environment (CI sets TEST_DATABASE_URL).
}

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  // One shared database, so tests run one at a time.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // A production build, not the dev server. CI builds in an earlier step.
    command: process.env.CI ? `npm run start -- --port ${PORT}` : `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // The app under test always talks to the test database.
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
  },
});
