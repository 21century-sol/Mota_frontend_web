import type { ReservationStatus } from "@/types/dashboard/reservation";

/**
 * Query key factory for `/dashboard/reservations` (issue #51, React Query
 * v5), same shape convention as `vehiclesQueryKeys` (`lib/dashboard/vehicles/queryKeys.ts`).
 * `page` is 1-based, matching the URL and `ReservationPageInfo` convention
 * used everywhere else in this feature.
 */
export const reservationsQueryKeys = {
  all: ["dashboard", "reservations"] as const,
  list: (filters: {
    status: ReservationStatus | undefined;
    page: number;
    rentedOn: string | undefined;
    returnedOn: string | undefined;
  }) =>
    [
      ...reservationsQueryKeys.all,
      "list",
      {
        status: filters.status ?? null,
        page: filters.page,
        rentedOn: filters.rentedOn ?? null,
        returnedOn: filters.returnedOn ?? null,
      },
    ] as const,
};
