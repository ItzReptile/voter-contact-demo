import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The nightly reset reads these files at runtime; make sure they ship with that function.
  outputFileTracingIncludes: {
    "/api/reset-demo": ["./db/schema.sql", "./public/sample-voters.csv"],
  },
  experimental: {
    serverActions: {
      // CSV uploads go through a Server Action; the default limit is 1 MB.
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
