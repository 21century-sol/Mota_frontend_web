"use client";

import Image from "next/image";
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
        <Icon
          className={[
            "h-6 w-6 shrink-0",
            active ? "text-dashboard-nav-active-icon" : "",
          ].join(" ")}
          aria-hidden="true"
        />
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
      {/*
        Logo mark + wordmark (Figma file nt8U8I48Rcfz8LGNqYvRZv, node 1:12191,
        verified 2026-07-18, issue #40). The app icon's #5A46FA background is
        baked into the SVG itself; the prior placeholder's "#5a55f2 confirmed
        via issue #38" comment referred to the unrelated `dashboard-chart-accent`
        token, not this logo, and is superseded by this asset.
      */}
      <div className="flex h-20 items-center gap-2 pl-6">
        <Image
          src="/assets/dashboard/mota-app-icon.svg"
          alt=""
          width={30}
          height={30}
          unoptimized
        />
        <Image
          src="/assets/dashboard/mota-wordmark.svg"
          alt="MOTA"
          width={67}
          height={16}
          unoptimized
        />
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
