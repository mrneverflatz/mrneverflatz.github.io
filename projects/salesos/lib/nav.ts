import {
  LayoutDashboard,
  Columns3,
  Users,
  ChartColumn,
  Shield,
  Settings,
} from "lucide-react";
import type { Role } from "@/lib/session";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
  /** If set, only these roles see the group. */
  roles?: Role[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Sales",
    items: [
      { label: "Pipeline", href: "/pipeline", icon: Columns3 },
      { label: "Contacts", href: "/contacts", icon: Users },
    ],
  },
  {
    label: "Analytics",
    items: [{ label: "Reports", href: "/reports", icon: ChartColumn }],
  },
  {
    label: "Admin",
    roles: ["ADMIN", "MANAGER"],
    items: [
      { label: "Team", href: "/team", icon: Shield },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function navGroupsForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.filter((g) => !g.roles || g.roles.includes(role));
}

/** Best-match nav item for a pathname (for page titles / active state). */
export function activeItem(pathname: string): NavItem | undefined {
  const all = NAV_GROUPS.flatMap((g) => g.items);
  return all
    .filter(
      (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}
