import { describe, expect, it } from "vitest";

import {
  computeRemainingLabel,
  CurrentRentalContractMismatchError,
  CurrentRentalFetchError,
  formatKstWireDateLabel,
  isCurrentRentalDto,
  OVERDUE_REMAINING_LABEL,
  parseKstDateTime,
  toCurrentRentalResult,
} from "@/lib/dashboard/vehicles/current-rental-api";
import type { CurrentRental } from "@/types/dashboard/vehicle";

const rentedFixture: CurrentRental = {
  rented: true,
  renterName: "김민준",
  startDate: "2026.07.15 09:00:00",
  endDate: "2026.07.20 09:00:00",
};

function envelope(
  content: unknown,
  overrides: { statusCode?: number; error?: string | null } = {},
) {
  return {
    statusCode: overrides.statusCode ?? 200,
    error: overrides.error ?? null,
    content,
  };
}

describe("isCurrentRentalDto", () => {
  it("accepts a `rented: false` payload with no other fields", () => {
    expect(isCurrentRentalDto({ rented: false })).toBe(true);
  });

  it("accepts a `rented: true` payload with all 3 required fields", () => {
    expect(isCurrentRentalDto(rentedFixture)).toBe(true);
  });

  it("rejects a `rented: true` payload with a missing renterName", () => {
    const { renterName: _omit, ...withoutRenterName } = rentedFixture;
    expect(isCurrentRentalDto(withoutRenterName)).toBe(false);
  });

  it("rejects a date string that is not in the YYYY.MM.DD HH:mm:ss wire format (e.g. ISO)", () => {
    expect(
      isCurrentRentalDto({ ...rentedFixture, endDate: "2026-07-20T09:00:00.000Z" }),
    ).toBe(false);
  });

  it("rejects a non-boolean `rented` field", () => {
    expect(isCurrentRentalDto({ rented: "true" })).toBe(false);
  });
});

describe("toCurrentRentalResult", () => {
  it("maps a normal not-rented envelope", () => {
    expect(toCurrentRentalResult(envelope({ rented: false }))).toEqual({ rented: false });
  });

  it("maps a normal rented envelope", () => {
    expect(toCurrentRentalResult(envelope(rentedFixture))).toEqual(rentedFixture);
  });

  it("treats a non-200 statusCode as a business-failure fetch error, not a contract mismatch", () => {
    expect(() => toCurrentRentalResult(envelope(rentedFixture, { statusCode: 500 }))).toThrow(
      CurrentRentalFetchError,
    );
  });

  it("classifies a 5xx business-failure statusCode as a server-error kind", () => {
    try {
      toCurrentRentalResult(envelope(rentedFixture, { statusCode: 500 }));
      expect.unreachable("expected toCurrentRentalResult to throw");
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(CurrentRentalFetchError);
      expect((thrown as CurrentRentalFetchError).kind).toBe("server-error");
    }
  });

  it("classifies a 4xx business-failure statusCode as a client-error kind", () => {
    try {
      toCurrentRentalResult(envelope(rentedFixture, { statusCode: 400 }));
      expect.unreachable("expected toCurrentRentalResult to throw");
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(CurrentRentalFetchError);
      expect((thrown as CurrentRentalFetchError).kind).toBe("client-error");
    }
  });

  it("treats a non-null `error` field as a business-failure fetch error", () => {
    expect(() =>
      toCurrentRentalResult(envelope(rentedFixture, { statusCode: 200, error: "SOME_ERROR" })),
    ).toThrow(CurrentRentalFetchError);
  });

  it("treats a malformed `content` shape as a contract mismatch", () => {
    expect(() => toCurrentRentalResult(envelope({ rented: true }))).toThrow(
      CurrentRentalContractMismatchError,
    );
  });

  it("treats a response missing `content` as a contract mismatch", () => {
    expect(() => toCurrentRentalResult({ statusCode: 200, error: null })).toThrow(
      CurrentRentalContractMismatchError,
    );
  });
});

describe("parseKstDateTime", () => {
  it("parses a valid wire string into the correct UTC instant (KST is UTC+9)", () => {
    const parsed = parseKstDateTime("2026.07.19 09:00:00");
    expect(parsed.toISOString()).toBe("2026-07-19T00:00:00.000Z");
  });

  it("throws a contract mismatch error for a non-matching format (e.g. ISO)", () => {
    expect(() => parseKstDateTime("2026-07-19T09:00:00.000Z")).toThrow(
      CurrentRentalContractMismatchError,
    );
  });

  it("throws for an out-of-range month", () => {
    expect(() => parseKstDateTime("2026.13.01 09:00:00")).toThrow(
      CurrentRentalContractMismatchError,
    );
  });

  it("throws for an out-of-range day (Feb 30 in a non-leap year)", () => {
    expect(() => parseKstDateTime("2026.02.30 09:00:00")).toThrow(
      CurrentRentalContractMismatchError,
    );
  });

  it("throws for an out-of-range hour", () => {
    expect(() => parseKstDateTime("2026.07.19 24:00:00")).toThrow(
      CurrentRentalContractMismatchError,
    );
  });

  it("accepts Feb 29 in a leap year (2028)", () => {
    expect(() => parseKstDateTime("2028.02.29 09:00:00")).not.toThrow();
  });
});

describe("formatKstWireDateLabel", () => {
  it("extracts the YYYY.MM.DD date prefix from a wire datetime string", () => {
    expect(formatKstWireDateLabel("2026.07.19 09:00:00")).toBe("2026.07.19");
  });

  it("throws a contract mismatch error for a non-matching format", () => {
    expect(() => formatKstWireDateLabel("2026-07-19")).toThrow(
      CurrentRentalContractMismatchError,
    );
  });
});

describe("computeRemainingLabel", () => {
  const now = new Date("2026-07-19T03:00:00.000Z"); // 2026.07.19 12:00:00 KST

  it("returns the overdue label when diffMs <= 0, never calling new Date() itself", () => {
    const endDate = parseKstDateTime("2026.07.19 10:00:00"); // 2h before `now`
    expect(computeRemainingLabel(endDate, now)).toBe(OVERDUE_REMAINING_LABEL);
  });

  it("returns the overdue label at the exact boundary (diffMs === 0)", () => {
    expect(computeRemainingLabel(now, now)).toBe(OVERDUE_REMAINING_LABEL);
  });

  it("returns a day-granularity label for >= 24h remaining (ceil)", () => {
    const endDate = parseKstDateTime("2026.07.23 12:00:00"); // exactly +4일
    expect(computeRemainingLabel(endDate, now)).toBe("반납까지 4일 남았습니다");
  });

  it("returns an hour-granularity label for [1h, 24h) remaining (ceil)", () => {
    const endDate = parseKstDateTime("2026.07.19 17:00:00"); // exactly +5시간
    expect(computeRemainingLabel(endDate, now)).toBe("반납까지 5시간 남았습니다");
  });

  it("returns a minute-granularity label for (0, 1h) remaining (ceil)", () => {
    const endDate = parseKstDateTime("2026.07.19 12:20:00"); // exactly +20분
    expect(computeRemainingLabel(endDate, now)).toBe("반납까지 20분 남았습니다");
  });

  it("stays at the hour boundary label for exactly 1h remaining", () => {
    const endDate = parseKstDateTime("2026.07.19 13:00:00"); // exactly +1시간
    expect(computeRemainingLabel(endDate, now)).toBe("반납까지 1시간 남았습니다");
  });

  it("stays at the day boundary label for exactly 24h remaining", () => {
    const endDate = parseKstDateTime("2026.07.20 12:00:00"); // exactly +24시간
    expect(computeRemainingLabel(endDate, now)).toBe("반납까지 1일 남았습니다");
  });
});
