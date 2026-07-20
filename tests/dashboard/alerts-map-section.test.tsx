import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AlertsAndMapSection } from "@/components/dashboard/alerts-map/AlertsAndMapSection";
import { server } from "@/lib/dashboard/msw/server";
import {
  alertsEmptyHandler,
  alertsErrorHandler,
} from "@/lib/dashboard/msw/handlers/alerts";

/**
 * SSE + 서버 목록 통합 검증. `AlertsAndMapSection`은 지도(fallback) +
 * `LiveAlertsFeed`로 구성된다. `LiveAlertsFeed`는:
 * - `useAlertHistory`(React Query 무한 조회)로 서버 저장 알림을 최신순 표시하고,
 * - `useAlertStream`(SSE)로 실시간 신규 알림을 맨 위에 얹으며 "새 알림" 빨간 점을 붙인다.
 *
 * jsdom에는 `EventSource`가 없으므로 목을 주입해 `alert` 이벤트를 직접 흘려보낸다.
 * (`IntersectionObserver`도 없어 무한 스크롤 관찰은 컴포넌트에서 자동 skip된다.)
 * `window.kakao`는 미설정이라 `VehicleMap`은 항상 fallback을 렌더한다.
 */
type Listener = (event: Event) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  url: string;
  readyState = MockEventSource.CONNECTING;
  onopen: Listener | null = null;
  onerror: Listener | null = null;
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  removeEventListener(type: string, cb: Listener) {
    this.listeners.get(type)?.delete(cb);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  emit(type: string, data?: string) {
    const event = { data } as MessageEvent;
    this.listeners.get(type)?.forEach((cb) => cb(event));
  }
}

function livePayload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    alertId: "live-1",
    vehicleId: "v-1",
    plateNumber: "12가 3456",
    tireId: "t-1",
    alertLevel: "DANGER",
    alertTitle: "실시간 신규 알림",
    alertTime: "2026.07.16 11:00:00", // 픽스처(10:xx)보다 최신 → 맨 위
    ...overrides,
  });
}

function lastSource() {
  const src = MockEventSource.instances.at(-1);
  if (!src) throw new Error("no EventSource opened");
  return src;
}

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AlertsAndMapSection />
    </QueryClientProvider>,
  );
}

describe("AlertsAndMapSection (SSE + 서버 목록)", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal("EventSource", MockEventSource);
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-07-16T10:00:00.000Z"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("subscribes to the SSE endpoint on mount", () => {
    renderSection();
    expect(lastSource().url).toContain("/api/dashboard/alerts/subscribe");
  });

  it("loads server-stored alerts (history) without a new-alert dot", async () => {
    renderSection();
    expect(await screen.findByText("알림 제목 1")).toBeInTheDocument();
    // 과거(서버) 항목에는 "새 알림" 점이 없다.
    expect(screen.queryByAltText("새 알림")).not.toBeInTheDocument();
  });

  it("prepends a live SSE alert and marks it with a '새 알림' red dot", async () => {
    renderSection();
    await screen.findByText("알림 제목 1"); // 히스토리 로드 대기

    act(() => lastSource().emit("alert", livePayload()));

    expect(await screen.findByText("실시간 신규 알림")).toBeInTheDocument();
    expect(screen.getByAltText("새 알림")).toBeInTheDocument();
  });

  it("shows the empty state when there are no alerts", async () => {
    server.use(alertsEmptyHandler);
    renderSection();
    expect(
      await screen.findByText("아직 수신된 실시간 알림이 없습니다."),
    ).toBeInTheDocument();
  });

  it("shows an error with a retry button when the list request fails", async () => {
    server.use(alertsErrorHandler);
    renderSection();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "알림 목록을 불러오지 못했습니다.",
    );
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  it("does not render a connection status indicator (removed from design)", async () => {
    renderSection();
    await screen.findByText("알림 제목 1");
    expect(screen.queryByText("실시간 연결됨")).not.toBeInTheDocument();
    expect(screen.queryByText("연결 중…")).not.toBeInTheDocument();
    expect(screen.queryByText("연결 끊김")).not.toBeInTheDocument();
  });

  it("still shows the map fallback message when the Kakao SDK is unavailable (AC6)", async () => {
    renderSection();
    expect(
      await screen.findByText("지도를 불러올 수 없습니다"),
    ).toBeInTheDocument();
  });
});
