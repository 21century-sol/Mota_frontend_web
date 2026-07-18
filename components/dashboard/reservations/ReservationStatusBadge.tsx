import type { ReservationStatus } from "@/types/dashboard/reservation";
import { formatReservationStatusBadgeLabel } from "@/lib/dashboard/reservations/format";

/**
 * Outline pill badge (1px border, no fill, 6px status dot) — Figma Confirmed
 * Design Facts, `.claude/handoffs/16-figma-specs.md`: "반납완료"(no space)
 * `#969696`, "대여 중"(with space) `#fb963d` (`dashboard-reservation-status-*`
 * tokens, `tailwind.config.ts`).
 *
 * The label text itself ("대여 중" vs "반납완료") differs, not just the color,
 * so status is never conveyed by color alone (CLAUDE.md §4 accessibility).
 */
const STATUS_BADGE_STYLES: Record<
  ReservationStatus,
  { border: string; text: string; dot: string }
> = {
  RENTED: {
    border: "border-dashboard-reservation-status-rented",
    text: "text-dashboard-reservation-status-rented",
    dot: "bg-dashboard-reservation-status-rented",
  },
  RETURNED: {
    border: "border-dashboard-reservation-status-returned",
    text: "text-dashboard-reservation-status-returned",
    dot: "bg-dashboard-reservation-status-returned",
  },
};

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const style = STATUS_BADGE_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border py-1 pl-3 pr-3.5 text-sm font-medium ${style.border} ${style.text}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {formatReservationStatusBadgeLabel(status)}
    </span>
  );
}
