import { Calendar, Folder, Home, MessageSquare, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Primary sidebar navigation items (Figma "Sidebar Links" wrapper, node 2483:30897).
 * Order matches the confirmed Figma link order: Dashboard, Vehicle Management,
 * Reservation History, Customer Inquiry. "설정" is tracked separately in
 * {@link SETTINGS_NAV_ITEM} because Figma visually pins it near the bottom of the
 * sidebar, but it shares the same link/active-state rendering.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: Home },
  { href: "/dashboard/vehicles", label: "차량 관리", icon: Folder },
  { href: "/dashboard/reservations", label: "대여 현황", icon: Calendar },
  { href: "/dashboard/inquiries", label: "고객 문의", icon: MessageSquare },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  href: "/dashboard/settings",
  label: "설정",
  icon: Settings,
};

/**
 * Determines whether a sidebar link represents the current route.
 *
 * `/dashboard` is matched exactly only — otherwise it would stay highlighted while
 * visiting every nested route (e.g. `/dashboard/vehicles`). Every other item matches
 * its own path and any of its sub-routes (e.g. `/dashboard/vehicles/123`), but not an
 * unrelated sibling path that merely shares a string prefix
 * (e.g. `/dashboard/vehicles-archive` must not match `/dashboard/vehicles`).
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
