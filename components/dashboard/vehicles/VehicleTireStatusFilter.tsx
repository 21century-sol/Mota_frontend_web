"use client";

import { useRouter } from "next/navigation";

import type {
  TireStatus,
  VehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import { buildVehicleListHref } from "@/lib/dashboard/vehicles/url";

/** Figma 타이어 상태 필터 order (node 2722:28835): 정상/주의/위험. */
const TIRE_CHIPS: ReadonlyArray<{ value: TireStatus; label: string }> = [
  { value: "NORMAL", label: "정상" },
  { value: "CAUTION", label: "주의" },
  { value: "WARNING", label: "위험" },
];

/**
 * Tire status filter chips (issue #14, PM Decision 4). Independent from
 * {@link import("./VehicleFilterBar").VehicleFilterBar} — writes `?tireStatus=`
 * via `router.replace` and forwards the current `status` unchanged (AC6).
 *
 * Figma has no "전체"/clear chip for tire status, so clicking the already-selected
 * chip toggles it off (clears `tireStatus`) instead of being a no-op — a
 * reversible, low-risk UX choice (no confirmed design fact either way) that
 * gives users a way to clear this filter without leaving the tab.
 */
export function VehicleTireStatusFilter({
  currentStatus,
  currentTireStatus,
}: {
  currentStatus: VehicleManagementStatus | undefined;
  currentTireStatus: TireStatus | undefined;
}) {
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="타이어 상태 필터"
      className="flex flex-wrap gap-2"
    >
      {TIRE_CHIPS.map(({ value, label }) => {
        const isSelected = value === currentTireStatus;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              router.replace(
                buildVehicleListHref({
                  status: currentStatus,
                  tireStatus: isSelected ? undefined : value,
                }),
              );
            }}
            className={[
              "rounded-full border px-3 py-1.5 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              isSelected
                ? "border-brand bg-dashboard-chip-selected-bg text-brand"
                : "border-dashboard-vehicles-border text-dashboard-vehicles-label hover:bg-dashboard-vehicles-surface",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
