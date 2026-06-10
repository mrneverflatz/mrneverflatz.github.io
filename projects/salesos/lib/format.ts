import { differenceInCalendarDays, format } from "date-fns";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** $12,500 */
export function formatCurrency(value: number): string {
  return usd.format(value);
}

/** $12.5K, $1.2M */
export function formatCompactCurrency(value: number): string {
  return compactUsd.format(value);
}

/** 12.5K, 1.2M */
export function formatCompactNumber(value: number): string {
  return compact.format(value);
}

/** 42% — `value` is a 0–1 ratio unless `alreadyPercent` is set. */
export function formatPercent(value: number, alreadyPercent = false): string {
  const pct = alreadyPercent ? value : value * 100;
  return `${Math.round(pct)}%`;
}

/** Jun 5, 2026 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

/** Jun 2026 */
export function formatMonth(date: Date | string): string {
  return format(new Date(date), "MMM yyyy");
}

/** Whole calendar days between `from` and now (or `to`). */
export function daysSince(from: Date | string, to: Date | string = new Date()): number {
  return Math.max(0, differenceInCalendarDays(new Date(to), new Date(from)));
}

/** "JD" from "Jane Doe" — first letters of the first two words. */
export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
