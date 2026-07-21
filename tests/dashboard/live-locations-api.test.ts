import { describe, expect, it } from "vitest";

import {
  fetchLiveLocations,
  toLiveLocation,
} from "@/lib/dashboard/live-locations/api";
import { server } from "@/lib/dashboard/msw/server";
import { liveLocationsNormalHandler } from "@/lib/dashboard/msw/handlers/live-locations";
import type { LiveLocationDto } from "@/types/dashboard/live-locations";

const dto = (overrides: Partial<LiveLocationDto> = {}): LiveLocationDto => ({
  vehicleId: "v-1",
  plateNumber: "12가 3456",
  model: "아반떼",
  latitude: 33.5,
  longitude: 126.5,
  measuredAt: "2026-07-16T10:00:00",
  ...overrides,
});

describe("fetchLiveLocations", () => {
  it("returns every rented vehicle from the API, including vehicles absent from alerts (#69)", async () => {
    server.use(liveLocationsNormalHandler);

    const locations = await fetchLiveLocations();

    expect(locations.map((location) => location.vehicleId)).toEqual([
      "v-1",
      "v-2",
      "v-rented-only",
    ]);
    expect(
      locations.find((location) => location.vehicleId === "v-rented-only"),
    ).toMatchObject({
      plateNumber: "27마 5821",
      model: "쏘나타 뉴 라이즈",
    });
  });
});

describe("toLiveLocation", () => {
  it("maps latitude/longitude to lat/lng", () => {
    expect(toLiveLocation(dto())).toMatchObject({
      vehicleId: "v-1",
      lat: 33.5,
      lng: 126.5,
    });
  });
});
