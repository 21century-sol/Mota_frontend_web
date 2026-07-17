import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { ReservationListPanel } from "@/components/dashboard/reservations/ReservationListPanel";
import type { ReservationItem, ReservationPageInfo } from "@/types/dashboard/reservation";

const ITEM: ReservationItem = {
  id: "res-a",
  renterName: "김모타",
  renterPhone: "010-1243-1231",
  plateNumber: "12가 4412",
  vehicleModel: "현대 그랜저 GN7",
  rentedAt: "2026-07-19",
  returnedAt: "2026-07-21",
  status: "RETURNED",
};

const PAGE_INFO: ReservationPageInfo = { page: 1, pageSize: 8, totalCount: 1, totalPages: 1 };

describe("ReservationListPanel (AC1, AC8, AC11)", () => {
  it("renders the '대여 현황' heading and the table when items are present (AC1, AC11)", () => {
    render(<ReservationListPanel status={undefined} items={[ITEM]} pageInfo={PAGE_INFO} />);

    expect(screen.getByRole("heading", { name: "대여 현황" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows a role=status empty message instead of the table when items is empty (AC8)", () => {
    render(
      <ReservationListPanel
        status="RETURNED"
        items={[]}
        pageInfo={{ page: 1, pageSize: 8, totalCount: 0, totalPages: 1 }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("표시할 예약이 없습니다.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the '전체 N건 중 X-Y 표시' count text for a populated page", () => {
    render(
      <ReservationListPanel
        status={undefined}
        items={[ITEM]}
        pageInfo={{ page: 1, pageSize: 8, totalCount: 9, totalPages: 2 }}
      />,
    );

    // pageInfo drives the range text (not items.length): page 1 of 8/pageSize
    // against a totalCount of 9 → "1-8".
    expect(screen.getByText("전체 9건 중 1-8 표시")).toBeInTheDocument();
  });
});
