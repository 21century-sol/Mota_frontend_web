"use client";

import { Link as LinkIcon } from "lucide-react";

import type { ReservationItem } from "@/types/dashboard/reservation";
import { formatReservationDateLabel } from "@/lib/dashboard/reservations/format";
import { ReservationStatusBadge } from "@/components/dashboard/reservations/ReservationStatusBadge";

/**
 * Reservation list table (issue #16, Figma Confirmed Design Facts, restyled
 * in #38). Columns in the confirmed order: 대여자 / 연락처 / 차량 정보(번호+차종,
 * 2줄) / 대여일 / 반납일 / 상태 / 리포트. Assumes a non-empty `items` array — the
 * empty state (AC8) is owned by `ReservationListPanel`.
 *
 * Only this table gets card styling (issue #38): the outer wrapper carries
 * the surface background/border/radius, while the header row has no
 * background of its own (the surface color shows through) and only body
 * rows are painted `bg-white`. Card rounding/border live on an `overflow-hidden`
 * outer `div` so corners clip correctly; a nested `overflow-x-auto` div keeps
 * the small-viewport horizontal-scroll behavior (AC9) that `overflow-hidden`
 * on the same element would otherwise break.
 *
 * The "PDF" report button only renders when `item.reportDownloadUrl` is
 * present (non-null, non-empty) — rows without a report (all `RENTED` rows, and
 * any `RETURNED` row whose report has not been generated yet) keep the cell
 * empty rather than showing a dead button. Clicking it opens
 * `item.reportDownloadUrl` in a new tab (issue #51 AC4) — same
 * `window.open(url, "_blank", "noopener,noreferrer")` idiom as an external
 * download link, chosen because the URL is server-hosted and not a same-origin
 * route to `router.push`.
 */
export function ReservationTable({ items }: { items: ReservationItem[] }) {
  return (
    <div className="overflow-hidden rounded-dashboard-card border border-dashboard-vehicles-border bg-dashboard-vehicles-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">{items.length}건의 예약 목록</caption>
          <thead>
            <tr className="border-b border-dashboard-vehicles-border text-base font-normal text-dashboard-vehicles-label">
              <th scope="col" className="py-3 pl-20">
                대여자
              </th>
              <th scope="col" className="py-3 pl-3">
                연락처
              </th>
              <th scope="col" className="py-3 pl-3">
                차량 정보
              </th>
              <th scope="col" className="py-3 pl-3">
                대여일
              </th>
              <th scope="col" className="py-3 pl-3">
                반납일
              </th>
              <th scope="col" className="py-3 pl-3">
                상태
              </th>
              <th scope="col" className="py-3 pl-3">
                리포트
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-dashboard-vehicles-border bg-white last:border-b-0"
              >
                <td className="py-3 pl-20 text-base font-medium text-dashboard-usage-text">
                  {item.renterName}
                </td>
                <td className="py-3 pl-3 text-base font-medium text-dashboard-usage-text">
                  {item.renterPhone}
                </td>
                <td className="pl-3 py-3">
                  <div className="flex flex-col gap-1">
                    <p className="m-0 text-base font-medium text-dashboard-usage-text">
                      {item.plateNumber}
                    </p>
                    <p className="m-0 text-xs text-dashboard-usage-text-muted">
                      {item.vehicleModel}
                    </p>
                  </div>
                </td>
                <td className="pl-3 py-3 text-sm font-medium text-dashboard-account-text">
                  {formatReservationDateLabel(item.rentedAt)}
                </td>
                <td className="pl-3 py-3 text-sm font-medium text-dashboard-account-text">
                  {formatReservationDateLabel(item.returnedAt)}
                </td>
                <td className="pl-3 py-3">
                  <ReservationStatusBadge status={item.status} />
                </td>
                <td className="pl-3 py-3">
                  {item.reportDownloadUrl ? (
                    <button
                      type="button"
                      aria-label={`${item.renterName} 리포트 PDF 다운로드`}
                      onClick={() => {
                        if (item.reportDownloadUrl) {
                          window.open(item.reportDownloadUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="flex items-center gap-1 text-[15px] font-medium text-dashboard-chart-accent outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid"
                    >
                      PDF
                      <LinkIcon aria-hidden="true" className="h-5 w-5" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
