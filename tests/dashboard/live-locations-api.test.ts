import { describe, expect, it } from "vitest";

import {
  filterLocationsByVehicleIds,
  toLiveLocation,
} from "@/lib/dashboard/live-locations/api";
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

describe("filterLocationsByVehicleIds", () => {
  const all = [
    toLiveLocation(dto({ vehicleId: "v-1" })),
    toLiveLocation(dto({ vehicleId: "v-2", plateNumber: "88허 1004" })),
    toLiveLocation(dto({ vehicleId: "v-rented-only", plateNumber: "27마 5821" })),
  ];

  it("returns only locations whose vehicleId is in the alert set", () => {
    const filtered = filterLocationsByVehicleIds(all, ["v-1", "v-2"]);
    expect(filtered.map((l) => l.vehicleId)).toEqual(["v-1", "v-2"]);
  });

  it("returns an empty list when there are no alert vehicle ids", () => {
    expect(filterLocationsByVehicleIds(all, [])).toEqual([]);
  });

  it("deduplicates via Set membership (same id listed twice still one pin)", () => {
    const filtered = filterLocationsByVehicleIds(all, ["v-1", "v-1"]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.vehicleId).toBe("v-1");
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
