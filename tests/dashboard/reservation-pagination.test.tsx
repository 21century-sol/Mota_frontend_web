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

  it("renders square (rounded-lg) 30px pill buttons, not the earlier rounded-full shape (issue #38)", () => {
    render(
      <ReservationPagination currentStatus={undefined} currentPage={1} totalPages={2} />,
    );

    const page1 = screen.getByRole("button", { name: "1" });
    expect(page1.className).toContain("rounded-lg");
    expect(page1.className).toContain("h-[30px]");
    expect(page1.className).toContain("w-[30px]");
    expect(page1.className).not.toContain("rounded-full");
  });

  it("styles the active page with the accent fill and the inactive page as a bordered white/black pill (issue #38)", () => {
    render(
      <ReservationPagination currentStatus={undefined} currentPage={1} totalPages={2} />,
    );

    const activePage = screen.getByRole("button", { name: "1" });
    const inactivePage = screen.getByRole("button", { name: "2" });

    expect(activePage.className).toContain("bg-dashboard-chart-accent");
    expect(activePage.className).toContain("text-white");
    expect(inactivePage.className).toContain("bg-white");
    expect(inactivePage.className).toContain("text-black");
    expect(inactivePage.className).toContain("border-dashboard-reservation-page-border");
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
