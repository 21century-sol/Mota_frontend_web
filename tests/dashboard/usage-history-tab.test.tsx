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

  it("matches the Figma table geometry and typography", async () => {
    server.use(vehicleRentalHistoryNormalHandler);
    renderTab("vehicle-mgmt-001", 1);

    const table = await screen.findByRole("table");
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "이용 이력",
    });
    expect(heading).toHaveClass(
      "pl-3",
      "text-xl",
      "font-medium",
      "tracking-[-0.5px]",
      "text-dashboard-text-primary",
    );
    expect(heading.parentElement).toHaveClass("gap-4");
    expect(table).toHaveClass("min-w-[800px]", "table-fixed");
    const columns = table.querySelectorAll("col");
    expect(columns).toHaveLength(5);
    expect(columns[0]).toHaveClass("w-[28.375%]");
    expect(columns[1]).toHaveClass("w-[21.125%]");
    expect(columns[2]).toHaveClass("w-[18.125%]");
    expect(columns[3]).toHaveClass("w-[18.125%]");
    expect(columns[4]).toHaveClass("w-[14.25%]");

    const scrollContainer = table.parentElement;
    const tableCard = scrollContainer?.parentElement;
    if (!scrollContainer || !tableCard) {
      throw new Error("Usage history table containers were not rendered.");
    }
    expect(scrollContainer).toHaveClass("overflow-x-auto");
    expect(tableCard).toHaveClass(
      "overflow-hidden",
      "rounded-dashboard-card",
      "border-dashboard-vehicles-border",
    );

    const rows = screen.getAllByRole("row");
    expect(rows[0]).toHaveClass(
      "h-12",
      "bg-dashboard-vehicles-surface",
      "text-base",
      "text-dashboard-vehicles-label",
    );
    expect(within(rows[0]).getByText("이용자")).toHaveClass(
      "ml-[29.96%]",
      "block",
    );
    expect(rows[1]).toHaveClass("h-[70px]");

    const name = within(rows[1]).getByText("윤지호");
    const contact = within(rows[1]).getByText("010-0000-0001");
    expect(name).toHaveClass("text-base", "text-dashboard-usage-text");
    expect(contact).toHaveClass("text-xs", "text-dashboard-usage-text-muted");

    const distance = within(rows[1]).getByText("210.4");
    const distanceCell = distance.closest("td");
    if (!distanceCell) {
      throw new Error("Distance cell was not rendered.");
    }
    expect(distance).toHaveClass("text-base", "text-dashboard-usage-text");
    expect(within(distanceCell).getByText("km")).toHaveClass(
      "text-xs",
      "text-dashboard-vehicles-label",
    );
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
    const alertCountCell = screen.getByText("2건").closest("td");
    if (!alertCountCell) {
      throw new Error("Alert-count cell was not rendered.");
    }
    const warningIcon = alertCountCell.querySelector("svg");
    expect(warningIcon).toHaveClass(
      "h-3.5",
      "w-3.5",
      "text-dashboard-usage-alert",
    );
    expect(warningIcon).toHaveAttribute("aria-hidden", "true");
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
    expect(reportLink).toHaveTextContent("PDF");
    expect(reportLink).toHaveClass(
      "text-[15px]",
      "text-dashboard-chart-accent",
    );
    const linkIcon = reportLink.querySelector("svg");
    expect(linkIcon).toHaveClass("h-5", "w-5");
    expect(linkIcon).toHaveAttribute("aria-hidden", "true");
  });

  it("marks the panel aria-busy while loading", () => {
    server.use(vehicleRentalHistoryNormalHandler);
    const { container } = renderTab("vehicle-mgmt-001", 1);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
