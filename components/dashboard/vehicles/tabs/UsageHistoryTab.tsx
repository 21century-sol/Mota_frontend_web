"use client";

import { Link as LinkIcon, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { VehicleRentalHistoryFetchError } from "@/lib/dashboard/vehicles/usage-history-api";
import {
  formatAlertCountLabel,
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
 * rendered (PM Scope). The report link is labeled "PDF" per issue #56/Figma
 * `1:14635`; it only renders when `reportDownloadUrl` is non-null and remains a
 * real `<a target="_blank" rel="noopener noreferrer">` (not a no-op button).
 */
export function UsageHistoryTab({ vehicleId, page }: { vehicleId: string; page: number }) {
  const query = useVehicleUsageHistory(vehicleId, page);

  return (
    <div className="flex flex-col gap-4" aria-busy={query.isPending}>
      <h2 className="m-0 pl-3 text-xl font-medium tracking-[-0.5px] text-dashboard-text-primary">
        이용 이력
      </h2>

      {query.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-dashboard-card border border-dashboard-vehicles-border bg-white px-6 py-10 text-center"
        >
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
        <p className="m-0 rounded-dashboard-card border border-dashboard-vehicles-border bg-white px-6 py-10 text-center text-sm text-dashboard-vehicles-label">
          이용 이력을 불러오는 중입니다.
        </p>
      ) : query.data.items.length === 0 ? (
        <p
          role="status"
          className="m-0 rounded-dashboard-card border border-dashboard-vehicles-border bg-white px-6 py-10 text-center text-sm text-dashboard-vehicles-label"
        >
          이용 이력이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Issue #49: the table's minimum content width (renter name+contact,
              duration, distance, alert count, report link) exceeds a
              sub-768px viewport, so it scrolls inside this container instead of
              forcing the page itself to scroll horizontally. */}
          <div className="overflow-hidden rounded-dashboard-card border border-dashboard-vehicles-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] table-fixed border-collapse text-left">
                <caption className="sr-only">{vehicleId} 차량 이용 이력</caption>
                {/* Figma 1:14635 uses column starts at x=68/227/396/541/686
                    in an 800px card. Percentage widths preserve those relative
                    positions when the dashboard card grows beyond 800px. */}
                <colgroup>
                  <col className="w-[28.375%]" />
                  <col className="w-[21.125%]" />
                  <col className="w-[18.125%]" />
                  <col className="w-[18.125%]" />
                  <col className="w-[14.25%]" />
                </colgroup>
                <thead>
                  <tr className="h-12 border-b border-dashboard-vehicles-border bg-dashboard-vehicles-surface text-base font-normal text-dashboard-vehicles-label">
                    <th scope="col" className="px-0 py-3 align-middle font-normal">
                      <span className="ml-[29.96%] block">이용자</span>
                    </th>
                    <th scope="col" className="px-0 py-3 align-middle font-normal">
                      대여시간
                    </th>
                    <th scope="col" className="px-0 py-3 align-middle font-normal">
                      운행거리
                    </th>
                    <th scope="col" className="px-0 py-3 align-middle font-normal">
                      알림건수
                    </th>
                    <th scope="col" className="px-0 py-3 align-middle font-normal">
                      리포트
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => {
                    const alertCountLabel = formatAlertCountLabel(item.alertCount);

                    return (
                      <tr
                        key={item.rentalId}
                        className="h-[70px] border-b border-dashboard-vehicles-border last:border-b-0"
                      >
                        <td className="px-0 py-3 align-middle">
                          <div className="ml-[29.96%] flex flex-col gap-1">
                            <span className="text-base font-medium text-dashboard-usage-text">
                              {item.renterName}
                            </span>
                            <span className="text-xs text-dashboard-usage-text-muted">
                              {item.contact}
                            </span>
                          </div>
                        </td>
                        <td className="px-0 py-3 align-middle text-base font-medium text-dashboard-usage-text">
                          {formatRentalDurationLabel(item.rentalMinutes)}
                        </td>
                        <td className="px-0 py-3 align-middle">
                          <span className="inline-flex items-end gap-0.5">
                            <span className="text-base font-medium text-dashboard-usage-text">
                              {item.distanceKm}
                            </span>
                            <span className="text-xs text-dashboard-vehicles-label">km</span>
                          </span>
                        </td>
                        <td className="px-0 py-3 align-middle">
                          {alertCountLabel ? (
                            <span className="inline-flex items-center gap-1.5">
                              <TriangleAlert
                                aria-hidden="true"
                                className="h-3.5 w-3.5 shrink-0 text-dashboard-usage-alert"
                              />
                              <span className="text-base text-dashboard-usage-text">
                                {alertCountLabel}
                              </span>
                            </span>
                          ) : null}
                        </td>
                        <td className="px-0 py-3 align-middle">
                          {item.reportDownloadUrl === null ? null : (
                            <a
                              href={item.reportDownloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${item.renterName} 이용 리포트 다운로드`}
                              className="inline-flex items-center gap-[3px] text-[15px] font-medium text-dashboard-chart-accent outline-none focus-visible:ring-2 focus-visible:ring-dashboard-sidebar"
                            >
                              PDF
                              <LinkIcon aria-hidden="true" className="h-5 w-5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 px-6 sm:flex-row sm:justify-between">
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
        </div>
      )}
    </div>
  );
}
