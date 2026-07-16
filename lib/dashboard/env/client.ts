/**
 * Browser-safe env accessor for `/dashboard` data fetching.
 *
 * Decision D2 (`.claude/handoffs/11-api-specs.md`, resolved 2026-07-16, 안 A):
 * dashboard reuses the same `NEXT_PUBLIC_API_BASE` value as `/rental-checklist`
 * (`lib/api.ts`) — no separate backend host is confirmed — but reads it through
 * this dedicated module instead of importing the protected `lib/api.ts` file, so
 * the two code paths stay isolated per CLAUDE.md §3 even though the underlying
 * value is shared.
 *
 * Next.js only statically inlines `NEXT_PUBLIC_*` variables when referenced as a
 * literal `process.env.NEXT_PUBLIC_...` expression, so the name is written out
 * here rather than looked up dynamically.
 *
 * `apiBase` intentionally falls back to `""` (relative fetch) instead of a fake
 * localhost default when the variable is unset, matching `lib/api.ts`'s existing
 * behavior. A relative base still works for same-origin requests (including MSW
 * in tests); it is only a real problem for a deployed build talking to a
 * separate origin, so we warn instead of throwing and breaking local/dev usage.
 */
function readApiBase(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE;

  if (!value) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[dashboard/env] NEXT_PUBLIC_API_BASE is not set; dashboard summary requests will use a relative URL.",
      );
    }
    return "";
  }

  return value;
}

/**
 * Kakao Maps JavaScript key (issue #12, Decision Resolved 2026-07-16 #1,
 * `.claude/handoffs/12-pm-breakdown.md`). Set locally in `.env.local` (not
 * committed — see `.env.example`). Deliberately returns `undefined` instead of a
 * fake default when unset: `VehicleMap` treats a missing key as a *supported*
 * fallback state (no SDK load attempt), not an error to warn about.
 *
 * Referenced as the literal `process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY`
 * expression (not a dynamic key) so Next.js can statically inline it.
 */
function readKakaoMapAppKey(): string | undefined {
  const value = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  return value ? value : undefined;
}

export const dashboardClientEnv = {
  apiBase: readApiBase(),
  kakaoMapAppKey: readKakaoMapAppKey(),
};
