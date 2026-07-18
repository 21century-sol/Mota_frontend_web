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
 * `/dashboard/reservations` "대여 현황" panel (issue #16, layout corrected in
 * #29, restyled to the confirmed Figma structure in #38). A Server Component
 * — `status`/`items`/`pageInfo`/`rentedOn`/`returnedOn` are already-computed
 * props (see `ReservationsSection`), so this component itself needs no
 * hooks; only the interactive leaves (`ReservationStatusTabs`,
 * `ReservationDateRangeTriggers`, `ReservationUpdateBar`,
 * `ReservationPagination`) are Client Components, kept as small as possible
 * (CLAUDE.md §4 App Router 렌더링 경계).
 *
 * Takes `items`/`pageInfo` directly (rather than recomputing from the
 * fixture) so the AC8 empty state can be exercised in a component test with a
 * synthetic empty list, independent of the actual fixture contents.
 *
 * Nested vertical stack mirroring the Figma group gaps (issue #38): only the
 * table itself gets card styling
 * (`ReservationTable`'s own wrapper) — there is no enclosing white card.
 * Gaps follow Figma exactly rather than a single flat 28px: title → block
 * 28px (`gap-7`), tabs → date/update row 24px (`gap-6`), date/update row →
 * table 16px (`gap-4`), and table → pagination 28px (the outer `gap-7`
 * between the tabs/filter block and the pagination row).
 */
export function ReservationListPanel({
  status,
  items,
  pageInfo,
  rentedOn,
  returnedOn,
}: {
  status: ReservationStatus | undefined;
  items: ReservationItem[];
  pageInfo: ReservationPageInfo;
  rentedOn?: string;
  returnedOn?: string;
}) {
  return (
    <section aria-labelledby="reservations-heading" className="flex flex-col gap-7">
      <h1
        id="reservations-heading"
        className="text-2xl font-medium tracking-[-0.6px] text-dashboard-vehicles-title"
      >
        대여 현황
      </h1>

      <div className="flex flex-col gap-6">
        <ReservationStatusTabs currentStatus={status} />

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ReservationDateRangeTriggers
              currentStatus={status}
              rentedOn={rentedOn}
              returnedOn={returnedOn}
            />
            <ReservationUpdateBar />
          </div>

          {items.length === 0 ? (
            <p
              role="status"
              className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label"
            >
              표시할 예약이 없습니다.
            </p>
          ) : (
            <ReservationTable items={items} />
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="m-0 pl-6 text-xs text-dashboard-text-muted">
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
      ) : null}
    </section>
  );
}
