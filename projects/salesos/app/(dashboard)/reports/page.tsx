import { redirect } from "next/navigation";
import { format } from "date-fns";
import { DollarSign, Sparkles, TrendingUp, Percent } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getReportsData } from "@/lib/queries";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ReportsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { snapshots, totals } = await getReportsData();
  const maxBar = Math.max(
    1,
    ...snapshots.map((s) => Math.max(s.revenue, s.forecastedRevenue)),
  );
  const mixTotal = Math.max(1, totals.newBusiness + totals.expansion);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Company-wide revenue performance over the last 12 months."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatCompactCurrency(totals.revenue)}
          hint="Closed-won, trailing 12mo"
          icon={DollarSign}
          accent="text-success"
        />
        <StatCard
          label="New business"
          value={formatCompactCurrency(totals.newBusiness)}
          hint={formatPercent(totals.newBusiness / (totals.revenue || 1))}
          icon={Sparkles}
          accent="text-primary"
        />
        <StatCard
          label="Expansion"
          value={formatCompactCurrency(totals.expansion)}
          hint={formatPercent(totals.expansion / (totals.revenue || 1))}
          icon={TrendingUp}
          accent="text-chart-5"
        />
        <StatCard
          label="Win rate"
          value={formatPercent(totals.winRate)}
          hint={`${totals.wonDeals} won · ${totals.lostDeals} lost`}
          icon={Percent}
          accent="text-warning"
        />
      </div>

      {/* Revenue vs forecast trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs. forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 sm:gap-3" style={{ height: 180 }}>
            {snapshots.map((s) => {
              const date = new Date(s.year, s.month - 1, 1);
              return (
                <div
                  key={s.id}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <div className="flex h-full w-full items-end justify-center gap-0.5">
                    <div
                      className="bg-primary w-2.5 rounded-t-sm sm:w-3"
                      style={{ height: `${(s.revenue / maxBar) * 100}%` }}
                      title={`Revenue: ${formatCurrency(s.revenue)}`}
                    />
                    <div
                      className="bg-muted-foreground/40 w-2.5 rounded-t-sm sm:w-3"
                      style={{
                        height: `${(s.forecastedRevenue / maxBar) * 100}%`,
                      }}
                      title={`Forecast: ${formatCurrency(s.forecastedRevenue)}`}
                    />
                  </div>
                  <span className="text-muted-foreground text-[10px]">
                    {format(date, "MMM")}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="bg-primary size-2.5 rounded-sm" /> Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-muted-foreground/40 size-2.5 rounded-sm" />{" "}
              Forecast
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue mix */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue mix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full"
              style={{ width: `${(totals.newBusiness / mixTotal) * 100}%` }}
            />
            <div
              className="bg-chart-5 h-full"
              style={{ width: `${(totals.expansion / mixTotal) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <span className="bg-primary size-2.5 rounded-sm" /> New business
              <span className="font-numeric text-muted-foreground">
                {formatCompactCurrency(totals.newBusiness)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-numeric text-muted-foreground">
                {formatCompactCurrency(totals.expansion)}
              </span>{" "}
              Expansion
              <span className="bg-chart-5 size-2.5 rounded-sm" />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly detail */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly detail</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Forecast</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Expansion</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Lost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...snapshots].reverse().map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {format(new Date(s.year, s.month - 1, 1), "MMM yyyy")}
                  </TableCell>
                  <TableCell className="font-numeric text-right">
                    {formatCurrency(s.revenue)}
                  </TableCell>
                  <TableCell className="font-numeric text-muted-foreground text-right">
                    {formatCurrency(s.forecastedRevenue)}
                  </TableCell>
                  <TableCell className="font-numeric text-right">
                    {formatCompactCurrency(s.newBusiness)}
                  </TableCell>
                  <TableCell className="font-numeric text-right">
                    {formatCompactCurrency(s.expansion)}
                  </TableCell>
                  <TableCell className="font-numeric text-success text-right">
                    {s.wonDeals}
                  </TableCell>
                  <TableCell className="font-numeric text-danger text-right">
                    {s.lostDeals}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
