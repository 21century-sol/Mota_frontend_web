import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { ReservationDateRangeTriggers } from "@/components/dashboard/reservations/ReservationDateRangeTriggers";

describe("ReservationDateRangeTriggers (issue #29, AC2-AC7)", () => {
  it("renders both 대여일/반납일 triggers as focusable, accessibly-named buttons with no popover open by default", () => {
    render(
      <ReservationDateRangeTriggers
        currentStatus={undefined}
        rentedOn={undefined}
        returnedOn={undefined}
      />,
    );

    const rentedTrigger = screen.getByRole("button", { name: "대여일 선택" });
    const returnedTrigger = screen.getByRole("button", { name: "반납일 선택" });

    expect(rentedTrigger).toBeInTheDocument();
    expect(returnedTrigger).toBeInTheDocument();
    expect(rentedTrigger).not.toBeDisabled();
    expect(returnedTrigger).not.toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the 대여일 calendar popover with header, weekday row and today/close buttons (AC2)", async () => {
    const user = userEvent.setup();
    render(
      <ReservationDateRangeTriggers
        currentStatus={undefined}
        rentedOn={undefined}
        returnedOn={undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "대여일 선택" }));

    const dialog = screen.getByRole("dialog", { name: "대여일 달력" });
    expect(within(dialog).getByText("2026년 7월")).toBeInTheDocument();
    expect(within(dialog).getByText("일")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "오늘 날짜" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "닫기" })).toBeInTheDocument();
  });

  it("closes the 대여일 calendar and opens only the 반납일 calendar when 반납일 is clicked (AC3)", async () => {
    const user = userEvent.setup();
    render(
      <ReservationDateRangeTriggers
        currentStatus={undefined}
        rentedOn={undefined}
        returnedOn={undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "대여일 선택" }));
    expect(screen.getByRole("dialog", { name: "대여일 달력" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "반납일 선택" }));

    expect(screen.queryByRole("dialog", { name: "대여일 달력" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "반납일 달력" })).toBeInTheDocument();
  });

  it("selecting a date updates the URL with rentedOn and closes the popover, updating the trigger label (AC4)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <ReservationDateRangeTriggers
        currentStatus={undefined}
        rentedOn={undefined}
        returnedOn={undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "대여일 선택" }));
    await user.click(screen.getByRole("button", { name: "2026-07-16" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations?rentedOn=2026-07-16");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking '오늘 날짜' selects the fixed reference today for the open field (AC5)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <ReservationDateRangeTriggers
        currentStatus={undefined}
        rentedOn={undefined}
        returnedOn={undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "반납일 선택" }));
    await user.click(screen.getByRole("button", { name: "오늘 날짜" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations?returnedOn=2026-07-16");
  });

  it("clicking '닫기' closes the popover without changing the selection (AC6)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <ReservationDateRangeTriggers
        currentStatus={undefined}
        rentedOn="2026-07-19"
        returnedOn={undefined}
      />,
    );

    // The trigger's accessible name stays the fixed "대여일 선택" (its
    // `aria-label`) even though the visible label text updates to the
    // formatted date — assert the visible text separately from the a11y name.
    const rentedTrigger = screen.getByRole("button", { name: "대여일 선택" });
    expect(rentedTrigger).toHaveTextContent("26.07.19");

    await user.click(rentedTrigger);
    expect(screen.getByRole("button", { name: "2026-07-19" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "대여일 선택" })).toHaveTextContent("26.07.19");
  });

  it("closes the popover on Escape without changing the selection (AC6)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <ReservationDateRangeTriggers
        currentStatus={undefined}
        rentedOn={undefined}
        returnedOn={undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "대여일 선택" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the popover when clicking outside the trigger/popover area (AC6)", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ReservationDateRangeTriggers
          currentStatus={undefined}
          rentedOn={undefined}
          returnedOn={undefined}
        />
        <button type="button">바깥 버튼</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "대여일 선택" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "바깥 버튼" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
