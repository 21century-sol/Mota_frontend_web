/**
 * Confirmed backend contract (issue #31, Swagger
 * `https://mota-app.duckdns.org/swagger-ui/index.html#/Dashboard/getSummary`,
 * `GET /api/dashboard/summary`). Replaces the #11 provisional array DTO
 * (`VehicleStatusCountDto[]`, `안 A`/`안 B` dual-shape guess) now that the real
 * response shape is known: a single object, not a per-status array.
 */
export interface DashboardSummaryContentDto {
  total: number;
  available: number;
  rented: number;
  repair: number;
}

/** UI model consumed by SummaryCardsSection/SummaryCard. Maps 1:1 to the 4 Figma cards. */
export interface VehicleSummaryCounts {
  ownedCount: number;
  availableCount: number;
  rentedCount: number;
  unavailableCount: number;
}
