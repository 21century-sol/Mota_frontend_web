"use client";

import { useRouter } from "next/navigation";

import type {
  TireStatus,
  VehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import { buildVehicleListHref } from "@/lib/dashboard/vehicles/url";

/** Figma "Filter Tabs" order (node 1:13290, `.claude/handoffs/35-figma-analysis.md`): 전체/대여 가능/대여 중/운행 불가. */
const STATUS_TABS: ReadonlyArray<{
  status: VehicleManagementStatus | undefined;
  label: string;
}> = [
  { status: undefined, label: "전체" },
  { status: "AVAILABLE", label: "대여 가능" },
  { status: "RENTED", label: "대여 중" },
  { status: "REPAIR", label: "운행 불가" },
];

/**
 * Vehicle status filter tabs (issue #14, PM Decision 1/4; restyled to an
 * underline tab pattern for issue #35 AC2). Selecting a tab writes `?status=`
 * via `router.replace` and forwards the current `tireStatus` selection
 * unchanged, so switching tabs never resets the tire-status chip selection
 * (AC6).
 *
 * Each tab renders its own 2px bottom indicator (filled only when selected)
 * instead of one shared underline spanning the row, matching the confirmed
 * Figma fact that the indicator width is scoped to the tab's own column
 * (`.claude/handoffs/35-figma-analysis.md`).
 */
export function VehicleFilterBar({
  currentStatus,
  currentTireStatus,
}: {
  currentStatus: VehicleManagementStatus | undefined;
  currentTireStatus: readonly TireStatus[];
}) {
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="차량 상태 필터"
      className="flex flex-wrap border-b border-dashboard-border"
    >
      {STATUS_TABS.map(({ status, label }) => {
        const isSelected = status === currentStatus;

        return (
          <button
            key={label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              if (isSelected) return;
              router.replace(
                buildVehicleListHref({
                  status,
                  tireStatus: currentTireStatus,
                }),
              );
            }}
            className="flex flex-col items-center gap-2 pt-3 px-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <span
              className={[
                "px-3 text-base tracking-[-0.4px]",
                isSelected
                  ? "font-bold text-brand"
                  : "font-medium text-dashboard-text-muted",
              ].join(" ")}
            >
              {label}
            </span>
            <span
              aria-hidden="true"
              className={[
                "h-0.5 w-full rounded-full",
                isSelected ? "bg-brand" : "bg-transparent",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
