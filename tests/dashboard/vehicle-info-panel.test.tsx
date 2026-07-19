import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { VehicleInfoPanel } from "@/components/dashboard/vehicles/VehicleInfoPanel";
import type { VehicleDetailDto } from "@/types/dashboard/vehicle";

const baseVehicle: VehicleDetailDto = {
  vehicleId: "vehicle-mgmt-001",
  imageUrls: [
    "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-001-detail-1.jpg",
    "https://mota-app.duckdns.org/uploads/vehicles/vehicle-mgmt-001-detail-2.jpg",
  ],
  plateNumber: "12가 3456",
  manufacturer: "현대",
  model: "그랜저",
  modelCode: "GN7",
  modelYear: 2024,
  vehicleType: "SEDAN",
  fuelType: "HYBRID",
  options: ["NAVIGATION", "HIPASS"],
  mileage: 15230,
  lastInspectedAt: "2026-06-01",
  tireStatus: "WARNING",
};

/**
 * `VehicleInfoPanel` renders from an explicit `vehicle` prop with no data
 * fetching of its own (issue #42 removed the `useVehicleTireDetail` call) —
 * these tests render synchronously against MSW's `onUnhandledRequest: "error"`
 * setup (`tests/setup.ts`) with no handlers registered, so any accidental
 * network call (e.g. a regression reintroducing the `/tires` query) would
 * fail the test.
 */
describe("VehicleInfoPanel", () => {
  it("renders the plate number, manufacturer+model (no brackets/modelCode) and 연식/연료 labels", () => {
    render(<VehicleInfoPanel vehicle={baseVehicle} />);

    expect(screen.getByText("12가 3456")).toBeInTheDocument();
    // Figma 배너는 차종과 연식/연료를 별도 줄로 분리한다 (issue #53).
    expect(screen.getByText("현대 그랜저")).toBeInTheDocument();
    expect(screen.getByText("2024년식 · 하이브리드차")).toBeInTheDocument();
    expect(screen.queryByText(/GN7/)).not.toBeInTheDocument();
  });

  it("renders the panel-only fuel label distinct from the shared list label ('가솔린차', not '가솔린')", () => {
    render(<VehicleInfoPanel vehicle={{ ...baseVehicle, fuelType: "GASOLINE" }} />);
    expect(screen.getByText(/가솔린차/)).toBeInTheDocument();
  });

  it("renders Korean option chip labels for a variable-length options array", () => {
    render(
      <VehicleInfoPanel
        vehicle={{
          ...baseVehicle,
          options: ["NAVIGATION", "HIPASS", "BLACKBOX", "HEATED_SEAT", "SMART_KEY", "SUNROOF"],
        }}
      />,
    );

    expect(screen.getByText("내비게이션")).toBeInTheDocument();
    expect(screen.getByText("하이패스")).toBeInTheDocument();
    expect(screen.getByText("블랙박스")).toBeInTheDocument();
    expect(screen.getByText("열선 시트")).toBeInTheDocument();
    expect(screen.getByText("스마트키")).toBeInTheDocument();
    expect(screen.getByText("선루프")).toBeInTheDocument();
  });

  it('renders the "—" placeholder for an empty options array', () => {
    render(<VehicleInfoPanel vehicle={{ ...baseVehicle, options: [] }} />);
    expect(screen.getByText("차량 옵션").closest("div")).toHaveTextContent("—");
  });

  it("formats mileage with ko-KR thousands separators and a km suffix", () => {
    render(<VehicleInfoPanel vehicle={{ ...baseVehicle, mileage: 123456 }} />);
    expect(screen.getByText("123,456 km")).toBeInTheDocument();
  });

  it("formats lastInspectedAt (YYYY-MM-DD) as YYYY.MM.DD", () => {
    render(<VehicleInfoPanel vehicle={baseVehicle} />);
    expect(screen.getByText("2026.06.01")).toBeInTheDocument();
  });

  it("renders vehicle.tireStatus directly (WARNING → 위험) without a separate tire-detail fetch", () => {
    render(<VehicleInfoPanel vehicle={baseVehicle} />);
    expect(screen.getByText("타이어 상태").closest("div")).toHaveTextContent("위험");
  });

  it("renders the main photo plus thumbnails for the remaining imageUrls", () => {
    render(<VehicleInfoPanel vehicle={baseVehicle} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", baseVehicle.imageUrls[0]);
  });

  it("renders a standard empty-state placeholder when imageUrls is empty", () => {
    render(<VehicleInfoPanel vehicle={{ ...baseVehicle, imageUrls: [] }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("등록된 차량 사진이 없습니다.")).toBeInTheDocument();
  });

  it("renders the image counter (1/N) with a single accessible description (AC2)", () => {
    // baseVehicle has 2 imageUrls → "전체 2장 중 1번째 사진"; the visual "1/2"
    // digits are aria-hidden so this sr-only text is the only announced label.
    render(<VehicleInfoPanel vehicle={baseVehicle} />);
    expect(screen.getByText("전체 2장 중 1번째 사진")).toBeInTheDocument();
  });

  it("caps thumbnails at 3 even when more than 4 images are provided (slice(1, 4))", () => {
    render(
      <VehicleInfoPanel
        vehicle={{
          ...baseVehicle,
          imageUrls: [
            "https://mota-app.duckdns.org/uploads/vehicles/detail-1.jpg",
            "https://mota-app.duckdns.org/uploads/vehicles/detail-2.jpg",
            "https://mota-app.duckdns.org/uploads/vehicles/detail-3.jpg",
            "https://mota-app.duckdns.org/uploads/vehicles/detail-4.jpg",
            "https://mota-app.duckdns.org/uploads/vehicles/detail-5.jpg",
          ],
        }}
      />,
    );
    // 1 main photo + 3 thumbnails = 4 images (the 5th image is not rendered).
    expect(screen.getAllByRole("img")).toHaveLength(4);
  });
});
