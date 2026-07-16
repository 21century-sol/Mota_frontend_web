/** Query key factory for `/dashboard` real-time alerts data (React Query v5). */
export const alertsQueryKeys = {
  all: ["dashboard", "alerts"] as const,
  list: () => [...alertsQueryKeys.all, "list"] as const,
};
