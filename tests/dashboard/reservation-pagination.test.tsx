import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { ReservationPagination } from "@/components/dashboard/reservations/ReservationPagination";

describe("ReservationPagination (AC3, AC10)", () => {
  it("renders nothing for a single page of results", () => {
    render(
      <ReservationPagination currentStatus={undefined} currentPage={1} totalPages={1} />,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("marks the current page via aria-current", () => {
    render(
      <ReservationPagination currentStatus={undefined} currentPage={2} totalPages={2} />,
    );
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
  });

  it("navigates to ?page=2 when page 2 is clicked, preserving the current status (AC3)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <ReservationPagination currentStatus="RENTED" currentPage={1} totalPages={2} />,
    );

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations?status=RENTED&page=2");
  });

  it("omits page from the URL when navigating back to page 1", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <ReservationPagination currentStatus={undefined} currentPage={2} totalPages={2} />,
    );

    await user.click(screen.getByRole("button", { name: "1" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations");
  });
});
