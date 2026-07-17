import { describe, expect, it } from "vitest";

import {
  buildReservationListHref,
  parseReservationListParams,
} from "@/lib/dashboard/reservations/url";

describe("buildReservationListHref", () => {
  it("returns the bare path when status/page are both defaults (전체/1페이지)", () => {
    expect(buildReservationListHref({})).toBe("/dashboard/reservations");
  });

  it("omits page when it is 1", () => {
    expect(buildReservationListHref({ status: "RENTED", page: 1 })).toBe(
      "/dashboard/reservations?status=RENTED",
    );
  });

  it("includes both status and page when page > 1", () => {
    expect(buildReservationListHref({ status: "RETURNED", page: 2 })).toBe(
      "/dashboard/reservations?status=RETURNED&page=2",
    );
  });

  it("includes only page when status is undefined (전체 탭, page 2)", () => {
    expect(buildReservationListHref({ page: 2 })).toBe("/dashboard/reservations?page=2");
  });

  it("includes rentedOn/returnedOn when set (issue #29, AC8)", () => {
    expect(buildReservationListHref({ rentedOn: "2026-07-16" })).toBe(
      "/dashboard/reservations?rentedOn=2026-07-16",
    );
    expect(
      buildReservationListHref({ rentedOn: "2026-07-16", returnedOn: "2026-07-20" }),
    ).toBe("/dashboard/reservations?rentedOn=2026-07-16&returnedOn=2026-07-20");
  });

  it("omits rentedOn/returnedOn from `{}` (used by the reset button, AC10)", () => {
    expect(buildReservationListHref({})).toBe("/dashboard/reservations");
  });
});

describe("parseReservationListParams", () => {
  it("parses a valid status and page", () => {
    expect(parseReservationListParams({ status: "RENTED", page: "2" })).toEqual({
      status: "RENTED",
      page: 2,
    });
  });

  it("defaults to 전체/1페이지 when the query is empty", () => {
    expect(parseReservationListParams({})).toEqual({ status: undefined, page: 1 });
  });

  it("degrades an unrecognized status value to undefined instead of throwing (AC5)", () => {
    expect(parseReservationListParams({ status: "CANCELED" })).toEqual({
      status: undefined,
      page: 1,
    });
  });

  it("degrades a duplicated (array) status value to undefined instead of throwing", () => {
    expect(parseReservationListParams({ status: ["RENTED", "RETURNED"] })).toEqual({
      status: undefined,
      page: 1,
    });
  });

  it("degrades a non-numeric page value to 1 instead of throwing (AC5)", () => {
    expect(parseReservationListParams({ page: "abc" })).toEqual({
      status: undefined,
      page: 1,
    });
  });

  it("degrades a non-positive page value to 1", () => {
    expect(parseReservationListParams({ page: "0" })).toEqual({ status: undefined, page: 1 });
    expect(parseReservationListParams({ page: "-3" })).toEqual({ status: undefined, page: 1 });
  });

  it("parses valid rentedOn/returnedOn (issue #29, AC8)", () => {
    expect(
      parseReservationListParams({ rentedOn: "2026-07-16", returnedOn: "2026-07-20" }),
    ).toEqual({
      status: undefined,
      page: 1,
      rentedOn: "2026-07-16",
      returnedOn: "2026-07-20",
    });
  });

  it("degrades a malformed rentedOn/returnedOn to undefined instead of throwing", () => {
    expect(
      parseReservationListParams({ rentedOn: "07/16/2026", returnedOn: ["2026-07-20"] }),
    ).toEqual({ status: undefined, page: 1, rentedOn: undefined, returnedOn: undefined });
  });
});
