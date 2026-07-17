import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { VEHICLE_DETAIL_LIST_PATH } from "@/lib/dashboard/vehicles/tab-url";

/**
 * Back button + page title (issue #15, Figma "Header Container", PM AC3).
 * No client directive of its own — it renders fine inside the
 * `VehicleDetailSection` client subtree, matching CLAUDE.md §4's "client
 * 경계 아래 모든 파일에 use client를 반복하지 않는다".
 */
export function VehicleDetailHeader() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={VEHICLE_DETAIL_LIST_PATH}
        aria-label="차량 목록으로 돌아가기"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashboard-vehicles-border text-dashboard-vehicles-title outline-none transition-colors hover:bg-dashboard-vehicles-surface focus-visible:ring-2 focus-visible:ring-dashboard-sidebar focus-visible:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      </Link>
      <h1 className="m-0 text-xl font-semibold text-dashboard-vehicles-title">차량 상세</h1>
    </div>
  );
}
