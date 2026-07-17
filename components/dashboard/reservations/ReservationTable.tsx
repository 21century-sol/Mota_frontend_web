import { Link as LinkIcon } from "lucide-react";

import type { ReservationItem } from "@/types/dashboard/reservation";
import { formatReservationDateLabel } from "@/lib/dashboard/reservations/format";
import { ReservationStatusBadge } from "@/components/dashboard/reservations/ReservationStatusBadge";

/**
 * Reservation list table (issue #16, Figma Confirmed Design Facts). Columns
 * in the confirmed order: 대여자 / 연락처 / 차량 정보(번호+차종, 2줄) / 대여일 /
 * 반납일 / 상태 / 리포트. Assumes a non-empty `items` array — the empty state
 * (AC8) is owned by `ReservationListPanel`.
 *
 * The "PDF" report button only renders for `RETURNED` rows (Figma: "반납완료
 * 행에만 존재") — `RENTED` rows keep the cell empty rather than a disabled
 * button, matching the confirmed layout fact exactly. It is `onClick`-less
 * (no-op, PM Non-goal: no real download), same pattern as `UsageHistoryTab`'s
 * "리포트" button (issue #15).
 *
 * Wrapped in `overflow-x-auto` (not a reflowing single-table layout) so all 7
 * columns stay reachable via horizontal scroll under 768px without clipping
 * (AC9), following the `UsageHistoryTab` (#15) precedent referenced by PM.
 */
export function ReservationTable({ items }: { items: ReservationItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-dashboard-vehicles-border">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">{items.length}건의 예약 목록</caption>
        <thead>
          <tr className="bg-dashboard-vehicles-surface text-xs font-medium text-dashboard-vehicles-label">
            <th scope="col" className="px-3 py-2">
              대여자
            </th>
            <th scope="col" className="px-3 py-2">
              연락처
            </th>
            <th scope="col" className="px-3 py-2">
              차량 정보
            </th>
            <th scope="col" className="px-3 py-2">
              대여일
            </th>
            <th scope="col" className="px-3 py-2">
              반납일
            </th>
            <th scope="col" className="px-3 py-2">
              상태
            </th>
            <th scope="col" className="px-3 py-2">
              리포트
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-dashboard-vehicles-border last:border-b-0"
            >
              <td className="px-3 py-3 text-sm font-medium text-dashboard-vehicles-title">
                {item.renterName}
              </td>
              <td className="px-3 py-3 text-sm text-dashboard-vehicles-title">
                {item.renterPhone}
              </td>
              <td className="px-3 py-3">
                <p className="m-0 text-sm font-medium text-dashboard-vehicles-title">
                  {item.plateNumber}
                </p>
                <p className="m-0 text-xs text-dashboard-vehicles-label">
                  {item.vehicleModel}
                </p>
              </td>
              <td className="px-3 py-3 text-sm text-dashboard-vehicles-title">
                {formatReservationDateLabel(item.rentedAt)}
              </td>
              <td className="px-3 py-3 text-sm text-dashboard-vehicles-title">
                {formatReservationDateLabel(item.returnedAt)}
              </td>
              <td className="px-3 py-3">
                <ReservationStatusBadge status={item.status} />
              </td>
              <td className="px-3 py-3">
                {item.status === "RETURNED" ? (
                  <button
                    type="button"
                    aria-label={`${item.renterName} 리포트 PDF 다운로드`}
                    className="flex items-center gap-1 text-xs font-medium text-dashboard-usage-text-subtle outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid"
                  >
                    PDF
                    <LinkIcon aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
