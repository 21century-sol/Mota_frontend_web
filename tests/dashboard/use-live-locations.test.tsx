import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useLiveLocations } from "@/hooks/dashboard/useLiveLocations";
import { server } from "@/lib/dashboard/msw/server";
import { liveLocationsNormalHandler } from "@/lib/dashboard/msw/handlers/live-locations";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useLiveLocations", () => {
  it("provides all rented vehicles without filtering by alert vehicleIds (#69)", async () => {
    server.use(liveLocationsNormalHandler);

    const { result } = renderHook(() => useLiveLocations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.locations.map((location) => location.vehicleId)).toEqual(
      ["v-1", "v-2", "v-rented-only"],
    );
  });
});
