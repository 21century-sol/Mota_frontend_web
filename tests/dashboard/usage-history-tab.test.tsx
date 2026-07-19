import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { UsageHistoryTab } from "@/components/dashboard/vehicles/tabs/UsageHistoryTab";
import { server } from "@/lib/dashboard/msw/server";
import {
  vehicleRentalHistoryErrorHandler,
  vehicleRentalHistoryNormalHandler,
} from "@/lib/dashboard/msw/handlers/vehicles";

function renderTab(vehicleId: string, page = 1) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsageHistoryTab vehicleId={vehicleId} page={page} />
    </QueryClientProvider>,
  );
}

describe("UsageHistoryTab", () => {
  it("shows 8 rows/page with a numeric pagination control and an accurate summary count (AC1/AC9)", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-003", 1);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    // vehicle-mgmt-003 fixture: 20 rental history rows total → 8 on page 1 (3 pages).
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1 + 8); // 1 header row + 8 data rows.

    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByText("전체 20건 중 1-8 표시")).toBeInTheDocument();
  });

  it("navigates to ?tab=usage&page=2 when page 2 is clicked and requests page=2 (AC9)", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    const user = userEvent.setup();
    replace.mockClear();
    renderTab("vehicle-mgmt-003", 1);

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "2" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles/vehicle-mgmt-003?tab=usage&page=2");
  });

  it("shows the final partial page (4 rows) on page 3 of 3", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-003", 3);

    await screen.findByRole("table");
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1 + 4); // 1 header row + 4 remaining data rows.
    expect(screen.getByText("전체 20건 중 17-20 표시")).toBeInTheDocument();
  });

  it("shows an explicit empty state when there is no rental history (no pagination nav)", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-004", 1);

    expect(await screen.findByText("이용 이력이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("does not render pagination for a single page of results", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-001", 1);

    await screen.findByRole("table");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows an error message with a retry button on fetch failure (business/HTTP failure)", async () => {
    server.use(vehicleRentalHistoryErrorHandler);
    renderTab("vehicle-mgmt-001", 1);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("retries the same page on retry click and shows the table once it succeeds", async () => {
    server.use(vehicleRentalHistoryErrorHandler);
    const user = userEvent.setup();
    renderTab("vehicle-mgmt-001", 1);

    await screen.findByRole("alert");
    server.use(vehicleRentalHistoryNormalHandler);
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("never renders the rental status anywhere in the table (PM Scope)", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-001", 1);

    await screen.findByRole("table");
    for (const statusText of ["RESERVED", "IN_PROGRESS", "RETURNED"]) {
      expect(screen.queryByText(statusText)).not.toBeInTheDocument();
    }
  });

  it("renders 이용자 이름/연락처 on two lines and hides the alert-count cell for a 0/null-alert row", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-001", 1);

    await screen.findByRole("table");
    // vehicle-mgmt-001 fixture row 1: 윤지호 / 010-0000-0001, alertCount 2.
    expect(screen.getByText("윤지호")).toBeInTheDocument();
    expect(screen.getByText("010-0000-0001")).toBeInTheDocument();
    expect(screen.getByText("2건")).toBeInTheDocument();
    // row 2 (최유진): alertCount null → rendered as an empty cell, not "0건"/"null건".
    expect(screen.queryByText("0건")).not.toBeInTheDocument();
    expect(screen.queryByText("null건")).not.toBeInTheDocument();
  });

  it("renders the '리포트' link as a new-tab anchor only when reportDownloadUrl is non-null (AC8)", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-001", 1);

    await screen.findByRole("table");
    // vehicle-mgmt-001 row 3 (정하윤): reportDownloadUrl === null → no report link for that row.
    const rows = screen.getAllByRole("row");
    const row3 = rows[3]; // header + row1 + row2 + row3
    expect(within(row3).queryByRole("link")).not.toBeInTheDocument();

    // vehicle-mgmt-001 row 1 (윤지호): reportDownloadUrl is non-null.
    const reportLink = screen.getByRole("link", { name: "윤지호 이용 리포트 다운로드" });
    expect(reportLink).toHaveAttribute(
      "href",
      "https://mota-app.duckdns.org/reports/vehicle-mgmt-001-01.pdf",
    );
    expect(reportLink).toHaveAttribute("target", "_blank");
    expect(reportLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(reportLink).toHaveTextContent("리포트");
  });

  it("marks the panel aria-busy while loading", () => {
    server.use(vehicleRentalHistoryNormalHandler);
    const { container } = renderTab("vehicle-mgmt-001", 1);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
