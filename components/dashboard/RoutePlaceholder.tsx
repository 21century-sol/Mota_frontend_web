/**
 * Minimal "coming soon" placeholder shared by routes whose real content is scoped to
 * later issues (dashboard summary/alerts/chart: #11-#13, vehicle list: #14,
 * reservation list: #16 — see .claude/handoffs/5-pm-breakdown.md Safe Assumption A4).
 * Each caller should stop rendering this once its own feature issue lands.
 *
 * `headingLevel` defaults to `h1` (the placeholder is the page's only content in
 * most routes). `/dashboard` passes `h2` (issue #11) because that page now has its
 * own `h1` plus a real summary-cards section above these remaining placeholders,
 * and a page must not contain more than one `h1`.
 */
export function RoutePlaceholder({
  title,
  headingLevel = "h1",
}: {
  title: string;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center">
      <Heading className="text-lg font-semibold text-text-strong">
        {title}
      </Heading>
      <p className="text-sm text-text-sub">준비 중입니다.</p>
    </div>
  );
}
