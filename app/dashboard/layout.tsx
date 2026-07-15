import type { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

/**
 * Common shell for every `/dashboard` route (issue #10). Server Component — the
 * sidebar's active-link detection and the search input are the only client
 * boundaries, isolated in their own components.
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
        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
