import { describe, expect, it } from "vitest";

import {
  RESERVATIONS_PAGE_SIZE,
  filterReservationsByDateRange,
  filterReservationsByStatus,
  paginateReservations,
} from "@/lib/dashboard/reservations/list";
import type { ReservationItem } from "@/types/dashboard/reservation";

function makeItem(
  id: string,
  status: ReservationItem["status"],
  dates: { rentedAt?: string; returnedAt?: string } = {},
): ReservationItem {
  return {
    id,
    renterName: `renter-${id}`,
    renterPhone: "010-0000-0000",
    plateNumber: "12가 3456",
    vehicleModel: "아반떼 하이브리드",
    rentedAt: dates.rentedAt ?? "2026-07-01",
    returnedAt: dates.returnedAt ?? "2026-07-05",
    status,
  };
}

describe("filterReservationsByStatus", () => {
  const items = [
    makeItem("1", "RENTED"),
    makeItem("2", "RETURNED"),
    makeItem("3", "RENTED"),
  ];

  it("returns a shallow copy of all items when status is undefined (전체 tab)", () => {
    const result = filterReservationsByStatus(items, undefined);
    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });

  it("returns only items matching the given status", () => {
    expect(filterReservationsByStatus(items, "RENTED")).toEqual([items[0], items[2]]);
  });

  it("returns an empty array when no item matches (AC8)", () => {
    const onlyRented = [makeItem("1", "RENTED")];
    expect(filterReservationsByStatus(onlyRented, "RETURNED")).toEqual([]);
  });
});

describe("paginateReservations", () => {
  const items = Array.from({ length: 10 }, (_, i) => makeItem(String(i + 1), "RENTED"));

  it("uses the default page size of 8", () => {
    expect(RESERVATIONS_PAGE_SIZE).toBe(8);
  });

  it("returns the first 8 items and correct pageInfo on page 1", () => {
    const { items: page1, pageInfo } = paginateReservations(items, 1);
    expect(page1).toHaveLength(8);
    expect(page1[0].id).toBe("1");
    expect(page1[7].id).toBe("8");
    expect(pageInfo).toEqual({ page: 1, pageSize: 8, totalCount: 10, totalPages: 2 });
  });

  it("returns the remaining items on the last page (boundary)", () => {
    const { items: page2, pageInfo } = paginateReservations(items, 2);
    expect(page2).toHaveLength(2);
    expect(page2[0].id).toBe("9");
    expect(pageInfo.totalPages).toBe(2);
  });

  it("returns an empty array for a page beyond the last page", () => {
    const { items: page3 } = paginateReservations(items, 3);
    expect(page3).toEqual([]);
  });

  it("reports totalPages: 1 (never 0) for an empty input list", () => {
    const { items: emptyItems, pageInfo } = paginateReservations([], 1);
    expect(emptyItems).toEqual([]);
    expect(pageInfo).toEqual({ page: 1, pageSize: 8, totalCount: 0, totalPages: 1 });
  });

  it("respects a custom pageSize", () => {
    const { items: page1, pageInfo } = paginateReservations(items, 1, 5);
    expect(page1).toHaveLength(5);
    expect(pageInfo.totalPages).toBe(2);
  });
});

describe("filterReservationsByDateRange (issue #29, AC8)", () => {
  const items = [
    makeItem("1", "RENTED", { rentedAt: "2026-07-10", returnedAt: "2026-07-15" }),
    makeItem("2", "RETURNED", { rentedAt: "2026-07-10", returnedAt: "2026-07-20" }),
    makeItem("3", "RENTED", { rentedAt: "2026-07-12", returnedAt: "2026-07-20" }),
  ];

  it("returns all items unchanged when both dates are undefined", () => {
    expect(filterReservationsByDateRange(items, undefined, undefined)).toEqual(items);
  });

  it("filters by rentedOn alone (exact-day match)", () => {
    expect(filterReservationsByDateRange(items, "2026-07-10", undefined)).toEqual([
      items[0],
      items[1],
    ]);
  });

  it("filters by returnedOn alone (exact-day match)", () => {
    expect(filterReservationsByDateRange(items, undefined, "2026-07-20")).toEqual([
      items[1],
      items[2],
    ]);
  });

  it("applies both filters with AND semantics", () => {
    expect(filterReservationsByDateRange(items, "2026-07-10", "2026-07-20")).toEqual([
      items[1],
    ]);
  });

  it("returns an empty array when no item matches either date", () => {
    expect(filterReservationsByDateRange(items, "2099-01-01", undefined)).toEqual([]);
  });
});
