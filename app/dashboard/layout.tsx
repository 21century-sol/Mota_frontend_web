import type { ReactNode } from "react";
import { QueryProvider } from "@/components/dashboard/QueryProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

/**
 * Common shell for every `/dashboard` route (issue #10). Server Component — the
 * sidebar's active-link detection, the search input and React Query are the only
 * client boundaries, isolated in their own components.
 *
 * `QueryProvider` (issue #11) is scoped here rather than in the shared root
 * `app/layout.tsx` since `/rental-checklist` does not use React Query
 * (`.claude/handoffs/11-pm-breakdown.md` Assumption A2).
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-[260px]">
        <TopBar />
        <main className="flex-1 px-4 py-8 md:px-8">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </div>
    </div>
  );
}
