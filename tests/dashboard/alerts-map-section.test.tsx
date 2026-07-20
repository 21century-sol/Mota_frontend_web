import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AlertsAndMapSection } from "@/components/dashboard/alerts-map/AlertsAndMapSection";
import { server } from "@/lib/dashboard/msw/server";
import {
  alertsEmptyHandler,
  alertsErrorHandler,
} from "@/lib/dashboard/msw/handlers/alerts";
import { LIVE_LOCATIONS_PATH } from "@/lib/dashboard/live-locations/api";

/**
 * SSE + 서버 목록 + live-locations 통합 검증 (#12 / #64).
 * `window.kakao` 미설정이라 지도는 fallback. EventSource는 목으로 주입.
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
    alertTitle: "실시간 수신 알림",
    alertTime: "2026.07.16 11:00:00",
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

describe("AlertsAndMapSection (SSE + 서버 목록 + GPS)", () => {
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

  it("loads server-stored alerts (history) without a new-alert marker in the name", async () => {
    renderSection();
    expect(await screen.findByText("알림 제목 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /새 알림/ }),
    ).not.toBeInTheDocument();
  });

  it("prepends a live SSE alert and marks it with a '새 알림' affordance", async () => {
    renderSection();
    await screen.findByText("알림 제목 1");

    act(() => lastSource().emit("alert", livePayload()));

    expect(await screen.findByText("실시간 수신 알림")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /실시간 수신 알림.*새 알림/ }),
    ).toBeInTheDocument();
  });

  it("selects a vehicle for the map when an alert row is clicked (#64)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderSection();
    await screen.findByText("알림 제목 1");

    const row = screen.getByRole("button", { name: /알림 제목 1/ });
    await user.click(row);

    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(/선택한 차량|지도 중심이|지도를 사용할 수 없어/),
    ).toBeInTheDocument();
  });

  it("keeps the same vehicle selected when another alert for that vehicle is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderSection();
    await screen.findByText("알림 제목 1"); // v-1
    // 홀수 n = v-1, 짝수 = v-2 — 제목 3도 v-1
    const first = screen.getByRole("button", { name: /알림 제목 1/ });
    const third = screen.getByRole("button", { name: /알림 제목 3/ });

    await user.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");

    await user.click(third);
    expect(third).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("aria-pressed", "true");
  });

  it("requests live-locations for map GPS polling (#64)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderSection();
    await screen.findByText("알림 제목 1");

    expect(
      fetchSpy.mock.calls.some(([input]) =>
        String(input).includes(LIVE_LOCATIONS_PATH),
      ),
    ).toBe(true);
    fetchSpy.mockRestore();
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
