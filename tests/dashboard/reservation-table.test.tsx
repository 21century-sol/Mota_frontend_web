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

  it("renders a focusable, accessible PDF button only for a RETURNED row (AC7)", () => {
    render(<ReservationTable items={[RETURNED_ITEM, RENTED_ITEM]} />);

    const rows = screen.getAllByRole("row");
    // rows[0] is the header row.
    const returnedRow = within(rows[1]);
    const rentedRow = within(rows[2]);

    expect(
      returnedRow.getByRole("button", { name: "김모타 리포트 PDF 다운로드" }),
    ).toBeInTheDocument();
    expect(rentedRow.queryByRole("button")).not.toBeInTheDocument();
  });

  it("PDF button click is a no-op (no thrown error, no navigation side effect)", async () => {
    const user = userEvent.setup();
    render(<ReservationTable items={[RETURNED_ITEM]} />);

    const pdfButton = screen.getByRole("button", { name: "김모타 리포트 PDF 다운로드" });
    await expect(user.click(pdfButton)).resolves.toBeUndefined();
  });
});
