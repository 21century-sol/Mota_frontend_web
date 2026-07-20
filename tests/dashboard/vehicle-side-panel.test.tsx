import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { VehicleSidePanel } from "@/components/dashboard/vehicles/VehicleSidePanel";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehicleCurrentRentalErrorHandler,
  vehicleCurrentRentalNormalHandler,
  vehicleCurrentRentalSlowHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";
import { VEHICLE_CURRENT_RENTAL_OVERDUE_ID } from "@/lib/dashboard/msw/fixtures/vehicles";

// `FIXED_NOW_KST` ("2026.07.19 12:00:00" KST) — matches the current-rental
// fixtures' scenario boundaries (`lib/dashboard/msw/fixtures/vehicles.ts`).
// `Date`/`setInterval` are faked so `ReservationSummaryCard`'s client-only
// `now` tick is deterministic; `setTimeout` is left real so Testing
// Library's `findBy*`/`waitFor` polling still resolves.
const FIXED_NOW = new Date("2026-07-19T03:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
}

function renderPanel(vehicleId: string) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <VehicleSidePanel vehicleId={vehicleId} />
    </QueryClientProvider>,
  );
}

describe("VehicleSidePanel", () => {
  it("renders the two separate card headings '예약 내역' and '알림 이력' (issue #53 AC4)", () => {
    renderPanel("vehicle-mgmt-001");

    expect(screen.getByRole("heading", { name: "예약 내역" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "알림 이력" })).toBeInTheDocument();
  });

  it("shows an aria-busy loading state before the current-rental response resolves", () => {
    server.use(vehicleCurrentRentalSlowHandler);
    renderPanel("vehicle-mgmt-001");

    expect(screen.getByText("예약 내역을 불러오는 중입니다.").closest('[aria-busy="true"]')).not.toBeNull();
  });

  it("shows the explicit empty state for a not-rented vehicle (rented: false)", async () => {
    renderPanel("vehicle-mgmt-001");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(await screen.findByText("현재 예약된 내역이 없습니다.")).toBeInTheDocument();
  });

  it("renders the renter/date/remaining-time for a rented vehicle (over-24h scenario)", async () => {
    renderPanel("vehicle-mgmt-003");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // vehicle-mgmt-003 fixture: renterName 김민준, endDate = FIXED_NOW + exactly 4일.
    expect(await screen.findByText("김민준")).toBeInTheDocument();
    expect(screen.getByText("2026.07.15 - 2026.07.23")).toBeInTheDocument();
    expect(screen.getByText("반납까지 4일 남았습니다")).toBeInTheDocument();
  });

  it("renders the overdue label distinctly for a past-due rental", async () => {
    renderPanel(VEHICLE_CURRENT_RENTAL_OVERDUE_ID);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const overdueLabel = await screen.findByText("반납 예정 시간이 지났습니다");
    expect(overdueLabel).toHaveClass("text-dashboard-tire-warning");
  });

  it("re-ticks the remaining-time label every 60s without unmounting (client-only, no hydration mismatch)", async () => {
    // 1-to-24h scenario: vehicle-mgmt-004, endDate = FIXED_NOW + exactly 5시간.
    renderPanel("vehicle-mgmt-004");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(await screen.findByText("반납까지 5시간 남았습니다")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    // Still inside the same hour bucket after 1 more minute.
    expect(screen.getByText("반납까지 5시간 남았습니다")).toBeInTheDocument();
  });

  it("shows a generic error with retry for a current-rental fetch failure, distinct from the empty state", async () => {
    server.use(vehicleCurrentRentalErrorHandler);
    const user = userEvent.setup({ delay: null });
    renderPanel("vehicle-mgmt-001");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("예약 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    expect(screen.queryByText("현재 예약된 내역이 없습니다.")).not.toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "다시 시도" });
    expect(retryButton).not.toBeDisabled();

    server.use(vehicleCurrentRentalNormalHandler);
    await user.click(retryButton);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(await screen.findByText("현재 예약된 내역이 없습니다.")).toBeInTheDocument();
  });
});
