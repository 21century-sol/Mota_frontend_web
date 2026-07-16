import { describe, expect, it } from "vitest";

import {
  buildVehicleListHref,
  parseVehicleListFilters,
} from "@/lib/dashboard/vehicles/url";

describe("buildVehicleListHref", () => {
  it("returns the bare path when no filter is set", () => {
    expect(buildVehicleListHref({})).toBe("/dashboard/vehicles");
  });

  it("includes only `status` when `tireStatus` is omitted", () => {
    expect(buildVehicleListHref({ status: "AVAILABLE" })).toBe(
      "/dashboard/vehicles?status=AVAILABLE",
    );
  });

  it("includes only `tireStatus` when `status` is omitted", () => {
    expect(buildVehicleListHref({ tireStatus: "CAUTION" })).toBe(
      "/dashboard/vehicles?tireStatus=CAUTION",
    );
  });

  it("includes both params together (AND) when both are set", () => {
    expect(
      buildVehicleListHref({ status: "AVAILABLE", tireStatus: "CAUTION" }),
    ).toBe("/dashboard/vehicles?status=AVAILABLE&tireStatus=CAUTION");
  });

  it("drops a param that is explicitly undefined (used to clear a filter)", () => {
    expect(
      buildVehicleListHref({ status: "RENTED", tireStatus: undefined }),
    ).toBe("/dashboard/vehicles?status=RENTED");
  });
});

describe("parseVehicleListFilters", () => {
  it("parses valid `status`/`tireStatus` values", () => {
    expect(
      parseVehicleListFilters({ status: "RENTED", tireStatus: "WARNING" }),
    ).toEqual({ status: "RENTED", tireStatus: "WARNING" });
  });

  it("omits both filters when the query has neither", () => {
    expect(parseVehicleListFilters({})).toEqual({
      status: undefined,
      tireStatus: undefined,
    });
  });

  it("falls back to undefined for an unrecognized enum value instead of throwing", () => {
    expect(parseVehicleListFilters({ status: "SCRAPPED" })).toEqual({
      status: undefined,
      tireStatus: undefined,
    });
  });

  it("falls back to undefined for a duplicated (array) query value instead of throwing", () => {
    expect(
      parseVehicleListFilters({ status: ["AVAILABLE", "RENTED"] }),
    ).toEqual({ status: undefined, tireStatus: undefined });
  });
});
