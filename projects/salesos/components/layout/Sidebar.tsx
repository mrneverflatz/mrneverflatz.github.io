import { SidebarNav } from "./SidebarNav";
import type { Role } from "@/lib/session";

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="border-sidebar-border bg-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r lg:flex">
      <SidebarNav role={role} />
    </aside>
  );
}
