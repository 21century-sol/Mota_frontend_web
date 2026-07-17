import { describe, expect, it } from "vitest";

import {
  buildVehicleDetailHref,
  parseVehicleDetailTab,
  parseVehicleUsagePage,
} from "@/lib/dashboard/vehicles/tab-url";

describe("parseVehicleDetailTab", () => {
  it("defaults to 'tires' when the tab query is missing (AC12)", () => {
    expect(parseVehicleDetailTab(undefined)).toBe("tires");
  });

  it("accepts a recognized tab value", () => {
    expect(parseVehicleDetailTab("usage")).toBe("usage");
    expect(parseVehicleDetailTab("inspection")).toBe("inspection");
    expect(parseVehicleDetailTab("info")).toBe("info");
  });

  it("degrades an unrecognized tab value to the default instead of throwing", () => {
    expect(parseVehicleDetailTab("unknown-tab")).toBe("tires");
  });

  it("degrades a duplicated array query value to the default", () => {
    expect(parseVehicleDetailTab(["usage", "info"])).toBe("tires");
  });
});

describe("parseVehicleUsagePage", () => {
  it("defaults to 1 when the page query is missing", () => {
    expect(parseVehicleUsagePage(undefined)).toBe(1);
  });

  it("parses a valid positive integer", () => {
    expect(parseVehicleUsagePage("3")).toBe(3);
  });

  it("degrades a non-positive or non-integer value to 1", () => {
    expect(parseVehicleUsagePage("0")).toBe(1);
    expect(parseVehicleUsagePage("-2")).toBe(1);
    expect(parseVehicleUsagePage("abc")).toBe(1);
  });
});

describe("buildVehicleDetailHref", () => {
  const vehicleId = "vehicle-mgmt-003";

  it("omits the tab query for the default 'tires' tab (AC12)", () => {
    expect(buildVehicleDetailHref(vehicleId, "tires")).toBe(
      `/dashboard/vehicles/${vehicleId}`,
    );
  });

  it("adds ?tab=usage/inspection/info for the other 3 tabs (AC13)", () => {
    expect(buildVehicleDetailHref(vehicleId, "usage")).toBe(
      `/dashboard/vehicles/${vehicleId}?tab=usage`,
    );
    expect(buildVehicleDetailHref(vehicleId, "inspection")).toBe(
      `/dashboard/vehicles/${vehicleId}?tab=inspection`,
    );
    expect(buildVehicleDetailHref(vehicleId, "info")).toBe(
      `/dashboard/vehicles/${vehicleId}?tab=info`,
    );
  });

  it("adds &page=N only for the usage tab beyond page 1 (AC19)", () => {
    expect(buildVehicleDetailHref(vehicleId, "usage", 2)).toBe(
      `/dashboard/vehicles/${vehicleId}?tab=usage&page=2`,
    );
    expect(buildVehicleDetailHref(vehicleId, "usage", 1)).toBe(
      `/dashboard/vehicles/${vehicleId}?tab=usage`,
    );
  });

  it("never adds a page query for a non-usage tab", () => {
    expect(buildVehicleDetailHref(vehicleId, "tires", 3)).toBe(
      `/dashboard/vehicles/${vehicleId}`,
    );
  });
});
