import { Megaphone } from "lucide-react";
import { SearchInput } from "@/components/dashboard/SearchInput";

/**
 * Admin top bar (Figma node 2467:28490). Server Component — the only interactive
 * piece (search input) is isolated in {@link SearchInput}.
 *
 * Figma places the search box and the notification/account group with absolute
 * positioning against a fixed 1440px frame. This implementation uses a responsive
 * 3-column grid instead (empty spacer / search / actions) so the search box stays
 * visually centered without relying on a fixed viewport width, per repository layout
 * guidance (prefer grid/flex + min/max-width over fixed positioning).
 */
export function TopBar() {
  return (
    <header className="w-full border-b border-dashboard-border px-4 py-3 md:h-20 md:px-6 md:py-0">
      <div className="flex flex-col gap-3 md:grid md:h-full md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-0">
        <div className="order-2 flex justify-center md:order-none md:col-start-2">
          <SearchInput />
        </div>
        <div className="order-1 flex items-center justify-end gap-4 md:order-none md:col-start-3 md:gap-7">
          {/* Non-goal (#10): notification badge/count and click behavior are not implemented. */}
          <Megaphone
            className="h-5 w-5 shrink-0 text-dashboard-account-text"
            aria-hidden="true"
          />
          {/* Non-goal (#10): static placeholder text, no real account session. */}
          <div className="flex w-[110px] shrink-0 items-center gap-1 rounded-full border border-dashboard-border p-1">
            <span
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-r from-[#7366f2] to-[#d980bf]"
            />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium tracking-[-0.3px] text-dashboard-account-text">
              어드민어드민어드민
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
