import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { VehicleDetailTabs } from "@/components/dashboard/vehicles/VehicleDetailTabs";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehicleRentalHistoryNormalHandler,
  vehicleTireDetailNormalHandler,
  vehicleTireTrendNormalHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";

function renderTabs(activeTab: "tires" | "usage" | "inspection" | "info" = "tires", page = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <VehicleDetailTabs
        vehicleId="vehicle-mgmt-001"
        activeTab={activeTab}
        page={page}
      />
    </QueryClientProvider>,
  );
}

describe("VehicleDetailTabs", () => {
  it("exposes tablist/tab/tabpanel semantics with aria-selected on the active tab (AC14)", () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    renderTabs("tires");

    expect(screen.getByRole("tablist", { name: "차량 상세 탭" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "타이어" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "이용 이력" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("navigates to ?tab=usage when the 이용 이력 tab is clicked (AC13)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    const user = userEvent.setup();
    replace.mockClear();
    renderTabs("tires");

    await user.click(screen.getByRole("tab", { name: "이용 이력" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles/vehicle-mgmt-001?tab=usage");
  });

  it("renders the usage-history panel (not the tires panel) when activeTab is 'usage'", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTabs("usage", 1);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "이용 이력" })).toHaveAttribute("aria-selected", "true");
  });

  it("navigates on ArrowRight keyboard activation (AC14)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    const user = userEvent.setup();
    replace.mockClear();
    renderTabs("tires");

    const tiresTab = screen.getByRole("tab", { name: "타이어" });
    tiresTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles/vehicle-mgmt-001?tab=usage");
  });

  it("renders explicit placeholder shells for 점검 이력/차량 정보 (AC21)", () => {
    renderTabs("inspection");
    expect(screen.getByText("준비 중입니다. 곧 제공될 예정입니다.")).toBeInTheDocument();
  });
});
