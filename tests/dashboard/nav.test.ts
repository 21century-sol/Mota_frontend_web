import { describe, expect, it } from "vitest";
import {
  isNavItemActive,
  NAV_ITEMS,
  SETTINGS_NAV_ITEM,
} from "../../lib/dashboard/nav";

describe("isNavItemActive", () => {
  it("marks /dashboard active only on an exact match", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard/vehicles", "/dashboard")).toBe(false);
  });

  it("marks nested routes active for non-root items", () => {
    expect(
      isNavItemActive("/dashboard/vehicles", "/dashboard/vehicles"),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/vehicles/123", "/dashboard/vehicles"),
    ).toBe(true);
    expect(
      isNavItemActive("/dashboard/reservations", "/dashboard/vehicles"),
    ).toBe(false);
  });

  it("does not match a sibling path that only shares a string prefix", () => {
    expect(
      isNavItemActive("/dashboard/vehicles-archive", "/dashboard/vehicles"),
    ).toBe(false);
  });

  it("exposes the four primary menu entries plus a separate settings entry", () => {
    expect(NAV_ITEMS).toHaveLength(4);
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/dashboard",
      "/dashboard/vehicles",
      "/dashboard/reservations",
      "/dashboard/inquiries",
    ]);
    expect(SETTINGS_NAV_ITEM.href).toBe("/dashboard/settings");
  });
});
