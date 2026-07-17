import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { UsageHistoryTab } from "@/components/dashboard/vehicles/tabs/UsageHistoryTab";
import { server } from "@/lib/dashboard/msw/server";
import { vehicleUsageHistoryNormalHandler } from "@/lib/dashboard/msw/handlers/vehicles";

function renderTab(vehicleId: string, page = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsageHistoryTab vehicleId={vehicleId} page={page} />
    </QueryClientProvider>,
  );
}

describe("UsageHistoryTab", () => {
  it("shows 8 rows/page with a numeric pagination control (AC19)", async () => {
    server.use(vehicleUsageHistoryNormalHandler);
    renderTab("vehicle-mgmt-003", 1);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    // vehicle-mgmt-003 fixture: 10 usage history rows total → 8 on page 1.
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1 + 8); // 1 header row + 8 data rows.

    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
  });

  it("navigates to ?tab=usage&page=2 when page 2 is clicked (AC19)", async () => {
    server.use(vehicleUsageHistoryNormalHandler);
    const user = userEvent.setup();
    replace.mockClear();
    renderTab("vehicle-mgmt-003", 1);

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "2" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles/vehicle-mgmt-003?tab=usage&page=2");
  });

  it("hides the alert-count cell for a 0-alert row instead of showing '0건'", async () => {
    server.use(vehicleUsageHistoryNormalHandler);
    renderTab("vehicle-mgmt-007", 1);

    await screen.findByRole("table");
    // buildUsageHistoryItems: index 0 → alertCount 0.
    expect(screen.queryByText("0건")).not.toBeInTheDocument();
  });

  it("shows an explicit empty state when there is no usage history (AC20)", async () => {
    server.use(vehicleUsageHistoryNormalHandler);
    renderTab("vehicle-mgmt-004", 1);

    expect(await screen.findByText("이용 이력이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("does not render pagination for a single page of results", async () => {
    server.use(vehicleUsageHistoryNormalHandler);
    renderTab("vehicle-mgmt-001", 1);

    await screen.findByRole("table");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
