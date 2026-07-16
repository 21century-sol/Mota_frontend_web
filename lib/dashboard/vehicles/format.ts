import type { TireStatus } from "@/types/dashboard/vehicle";

/**
 * Explicit placeholder for a null `tireStatus`/`rentedAt`/`returnedAt`
 * (PM AC1, `.claude/handoffs/14-pm-breakdown.md`) — never an empty string, so
 * a missing value can't be mistaken for silent/empty rendering.
 */
export const NO_VALUE_PLACEHOLDER = "—";

const TIRE_STATUS_LABELS: Record<TireStatus, string> = {
  NORMAL: "정상",
  CAUTION: "주의",
  WARNING: "위험",
};

export function formatTireStatusLabel(tireStatus: TireStatus | null): string {
  return tireStatus ? TIRE_STATUS_LABELS[tireStatus] : NO_VALUE_PLACEHOLDER;
}

/**
 * `YYYY.MM.DD` display format (CLAUDE.md §4); the transmitted/fixture value
 * stays the original ISO string (adapter never rewrites it). UTC getters are
 * used (not local-time getters) so the rendered date does not shift by a day
 * depending on the machine/CI timezone running the code.
 */
export function formatVehicleDateLabel(iso: string | null): string {
  if (!iso) return NO_VALUE_PLACEHOLDER;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NO_VALUE_PLACEHOLDER;

  const yyyy = date.getUTCFullYear().toString().padStart(4, "0");
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = date.getUTCDate().toString().padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}
