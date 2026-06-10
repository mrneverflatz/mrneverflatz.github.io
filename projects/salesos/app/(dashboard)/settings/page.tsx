import { redirect } from "next/navigation";
import { Database, Shield, Server } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initialsFromName, formatCompactNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  REP: "Rep",
};

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "REP") redirect("/dashboard");

  const [users, contacts, deals, activities] = await Promise.all([
    prisma.user.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.activity.count(),
  ]);

  const stats = [
    { label: "Users", value: users },
    { label: "Contacts", value: contacts },
    { label: "Deals", value: deals },
    { label: "Activities", value: activities },
  ];

  const about = [
    { icon: Server, label: "Environment", value: process.env.NODE_ENV },
    { icon: Database, label: "Database", value: "Supabase Postgres" },
    { icon: Shield, label: "Auth", value: "JWT session (7-day)" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile and workspace configuration."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary/15 text-primary font-medium">
                  {user.avatarInitials ?? initialsFromName(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium">{user.name}</div>
                <div className="font-numeric text-muted-foreground truncate text-xs">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">
                {ROLE_LABEL[user.role] ?? user.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {about.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Icon className="size-4" />
                    {row.label}
                  </span>
                  <span className="font-medium">{row.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Data summary */}
      <Card>
        <CardHeader>
          <CardTitle>Seeded data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-numeric text-2xl font-semibold">
                  {formatCompactNumber(s.value)}
                </div>
                <div className="text-muted-foreground text-xs">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            This is a portfolio demo running on seeded data. Re-run{" "}
            <span className="font-numeric">npm run db:seed</span> to reset it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
