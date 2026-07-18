"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import type {
  TireStatus,
  VehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import { buildVehicleListHref } from "@/lib/dashboard/vehicles/url";

/** Figma 타이어 상태 필터 order (node 1:13308, `.claude/handoffs/35-figma-analysis.md`): 정상/주의/위험. */
const TIRE_CHIPS: ReadonlyArray<{ value: TireStatus; label: string }> = [
  { value: "NORMAL", label: "정상" },
  { value: "CAUTION", label: "주의" },
  { value: "WARNING", label: "위험" },
];

/**
 * Multi-select tire status chips (issue #35 AC4/AC7 — supersedes the issue
 * #14 single-select-with-toggle-off behavior). Each chip toggles
 * independently: clicking an unselected chip adds it to the selection,
 * clicking a selected chip removes it, and any combination of 0-3 chips can
 * be active at once. `buildVehicleListHref` canonicalizes the resulting
 * array into `NORMAL,CAUTION,WARNING` order before it reaches the URL, so
 * the URL/query-key never depends on click order.
 *
 * Independent from {@link import("./VehicleFilterBar").VehicleFilterBar} —
 * writes `?tireStatus=` via `router.replace` and forwards the current
 * `status` unchanged (AC6).
 */
export function VehicleTireStatusFilter({
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
      aria-label="타이어 상태 필터"
      className="flex flex-wrap gap-1.5"
    >
      {TIRE_CHIPS.map(({ value, label }) => {
        const isSelected = currentTireStatus.includes(value);

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              const nextTireStatus = isSelected
                ? currentTireStatus.filter((status) => status !== value)
                : [...currentTireStatus, value];
              router.replace(
                buildVehicleListHref({
                  status: currentStatus,
                  tireStatus: nextTireStatus,
                }),
              );
            }}
            className={[
              "inline-flex items-center gap-0.5 rounded-full border text-sm font-semibold tracking-[-0.35px] outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              isSelected
                ? "border-white bg-dashboard-chip-selected-bg pl-2.5 pr-4 py-1.5 text-brand"
                : "border-dashboard-vehicles-border px-4 py-1.5 text-dashboard-text-muted hover:bg-dashboard-vehicles-surface",
            ].join(" ")}
          >
            {isSelected ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}
