"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchAlertPage, type LiveAlert } from "@/lib/dashboard/alerts/stream";

/**
 * 한 번에 불러오는 알림 개수. 처음엔 상위 5건만 보이고, 무한 스크롤이 이 단위(5건)로
 * 다음 페이지를 이어 붙인다.
 */
export const ALERT_HISTORY_PAGE_SIZE = 5;

const alertHistoryQueryKey = ["dashboard", "alerts", "history"] as const;

/**
 * 서버에 저장된 실시간 알림 목록을 최신순으로 페이지 조회한다(무한 스크롤).
 *
 * `GET /api/dashboard/alerts?page&size`가 서버 진실원본이므로, 새로고침 후에도
 * 목록이 그대로 유지된다(localStorage 불필요). 실시간 신규 알림은 `useAlertStream`이
 * 별도로 얹는다.
 */
export function useAlertHistory() {
  const query = useInfiniteQuery({
    queryKey: alertHistoryQueryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchAlertPage(pageParam, ALERT_HISTORY_PAGE_SIZE, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });

  const items: LiveAlert[] =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    totalElements: query.data?.pages[0]?.totalElements ?? 0,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
