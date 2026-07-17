import type {
  ReservationItem,
  ReservationPageInfo,
  ReservationStatus,
} from "@/types/dashboard/reservation";
import { ReservationStatusTabs } from "@/components/dashboard/reservations/ReservationStatusTabs";
import { ReservationDateRangeTriggers } from "@/components/dashboard/reservations/ReservationDateRangeTriggers";
import { ReservationUpdateBar } from "@/components/dashboard/reservations/ReservationUpdateBar";
import { ReservationTable } from "@/components/dashboard/reservations/ReservationTable";
import { ReservationPagination } from "@/components/dashboard/reservations/ReservationPagination";

/**
 * `/dashboard/reservations` "대여 현황" panel (issue #16). A Server Component —
 * `status`/`items`/`pageInfo` are already-computed props (see
 * `ReservationsSection`), so this component itself needs no hooks; only the
 * interactive leaves (`ReservationStatusTabs`, `ReservationUpdateBar`,
 * `ReservationPagination`) are Client Components, kept as small as possible
 * (CLAUDE.md §4 App Router 렌더링 경계).
 *
 * Takes `items`/`pageInfo` directly (rather than recomputing from the
 * fixture) so the AC8 empty state can be exercised in a component test with a
 * synthetic empty list, independent of the actual fixture contents.
 */
export function ReservationListPanel({
  status,
  items,
  pageInfo,
}: {
  status: ReservationStatus | undefined;
  items: ReservationItem[];
  pageInfo: ReservationPageInfo;
}) {
  return (
    <section aria-labelledby="reservations-heading" className="flex flex-col gap-6">
      <h1
        id="reservations-heading"
        className="text-lg font-semibold text-dashboard-vehicles-title"
      >
        대여 현황
      </h1>

      <div className="flex flex-col gap-4 rounded-dashboard-card bg-white p-6 shadow-dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ReservationStatusTabs currentStatus={status} />
          <ReservationDateRangeTriggers />
        </div>

        <ReservationUpdateBar />

        {items.length === 0 ? (
          <p
            role="status"
            className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label"
          >
            표시할 예약이 없습니다.
          </p>
        ) : (
          <>
            <ReservationTable items={items} />

            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
              <p className="m-0 text-xs text-dashboard-vehicles-label">
                전체 {pageInfo.totalCount}건 중{" "}
                {(pageInfo.page - 1) * pageInfo.pageSize + 1}-
                {Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.totalCount)} 표시
              </p>
              <ReservationPagination
                currentStatus={status}
                currentPage={pageInfo.page}
                totalPages={pageInfo.totalPages}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
