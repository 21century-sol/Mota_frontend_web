"use client";

import { useRouter } from "next/navigation";

import type {
  TireStatus,
  VehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import { buildVehicleListHref } from "@/lib/dashboard/vehicles/url";

/** Figma "Filter Tabs" order (node 2467:25928): 전체/대여 가능/대여 중/운행 불가. */
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
 * Vehicle status filter tabs (issue #14, PM Decision 1/4). Selecting a tab
 * writes `?status=` via `router.replace` and forwards the current
 * `tireStatus` unchanged, so switching tabs never resets the tire-status chip
 * selection (AC6).
 */
export function VehicleFilterBar({
  currentStatus,
  currentTireStatus,
}: {
  currentStatus: VehicleManagementStatus | undefined;
  currentTireStatus: TireStatus | undefined;
}) {
  const router = useRouter();

  return (
    <div role="group" aria-label="차량 상태 필터" className="flex flex-wrap gap-2">
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
            className={[
              "rounded-full px-4 py-2 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              isSelected
                ? "bg-dashboard-chip-selected-bg text-brand"
                : "text-dashboard-vehicles-label hover:bg-dashboard-vehicles-surface",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
