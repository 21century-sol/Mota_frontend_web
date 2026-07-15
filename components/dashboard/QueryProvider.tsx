"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Scopes React Query to the `/dashboard` route tree only (issue #11 — first
 * dashboard feature to need server state). `/rental-checklist` does not use
 * React Query, so the provider lives in `app/dashboard/layout.tsx` instead of
 * the shared root `app/layout.tsx` to avoid an unnecessary shared-file change
 * (PM Assumption A2, `.claude/handoffs/11-pm-breakdown.md`).
 *
 * `QueryClient` is created inside `useState` (not module scope) so each client
 * render gets its own instance instead of leaking cache across users/requests.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
