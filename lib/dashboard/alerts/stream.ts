import { formatRelativeTime } from "@/lib/dashboard/alerts/api";
import { dashboardClientEnv } from "@/lib/dashboard/env/client";

/**
 * 대시보드 "실시간 알림" 전용 계약.
 *
 * 두 경로가 같은 알림 행(백엔드 `AlertResponse`)을 준다:
 * - 초기/과거 목록: `GET /api/dashboard/alerts?page&size` (서버 진실원본, 무한 스크롤)
 * - 실시간 신규:    `GET /api/dashboard/alerts/subscribe` SSE의 `alert` 이벤트
 *
 * 둘 다 동일한 `AlertResponse` 형태라 하나의 매퍼(`mapAlertResponse`)로 `LiveAlert`로
 * 변환한다. 기존 REST 목록(`AlertDto`/`AlertItem`, issue #12)과는 다른 계약이므로
 * 별도 타입을 둔다.
 */

/** SSE 구독 엔드포인트. */
export const ALERTS_SUBSCRIBE_PATH = "/api/dashboard/alerts/subscribe";
/** 페이지네이션 목록 엔드포인트(무한 스크롤). */
export const ALERTS_LIST_PATH = "/api/dashboard/alerts";
/** 세션 중 메모리에 유지할 실시간(신규) 알림 최대 개수. */
export const MAX_LIVE_ALERTS = 50;

/** 백엔드 `AlertLevel` enum 직렬화값(WARNING/DANGER)과 1:1 대응. */
export type LiveAlertSeverity = "DANGER" | "WARNING";

/** 서버 `AlertResponse`(SSE 이벤트 본문이자 목록 행)의 형태. */
interface AlertResponsePayload {
  alertId: string;
  vehicleId: string;
  plateNumber: string;
  tireId: string | null;
  alertLevel: string;
  alertTitle: string;
  /** "yyyy.MM.dd HH:mm:ss" (백엔드 로컬시각, KST 가정). */
  alertTime: string;
}

/** UI(`LiveAlertsFeed`)가 소비하는 알림 모델. */
export interface LiveAlert {
  id: string;
  vehicleId: string;
  vehiclePlateNumber: string;
  tireId: string | null;
  severity: LiveAlertSeverity;
  title: string;
  /** 정렬·중복제거 기준이 되는 오프셋 없는 로컬 ISO. */
  occurredAtIso: string;
  /** 렌더 시점 상대시간 라벨(예: "방금 전", "3분 전"). */
  occurredAtLabel: string;
}

/** 한 페이지 조회 결과 + 페이지네이션 메타. */
export interface AlertPage {
  items: LiveAlert[];
  page: number;
  totalPages: number;
  totalElements: number;
}

function isAlertResponsePayload(value: unknown): value is AlertResponsePayload {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.alertId === "string" &&
    typeof o.vehicleId === "string" &&
    typeof o.plateNumber === "string" &&
    typeof o.alertLevel === "string" &&
    typeof o.alertTitle === "string" &&
    typeof o.alertTime === "string"
  );
}

/** 알 수 없는 레벨은 덜 위중한 쪽(WARNING)으로 보수적으로 매핑한다. */
function toSeverity(alertLevel: string): LiveAlertSeverity {
  return alertLevel.toUpperCase() === "DANGER" ? "DANGER" : "WARNING";
}

/**
 * "yyyy.MM.dd HH:mm:ss" → "yyyy-MM-ddTHH:mm:ss". 타임존 오프셋이 없어 브라우저는
 * 이를 로컬시각으로 해석하며, 클라이언트·서버가 같은 KST라 상대시간이 맞는다.
 * 예상 밖 포맷이면 원문을 그대로 반환한다(라벨 계산이 방어적으로 처리).
 */
function alertTimeToIso(alertTime: string): string {
  const m = alertTime.match(
    /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!m) return alertTime;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

/** `AlertResponse` payload → `LiveAlert`. SSE·REST 양쪽이 공유한다. */
function mapAlertResponse(raw: AlertResponsePayload, now: Date): LiveAlert {
  const occurredAtIso = alertTimeToIso(raw.alertTime);
  const occurredAtLabel = Number.isNaN(Date.parse(occurredAtIso))
    ? "방금 전"
    : formatRelativeTime(occurredAtIso, now);

  return {
    id: raw.alertId,
    vehicleId: raw.vehicleId,
    vehiclePlateNumber: raw.plateNumber,
    tireId: typeof raw.tireId === "string" ? raw.tireId : null,
    severity: toSeverity(raw.alertLevel),
    title: raw.alertTitle,
    occurredAtIso,
    occurredAtLabel,
  };
}

/**
 * SSE `alert` 이벤트 data 문자열 → `LiveAlert`. 파싱 실패나 스키마 불일치는 `null`을
 * 반환해 스트림 하나의 불량 이벤트가 앱을 깨지 않도록 한다.
 */
export function parseAlertEvent(
  data: string,
  now: Date = new Date(),
): LiveAlert | null {
  let raw: unknown;
  try {
    raw = JSON.parse(data);
  } catch {
    return null;
  }
  if (!isAlertResponsePayload(raw)) return null;
  return mapAlertResponse(raw, now);
}

/**
 * Vitest jsdom AbortSignal vs Node undici 이중 realm 우회.
 * `lib/dashboard/summary/api.ts`와 동일. TODO(#22): tests/setup 정합화 후 제거.
 */
function isAbortSignalBrandMismatch(cause: unknown): boolean {
  return (
    cause instanceof TypeError &&
    cause.message.includes("AbortSignal") &&
    cause.message.includes("signal")
  );
}

/**
 * 알림 목록 한 페이지를 조회한다. 응답 봉투는 `{content:{content:[...],page,...}}`.
 * 손상된 행은 걸러내고 유효한 것만 매핑한다.
 */
export async function fetchAlertPage(
  pageParam: number,
  size: number,
  signal?: AbortSignal,
  now: Date = new Date(),
): Promise<AlertPage> {
  const url = `${dashboardClientEnv.apiBase}${ALERTS_LIST_PATH}?page=${pageParam}&size=${size}`;
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (signal && isAbortSignalBrandMismatch(cause)) {
      response = await fetch(url);
    } else {
      throw cause;
    }
  }
  if (!response.ok) {
    throw new Error(`알림 목록을 불러오지 못했습니다 (HTTP ${response.status}).`);
  }

  const envelope = (await response.json()) as {
    content?: {
      content?: unknown;
      page?: number;
      totalPages?: number;
      totalElements?: number;
    };
  };
  const body = envelope?.content ?? {};
  const rows = Array.isArray(body.content) ? body.content : [];

  const items = rows
    .filter(isAlertResponsePayload)
    .map((row) => mapAlertResponse(row, now));

  return {
    items,
    page: typeof body.page === "number" ? body.page : pageParam,
    totalPages: typeof body.totalPages === "number" ? body.totalPages : 0,
    totalElements:
      typeof body.totalElements === "number" ? body.totalElements : items.length,
  };
}
