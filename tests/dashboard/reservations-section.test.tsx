import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { ReservationsSection } from "@/components/dashboard/reservations/ReservationsSection";
import { server } from "@/lib/dashboard/msw/server";
import {
  reservationsEmptyHandler,
  reservationsErrorHandler,
  reservationsNormalHandler,
} from "@/lib/dashboard/msw/handlers/reservations";
import { reservationsNormalFixture } from "@/lib/dashboard/msw/fixtures/reservations";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retryDelay: 0 },
    },
  });
}

function renderSection(
  props: {
    status?: "RENTED" | "RETURNED";
    page?: number;
    rentedOn?: string;
    returnedOn?: string;
  } = {},
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationsSection
        status={props.status}
        page={props.page ?? 1}
        rentedOn={props.rentedOn}
        returnedOn={props.returnedOn}
      />
    </QueryClientProvider>,
  );
}

describe("ReservationsSection (issue #51, real GET /api/dashboard/rentals wiring)", () => {
  it("shows a busy loading message before the response resolves", () => {
    server.use(reservationsNormalHandler);
    renderSection();

    const loadingText = screen.getByText("대여 현황을 불러오는 중입니다.");
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders 8 data rows on page 1 of the unfiltered (전체) list", async () => {
    server.use(reservationsNormalHandler);
    renderSection();

    // 1 header row + 8 data rows (14-row fixture, page size 8).
    expect(await screen.findAllByRole("row")).toHaveLength(1 + 8);
    expect(screen.getByRole("navigation", { name: "예약 목록 페이지" })).toBeInTheDocument();
  });

  it("maps the RENTED tab to status=IN_PROGRESS and shows only RENTED-labeled rows (AC2)", async () => {
    server.use(reservationsNormalHandler);
    const rentedCount = reservationsNormalFixture.filter(
      (item) => item.status === "IN_PROGRESS",
    ).length;
    renderSection({ status: "RENTED" });

    const expectedFirstPageRows = Math.min(rentedCount, 8);
    expect(await screen.findAllByRole("row")).toHaveLength(1 + expectedFirstPageRows);
    expect(screen.queryByText("반납완료")).not.toBeInTheDocument();
  });

  it("maps the RETURNED tab to status=RETURNED and shows only RETURNED-labeled rows", async () => {
    server.use(reservationsNormalHandler);
    const returnedCount = reservationsNormalFixture.filter(
      (item) => item.status === "RETURNED",
    ).length;
    renderSection({ status: "RETURNED" });

    const expectedFirstPageRows = Math.min(returnedCount, 8);
    const table = await screen.findByRole("table");
    expect(screen.getAllByRole("row")).toHaveLength(1 + expectedFirstPageRows);
    // Scoped to the table body — the "대여 중" filter tab label itself is
    // always rendered regardless of the selected tab (`ReservationStatusTabs`),
    // so this must check the row badges, not the whole document.
    expect(within(table).queryByText("대여 중")).not.toBeInTheDocument();
  });

  it("renders the 2nd page of the unfiltered list directly from a URL-style page prop", async () => {
    server.use(reservationsNormalHandler);
    renderSection({ page: 2 });

    // 14 total rows, page size 8 → page 2 has 6 rows.
    expect(await screen.findAllByRole("row")).toHaveLength(1 + 6);
  });

  it("shows a distinct empty message when there are 0 matching reservations, not an error", async () => {
    server.use(reservationsEmptyHandler);
    renderSection();

    expect(await screen.findByText("표시할 예약이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error message with a retry button, and recovers on retry", async () => {
    server.use(reservationsErrorHandler);
    const user = userEvent.setup();
    renderSection();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "대여 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );

    const retryButton = screen.getByRole("button", { name: "다시 시도" });
    expect(retryButton).not.toBeDisabled();

    server.use(reservationsNormalHandler);
    await user.click(retryButton);

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("wires the PDF button on a RETURNED row to window.open(item.reportDownloadUrl) (AC4)", async () => {
    server.use(reservationsNormalHandler);
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderSection({ status: "RETURNED" });

    expect(await screen.findByRole("table")).toBeInTheDocument();

    const returnedItem = reservationsNormalFixture.find((item) => item.status === "RETURNED");
    expect(returnedItem).toBeDefined();
    const row = screen.getByText(returnedItem!.renterName).closest("tr") as HTMLElement;
    const pdfButton = within(row).getByRole("button", { name: /리포트 PDF 다운로드/ });

    await user.click(pdfButton);

    await waitFor(() =>
      expect(windowOpenSpy).toHaveBeenCalledWith(
        returnedItem!.reportDownloadUrl,
        "_blank",
        "noopener,noreferrer",
      ),
    );

    windowOpenSpy.mockRestore();
  });
});
