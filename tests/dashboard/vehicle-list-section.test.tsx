import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { VehicleListSection } from "@/components/dashboard/vehicles/VehicleListSection";
import type { VehicleListFilters } from "@/types/dashboard/vehicle";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehiclesEmptyHandler,
  vehiclesErrorHandler,
  vehiclesNormalHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retryDelay: 0 },
    },
  });
}

function renderSection(filters: VehicleListFilters = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <VehicleListSection filters={filters} />
    </QueryClientProvider>,
  );
}

describe("VehicleListSection", () => {
  it("shows a loading skeleton with aria-busy, before the response resolves (AC2)", () => {
    server.use(vehiclesNormalHandler);
    renderSection();

    const loadingText = screen.getByText("차량 목록을 불러오는 중입니다.");
    expect(loadingText).toBeInTheDocument();
    expect(loadingText.closest('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders every field, with an explicit placeholder for null tireStatus/rentedAt/returnedAt (AC1)", async () => {
    server.use(vehiclesNormalHandler);
    renderSection();

    expect(await screen.findByRole("table")).toBeInTheDocument();

    // vehicle-mgmt-001: AVAILABLE / tireStatus NORMAL / rentedAt null / returnedAt null.
    const row1 = screen.getByText("12가 3456").closest("tr");
    expect(row1).not.toBeNull();
    const withinRow1 = within(row1 as HTMLElement);
    expect(withinRow1.getByText(/현대 아반떼 하이브리드 · 2022/)).toBeInTheDocument();
    expect(withinRow1.getByText("대여 가능")).toBeInTheDocument();
    expect(withinRow1.getByText("정상")).toBeInTheDocument();
    // rentedAt/returnedAt both null → both render the placeholder, not an empty string.
    expect(withinRow1.getAllByText("—")).toHaveLength(2);

    // vehicle-mgmt-004: AVAILABLE / tireStatus null.
    const row4 = screen.getByText("78라 4321").closest("tr");
    expect(within(row4 as HTMLElement).getAllByText("—").length).toBeGreaterThanOrEqual(1);

    // vehicle-mgmt-006: RENTED, rentedAt populated, returnedAt null.
    const row6 = screen.getByText("11바 1111").closest("tr");
    const withinRow6 = within(row6 as HTMLElement);
    expect(withinRow6.getByText("2026.07.01")).toBeInTheDocument();
    expect(withinRow6.getByText("—")).toBeInTheDocument();
  });

  it("shows a distinct empty message when there are 0 registered vehicles, not an error (AC3)", async () => {
    server.use(vehiclesEmptyHandler);
    renderSection();

    expect(await screen.findByText("등록된 차량이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a filtered-empty message distinct from the all-vehicles empty message (AC4)", async () => {
    server.use(vehiclesNormalHandler);
    // No REPAIR + NORMAL vehicle exists in the fixture (documented in fixtures/vehicles.ts).
    renderSection({ status: "REPAIR", tireStatus: "NORMAL" });

    expect(
      await screen.findByText("선택한 조건에 맞는 차량이 없습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByText("등록된 차량이 없습니다.")).not.toBeInTheDocument();
  });

  it("shows an error message with a retry button, and recovers on retry (AC5)", async () => {
    server.use(vehiclesErrorHandler);
    const user = userEvent.setup();
    renderSection();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "차량 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );

    const retryButton = screen.getByRole("button", { name: "다시 시도" });
    expect(retryButton).not.toBeDisabled();

    server.use(vehiclesNormalHandler);
    await user.click(retryButton);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("filters by status only (AND with no tireStatus) (AC6)", async () => {
    server.use(vehiclesNormalHandler);
    renderSection({ status: "AVAILABLE" });

    expect(await screen.findByRole("table")).toBeInTheDocument();
    // 5 AVAILABLE vehicles in the fixture.
    expect(screen.getByText("12가 3456")).toBeInTheDocument();
    expect(screen.getByText("90마 8765")).toBeInTheDocument();
    // A RENTED-only vehicle must not appear.
    expect(screen.queryByText("11바 1111")).not.toBeInTheDocument();
  });

  it("filters by status AND tireStatus together (AC6)", async () => {
    server.use(vehiclesNormalHandler);
    renderSection({ status: "AVAILABLE", tireStatus: "NORMAL" });

    expect(await screen.findByRole("table")).toBeInTheDocument();
    // Only vehicle-mgmt-001 and vehicle-mgmt-005 are AVAILABLE + tireStatus NORMAL.
    expect(screen.getByText("12가 3456")).toBeInTheDocument();
    expect(screen.getByText("90마 8765")).toBeInTheDocument();
    // AVAILABLE but tireStatus CAUTION — must be excluded once tireStatus=NORMAL is applied.
    expect(screen.queryByText("34나 5678")).not.toBeInTheDocument();
  });

  it("renders the full loaded list inside one scrollable container with no duplicate rows (AC7)", async () => {
    server.use(vehiclesNormalHandler);
    renderSection();

    const table = await screen.findByRole("table");
    const scrollContainer = table.parentElement as HTMLElement;
    expect(scrollContainer.className).toContain("overflow-y-auto");

    const rows = screen.getAllByRole("row");
    // 1 header row + 12 vehicle rows, each vehicleId/plateNumber rendered exactly once.
    expect(rows).toHaveLength(13);
    expect(screen.getAllByText("12가 3456")).toHaveLength(1);
  });
});
