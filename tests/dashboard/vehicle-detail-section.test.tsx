import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { VehicleDetailSection } from "@/components/dashboard/vehicles/VehicleDetailSection";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehicleDetailErrorHandler,
  vehicleDetailNormalHandler,
  vehicleDetailSlowHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";
import { VEHICLE_DETAIL_NOT_FOUND_ID } from "@/lib/dashboard/msw/fixtures/vehicles";

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
}

function renderSection(vehicleId = "vehicle-mgmt-001") {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <VehicleDetailSection vehicleId={vehicleId} tab="tires" page={1} />
    </QueryClientProvider>,
  );
}

describe("VehicleDetailSection", () => {
  it("shows a loading skeleton with aria-busy before the response resolves (AC5)", () => {
    server.use(vehicleDetailSlowHandler);
    renderSection();

    const skeleton = screen.getByTestId("vehicle-detail-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.closest('[aria-busy="true"]')).not.toBeNull();
  });

  it("renders the vehicle identity fields, with an explicit placeholder for 0 options (issue #42)", async () => {
    server.use(vehicleDetailNormalHandler);
    renderSection("vehicle-mgmt-004");

    expect(await screen.findByText("78라 4321")).toBeInTheDocument();
    // vehicle-mgmt-004 fixture: options is [].
    expect(screen.getByText("차량 옵션").closest("div")).toHaveTextContent("—");
    // manufacturer + " " + model, no brackets/modelCode (PM confirmed display rule).
    expect(screen.getByText(/기아 모닝/)).toBeInTheDocument();
  });

  it("shows a distinct not-found state with a list link for an unknown vehicleId (AC6)", async () => {
    server.use(vehicleDetailNormalHandler);
    renderSection(VEHICLE_DETAIL_NOT_FOUND_ID);

    expect(await screen.findByText("차량 정보를 찾을 수 없습니다.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "차량 목록으로 돌아가기" });
    expect(link).toHaveAttribute("href", "/dashboard/vehicles");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a generic error with retry, distinct from not-found (AC7)", async () => {
    server.use(vehicleDetailErrorHandler);
    const user = userEvent.setup();
    renderSection();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("차량 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");

    const retryButton = screen.getByRole("button", { name: "다시 시도" });
    expect(retryButton).not.toBeDisabled();

    server.use(vehicleDetailNormalHandler);
    await user.click(retryButton);

    expect(await screen.findByText("12가 3456")).toBeInTheDocument();
  });

  it("shows an explicit empty state for a vehicle with no current rental (issue #42)", async () => {
    server.use(vehicleDetailNormalHandler);
    renderSection("vehicle-mgmt-001");

    expect(await screen.findByText("현재 예약된 내역이 없습니다.")).toBeInTheDocument();
  });

  it("shows an explicit empty state for a vehicle with no alert history (AC11)", async () => {
    server.use(vehicleDetailNormalHandler);
    renderSection("vehicle-mgmt-004");

    expect(await screen.findByText("확인할 알림이 없습니다.")).toBeInTheDocument();
  });

  it("renders the current-rental summary (renter/dates) and alert history items (position + alertTitle) (issue #42/#47, AC10)", async () => {
    server.use(vehicleDetailNormalHandler);
    renderSection("vehicle-mgmt-003");

    // vehicle-mgmt-003 current-rental fixture: renterName 김민준, startDate 2026.07.15, endDate 2026.07.23.
    expect(await screen.findByText("김민준")).toBeInTheDocument();
    expect(screen.getByText("2026.07.15 ~ 2026.07.23")).toBeInTheDocument();
    expect(screen.getByText(/반납까지 .+(일|시간|분) 남았습니다/)).toBeInTheDocument();

    // vehicle-mgmt-003 fixture alert (newest-first order): FR position + "공기압 알림" title,
    // raw enum code (not the Korean formatWheelPositionLabel) — issue #47 confirmed contract.
    expect(await screen.findByText("FR 공기압 알림")).toBeInTheDocument();
  });
});
