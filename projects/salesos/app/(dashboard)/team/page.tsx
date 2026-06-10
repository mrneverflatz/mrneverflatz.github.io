import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTeamData } from "@/lib/queries";
import {
  formatCompactCurrency,
  formatPercent,
  initialsFromName,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  REP: "Rep",
};

export default async function TeamPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  // Team management is for managers and admins only.
  if (user.role === "REP") redirect("/dashboard");

  const members = await getTeamData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Reps, roles, and how each is tracking against pipeline."
      >
        <div className="text-muted-foreground text-sm">
          {members.filter((m) => m.active).length} active
        </div>
      </PageHeader>

      <div className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Open deals</TableHead>
              <TableHead className="text-right">Pipeline</TableHead>
              <TableHead className="text-right">Won</TableHead>
              <TableHead className="text-right">Win rate</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id} className={m.active ? "" : "opacity-55"}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
                        {m.avatarInitials ?? initialsFromName(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium">{m.name}</div>
                      <div className="font-numeric text-muted-foreground truncate text-xs">
                        {m.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={m.role === "ADMIN" ? "secondary" : "outline"}>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </Badge>
                </TableCell>
                <TableCell className="font-numeric text-right">
                  {m.openCount}
                </TableCell>
                <TableCell className="font-numeric text-right">
                  {formatCompactCurrency(m.pipelineValue)}
                </TableCell>
                <TableCell className="font-numeric text-success text-right">
                  {formatCompactCurrency(m.wonValue)}
                </TableCell>
                <TableCell className="font-numeric text-right">
                  {formatPercent(m.winRate)}
                </TableCell>
                <TableCell className="text-right">
                  {m.active ? (
                    <span className="text-success inline-flex items-center gap-1.5 text-xs">
                      <span className="bg-success size-1.5 rounded-full" />
                      Active
                    </span>
                  ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                      <span className="bg-muted-foreground size-1.5 rounded-full" />
                      Inactive
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
