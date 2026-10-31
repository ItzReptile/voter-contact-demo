import path from "node:path";
import { defineConfig } from "vitest/config";

// Pick up TEST_DATABASE_URL from .env locally. In CI it comes from the workflow.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the environment.
}

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    // Database tests share one database, so test files run one at a time.
    fileParallelism: false,
    env: {
      // App code reads DATABASE_URL; under test it always points at the test database.
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
    },
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["src/**/*.test.ts"], exclude: ["src/**/*.db.test.ts"] },
      },
      {
        extends: true,
        test: { name: "db", include: ["src/**/*.db.test.ts"] },
      },
    ],
  },
});
