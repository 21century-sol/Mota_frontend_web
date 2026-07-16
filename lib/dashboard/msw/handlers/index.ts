import type { RequestHandler } from "msw";

import { summaryNormalHandler } from "@/lib/dashboard/msw/handlers/summary";
import { alertsNormalHandler } from "@/lib/dashboard/msw/handlers/alerts";

// Dev-boot default: only the "normal" scenario for each dashboard widget runs out
// of the box. Other scenarios (empty/error/slow) are opted into per-test via
// `server.use(...)` (see tests/dashboard/summary-cards-section.test.tsx,
// tests/dashboard/alerts-map-section.test.tsx).
export const handlers: RequestHandler[] = [
  summaryNormalHandler,
  alertsNormalHandler,
];
