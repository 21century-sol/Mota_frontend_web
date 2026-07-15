import type { VehicleStatusCountDto } from "@/types/dashboard/summary";

/** Normal scenario: all 4 statuses present with distinct synthetic non-zero values (AC1). */
export const summaryNormalFixture = [
  { status: "OWNED", count: 42 },
  { status: "AVAILABLE", count: 18 },
  { status: "RENTED", count: 20 },
  { status: "UNAVAILABLE", count: 4 },
] satisfies VehicleStatusCountDto[];

/** Empty scenario: all 4 statuses present but count=0 (AC3 — "0대" must not read as an error). */
export const summaryEmptyFixture = [
  { status: "OWNED", count: 0 },
  { status: "AVAILABLE", count: 0 },
  { status: "RENTED", count: 0 },
  { status: "UNAVAILABLE", count: 0 },
] satisfies VehicleStatusCountDto[];
