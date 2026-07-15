import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // esbuild's default JSX transform is classic (requires `React` in scope). The app
  // uses React 18's automatic runtime (no explicit `import React` in .tsx files), so
  // component tests need the same "automatic" transform to render without ReferenceErrors.
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    // Mirrors tsconfig.json's "@/*" path alias so component tests can import the same
    // "@/..." specifiers used in app code without duplicating relative import paths.
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    // jsdom is required for Testing Library component tests (tests/dashboard/**.test.tsx).
    // Pure-logic tests (e.g. tests/smoke.test.ts, tests/dashboard/nav.test.ts) run fine
    // under jsdom too, so a single global environment keeps the config simple.
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
