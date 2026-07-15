import type { YearlyCostDataset } from "@/types/dashboard/cost-chart";

const DIRECTION_LABEL: Record<YearlyCostDataset["comparisonDirection"], string> =
  {
    increase: "증가",
    decrease: "감소",
  };

/**
 * `CostLineChart`(Recharts SVG, `aria-hidden`)와 동일한 12개월 데이터를 제공하는
 * 스크린 리더 전용 표(Safe Assumption D, `.claude/handoffs/13-pm-breakdown.md`).
 * Recharts SVG 출력은 기본적으로 스크린 리더에 의미 있는 정보를 제공하지 않으므로,
 * 증감 방향까지 텍스트("전년대비 N% 증가/감소")로 명시하는 대안 표를 별도로 둔다.
 */
export function CostChartAccessibleTable({
  dataset,
}: {
  dataset: YearlyCostDataset;
}) {
  const directionLabel = DIRECTION_LABEL[dataset.comparisonDirection];

  return (
    <table className="sr-only">
      <caption>
        {dataset.year}년 차량유지보수비 월별 데이터. 전년대비{" "}
        {dataset.comparisonPercentage}% {directionLabel}.
      </caption>
      <thead>
        <tr>
          <th scope="col">월</th>
          <th scope="col">전년 비용</th>
          <th scope="col">올해 비용</th>
        </tr>
      </thead>
      <tbody>
        {dataset.points.map((point) => (
          <tr key={point.month}>
            <th scope="row">{point.month}월</th>
            <td>{point.lastYearCost.toLocaleString("ko-KR")}만원</td>
            <td>
              {point.currentYearCost !== undefined
                ? `${point.currentYearCost.toLocaleString("ko-KR")}만원`
                : "데이터 없음"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
