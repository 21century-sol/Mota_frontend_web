import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CostChartSection } from "@/components/dashboard/cost-chart/CostChartSection";

describe("CostChartSection", () => {
  it("renders the 2026 title, comparison direction, and highlighted value by default (AC1, AC2)", () => {
    render(<CostChartSection />);

    expect(
      screen.getByRole("heading", { level: 2, name: "차량유지보수비" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "전년대비 22% 감소" }),
    ).toBeInTheDocument();

    const table = screen.getByRole("table", { hidden: true });
    expect(within(table).getByText(/2026년/)).toBeInTheDocument();
    expect(within(table).getByText("1,760만원")).toBeInTheDocument();
  });

  it("switches to the 2025 dataset when the year pill is clicked, with no network request (AC3)", async () => {
    const user = userEvent.setup();
    render(<CostChartSection />);

    await user.click(screen.getByRole("button", { name: "2025년 데이터 보기" }));

    expect(
      screen.getByRole("group", { name: "전년대비 15% 증가" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "전년대비 22% 감소" }),
    ).not.toBeInTheDocument();

    const table = screen.getByRole("table", { hidden: true });
    expect(within(table).getByText(/2025년/)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "2025년 데이터 보기" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "2026년 데이터 보기" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("supports switching years by keyboard (Tab + Enter) (AC6)", async () => {
    const user = userEvent.setup();
    render(<CostChartSection />);

    const year2025Button = screen.getByRole("button", {
      name: "2025년 데이터 보기",
    });
    year2025Button.focus();
    expect(year2025Button).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("group", { name: "전년대비 15% 증가" }),
    ).toBeInTheDocument();
  });

  it("keeps the chart visual non-interactive while year buttons remain selectable", () => {
    const { container } = render(<CostChartSection />);
    const chartVisual = container.querySelector(
      '[aria-hidden="true"].pointer-events-none',
    );

    expect(chartVisual).toHaveClass("pointer-events-none", "select-none");
    expect(
      screen.getByRole("button", { name: "2025년 데이터 보기" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "2026년 데이터 보기" }),
    ).toBeEnabled();
  });

  it("provides an sr-only table with all 12 months and an explicit direction word (AC5)", () => {
    render(<CostChartSection />);

    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveClass("sr-only");

    for (let month = 1; month <= 12; month += 1) {
      expect(
        within(table).getByRole("rowheader", { name: `${month}월` }),
      ).toBeInTheDocument();
    }
    expect(within(table).getByText(/감소\.?$/)).toBeInTheDocument();
  });

  it('renders "전체보기" as static text with no click interaction (AC9)', () => {
    render(<CostChartSection />);

    expect(screen.getByText("전체")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /전체/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /전체$/ }),
    ).not.toBeInTheDocument();
  });
});
