import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AlertsAndMapSection } from "@/components/dashboard/alerts-map/AlertsAndMapSection";
import { server } from "@/lib/dashboard/msw/server";
import {
  alertsEmptyHandler,
  alertsErrorHandler,
  alertsNormalHandler,
} from "@/lib/dashboard/msw/handlers/alerts";

/**
 * `window.kakao` is left undefined for every test in this file (no key is set in
 * the test environment — see `lib/dashboard/env/client.ts`), so `VehicleMap`
 * always takes its "unavailable" fallback branch. This deliberately exercises
 * AC6 (fallback UI + independent list) without depending on jsdom's script
 * loading, which does not execute injected `<script src>` tags.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retryDelay: 0,
      },
    },
  });
}

function renderSection() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AlertsAndMapSection />
    </QueryClientProvider>,
  );
}

describe("AlertsAndMapSection", () => {
  // Alert `occurredAtLabel`s ("2분 전" etc.) are computed against the real wall
  // clock at fetch time (`formatRelativeTime`'s default `referenceTime`, see
  // `lib/dashboard/alerts/api.ts`) so the label stays accurate without polling.
  // Fixing `Date` (but not `setTimeout`/microtasks, so async MSW responses and
  // Testing Library's `findBy*` still resolve normally) to the fixture's
  // documented anchor instant makes those labels deterministic here instead of
  // depending on when this suite happens to run relative to the fixed fixture
  // timestamps in `lib/dashboard/msw/fixtures/alerts.ts`.
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-07-16T10:00:00.000Z"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a loading skeleton with aria-busy, before the response resolves (AC2)", () => {
    server.use(alertsNormalHandler);
    renderSection();

    const loadingText = screen.getByText("실시간 알림을 불러오는 중입니다.");
    expect(loadingText).toBeInTheDocument();
    expect(loadingText.closest('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole("button", { name: /12가 3456/ })).not.toBeInTheDocument();
  });

  it("renders every alert with severity, vehicle plate, description, and time on success (AC1)", async () => {
    server.use(alertsNormalHandler);
    renderSection();

    expect(
      await screen.findByRole("button", {
        name: "위험 알림, 12가 3456, 타이어 온도 90℃ 이상 감지, 2분 전",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "주의 알림, 88허 1004, 타이어 마모도 70% 감지, 1시간 전",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("실시간 알림을 불러오는 중입니다."),
    ).not.toBeInTheDocument();
  });

  it("shows a distinct empty message when there are 0 alerts, not an error (AC3)", async () => {
    server.use(alertsEmptyHandler);
    renderSection();

    expect(await screen.findByText("현재 알림이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error message with a retry button, and recovers on retry (AC4)", async () => {
    server.use(alertsErrorHandler);
    const user = userEvent.setup();
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "알림 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );

    server.use(alertsNormalHandler);
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("button", {
        name: "위험 알림, 12가 3456, 타이어 온도 90℃ 이상 감지, 2분 전",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("marks the clicked alert as selected (aria-pressed) and announces the outcome via a live region (AC5, AC7)", async () => {
    server.use(alertsNormalHandler);
    const user = userEvent.setup();
    renderSection();

    const firstAlertButton = await screen.findByRole("button", {
      name: "위험 알림, 12가 3456, 타이어 온도 90℃ 이상 감지, 2분 전",
    });
    expect(firstAlertButton).toHaveAttribute("aria-pressed", "false");

    await user.click(firstAlertButton);

    expect(
      screen.getByRole("button", {
        name: "위험 알림, 12가 3456, 타이어 온도 90℃ 이상 감지, 2분 전, 선택됨",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(
        "12가 3456 선택됨 — 지도를 사용할 수 없어 위치를 표시할 수 없습니다.",
      ),
    ).toBeInTheDocument();
  });

  it("supports keyboard selection (Tab + Enter) (AC5)", async () => {
    server.use(alertsNormalHandler);
    const user = userEvent.setup();
    renderSection();

    const firstAlertButton = await screen.findByRole("button", {
      name: "위험 알림, 12가 3456, 타이어 온도 90℃ 이상 감지, 2분 전",
    });
    firstAlertButton.focus();
    expect(firstAlertButton).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("button", {
        name: "위험 알림, 12가 3456, 타이어 온도 90℃ 이상 감지, 2분 전, 선택됨",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the map fallback message when the Kakao SDK is unavailable, independent of the alerts list (AC6)", async () => {
    server.use(alertsNormalHandler);
    renderSection();

    expect(await screen.findByText("지도를 불러올 수 없습니다")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", {
        name: "위험 알림, 12가 3456, 타이어 온도 90℃ 이상 감지, 2분 전",
      }),
    ).toBeInTheDocument();
  });
});
