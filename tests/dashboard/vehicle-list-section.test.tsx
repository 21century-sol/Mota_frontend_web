import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { delay, http, HttpResponse } from "msw";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { VehicleListSection } from "@/components/dashboard/vehicles/VehicleListSection";
import type {
  VehicleListFilters,
  VehicleManagementListResponse,
} from "@/types/dashboard/vehicle";
import { server } from "@/lib/dashboard/msw/server";
import { VEHICLES_ENDPOINT_PATH } from "@/lib/dashboard/vehicles/api";
import {
  toVehicleManagementListResponse,
  vehiclesNormalFixture,
} from "@/lib/dashboard/msw/fixtures/vehicles";
import {
  vehiclesEmptyHandler,
  vehiclesErrorHandler,
  vehiclesNormalHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";

/**
 * Short, deterministic-enough delay so the refresh button's transient
 * `disabled`/`aria-busy="true"` window (issue #35 AC10) is actually
 * observable in a test instead of resolving before the first assertion runs
 * (test-agent independent verification — no equivalent handler existed
 * before this file).
 */
const vehiclesShortDelayHandler = http.get(VEHICLES_ENDPOINT_PATH, async () => {
  await delay(50);
  return HttpResponse.json<VehicleManagementListResponse>(
    toVehicleManagementListResponse(vehiclesNormalFixture),
  );
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retryDelay: 0 },
    },
  });
}

function renderSection(filters: VehicleListFilters = { tireStatus: [] }) {
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
    expect(withinRow1.getByText(/현대 아반떼 하이브리드/)).toBeInTheDocument();
    expect(withinRow1.getByText("2022년식")).toBeInTheDocument();
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
    expect(withinRow6.getByText("26.07.01")).toBeInTheDocument();
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
    renderSection({ status: "REPAIR", tireStatus: ["NORMAL"] });

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
    renderSection({ status: "AVAILABLE", tireStatus: [] });

    expect(await screen.findByRole("table")).toBeInTheDocument();
    // 5 AVAILABLE vehicles in the fixture.
    expect(screen.getByText("12가 3456")).toBeInTheDocument();
    expect(screen.getByText("90마 8765")).toBeInTheDocument();
    // A RENTED-only vehicle must not appear.
    expect(screen.queryByText("11바 1111")).not.toBeInTheDocument();
  });

  it("filters by status AND tireStatus together (AC6)", async () => {
    server.use(vehiclesNormalHandler);
    renderSection({ status: "AVAILABLE", tireStatus: ["NORMAL"] });

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

describe("VehicleListSection multi-select tire filter (issue #35 AC7/AC8, independently verified)", () => {
  it("OR-matches across 2+ selected tire chips against the unfiltered response, excluding a null tireStatus and any status the chips don't cover", async () => {
    server.use(vehiclesNormalHandler);
    renderSection({ tireStatus: ["NORMAL", "CAUTION"] });

    expect(await screen.findByRole("table")).toBeInTheDocument();

    // NORMAL: 001 (AVAILABLE), 005 (AVAILABLE), 006 (RENTED).
    expect(screen.getByText("12가 3456")).toBeInTheDocument();
    expect(screen.getByText("90마 8765")).toBeInTheDocument();
    expect(screen.getByText("11바 1111")).toBeInTheDocument();
    // CAUTION: 002 (AVAILABLE), 007 (RENTED), 011 (REPAIR), 012 (REPAIR) — matches
    // spanning every vehicle status prove the request wasn't narrowed server-side
    // by `status`/`tireStatus`, only client-filtered here.
    expect(screen.getByText("34나 5678")).toBeInTheDocument();
    expect(screen.getByText("22사 2222")).toBeInTheDocument();
    expect(screen.getByText("66카 6666")).toBeInTheDocument();
    expect(screen.getByText("77타 7777")).toBeInTheDocument();

    // WARNING must be excluded (003, 008, 010) — not part of the selected set.
    expect(screen.queryByText("56다 1234")).not.toBeInTheDocument();
    expect(screen.queryByText("33아 3333")).not.toBeInTheDocument();
    expect(screen.queryByText("55차 5555")).not.toBeInTheDocument();
    // null tireStatus (004, 009) must be excluded even though no `status` filter is set.
    expect(screen.queryByText("78라 4321")).not.toBeInTheDocument();
    expect(screen.queryByText("44자 4444")).not.toBeInTheDocument();

    // 1 header row + 7 matching vehicle rows.
    expect(screen.getAllByRole("row")).toHaveLength(8);
  });

  it("shows every one of the 3 tire chips selected as equivalent to no tire filter (still excludes null tireStatus)", async () => {
    server.use(vehiclesNormalHandler);
    renderSection({ tireStatus: ["NORMAL", "CAUTION", "WARNING"] });

    expect(await screen.findByRole("table")).toBeInTheDocument();
    // 12 fixture vehicles minus the 2 with a null tireStatus (004, 009).
    expect(screen.getAllByRole("row")).toHaveLength(1 + 10);
    expect(screen.queryByText("78라 4321")).not.toBeInTheDocument();
    expect(screen.queryByText("44자 4444")).not.toBeInTheDocument();
  });

  it("never renders the tireStatus '—' placeholder while any tire chip filter is active (issue #35 AC8)", async () => {
    server.use(vehiclesNormalHandler);
    renderSection({ tireStatus: ["NORMAL"] });

    expect(await screen.findByRole("table")).toBeInTheDocument();

    const tireCells = screen
      .getAllByText("타이어", { selector: "span" })
      .map((label) => label.closest("td"));
    expect(tireCells.length).toBeGreaterThan(0);
    for (const cell of tireCells) {
      expect(cell).not.toBeNull();
      expect((cell as HTMLElement).textContent).not.toContain("—");
    }
  });
});

describe("VehicleListSection update-time + refresh row (issue #35 AC9/AC10, independently verified)", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "Asia/Seoul");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the refreshedAt label from the response next to an enabled, non-busy refresh button", async () => {
    server.use(vehiclesNormalHandler);
    renderSection();

    expect(await screen.findByRole("table")).toBeInTheDocument();
    // Fixture's fixed `refreshedAt` (2026-07-16T10:00:00.000Z) in KST is 19:00.
    expect(screen.getByText("업데이트 시간 : 26/07/16 19:00")).toBeInTheDocument();

    const refreshButton = screen.getByRole("button", { name: "차량 목록 새로고침" });
    expect(refreshButton).not.toBeDisabled();
    expect(refreshButton).toHaveAttribute("aria-busy", "false");
  });

  it("disables the refresh button and sets aria-busy while refetching, then calls a new request via refetch()", async () => {
    server.use(vehiclesNormalHandler);
    const user = userEvent.setup();
    renderSection();

    expect(await screen.findByRole("table")).toBeInTheDocument();
    const refreshButton = screen.getByRole("button", { name: "차량 목록 새로고침" });

    server.use(vehiclesShortDelayHandler);
    await user.click(refreshButton);

    await waitFor(() =>
      expect(refreshButton).toHaveAttribute("aria-busy", "true"),
    );
    expect(refreshButton).toBeDisabled();

    await waitFor(() =>
      expect(refreshButton).toHaveAttribute("aria-busy", "false"),
    );
    expect(refreshButton).not.toBeDisabled();
  });
});
