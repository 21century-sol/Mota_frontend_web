import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { VehicleFilterBar } from "@/components/dashboard/vehicles/VehicleFilterBar";
import { VehicleTireStatusFilter } from "@/components/dashboard/vehicles/VehicleTireStatusFilter";

describe("VehicleFilterBar (AC2, AC6)", () => {
  it("marks the current status tab as selected via aria-pressed", () => {
    render(
      <VehicleFilterBar currentStatus="AVAILABLE" currentTireStatus={[]} />,
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

  it("replaces the URL with `?status=` on tab click and preserves the current tireStatus selection (AC6)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleFilterBar currentStatus={undefined} currentTireStatus={["CAUTION"]} />,
    );

    await user.click(screen.getByRole("button", { name: "대여 가능" }));

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/vehicles?status=AVAILABLE&tireStatus=CAUTION",
    );
  });

  it("clears `status` from the URL when '전체' is clicked, preserving the tireStatus selection", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleFilterBar currentStatus="RENTED" currentTireStatus={["WARNING"]} />,
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
      <VehicleFilterBar currentStatus={undefined} currentTireStatus={[]} />,
    );

    const availableTab = screen.getByRole("button", { name: "대여 가능" });
    availableTab.focus();
    expect(availableTab).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles?status=AVAILABLE");
  });
});

describe("VehicleTireStatusFilter (AC4, AC6)", () => {
  it("marks the current chip as selected via aria-pressed", () => {
    render(
      <VehicleTireStatusFilter currentStatus={undefined} currentTireStatus={["WARNING"]} />,
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
      <VehicleTireStatusFilter currentStatus="AVAILABLE" currentTireStatus={[]} />,
    );

    await user.click(screen.getByRole("button", { name: "주의" }));

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/vehicles?status=AVAILABLE&tireStatus=CAUTION",
    );
  });

  it("removes the clicked chip from the selection (toggle off) on a second click", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleTireStatusFilter currentStatus="AVAILABLE" currentTireStatus={["CAUTION"]} />,
    );

    await user.click(screen.getByRole("button", { name: "주의" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/vehicles?status=AVAILABLE");
  });

  it("adds a chip to an existing multi-value selection instead of replacing it (issue #35 AC4)", async () => {
    replace.mockClear();
    const user = userEvent.setup();
    render(
      <VehicleTireStatusFilter currentStatus={undefined} currentTireStatus={["NORMAL"]} />,
    );

    await user.click(screen.getByRole("button", { name: "위험" }));

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/vehicles?tireStatus=NORMAL,WARNING",
    );
  });
});
