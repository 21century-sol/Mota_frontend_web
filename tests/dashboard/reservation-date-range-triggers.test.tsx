import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReservationDateRangeTriggers } from "@/components/dashboard/reservations/ReservationDateRangeTriggers";

describe("ReservationDateRangeTriggers (AC10, Non-goal: no real filtering)", () => {
  it("renders both 대여일/반납일 triggers as focusable, accessibly-named buttons", () => {
    render(<ReservationDateRangeTriggers />);

    const rentedTrigger = screen.getByRole("button", { name: "대여일 선택" });
    const returnedTrigger = screen.getByRole("button", { name: "반납일 선택" });

    expect(rentedTrigger).toBeInTheDocument();
    expect(returnedTrigger).toBeInTheDocument();
    expect(rentedTrigger).not.toBeDisabled();
    expect(returnedTrigger).not.toBeDisabled();
  });
});
