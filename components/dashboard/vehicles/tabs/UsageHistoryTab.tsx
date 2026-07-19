"use client";

import { Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { VehicleRentalHistoryFetchError } from "@/lib/dashboard/vehicles/usage-history-api";
import {
  formatAlertCountLabel,
  formatDistanceKmLabel,
  formatRentalDurationLabel,
} from "@/lib/dashboard/vehicles/format";
import { buildVehicleDetailHref } from "@/lib/dashboard/vehicles/tab-url";
import { useVehicleUsageHistory } from "@/hooks/dashboard/useVehicleUsageHistory";

/**
 * Numeric pagination (1, 2, 3…) — same "square button, active
 * `bg-dashboard-chart-accent`, inactive `border-dashboard-reservation-page-border`"
 * pattern as `components/dashboard/reservations/ReservationPagination.tsx`
 * (issue #49, Figma-confirmed alignment; that component itself is not
 * imported/modified — reservations is a separate protected feature).
 */
function UsagePagination({
  vehicleId,
  currentPage,
  totalPages,
}: {
  vehicleId: string;
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="이용 이력 페이지" className="flex gap-1.5">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
        const isCurrent = pageNumber === currentPage;
        return (
          <button
            key={pageNumber}
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => router.replace(buildVehicleDetailHref(vehicleId, "usage", pageNumber))}
            className={[
              "h-[30px] w-[30px] rounded-lg text-xs font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-dashboard-sidebar",
              isCurrent
                ? "bg-dashboard-chart-accent text-white"
                : "border border-dashboard-reservation-page-border bg-white text-black hover:bg-dashboard-vehicles-surface",
            ].join(" ")}
          >
            {pageNumber}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * "이용 이력" tab (issue #49, Figma root `1:14635`, confirmed
 * `GET /api/dashboard/vehicles/{vehicleId}/rentals` contract). 8 rows/page
 * server-paginated via `useVehicleUsageHistory(vehicleId, page)` — `page`
 * comes from the Server Component page's `searchParams` as a prop (1-based),
 * and pagination clicks write `?tab=usage&page=N` via `router.replace`.
 *
 * Columns: 이용자(이름+연락처, 2줄) / 대여시간 / 운행거리 / 알림건수 / 리포트.
 * `status`/`startDate`/`endDate` are part of the validated DTO but are never
 * rendered (PM Scope). The "리포트" link only renders when
 * `reportDownloadUrl` is non-null, and is a real `<a target="_blank"
 * rel="noopener noreferrer">` (not a no-op button) — issue #49 replaces the
 * #15 provisional always-rendered, UI-only report button.
 */
export function UsageHistoryTab({ vehicleId, page }: { vehicleId: string; page: number }) {
  const query = useVehicleUsageHistory(vehicleId, page);

  return (
    <div className="rounded-dashboard-card bg-white p-6 shadow-dashboard-card" aria-busy={query.isPending}>
      {query.isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
            {query.error instanceof VehicleRentalHistoryFetchError
              ? query.error.userMessage
              : "이용 이력을 불러오지 못했습니다."}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            aria-busy={query.isFetching}
            className="rounded-full bg-dashboard-sidebar px-4 py-2 text-sm font-medium text-white outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {query.isFetching ? "다시 시도하는 중..." : "다시 시도"}
          </button>
        </div>
      ) : query.isPending ? (
        <p className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label">
          이용 이력을 불러오는 중입니다.
        </p>
      ) : query.data.items.length === 0 ? (
        <p role="status" className="m-0 py-10 text-center text-sm text-dashboard-vehicles-label">
          이용 이력이 없습니다.
        </p>
      ) : (
        <>
          {/* Issue #49: the table's minimum content width (renter name+contact,
              duration, distance, alert count, report link) exceeds a
              sub-768px viewport, so it scrolls inside this container instead of
              forcing the page itself to scroll horizontally. */}
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">{vehicleId} 차량 이용 이력</caption>
            <thead>
              <tr className="bg-dashboard-vehicles-surface text-base font-normal text-dashboard-vehicles-label">
                <th scope="col" className="px-3 py-2">
                  이용자
                </th>
                <th scope="col" className="px-3 py-2">
                  대여시간
                </th>
                <th scope="col" className="px-3 py-2">
                  운행거리
                </th>
                <th scope="col" className="px-3 py-2">
                  알림건수
                </th>
                <th scope="col" className="px-3 py-2">
                  리포트
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((item) => (
                <tr key={item.rentalId} className="border-b border-dashboard-vehicles-border last:border-b-0">
                  <td className="px-3 py-3">
                    <p className="m-0 text-sm font-medium text-dashboard-usage-text">
                      {item.renterName}
                    </p>
                    <p className="m-0 text-xs text-dashboard-usage-text-muted">{item.contact}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-dashboard-usage-text">
                    {formatRentalDurationLabel(item.rentalMinutes)}
                  </td>
                  <td className="px-3 py-3 text-sm text-dashboard-usage-text">
                    {formatDistanceKmLabel(item.distanceKm)}
                  </td>
                  <td className="px-3 py-3 text-sm text-dashboard-usage-text">
                    {formatAlertCountLabel(item.alertCount)}
                  </td>
                  <td className="px-3 py-3">
                    {item.reportDownloadUrl === null ? null : (
                      <a
                        href={item.reportDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${item.renterName} 이용 리포트 다운로드`}
                        className="flex items-center gap-[3px] text-xs text-dashboard-usage-text-subtle outline-none focus-visible:ring-2 focus-visible:ring-dashboard-sidebar"
                      >
                        <LinkIcon aria-hidden="true" className="h-5 w-5 text-dashboard-chart-accent" />
                        리포트
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="flex flex-col items-center gap-3 pt-3 sm:flex-row sm:justify-between">
            <p className="m-0 text-xs text-dashboard-text-muted">
              전체 {query.data.pageInfo.totalCount}건 중{" "}
              {(query.data.pageInfo.page - 1) * query.data.pageInfo.pageSize + 1}-
              {Math.min(
                query.data.pageInfo.page * query.data.pageInfo.pageSize,
                query.data.pageInfo.totalCount,
              )}{" "}
              표시
            </p>
            <UsagePagination
              vehicleId={vehicleId}
              currentPage={query.data.pageInfo.page}
              totalPages={query.data.pageInfo.totalPages}
            />
          </div>
        </>
      )}
    </div>
  );
}
