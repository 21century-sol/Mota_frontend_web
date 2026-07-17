import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { ReservationUpdateBar } from "@/components/dashboard/reservations/ReservationUpdateBar";
import { RESERVATIONS_UPDATED_AT_LABEL } from "@/lib/dashboard/reservations/fixtures";

describe("ReservationUpdateBar (A2, AC10)", () => {
  it("shows the fixed update-time label", () => {
    render(<ReservationUpdateBar />);
    expect(screen.getByText(RESERVATIONS_UPDATED_AT_LABEL)).toBeInTheDocument();
  });

  it("resets the filter to 전체/1페이지 (bare path) on reset click", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(<ReservationUpdateBar />);

    await user.click(screen.getByRole("button", { name: "필터 초기화" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations");
  });
});
