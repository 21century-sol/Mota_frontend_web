import { describe, expect, it } from "vitest";

import {
  fetchAlertPage,
  parseAlertEvent,
} from "@/lib/dashboard/alerts/stream";
import { server } from "@/lib/dashboard/msw/server";
import { alertsErrorHandler } from "@/lib/dashboard/msw/handlers/alerts";

// 오프셋 없는 로컬 시각. `occurredAtIso`도 오프셋 없는 로컬 시각이라, 둘을 같은
// 로컬 기준으로 맞춰 러너 타임존과 무관하게 상대시간이 결정적이게 한다.
const NOW = new Date("2026-07-16T10:00:00");

function raw(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    alertId: "a1",
    vehicleId: "v1",
    plateNumber: "12가 3456",
    tireId: "t1",
    alertLevel: "DANGER",
    alertTitle: "타이어 온도 90℃ 이상 감지",
    alertTime: "2026.07.16 18:58:00",
    ...overrides,
  });
}

describe("parseAlertEvent", () => {
  it("maps a valid SSE payload to a LiveAlert (fields + ISO time)", () => {
    expect(parseAlertEvent(raw(), NOW)).toMatchObject({
      id: "a1",
      vehicleId: "v1",
      vehiclePlateNumber: "12가 3456",
      tireId: "t1",
      severity: "DANGER",
      title: "타이어 온도 90℃ 이상 감지",
      occurredAtIso: "2026-07-16T18:58:00",
    });
  });

  it("maps alertLevel to severity (WARNING default for unknown)", () => {
    expect(parseAlertEvent(raw({ alertLevel: "WARNING" }), NOW)?.severity).toBe("WARNING");
    expect(parseAlertEvent(raw({ alertLevel: "Danger" }), NOW)?.severity).toBe("DANGER");
    expect(parseAlertEvent(raw({ alertLevel: "???" }), NOW)?.severity).toBe("WARNING");
  });

  it("returns null on malformed JSON or a missing required field", () => {
    expect(parseAlertEvent("not-json", NOW)).toBeNull();
    expect(parseAlertEvent(JSON.stringify({ alertId: "only-id" }), NOW)).toBeNull();
  });

  it("falls back to '방금 전' when the time format is unexpected", () => {
    expect(parseAlertEvent(raw({ alertTime: "invalid" }), NOW)?.occurredAtLabel).toBe(
      "방금 전",
    );
  });
});

describe("fetchAlertPage", () => {
  it("parses the paginated envelope into items + page metadata (page 0)", async () => {
    const page = await fetchAlertPage(0, 20, undefined, NOW);

    expect(page.page).toBe(0);
    expect(page.totalPages).toBe(2);
    expect(page.totalElements).toBe(25);
    expect(page.items).toHaveLength(20);
    // 픽스처는 최신순(alert-01 = 10:59) — 매핑된 첫 행이 그대로 온다.
    expect(page.items[0]).toMatchObject({ id: "alert-01", severity: "WARNING" });
  });

  it("returns the remaining rows on the last page (page 1)", async () => {
    const page = await fetchAlertPage(1, 20, undefined, NOW);
    expect(page.items).toHaveLength(5);
    expect(page.page).toBe(1);
  });

  it("throws on a non-OK response", async () => {
    server.use(alertsErrorHandler);
    await expect(fetchAlertPage(0, 20, undefined, NOW)).rejects.toThrow(
      /HTTP 500/,
    );
  });
});
