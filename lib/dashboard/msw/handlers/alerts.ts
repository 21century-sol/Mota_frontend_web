import { delay, http, HttpResponse } from "msw";

import { ALERTS_LIST_PATH } from "@/lib/dashboard/alerts/stream";
import {
  alertsFixtureRows,
  type AlertResponseFixture,
} from "@/lib/dashboard/msw/fixtures/alerts";

/** 백엔드 `ApiResponse<AlertPageResponse>` 봉투를 페이지 파라미터에 맞춰 만든다. */
function pageEnvelope(rows: AlertResponseFixture[], page: number, size: number) {
  const start = page * size;
  const content = rows.slice(start, start + size);
  return {
    statusCode: 200,
    error: null,
    content: {
      content,
      page,
      size,
      totalPages: Math.ceil(rows.length / size),
      totalElements: rows.length,
    },
  };
}

function readPageParams(request: Request) {
  const url = new URL(request.url);
  return {
    page: Number(url.searchParams.get("page") ?? "0"),
    size: Number(url.searchParams.get("size") ?? "20"),
  };
}

/** success: 25건을 페이지네이션(무한 스크롤 2페이지). */
export const alertsNormalHandler = http.get(ALERTS_LIST_PATH, ({ request }) => {
  const { page, size } = readPageParams(request);
  return HttpResponse.json(pageEnvelope(alertsFixtureRows, page, size));
});

/** success: 0건(빈 상태). */
export const alertsEmptyHandler = http.get(ALERTS_LIST_PATH, ({ request }) => {
  const { size } = readPageParams(request);
  return HttpResponse.json(pageEnvelope([], 0, size));
});

/** server error: 500(에러 + 재시도). */
export const alertsErrorHandler = http.get(ALERTS_LIST_PATH, () =>
  HttpResponse.json(
    { statusCode: 500, error: "Internal Server Error", content: null },
    { status: 500 },
  ),
);

/** 느린 응답(로딩 상태 검증용). */
export const alertsSlowHandler = http.get(ALERTS_LIST_PATH, async ({ request }) => {
  await delay(2000);
  const { page, size } = readPageParams(request);
  return HttpResponse.json(pageEnvelope(alertsFixtureRows, page, size));
});
