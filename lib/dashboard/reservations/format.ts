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

/**
 * "업데이트 시간 : YY/MM/DD HH:mm" — the `ReservationUpdateBar` refresh-time
 * label (issue #38). Slash-separated with a 2-digit year, matching the
 * confirmed Figma copy's literal separator convention (the fixed
 * `RESERVATIONS_UPDATED_AT_LABEL` fallback: "26/07/08 20:41"), which is
 * distinct from this file's dot-separated `YY.MM.DD` used by
 * `formatReservationDateLabel`.
 *
 * Uses local-time getters (not the UTC getters `formatReservationDateLabel`
 * uses) because `date` here is always a client-side `Date` created at the
 * moment the page mounted or the user clicked refresh — it represents "now"
 * in the browser's own timezone, not a server-supplied ISO date that must
 * render identically regardless of the viewer's timezone.
 */
export function formatReservationUpdatedAtLabel(date: Date): string {
  const yy = (date.getFullYear() % 100).toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `업데이트 시간 : ${yy}/${mm}/${dd} ${hh}:${min}`;
}
