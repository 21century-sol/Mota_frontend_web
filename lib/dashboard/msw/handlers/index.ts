import type { RequestHandler } from "msw";

import { summaryNormalHandler } from "@/lib/dashboard/msw/handlers/summary";

// Dev-boot default: only the "normal" summary-card scenario runs out of the box.
// Other scenarios (empty/error/slow) are opted into per-test via `server.use(...)`
// (see tests/dashboard/summary-cards-section.test.tsx).
export const handlers: RequestHandler[] = [summaryNormalHandler];
