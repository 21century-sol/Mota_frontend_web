import type { ReservationStatus } from "@/types/dashboard/reservation";

/**
 * `YY.MM.DD` display format — matches the literal Figma copy for this screen
 * ("26.07.19", `.claude/handoffs/16-figma-specs.md` Confirmed Design Facts),
 * which is a 2-digit year unlike the `YYYY.MM.DD` format used by
 * `lib/dashboard/vehicles/format.ts`. UTC getters are used (not local-time
 * getters) so the rendered date does not shift by a day depending on the
 * machine/CI timezone running the code.
 */
export function formatReservationDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  const yy = (date.getUTCFullYear() % 100).toString().padStart(2, "0");
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = date.getUTCDate().toString().padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

/**
 * Status badge/tab label text. Note the two confirmed Figma strings differ in
 * spacing on purpose: the table badge is "반납완료" (no space) while the filter
 * tab is "반납 완료" (with a space) — this map is for the badge; tab labels are
 * defined locally in `ReservationStatusTabs`.
 */
const RESERVATION_STATUS_BADGE_LABELS: Record<ReservationStatus, string> = {
  RENTED: "대여 중",
  RETURNED: "반납완료",
};

export function formatReservationStatusBadgeLabel(
  status: ReservationStatus,
): string {
  return RESERVATION_STATUS_BADGE_LABELS[status];
}
