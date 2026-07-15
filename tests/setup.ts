import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

import { server } from "@/lib/dashboard/msw/server";

// vitest.config.ts does not enable `test.globals`, so Testing Library's automatic
// afterEach cleanup (which relies on detecting a global `afterEach`) does not run.
// Registering it explicitly prevents component trees from leaking between tests
// (e.g. duplicate DOM nodes causing "Found multiple elements" failures).
afterEach(() => {
  cleanup();
});

// `onUnhandledRequest: "error"` fails a test the moment it makes a request with
// no matching handler, instead of silently hitting the network. This is intentional:
// future dashboard tests must register a handler for every request they expect,
// per CLAUDE.md §6 (mock and real API share the same DTO/contract boundary).
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
