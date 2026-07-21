import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

import type { KakaoMapsNamespace } from "@/lib/dashboard/map/kakao-loader";
import type { LiveLocation } from "@/types/dashboard/live-locations";

const loaderMock = vi.hoisted(() => ({
  loadKakaoMaps: vi.fn(),
}));

vi.mock("@/lib/dashboard/env/client", () => ({
  dashboardClientEnv: {
    apiBase: "",
    kakaoMapAppKey: "test-kakao-key",
  },
}));

vi.mock("@/lib/dashboard/map/kakao-loader", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/dashboard/map/kakao-loader")>();
  return {
    ...actual,
    loadKakaoMaps: loaderMock.loadKakaoMaps,
  };
});

import { VehicleMap } from "@/components/dashboard/alerts-map/VehicleMap";

class MockLatLng {
  constructor(
    readonly lat: number,
    readonly lng: number,
  ) {}

  getLat() {
    return this.lat;
  }

  getLng() {
    return this.lng;
  }
}

class MockLatLngBounds {
  readonly positions: MockLatLng[] = [];

  extend(position: MockLatLng) {
    this.positions.push(position);
  }
}

class MockSize {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
}

class MockPoint {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}
}

class MockMarkerImage {
  constructor(
    readonly src: string,
    readonly size: MockSize,
  ) {}
}

class MockMarker {
  static instances: MockMarker[] = [];

  readonly setMap = vi.fn();
  readonly setPosition = vi.fn();
  readonly setImage = vi.fn();

  constructor(
    readonly options: {
      position: MockLatLng;
      map?: MockMap;
      image?: MockMarkerImage;
    },
  ) {
    MockMarker.instances.push(this);
  }
}

class MockMap {
  static instances: MockMap[] = [];

  readonly setCenter = vi.fn();
  readonly panTo = vi.fn();
  readonly jump = vi.fn();
  readonly setLevel = vi.fn();
  readonly setBounds = vi.fn();

  constructor(
    readonly container: HTMLElement,
    readonly options: { center: MockLatLng; level?: number },
  ) {
    MockMap.instances.push(this);
  }
}

const mapsNamespace = {
  load: (callback: () => void) => callback(),
  LatLng: MockLatLng,
  LatLngBounds: MockLatLngBounds,
  Map: MockMap,
  Marker: MockMarker,
  MarkerImage: MockMarkerImage,
  Size: MockSize,
  Point: MockPoint,
} as unknown as KakaoMapsNamespace;

const locations: LiveLocation[] = [
  {
    vehicleId: "v-1",
    plateNumber: "12가 3456",
    model: "아반떼",
    lat: 33.5,
    lng: 126.5,
    measuredAt: "2026-07-21T14:00:00",
  },
  {
    vehicleId: "v-2",
    plateNumber: "88허 1004",
    model: "쏘나타",
    lat: 33.51,
    lng: 126.51,
    measuredAt: "2026-07-21T14:00:00",
  },
];

describe("VehicleMap selected vehicle zoom", () => {
  beforeEach(() => {
    MockMap.instances = [];
    MockMarker.instances = [];
    loaderMock.loadKakaoMaps.mockReset();
    loaderMock.loadKakaoMaps.mockResolvedValue(mapsNamespace);
    window.kakao = { maps: mapsNamespace };
  });

  afterEach(() => {
    delete window.kakao;
  });

  it("zooms and centers again on the same vehicle re-click", async () => {
    const { rerender } = render(
      <VehicleMap
        locations={locations}
        selectedVehicleId={null}
        focusNonce={0}
      />,
    );

    await waitFor(() => expect(MockMap.instances).toHaveLength(1));
    await waitFor(() => expect(MockMarker.instances).toHaveLength(2));

    const map = MockMap.instances[0];
    expect(map.setBounds).toHaveBeenCalledTimes(1);

    rerender(
      <VehicleMap
        locations={locations}
        selectedVehicleId="v-1"
        focusNonce={1}
      />,
    );

    await waitFor(() => expect(map.jump).toHaveBeenCalledTimes(1));
    expect(map.jump).toHaveBeenLastCalledWith(
      expect.objectContaining({ lat: 33.5, lng: 126.5 }),
      3,
      expect.objectContaining({
        animate: { duration: 300 },
      }),
    );

    const movedLocations = [
      { ...locations[0], lat: 33.505, lng: 126.505 },
      locations[1],
    ];
    rerender(
      <VehicleMap
        locations={movedLocations}
        selectedVehicleId="v-1"
        focusNonce={1}
      />,
    );

    await waitFor(() =>
      expect(MockMarker.instances[0].setPosition).toHaveBeenCalledWith(
        expect.objectContaining({ lat: 33.505, lng: 126.505 }),
      ),
    );
    expect(map.jump).toHaveBeenCalledTimes(1);

    rerender(
      <VehicleMap
        locations={movedLocations}
        selectedVehicleId="v-1"
        focusNonce={2}
      />,
    );

    await waitFor(() => expect(map.jump).toHaveBeenCalledTimes(2));
    expect(map.jump).toHaveBeenLastCalledWith(
      expect.objectContaining({ lat: 33.505, lng: 126.505 }),
      3,
      expect.objectContaining({ animate: { duration: 300 } }),
    );
  });

  it("does not zoom or pan when the selected vehicle has no GPS row", async () => {
    render(
      <VehicleMap
        locations={locations}
        selectedVehicleId="missing-vehicle"
        focusNonce={1}
      />,
    );

    await waitFor(() => expect(MockMap.instances).toHaveLength(1));
    await waitFor(() => expect(MockMarker.instances).toHaveLength(2));

    const map = MockMap.instances[0];
    expect(map.jump).not.toHaveBeenCalled();
    expect(map.setLevel).not.toHaveBeenCalled();
    expect(map.panTo).not.toHaveBeenCalled();
  });
});
