import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AlertHistoryList } from "@/components/dashboard/vehicles/AlertHistoryList";
import { VehicleSidePanel } from "@/components/dashboard/vehicles/VehicleSidePanel";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehicleAlertHistoryErrorHandler,
  vehicleAlertHistoryNormalHandler,
  vehicleAlertHistorySlowHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";
import type { AlertHistoryItem } from "@/types/dashboard/vehicle";

// Matches `vehicle-side-panel.test.tsx`'s fixed instant so `ReservationSummaryCard`'s
// client-only remaining-time tick is deterministic for any rented-state fixture.
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

describe("AlertHistoryList (issue #47)", () => {
  const alerts: AlertHistoryItem[] = [
    {
      alertId: "alert-hist-001-02",
      tireId: "tire-001-fr",
      position: "FR",
      alertLevel: "WARNING",
      alertTitle: "공기압 알림",
      alertTime: "2026.07.18 11:00:00",
    },
    {
      alertId: "alert-hist-001-01",
      tireId: "tire-001-fl",
      position: "FL",
      alertLevel: "DANGER",
      alertTitle: "마모도 알림",
      alertTime: "2026.06.01 10:00:00",
    },
  ];

  it("renders '{alertTitle}' and the formatted KST time, in the given order (AC1)", () => {
    render(<AlertHistoryList alerts={alerts} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("공기압 알림")).toBeInTheDocument();
    expect(within(items[0]).getByText("2026.07.18 오전 11:00")).toBeInTheDocument();
    expect(within(items[1]).getByText("마모도 알림")).toBeInTheDocument();
    expect(within(items[1]).getByText("2026.06.01 오전 10:00")).toBeInTheDocument();
  });

  it("never renders the tire position code (FR/FL stay invisible)", () => {
    render(<AlertHistoryList alerts={alerts} />);

    expect(screen.queryByText(/FR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/FL/)).not.toBeInTheDocument();
  });

  it("never renders the alertLevel value anywhere (WARNING/DANGER stay invisible, AC1)", () => {
    render(<AlertHistoryList alerts={alerts} />);

    expect(screen.queryByText(/WARNING/)).not.toBeInTheDocument();
    expect(screen.queryByText(/DANGER/)).not.toBeInTheDocument();
  });
});

describe("VehicleSidePanel alert history section (issue #47)", () => {
  it("shows an aria-busy loading state before the alert history response resolves (AC2)", () => {
    server.use(vehicleAlertHistorySlowHandler);
    renderPanel("vehicle-mgmt-001");

    expect(
      screen.getByText("알림 이력을 불러오는 중입니다.").closest('[aria-busy="true"]'),
    ).not.toBeNull();
  });

  it("renders the alert list on success (vehicle-mgmt-001, 2건)", async () => {
    server.use(vehicleAlertHistoryNormalHandler);
    renderPanel("vehicle-mgmt-001");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(await screen.findByText("공기압 알림")).toBeInTheDocument();
    expect(screen.getByText("마모도 알림")).toBeInTheDocument();
  });

  it("shows the empty-state message with role=status for 0 alerts (AC3)", async () => {
    server.use(vehicleAlertHistoryNormalHandler);
    renderPanel("vehicle-mgmt-004");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const emptyMessage = await screen.findByText("확인할 알림이 없습니다.");
    expect(emptyMessage.closest('[role="status"]')).not.toBeNull();
  });

  it("shows a generic error with retry for an alert history fetch failure, and recovers after retry (AC4)", async () => {
    server.use(vehicleAlertHistoryErrorHandler);
    const user = userEvent.setup({ delay: null });
    renderPanel("vehicle-mgmt-001");

    const alerts = await screen.findAllByRole("alert");
    const alertHistoryAlert = alerts.find((node) =>
      node.textContent?.includes("알림 이력을 불러오지 못했습니다."),
    );
    expect(alertHistoryAlert).toBeDefined();
    expect(alertHistoryAlert).toHaveTextContent(
      "알림 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );

    const retryButtons = screen.getAllByRole("button", { name: "다시 시도" });
    expect(retryButtons.length).toBeGreaterThan(0);

    server.use(vehicleAlertHistoryNormalHandler);
    await user.click(retryButtons[retryButtons.length - 1]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(await screen.findByText("공기압 알림")).toBeInTheDocument();
  });
});
