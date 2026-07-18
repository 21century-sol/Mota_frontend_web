import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { ReservationUpdateBar } from "@/components/dashboard/reservations/ReservationUpdateBar";
import { RESERVATIONS_UPDATED_AT_LABEL } from "@/lib/dashboard/reservations/fixtures";
import { formatReservationUpdatedAtLabel } from "@/lib/dashboard/reservations/format";

describe("ReservationUpdateBar (A2, AC10, issue #38 hydration-safe timestamp)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-07-18T09:30:00") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders only the static fallback label on the server, before any mount effect can run", () => {
    // `renderToStaticMarkup` never commits effects, so this reproduces exactly
    // what the server sends down for the first paint — it must match the
    // pre-effect client render byte-for-byte or React logs a hydration
    // mismatch warning.
    const html = renderToStaticMarkup(<ReservationUpdateBar />);
    expect(html).toContain(RESERVATIONS_UPDATED_AT_LABEL);
  });

  it("replaces the fallback with the live time once the mount effect commits", () => {
    render(<ReservationUpdateBar />);
    expect(
      screen.getByText(formatReservationUpdatedAtLabel(new Date())),
    ).toBeInTheDocument();
    expect(screen.queryByText(RESERVATIONS_UPDATED_AT_LABEL)).not.toBeInTheDocument();
  });

  it("has an accessible name reflecting refresh + filter reset on the button", () => {
    render(<ReservationUpdateBar />);
    expect(
      screen.getByRole("button", { name: "목록 새로고침 (필터 초기화)" }),
    ).toBeInTheDocument();
  });

  it("resets the filter to 전체/1페이지 (bare path) on refresh click", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(<ReservationUpdateBar />);

    await user.click(screen.getByRole("button", { name: "목록 새로고침 (필터 초기화)" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/reservations");
  });

  it("recomputes the displayed time on a second refresh click", async () => {
    const user = userEvent.setup();
    render(<ReservationUpdateBar />);

    vi.setSystemTime(new Date("2026-07-18T09:45:00"));
    await user.click(screen.getByRole("button", { name: "목록 새로고침 (필터 초기화)" }));

    expect(
      screen.getByText(formatReservationUpdatedAtLabel(new Date("2026-07-18T09:45:00"))),
    ).toBeInTheDocument();
  });
});
