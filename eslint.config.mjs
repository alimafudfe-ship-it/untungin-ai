import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This codebase still uses a few Supabase and webhook payloads that are
      // intentionally dynamic. Keep lint useful without blocking production builds.
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    // Historical/generated upgrade snapshots kept for reference, not compiled by Next.
    "upgrade/**",
    "admin/**",
    "login/**",
    "*.tsx",
    "route*.ts",
    "supabaseClient.ts",
    "globals.css",
    "layout.tsx",
    "sitemap.ts",
    "api/**",
    "calculations.ts",
    "dashboard.ts",
    "download",
    "env.ts",
    "format.ts",
    "reportData.ts",
    "reports.ts",
  ]),
]);

export default eslintConfig;
