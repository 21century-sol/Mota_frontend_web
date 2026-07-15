"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV_ITEMS,
  SETTINGS_NAV_ITEM,
  isNavItemActive,
  type NavItem,
} from "@/lib/dashboard/nav";

type SidebarLinkProps = {
  item: NavItem;
  active: boolean;
  /** Text color for the inactive state. Settings uses a darker gray than the other links (Figma). */
  inactiveTextClassName?: string;
};

function SidebarLink({
  item,
  active,
  inactiveTextClassName = "text-dashboard-nav-inactive",
}: SidebarLinkProps) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center gap-3 whitespace-nowrap px-5 py-4 text-base font-medium tracking-[-0.4px] outline-none",
          "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-sidebar",
          active
            ? "rounded-full bg-dashboard-nav-active text-white"
            : `rounded-dashboard-nav ${inactiveTextClassName}`,
        ].join(" ")}
      >
        <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

/**
 * Admin sidebar navigation (Figma node 2483:30897).
 *
 * Client Component boundary is required for `usePathname()` (active link detection).
 * No mobile design frame exists in Figma (Decision Required, resolved as a Safe
 * Assumption): below `md` the sidebar reflows from a fixed 260px column into a
 * horizontally scrollable top bar instead of an off-canvas drawer, so no extra
 * open/close state is needed and every link stays reachable by keyboard/scroll.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 bg-dashboard-sidebar md:fixed md:inset-y-0 md:left-0 md:flex md:h-screen md:w-[260px] md:flex-col md:overflow-y-auto">
      <div className="flex h-20 items-center gap-2 pl-6">
        {/*
          TODO(#10): Figma MCP asset export for the MOTA logo symbol (node 2552:27626)
          was unavailable in this session (no Figma MCP tool access granted to this
          agent run). This single-letter mark is a clearly temporary stand-in; replace
          with the exported SVG under /public/assets/dashboard/ and remove this comment
          once the asset is available.
        */}
        <span
          aria-hidden="true"
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white"
        >
          M
        </span>
        {/* TODO(#10): Figma MCP asset export for the MOTA wordmark (node 2483:30903) was unavailable; swap this text for the real SVG once exported. */}
        <span className="text-base font-semibold tracking-tight text-white">
          MOTA
        </span>
      </div>

      <nav
        aria-label="관리자 메뉴"
        className="md:flex md:flex-1 md:flex-col md:justify-between"
      >
        <ul className="flex flex-row flex-wrap gap-2 overflow-x-auto px-3 pb-2 md:flex-col md:overflow-visible md:pb-0">
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isNavItemActive(pathname, item.href)}
            />
          ))}
        </ul>
        <ul className="flex flex-row px-3 pb-4 md:flex-col">
          <SidebarLink
            item={SETTINGS_NAV_ITEM}
            active={isNavItemActive(pathname, SETTINGS_NAV_ITEM.href)}
            inactiveTextClassName="text-dashboard-nav-muted"
          />
        </ul>
      </nav>
    </aside>
  );
}
