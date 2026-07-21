import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TireStatusTab } from "@/components/dashboard/vehicles/tabs/TireStatusTab";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehicleTireDetailNormalHandler,
  vehicleTireTrendErrorHandler,
  vehicleTireTrendNormalHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";

function renderTab(vehicleId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TireStatusTab vehicleId={vehicleId} />
    </QueryClientProvider>,
  );
}

describe("TireStatusTab", () => {
  it("renders no banner when all 4 tires are NORMAL (AC15)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    renderTab("vehicle-mgmt-001");

    // Wait for the tire cards to render before asserting absence of the banner.
    // Chart sr-only table still uses 전좌; card headings use Figma "앞 왼쪽 (FL)".
    expect(await screen.findByText("앞 왼쪽 (FL)", { selector: "p" })).toBeInTheDocument();
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

    const flHeading = await screen.findByText("앞 왼쪽 (FL)", { selector: "p" });
    const flCard = flHeading.closest(".rounded-dashboard-tire-card");
    expect(flCard).not.toBeNull();
    expect(within(flCard as HTMLElement).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("switches the trend chart metric on toggle click, with aria-pressed tracking the selection (AC18)", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    const user = userEvent.setup();
    renderTab("vehicle-mgmt-001");

    await screen.findByText("앞 왼쪽 (FL)", { selector: "p" });
    expect(await screen.findByRole("heading", { name: "타이어 상태 추이" })).toBeInTheDocument();

    const pressureButton = screen.getByRole("button", { name: "공기압" });
    const temperatureButton = screen.getByRole("button", { name: "온도" });
    expect(pressureButton).toHaveAttribute("aria-pressed", "true");
    expect(temperatureButton).toHaveAttribute("aria-pressed", "false");

    await user.click(temperatureButton);

    expect(temperatureButton).toHaveAttribute("aria-pressed", "true");
    expect(pressureButton).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the title and metric controls outside the non-interactive graph card", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    renderTab("vehicle-mgmt-001");

    const heading = await screen.findByRole("heading", { name: "타이어 상태 추이" });
    const controls = screen.getByRole("group", { name: "상태 추이 지표 선택" });
    const chartCard = screen.getByTestId("tire-trend-chart-card");
    const chartVisual = await screen.findByTestId("tire-trend-chart-visual");

    expect(chartCard).toContainElement(chartVisual);
    expect(chartCard).not.toContainElement(heading);
    expect(chartCard).not.toContainElement(controls);
    expect(chartVisual).toHaveAttribute("aria-hidden", "true");
    expect(chartVisual).toHaveClass("pointer-events-none", "select-none");
    expect(screen.getByRole("button", { name: "공기압" })).toBeEnabled();
  });

  it("keeps the external metric controls keyboard operable", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    const user = userEvent.setup();
    renderTab("vehicle-mgmt-001");

    const temperatureButton = await screen.findByRole("button", { name: "온도" });
    temperatureButton.focus();
    await user.keyboard("{Enter}");

    expect(temperatureButton).toHaveFocus();
    expect(temperatureButton).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the title and metric controls outside the card when the trend request errors", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendErrorHandler);
    renderTab("vehicle-mgmt-001");

    const heading = await screen.findByRole("heading", { name: "타이어 상태 추이" });
    const controls = screen.getByRole("group", { name: "상태 추이 지표 선택" });
    const chartCard = screen.getByTestId("tire-trend-chart-card");
    const alert = await screen.findByRole("alert");

    expect(chartCard).toContainElement(alert);
    expect(chartCard).not.toContainElement(heading);
    expect(chartCard).not.toContainElement(controls);
    expect(screen.getByRole("button", { name: "공기압" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();
  });

  it("shows empty trend copy when all metric values are null", async () => {
    server.use(vehicleTireDetailNormalHandler, vehicleTireTrendNormalHandler);
    renderTab("vehicle-mgmt-004");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "표시할 상태 추이 데이터가 없습니다.",
    );
  });
});