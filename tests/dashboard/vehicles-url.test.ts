import { describe, expect, it } from "vitest";

import {
  buildVehicleListHref,
  parseVehicleListFilters,
} from "@/lib/dashboard/vehicles/url";

describe("buildVehicleListHref", () => {
  it("returns the bare path when no filter is set", () => {
    expect(buildVehicleListHref({ tireStatus: [] })).toBe("/dashboard/vehicles");
  });

  it("includes only `status` when `tireStatus` is empty", () => {
    expect(
      buildVehicleListHref({ status: "AVAILABLE", tireStatus: [] }),
    ).toBe("/dashboard/vehicles?status=AVAILABLE");
  });

  it("includes only `tireStatus` when `status` is omitted", () => {
    expect(buildVehicleListHref({ tireStatus: ["CAUTION"] })).toBe(
      "/dashboard/vehicles?tireStatus=CAUTION",
    );
  });

  it("includes both params together (AND) when both are set", () => {
    expect(
      buildVehicleListHref({ status: "AVAILABLE", tireStatus: ["CAUTION"] }),
    ).toBe("/dashboard/vehicles?status=AVAILABLE&tireStatus=CAUTION");
  });

  it("drops `status` when it is explicitly undefined (used to clear that filter)", () => {
    expect(
      buildVehicleListHref({ status: undefined, tireStatus: ["WARNING"] }),
    ).toBe("/dashboard/vehicles?tireStatus=WARNING");
  });

  it("comma-joins a multi-value `tireStatus` selection in canonical NORMAL,CAUTION,WARNING order regardless of input order (issue #35 AC4)", () => {
    expect(
      buildVehicleListHref({ tireStatus: ["WARNING", "CAUTION"] }),
    ).toBe("/dashboard/vehicles?tireStatus=CAUTION,WARNING");

    expect(
      buildVehicleListHref({ tireStatus: ["CAUTION", "NORMAL", "WARNING"] }),
    ).toBe("/dashboard/vehicles?tireStatus=NORMAL,CAUTION,WARNING");
  });

  it("de-duplicates a `tireStatus` selection", () => {
    expect(
      buildVehicleListHref({ tireStatus: ["WARNING", "WARNING"] }),
    ).toBe("/dashboard/vehicles?tireStatus=WARNING");
  });
});

describe("parseVehicleListFilters", () => {
  it("parses valid `status`/`tireStatus` values", () => {
    expect(
      parseVehicleListFilters({ status: "RENTED", tireStatus: "WARNING" }),
    ).toEqual({ status: "RENTED", tireStatus: ["WARNING"] });
  });

  it("parses a comma-joined multi-value `tireStatus` into canonical order (issue #35 AC4)", () => {
    expect(
      parseVehicleListFilters({ tireStatus: "WARNING,CAUTION" }),
    ).toEqual({ status: undefined, tireStatus: ["CAUTION", "WARNING"] });
  });

  it("omits both filters when the query has neither", () => {
    expect(parseVehicleListFilters({})).toEqual({
      status: undefined,
      tireStatus: [],
    });
  });

  it("falls back to undefined/[] for an unrecognized enum value instead of throwing", () => {
    expect(
      parseVehicleListFilters({ status: "SCRAPPED", tireStatus: "FLAT" }),
    ).toEqual({ status: undefined, tireStatus: [] });
  });

  it("falls back to undefined for a duplicated (array) query value instead of throwing", () => {
    expect(
      parseVehicleListFilters({ status: ["AVAILABLE", "RENTED"] }),
    ).toEqual({ status: undefined, tireStatus: [] });
  });

  it("degrades the whole `tireStatus` filter to [] when any one token is invalid, instead of partially recovering it (issue #35 Assumption A2)", () => {
    expect(
      parseVehicleListFilters({ tireStatus: "NORMAL,NOT_A_STATUS" }),
    ).toEqual({ status: undefined, tireStatus: [] });
  });
});
