import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { ReservationStatusTabs } from "@/components/dashboard/reservations/ReservationStatusTabs";

describe("ReservationStatusTabs (AC2, AC4, AC10)", () => {
  it("marks the current tab as selected via aria-pressed", () => {
    render(<ReservationStatusTabs currentStatus="RENTED" />);

    expect(screen.getByRole("button", { name: "대여 중" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("renders the exact confirmed tab text including the '반납 완료' space", () => {
    render(<ReservationStatusTabs currentStatus={undefined} />);
    expect(screen.getByRole("button", { name: "반납 완료" })).toBeInTheDocument();
  });

  it("replaces the URL with ?status=RENTED on tab click (AC2)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(<ReservationStatusTabs currentStatus={undefined} />);

    await user.click(screen.getByRole("button", { name: "대여 중" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations?status=RENTED");
  });

  it("clears status and page from the URL when '전체' is clicked (AC4)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(<ReservationStatusTabs currentStatus="RETURNED" />);

    await user.click(screen.getByRole("button", { name: "전체" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations");
  });

  it("supports keyboard activation (Tab + Enter, AC10)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(<ReservationStatusTabs currentStatus={undefined} />);

    const rentedTab = screen.getByRole("button", { name: "대여 중" });
    rentedTab.focus();
    expect(rentedTab).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations?status=RENTED");
  });
});
