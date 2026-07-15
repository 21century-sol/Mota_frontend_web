import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config.ts does not enable `test.globals`, so Testing Library's automatic
// afterEach cleanup (which relies on detecting a global `afterEach`) does not run.
// Registering it explicitly prevents component trees from leaking between tests
// (e.g. duplicate DOM nodes causing "Found multiple elements" failures).
afterEach(() => {
  cleanup();
});
