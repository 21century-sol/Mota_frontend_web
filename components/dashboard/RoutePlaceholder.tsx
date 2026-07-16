/**
 * Minimal "coming soon" placeholder shared by routes whose real content is scoped to
 * later issues (vehicle list: #14, reservation list: #16 — see
 * .claude/handoffs/5-pm-breakdown.md Safe Assumption A4). `/dashboard` no longer
 * uses this placeholder itself (summary/alerts+map/chart landed in #11/#12/#13).
 * Each remaining caller should stop rendering this once its own feature issue lands.
 *
 * `headingLevel` defaults to `h1` (the placeholder is the page's only content in
 * most routes). Callers that already have their own page `h1` (and would
 * otherwise render a second one) should pass `h2` instead.
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
