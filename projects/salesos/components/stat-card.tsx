import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "text-muted-foreground",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  /** text color class for the icon, e.g. "text-success" */
  accent?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </div>
          <div className="font-numeric text-2xl font-semibold tracking-tight">
            {value}
          </div>
          {hint && <div className="text-muted-foreground text-xs">{hint}</div>}
        </div>
        {Icon && (
          <span
            className={cn(
              "bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-lg",
              accent,
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}
