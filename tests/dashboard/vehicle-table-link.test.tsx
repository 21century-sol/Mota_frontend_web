import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { VehicleTable } from "@/components/dashboard/vehicles/VehicleTable";
import type { VehicleListItem } from "@/types/dashboard/vehicle";

const vehicle: VehicleListItem = {
  vehicleId: "vehicle-mgmt-001",
  plateNumber: "12가 3456",
  model: "아반떼 하이브리드",
  modelYear: 2022,
  manufacturer: "현대",
  vehicleType: "SEDAN",
  fuelType: "HYBRID",
  imageUrl: "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-001.jpg",
  status: "AVAILABLE",
  tireStatus: "NORMAL",
  rentedAt: null,
  returnedAt: null,
};

describe("VehicleTable row link (issue #15 AC1/AC2)", () => {
  it("wraps each row in a link to /dashboard/vehicles/{vehicleId} with an accessible name", () => {
    render(<VehicleTable vehicles={[vehicle]} />);

    const link = screen.getByRole("link", { name: "12가 3456 현대 아반떼 하이브리드 상세보기" });
    expect(link).toHaveAttribute("href", "/dashboard/vehicles/vehicle-mgmt-001");
  });

  it("is keyboard-focusable with a visible focus style", () => {
    render(<VehicleTable vehicles={[vehicle]} />);

    const link = screen.getByRole("link", { name: "12가 3456 현대 아반떼 하이브리드 상세보기" });
    link.focus();
    expect(link).toHaveFocus();
    expect(link.className).toContain("focus-visible:ring-2");
  });

  it("still renders every #14 column's text content (regression, AC24)", () => {
    render(<VehicleTable vehicles={[vehicle]} />);

    expect(screen.getByText("12가 3456")).toBeInTheDocument();
    expect(screen.getByText(/현대 아반떼 하이브리드 · 2022/)).toBeInTheDocument();
    expect(screen.getByText("대여 가능")).toBeInTheDocument();
    expect(screen.getByText("정상")).toBeInTheDocument();
  });
});
