/**
 * Pre-mount fallback for `ReservationUpdateBar`'s update-time text (issue
 * #16, literal Figma copy captured in `.claude/handoffs/29-pm-breakdown.md`
 * Confirmed Facts). Since #38, this fixed string is only shown before the
 * component's mount effect has computed a real client-side timestamp (via
 * `formatReservationUpdatedAtLabel`) — using the same static string on the
 * server and the pre-effect client render avoids a hydration mismatch. A
 * fixed, static fixture string — never generated from `new Date()`
 * (CLAUDE.md §6).
 */
export const RESERVATIONS_UPDATED_AT_LABEL = "업데이트 시간 : 26/07/08 20:41";
