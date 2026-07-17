import type { ReservationStatus } from "@/types/dashboard/reservation";
import { RESERVATION_FIXTURES } from "@/lib/dashboard/reservations/fixtures";
import {
  filterReservationsByStatus,
  paginateReservations,
} from "@/lib/dashboard/reservations/list";
import { ReservationListPanel } from "@/components/dashboard/reservations/ReservationListPanel";

/**
 * Data-selection boundary for `/dashboard/reservations` (issue #16). Owns the
 * only read of `RESERVATION_FIXTURES` — filtering/pagination is plain
 * synchronous array logic (no server fetch, no React Query), so this stays a
 * Server Component computing props for the purely-presentational
 * `ReservationListPanel`.
 */
export function ReservationsSection({
  status,
  page,
}: {
  status: ReservationStatus | undefined;
  page: number;
}) {
  const filtered = filterReservationsByStatus(RESERVATION_FIXTURES, status);
  const { items, pageInfo } = paginateReservations(filtered, page);

  return <ReservationListPanel status={status} items={items} pageInfo={pageInfo} />;
}
