// Central presentation metadata for deals, stages, and activities.
// Class strings are written out in full so Tailwind can statically detect them.
import {
  Phone,
  Mail,
  Calendar,
  StickyNote,
  ArrowRightLeft,
  type LucideIcon,
} from "lucide-react";

export type DealStage =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export type DealType = "NEW" | "EXPANSION";

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "STAGE_CHANGE";

/** The four open stages, in pipeline order (used for the kanban columns). */
export const PIPELINE_STAGES: DealStage[] = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
];

/** Open stages = pipeline stages (a deal is "open" until it's closed). */
export const OPEN_STAGES: DealStage[] = PIPELINE_STAGES;

export const CLOSED_STAGES: DealStage[] = ["CLOSED_WON", "CLOSED_LOST"];

type StageMeta = {
  label: string;
  /** badge background + text */
  badge: string;
  /** small status dot */
  dot: string;
};

export const STAGE_META: Record<DealStage, StageMeta> = {
  LEAD: {
    label: "Lead",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  QUALIFIED: {
    label: "Qualified",
    badge: "bg-chart-5/10 text-chart-5",
    dot: "bg-chart-5",
  },
  PROPOSAL: {
    label: "Proposal",
    badge: "bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  NEGOTIATION: {
    label: "Negotiation",
    badge: "bg-primary/15 text-primary",
    dot: "bg-primary",
  },
  CLOSED_WON: {
    label: "Closed Won",
    badge: "bg-success/10 text-success",
    dot: "bg-success",
  },
  CLOSED_LOST: {
    label: "Closed Lost",
    badge: "bg-danger/10 text-danger",
    dot: "bg-danger",
  },
};

export const DEAL_TYPE_LABEL: Record<DealType, string> = {
  NEW: "New",
  EXPANSION: "Expansion",
};

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: LucideIcon }
> = {
  CALL: { label: "Call", icon: Phone },
  EMAIL: { label: "Email", icon: Mail },
  MEETING: { label: "Meeting", icon: Calendar },
  NOTE: { label: "Note", icon: StickyNote },
  STAGE_CHANGE: { label: "Stage change", icon: ArrowRightLeft },
};

/** Probability-weighted value of a deal (value × probability%). */
export function weightedValue(value: number, probability: number): number {
  return value * (probability / 100);
}
