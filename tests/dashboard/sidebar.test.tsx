import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../../components/dashboard/Sidebar";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("Sidebar", () => {
  it("renders all five menu entries and the admin nav landmark", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);

    const nav = screen.getByRole("navigation", { name: "관리자 메뉴" });
    expect(nav).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "대시보드" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "차량 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "예약 내역" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "고객 문의" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "설정" })).toBeInTheDocument();

    // Only the 5 confirmed menu items exist; no leftover placeholder links.
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("marks only the menu matching the current pathname as aria-current", () => {
    mockUsePathname.mockReturnValue("/dashboard/vehicles/123");
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "차량 관리" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    for (const label of ["대시보드", "예약 내역", "고객 문의", "설정"]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });
});
