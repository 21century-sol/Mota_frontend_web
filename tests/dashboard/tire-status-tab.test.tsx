import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TireStatusTab } from "@/components/dashboard/vehicles/tabs/TireStatusTab";
import { server } from "@/lib/dashboard/msw/server";
import { vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler } from "@/lib/dashboard/msw/handlers/vehicles";

function renderTab(vehicleId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TireStatusTab vehicleId={vehicleId} vehiclePhotoUrl={undefined} vehicleModel="아반떼 하이브리드" />
    </QueryClientProvider>,
  );
}

describe("TireStatusTab", () => {
  it("renders no banner when all 4 tires are NORMAL (AC15)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    renderTab("vehicle-mgmt-001");

    // Wait for the tire cards to render before asserting absence of the banner.
    // "전좌" also appears in TireTrendChart's sr-only accessible table, so match by tag.
    expect(await screen.findByText("전좌", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByText(/점검이 필요한 타이어가/)).not.toBeInTheDocument();
  });

  it("renders a banner with the correct count when tires need attention (AC15)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    renderTab("vehicle-mgmt-003");

    // vehicle-mgmt-003 fixture: FL=CAUTION, FR=WARNING → 2 tires need attention.
    expect(await screen.findByText("점검이 필요한 타이어가 2개 있습니다")).toBeInTheDocument();
  });

  it("renders all 4 tire cards with null values as the placeholder (AC16)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    renderTab("vehicle-mgmt-004");

    const flHeading = await screen.findByText("전좌", { selector: "p" });
    const flCard = flHeading.closest("div");
    expect(within(flCard as HTMLElement).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("switches the trend chart metric on toggle click, with aria-pressed tracking the selection (AC18)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    const user = userEvent.setup();
    renderTab("vehicle-mgmt-001");

    await screen.findByText("전좌", { selector: "p" });

    const pressureButton = screen.getByRole("button", { name: "공기압" });
    const temperatureButton = screen.getByRole("button", { name: "온도" });
    expect(pressureButton).toHaveAttribute("aria-pressed", "true");
    expect(temperatureButton).toHaveAttribute("aria-pressed", "false");

    await user.click(temperatureButton);

    expect(temperatureButton).toHaveAttribute("aria-pressed", "true");
    expect(pressureButton).toHaveAttribute("aria-pressed", "false");
  });
});
