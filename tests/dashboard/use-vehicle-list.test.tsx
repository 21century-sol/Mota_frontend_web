import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useVehicleList } from "@/hooks/dashboard/useVehicleList";
import { VehicleListFetchError } from "@/lib/dashboard/vehicles/api";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehiclesErrorHandler,
  vehiclesNormalHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useVehicleList", () => {
  it("resolves with the filtered vehicle list and refreshedAt for the given filters (AC1, AC6, issue #35)", async () => {
    server.use(vehiclesNormalHandler);
    const { result } = renderHook(
      () => useVehicleList({ status: "AVAILABLE", tireStatus: [] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.vehicles).toHaveLength(5);
    expect(
      result.current.data?.vehicles.every((v) => v.status === "AVAILABLE"),
    ).toBe(true);
    expect(result.current.data?.refreshedAt).toBe("2026-07-16T10:00:00.000Z");
  });

  it("surfaces a 500 response as a server-error VehicleListFetchError (AC5)", async () => {
    server.use(vehiclesErrorHandler);
    const { result } = renderHook(
      () => useVehicleList({ tireStatus: [] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(VehicleListFetchError);
    expect((result.current.error as VehicleListFetchError).kind).toBe(
      "server-error",
    );
  });
});
