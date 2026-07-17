import type { DashboardSummaryContentDto } from "@/types/dashboard/summary";

/** Normal scenario: 4 distinct synthetic non-zero values (AC1). */
export const summaryNormalFixture = {
  total: 42,
  available: 18,
  rented: 20,
  repair: 4,
} satisfies DashboardSummaryContentDto;

/** Empty scenario: all 4 fields 0 (AC3 — "0대" must not read as an error). */
export const summaryEmptyFixture = {
  total: 0,
  available: 0,
  rented: 0,
  repair: 0,
} satisfies DashboardSummaryContentDto;
