import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { VehicleFilterBar } from "@/components/dashboard/vehicles/VehicleFilterBar";
import { VehicleTireStatusFilter } from "@/components/dashboard/vehicles/VehicleTireStatusFilter";

describe("VehicleFilterBar (AC6, AC9)", () => {
  it("marks the current status tab as selected via aria-pressed", () => {
    render(
      <VehicleFilterBar currentStatus="AVAILABLE" currentTireStatus={undefined} />,
    );

    expect(screen.getByRole("button", { name: "대여 가능" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("replaces the URL with `?status=` on tab click and preserves the current tireStatus (AC6)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleFilterBar currentStatus={undefined} currentTireStatus="CAUTION" />,
    );

    await user.click(screen.getByRole("button", { name: "대여 가능" }));

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/vehicles?status=AVAILABLE&tireStatus=CAUTION",
    );
  });

  it("clears `status` from the URL when '전체' is clicked, preserving tireStatus", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleFilterBar currentStatus="RENTED" currentTireStatus="WARNING" />,
    );

    await user.click(screen.getByRole("button", { name: "전체" }));

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/vehicles?tireStatus=WARNING",
    );
  });

  it("supports keyboard activation (Tab + Enter)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleFilterBar currentStatus={undefined} currentTireStatus={undefined} />,
    );

    const availableTab = screen.getByRole("button", { name: "대여 가능" });
    availableTab.focus();
    expect(availableTab).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles?status=AVAILABLE");
  });
});

describe("VehicleTireStatusFilter (AC6, AC9)", () => {
  it("marks the current chip as selected via aria-pressed", () => {
    render(
      <VehicleTireStatusFilter currentStatus={undefined} currentTireStatus="WARNING" />,
    );

    expect(screen.getByRole("button", { name: "위험" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "정상" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("replaces the URL with `?tireStatus=` on chip click and preserves the current status (AC6)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleTireStatusFilter currentStatus="AVAILABLE" currentTireStatus={undefined} />,
    );

    await user.click(screen.getByRole("button", { name: "주의" }));

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/vehicles?status=AVAILABLE&tireStatus=CAUTION",
    );
  });

  it("toggles the selected chip off (clears tireStatus) on a second click", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleTireStatusFilter currentStatus="AVAILABLE" currentTireStatus="CAUTION" />,
    );

    await user.click(screen.getByRole("button", { name: "주의" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles?status=AVAILABLE");
  });
});
