"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

import { VehicleUsageHistoryFetchError } from "@/lib/dashboard/vehicles/usage-history-api";
import { formatVehicleDateLabel } from "@/lib/dashboard/vehicles/format";
import { buildVehicleDetailHref } from "@/lib/dashboard/vehicles/tab-url";
import { useVehicleUsageHistory } from "@/hooks/dashboard/useVehicleUsageHistory";

/** Numeric pagination (1, 2, 3…) — PM AC19 explicitly requires page numbers, not prev/next arrows. */
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
    <nav aria-label="이용 이력 페이지" className="flex justify-center gap-1 pt-4">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
        const isCurrent = pageNumber === currentPage;
        return (
          <button
            key={pageNumber}
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => router.replace(buildVehicleDetailHref(vehicleId, "usage", pageNumber))}
            className={[
              "h-8 w-8 rounded-full text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-dashboard-sidebar",
              isCurrent
                ? "bg-dashboard-chart-accent text-white"
                : "text-dashboard-vehicles-label hover:bg-dashboard-vehicles-surface",
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
 * "이용 이력" tab (issue #15, Figma root `1:14480`, PM AC19/AC20). 8 rows/page
 * server-paginated via `useVehicleUsageHistory(vehicleId, page)` — `page`
 * comes from the Server Component page's `searchParams` as a prop, and
 * pagination clicks write `?tab=usage&page=N` via `router.replace`.
 *
 * The "리포트" button is UI-only (PM Non-goal: no real download) — `onClick`
 * intentionally does nothing beyond existing, per the issue's explicit scope.
 */
export function UsageHistoryTab({ vehicleId, page }: { vehicleId: string; page: number }) {
  const query = useVehicleUsageHistory(vehicleId, page);

  return (
    <div className="rounded-dashboard-card bg-white p-6 shadow-dashboard-card" aria-busy={query.isPending}>
      {query.isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
            {query.error instanceof VehicleUsageHistoryFetchError
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
          {/* Issue #15 AC22: the table's minimum content width (renter name+phone,
              a full date range, mileage, alert count, report button) exceeds a
              sub-768px viewport, so it scrolls inside this container instead of
              forcing the page itself to scroll horizontally. */}
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">{vehicleId} 차량 이용 이력</caption>
            <thead>
              <tr className="bg-dashboard-vehicles-surface text-xs font-medium text-dashboard-vehicles-label">
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
                <tr key={item.id} className="border-b border-dashboard-vehicles-border last:border-b-0">
                  <td className="px-3 py-3">
                    <p className="m-0 text-sm font-medium text-dashboard-usage-text">
                      {item.renterName}
                    </p>
                    <p className="m-0 text-xs text-dashboard-usage-text-muted">{item.renterPhone}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-dashboard-usage-text">
                    {formatVehicleDateLabel(item.rentedAt)} ~ {formatVehicleDateLabel(item.returnedAt)}
                  </td>
                  <td className="px-3 py-3 text-sm text-dashboard-usage-text">
                    {item.mileageKm.toLocaleString("ko-KR")}km
                  </td>
                  <td className="px-3 py-3 text-sm text-dashboard-usage-text">
                    {item.alertCount > 0 ? `${item.alertCount}건` : null}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      aria-label={`${item.renterName} 이용 리포트 다운로드`}
                      className="flex items-center gap-1 text-xs text-dashboard-usage-text-subtle outline-none focus-visible:ring-2 focus-visible:ring-dashboard-sidebar"
                    >
                      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                      리포트
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <p className="m-0 pt-3 text-center text-xs text-dashboard-vehicles-label">
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
        </>
      )}
    </div>
  );
}
