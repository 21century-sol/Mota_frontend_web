import { ReservationsSection } from "@/components/dashboard/reservations/ReservationsSection";
import { parseReservationListParams } from "@/lib/dashboard/reservations/url";

/**
 * `/dashboard/reservations` "대여 현황" (issue #16). Server Component —
 * `searchParams` is read here and passed down as typed props instead of the
 * client tree calling `useSearchParams()` itself (CLAUDE.md §4), so no
 * `Suspense` boundary is needed for the filter/page state.
 *
 * No server fetch, MSW handler or React Query anywhere in this feature — the
 * whole screen renders from a local, static fixture
 * (`.claude/handoffs/16-pm-breakdown.md` Source of Truth).
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
