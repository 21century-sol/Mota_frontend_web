import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReservationTable } from "@/components/dashboard/reservations/ReservationTable";
import type { ReservationItem } from "@/types/dashboard/reservation";

const RETURNED_ITEM: ReservationItem = {
  id: "res-a",
  renterName: "김모타",
  renterPhone: "010-1243-1231",
  plateNumber: "12가 4412",
  vehicleModel: "현대 그랜저 GN7",
  rentedAt: "2026-07-19",
  returnedAt: "2026-07-21",
  status: "RETURNED",
  reportDownloadUrl: "https://mota-app.duckdns.org/reports/res-a.pdf",
};

const RENTED_ITEM: ReservationItem = {
  id: "res-b",
  renterName: "홍길동",
  renterPhone: "010-2233-4455",
  plateNumber: "34나 5566",
  vehicleModel: "기아 쏘렌토",
  rentedAt: "2026-07-15",
  returnedAt: "2026-07-25",
  status: "RENTED",
  reportDownloadUrl: null,
};

const RETURNED_ITEM_NO_REPORT: ReservationItem = {
  id: "res-c",
  renterName: "이서준",
  renterPhone: "010-3344-5566",
  plateNumber: "56다 7788",
  vehicleModel: "현대 아반떼",
  rentedAt: "2026-07-10",
  returnedAt: "2026-07-13",
  status: "RETURNED",
  reportDownloadUrl: null,
};

describe("ReservationTable (AC6, AC7, AC9, AC10)", () => {
  it("renders the confirmed column headers in order", () => {
    render(<ReservationTable items={[RETURNED_ITEM]} />);
    const headers = screen.getAllByRole("columnheader").map((el) => el.textContent);
    expect(headers).toEqual(["대여자", "연락처", "차량 정보", "대여일", "반납일", "상태", "리포트"]);
  });

  it("renders renter/contact/vehicle info and YY.MM.DD dates", () => {
    render(<ReservationTable items={[RETURNED_ITEM]} />);
    expect(screen.getByText("김모타")).toBeInTheDocument();
    expect(screen.getByText("010-1243-1231")).toBeInTheDocument();
    expect(screen.getByText("12가 4412")).toBeInTheDocument();
    expect(screen.getByText("현대 그랜저 GN7")).toBeInTheDocument();
    expect(screen.getByText("26.07.19")).toBeInTheDocument();
    expect(screen.getByText("26.07.21")).toBeInTheDocument();
  });

  it("shows the badge label distinctly per status (AC6, not color-only)", () => {
    render(<ReservationTable items={[RETURNED_ITEM, RENTED_ITEM]} />);
    expect(screen.getByText("반납완료")).toBeInTheDocument();
    expect(screen.getByText("대여 중")).toBeInTheDocument();
  });

  it("renders the PDF button only when reportDownloadUrl is present, never for a report-less row (AC7, #51 follow-up)", () => {
    render(
      <ReservationTable items={[RETURNED_ITEM, RENTED_ITEM, RETURNED_ITEM_NO_REPORT]} />,
    );

    const rows = screen.getAllByRole("row");
    // rows[0] is the header row.
    const withReportRow = within(rows[1]);
    const rentedRow = within(rows[2]);
    const returnedNoReportRow = within(rows[3]);

    expect(
      withReportRow.getByRole("button", { name: "김모타 리포트 PDF 다운로드" }),
    ).toBeInTheDocument();
    // RENTED row (reportDownloadUrl null) → no button.
    expect(rentedRow.queryByRole("button")).not.toBeInTheDocument();
    // RETURNED row without a generated report (reportDownloadUrl null) → no button.
    expect(returnedNoReportRow.queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens item.reportDownloadUrl in a new tab when the PDF button is clicked (issue #51 AC4)", async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ReservationTable items={[RETURNED_ITEM]} />);

    const pdfButton = screen.getByRole("button", { name: "김모타 리포트 PDF 다운로드" });
    await user.click(pdfButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      RETURNED_ITEM.reportDownloadUrl,
      "_blank",
      "noopener,noreferrer",
    );
    windowOpenSpy.mockRestore();
  });
});
