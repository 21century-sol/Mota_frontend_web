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
      screen.getByRole("link", { name: "대여 현황" }),
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

    for (const label of ["대시보드", "대여 현황", "고객 문의", "설정"]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("renders the real MOTA logo assets instead of the temporary text mark (issue #40)", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);

    const images = screen.getAllByRole("img");
    // Only the two logo images (app icon mark + wordmark) should render as <img>;
    // nav icons must stay inline SVG (verified separately below).
    expect(images).toHaveLength(1); // app icon has alt="" (decorative), so only the wordmark is exposed as an accessible "img"
    expect(images[0]).toHaveAttribute(
      "src",
      expect.stringContaining("mota-wordmark.svg"),
    );

    const decorativeMark = document.querySelector(
      'img[alt=""]',
    ) as HTMLImageElement | null;
    expect(decorativeMark).not.toBeNull();
    expect(decorativeMark?.src).toContain("mota-app-icon.svg");

    expect(screen.queryByText("MOTA")).not.toBeInTheDocument();
    expect(screen.queryByText("M")).not.toBeInTheDocument();
  });

  it("applies the active nav icon color token only to the current link (issue #40)", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);

    const activeLink = screen.getByRole("link", { name: "대시보드" });
    expect(activeLink).toHaveClass("bg-dashboard-nav-active", "text-white");
    const activeIcon = activeLink.querySelector("svg");
    expect(activeIcon).toHaveClass("text-dashboard-nav-active-icon");
    expect(activeIcon).toHaveAttribute("aria-hidden", "true");

    for (const label of ["차량 관리", "대여 현황", "고객 문의"]) {
      const inactiveLink = screen.getByRole("link", { name: label });
      expect(inactiveLink).toHaveClass("text-dashboard-nav-inactive");
      const inactiveIcon = inactiveLink.querySelector("svg");
      expect(inactiveIcon).not.toHaveClass("text-dashboard-nav-active-icon");
    }

    const settingsLink = screen.getByRole("link", { name: "설정" });
    expect(settingsLink).toHaveClass("text-dashboard-nav-muted");
    expect(settingsLink.querySelector("svg")).not.toHaveClass(
      "text-dashboard-nav-active-icon",
    );
  });

  it("renders the 대여 현황 icon as a document-style mark, not the lucide Calendar grid (issue #40)", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar />);

    const reservationsIcon = screen
      .getByRole("link", { name: "대여 현황" })
      .querySelector("svg");

    expect(reservationsIcon).not.toBeNull();
    // The lucide Calendar icon renders a <rect> for the calendar body and <line>s for
    // the grid header; the replacement document-text icon is built from <path> only.
    expect(reservationsIcon?.querySelector("rect")).toBeNull();
    expect(reservationsIcon?.querySelector("line")).toBeNull();
  });
});
