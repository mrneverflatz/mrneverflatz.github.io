import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPipelineData } from "@/lib/queries";
import { STAGE_META, DEAL_TYPE_LABEL } from "@/lib/deal-meta";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  daysSince,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export default async function PipelinePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { columns, totalValue, totalCount } = await getPipelineData(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description={
          user.role === "REP"
            ? "Your open deals, by stage."
            : "All open deals across the team, by stage."
        }
      >
        <div className="text-right">
          <div className="font-numeric text-lg font-semibold">
            {formatCompactCurrency(totalValue)}
          </div>
          <div className="text-muted-foreground text-xs">
            {totalCount} open deals
          </div>
        </div>
      </PageHeader>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div key={col.stage} className="flex w-80 shrink-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${STAGE_META[col.stage].dot}`}
                />
                <span className="text-sm font-medium">
                  {STAGE_META[col.stage].label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {col.count}
                </span>
              </div>
              <span className="text-muted-foreground font-numeric text-xs">
                {formatCompactCurrency(col.value)}
              </span>
            </div>

            <div className="space-y-2">
              {col.deals.length === 0 && (
                <div className="border-border text-muted-foreground rounded-lg border border-dashed py-8 text-center text-xs">
                  No deals
                </div>
              )}
              {col.deals.map((d) => (
                <div
                  key={d.id}
                  className="bg-card ring-foreground/10 hover:ring-foreground/20 rounded-lg p-3 ring-1 transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{d.title}</p>
                    {d.dealType === "EXPANSION" && (
                      <span className="bg-chart-5/10 text-chart-5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                        {DEAL_TYPE_LABEL.EXPANSION}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {d.contact.company}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-numeric text-sm font-semibold">
                      {formatCurrency(d.value)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatPercent(d.probability, true)}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
                    <span className="truncate">
                      {d.rep.avatarInitials ?? d.rep.name}
                    </span>
                    <span className="font-numeric">
                      {daysSince(d.stageEnteredAt)}d in stage
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
