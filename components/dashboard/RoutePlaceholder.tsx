/**
 * Minimal "coming soon" placeholder shared by routes whose real content is scoped to
 * later issues (dashboard summary/alerts/chart: #11-#13, vehicle list: #14,
 * reservation list: #16 — see .claude/handoffs/5-pm-breakdown.md Safe Assumption A4).
 * Each caller should stop rendering this once its own feature issue lands.
 */
export function RoutePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-lg font-semibold text-text-strong">{title}</h1>
      <p className="text-sm text-text-sub">준비 중입니다.</p>
    </div>
  );
}
