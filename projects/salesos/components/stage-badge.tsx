import { cn } from "@/lib/utils";
import { STAGE_META, type DealStage } from "@/lib/deal-meta";

export function StageBadge({
  stage,
  className,
}: {
  stage: DealStage;
  className?: string;
}) {
  const meta = STAGE_META[stage];
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-medium",
        meta.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
