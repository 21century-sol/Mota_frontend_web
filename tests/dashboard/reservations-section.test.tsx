import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { ReservationsSection } from "@/components/dashboard/reservations/ReservationsSection";
import { RESERVATION_FIXTURES } from "@/lib/dashboard/reservations/fixtures";

describe("ReservationsSection (AC1, AC2, AC3, AC5 wiring over the real fixture)", () => {
  it("renders 8 data rows on page 1 of the unfiltered (전체) list without any network call", () => {
    render(<ReservationsSection status={undefined} page={1} />);

    // 1 header row + 8 data rows.
    expect(screen.getAllByRole("row")).toHaveLength(1 + 8);
    expect(screen.getByRole("navigation", { name: "예약 목록 페이지" })).toBeInTheDocument();
  });

  it("filters to only RENTED rows when status=RENTED (AC2)", () => {
    const rentedCount = RESERVATION_FIXTURES.filter((item) => item.status === "RENTED").length;
    render(<ReservationsSection status="RENTED" page={1} />);

    const expectedFirstPageRows = Math.min(rentedCount, 8);
    expect(screen.getAllByRole("row")).toHaveLength(1 + expectedFirstPageRows);
    // Every visible badge text must be the RENTED label, none from RETURNED rows.
    expect(screen.queryByText("반납완료")).not.toBeInTheDocument();
  });

  it("renders the 2nd page of a filtered status directly from a URL-style prop (AC5 initial render)", () => {
    render(<ReservationsSection status="RENTED" page={2} />);

    const rentedCount = RESERVATION_FIXTURES.filter((item) => item.status === "RENTED").length;
    const expectedSecondPageRows = rentedCount - 8;
    expect(expectedSecondPageRows).toBeGreaterThan(0);
    expect(screen.getAllByRole("row")).toHaveLength(1 + expectedSecondPageRows);
  });
});
