import { ReservationsSection } from "@/components/dashboard/reservations/ReservationsSection";
import { parseReservationListParams } from "@/lib/dashboard/reservations/url";

/**
 * `/dashboard/reservations` "대여 현황" (issue #16, real API wired in #51).
 * Server Component — `searchParams` is read here and passed down as typed
 * props instead of the client tree calling `useSearchParams()` itself
 * (CLAUDE.md §4), so no `Suspense` boundary is needed for the filter/page
 * state. The actual `GET /api/dashboard/rentals` fetch and its
 * loading/error/empty/success branching live in the client
 * `ReservationsSection` this page renders.
 */
export default function ReservationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { status, page, rentedOn, returnedOn } = parseReservationListParams(searchParams);

  return (
    <ReservationsSection
      status={status}
      page={page}
      rentedOn={rentedOn}
      returnedOn={returnedOn}
    />
  );
}
