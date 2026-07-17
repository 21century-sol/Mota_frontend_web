import type { TireDetail } from "@/types/dashboard/vehicle";
import { NO_VALUE_PLACEHOLDER } from "@/lib/dashboard/vehicles/format";

/**
 * Shared "needs attention" rule for the 4 wheels (PM AC15/AC17, and the Car
 * Info panel's derived "타이어상태" stat, AC4). `.claude/handoffs/15-figma-specs.md`
 * "Discovered Mock Inconsistencies" resolves the two root frames' conflicting
 * summary values by deriving this from the 4 `TireDetail.status` fields
 * instead of trusting any single "summary" field — one function is the single
 * source of truth so the banner (AC15) and the Car Info stat (AC4) can never
 * disagree.
 */
export function hasTireNeedingAttention(tires: TireDetail[]): boolean {
  return tires.some((tire) => tire.status !== "NORMAL");
}

export function countTiresNeedingAttention(tires: TireDetail[]): number {
  return tires.filter((tire) => tire.status !== "NORMAL").length;
}

/** `undefined` (still loading/errored) renders the explicit placeholder, never a stale/blank label. */
export function computeTireStatusSummaryLabel(tires: TireDetail[] | undefined): string {
  if (!tires) return NO_VALUE_PLACEHOLDER;
  return hasTireNeedingAttention(tires) ? "점검 필요" : "정상";
}
