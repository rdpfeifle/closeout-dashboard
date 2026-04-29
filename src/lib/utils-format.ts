import type { PunchStatus } from "./types";

export function ageInDays(ts: number): number {
  return Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function completionPct(items: { status: PunchStatus }[]): number {
  if (!items.length) return 0;
  const done = items.filter((i) => i.status === "complete").length;
  return Math.round((done / items.length) * 100);
}

export function countByStatus(items: { status: PunchStatus }[]) {
  const c = { open: 0, in_progress: 0, pending: 0, complete: 0, reopened: 0 } as Record<PunchStatus, number>;
  for (const i of items) c[i.status]++;
  return c;
}
