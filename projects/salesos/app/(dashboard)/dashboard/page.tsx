import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, Trophy, Percent, AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  daysSince,
} from "@/lib/format";
import { STAGE_META, ACTIVITY_META } from "@/lib/deal-meta";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StageBadge } from "@/components/stage-badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { kpis, stageBreakdown, attention, recentActivities } =
    await getDashboardData(user);

  const firstName = user.name.split(" ")[0];
  const maxStageValue = Math.max(1, ...stageBreakdown.map((s) => s.value));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          user.role === "REP"
            ? "Here's where your pipeline stands today."
            : "Here's how the team's pipeline stands today."
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open pipeline"
          value={formatCompactCurrency(kpis.pipelineValue)}
          hint={`${kpis.openCount} open deals`}
          icon={DollarSign}
          accent="text-primary"
        />
        <StatCard
          label="Weighted forecast"
          value={formatCompactCurrency(kpis.weightedForecast)}
          hint="Probability-adjusted"
          icon={TrendingUp}
          accent="text-chart-5"
        />
        <StatCard
          label="Won this month"
          value={formatCompactCurrency(kpis.wonThisMonthValue)}
          hint={`${kpis.wonThisMonthCount} deals closed`}
          icon={Trophy}
          accent="text-success"
        />
        <StatCard
          label="Win rate"
          value={formatPercent(kpis.winRate)}
          hint="Closed won vs. lost"
          icon={Percent}
          accent="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pipeline by stage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline by stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stageBreakdown.map((s) => (
              <div key={s.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <StageBadge stage={s.stage} />
                  <span className="text-muted-foreground">
                    <span className="font-numeric text-foreground">
                      {formatCurrency(s.value)}
                    </span>{" "}
                    · {s.count}
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${STAGE_META[s.stage].dot}`}
                    style={{ width: `${(s.value / maxStageValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 && (
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            )}
            {recentActivities.map((a) => {
              const meta = ACTIVITY_META[a.type];
              const Icon = meta.icon;
              return (
                <div key={a.id} className="flex gap-3">
                  <span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="truncate">
                      <span className="font-medium">{meta.label}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {a.deal.title}
                      </span>
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {a.user.name} · {daysSince(a.createdAt)}d ago
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Needs attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="text-warning size-4" />
            Needs attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Open deals that have been sitting longest in their current stage.
          </p>
          <div className="divide-border divide-y">
            {attention.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {d.contact.company} · {d.rep.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {d.overdue && (
                    <span className="text-danger text-xs font-medium">
                      Overdue
                    </span>
                  )}
                  <span className="text-muted-foreground font-numeric text-xs">
                    {daysSince(d.stageEnteredAt)}d in stage
                  </span>
                  <StageBadge stage={d.stage} />
                  <span className="font-numeric w-20 text-right text-sm font-medium">
                    {formatCompactCurrency(d.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
