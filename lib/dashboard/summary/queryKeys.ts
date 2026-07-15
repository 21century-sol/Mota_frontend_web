/** Query key factory for `/dashboard` summary card data (React Query v5). */
export const summaryQueryKeys = {
  all: ["dashboard", "summary"] as const,
  vehicleStatusCounts: () =>
    [...summaryQueryKeys.all, "vehicle-status-counts"] as const,
};
