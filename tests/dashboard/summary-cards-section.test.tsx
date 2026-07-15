import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SummaryCardsSection } from "@/components/dashboard/summary/SummaryCardsSection";
import { server } from "@/lib/dashboard/msw/server";
import {
  summaryEmptyHandler,
  summaryErrorHandler,
  summaryNormalHandler,
} from "@/lib/dashboard/msw/handlers/summary";

/**
 * Retries stay enabled (matching `useSummaryCards`'s own retry rule for
 * server/network errors) but `retryDelay: 0` skips React Query's default
 * exponential backoff so the error test doesn't wait on real timers.
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
      <SummaryCardsSection />
    </QueryClientProvider>,
  );
}

describe("SummaryCardsSection", () => {
  it("shows a loading skeleton immediately, before the response resolves", () => {
    server.use(summaryNormalHandler);
    renderSection();

    expect(
      screen.getByText("차량 상태 요약을 불러오는 중입니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "보유 중인 차량 42대" }),
    ).not.toBeInTheDocument();
  });

  it("renders the 4 cards with their exact counts on success (AC1)", async () => {
    server.use(summaryNormalHandler);
    renderSection();

    expect(
      await screen.findByRole("group", { name: "보유 중인 차량 42대" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "대여 가능 18대" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "대여 중 20대" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "운행 불가 4대" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("차량 상태 요약을 불러오는 중입니다."),
    ).not.toBeInTheDocument();
  });

  it("shows an explicit 0대 for every card when all counts are 0, not an error (AC3)", async () => {
    server.use(summaryEmptyHandler);
    renderSection();

    expect(
      await screen.findByRole("group", { name: "보유 중인 차량 0대" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "대여 가능 0대" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "대여 중 0대" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "운행 불가 0대" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error message with a retry button, and recovers on retry (AC4)", async () => {
    server.use(summaryErrorHandler);
    const user = userEvent.setup();
    renderSection();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "요약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );

    server.use(summaryNormalHandler);
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("group", { name: "보유 중인 차량 42대" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
