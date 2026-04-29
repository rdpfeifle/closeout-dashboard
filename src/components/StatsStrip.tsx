import { cn } from "@/lib/utils";
import { STATUS_LABEL, type PunchStatus } from "@/lib/types";
import { completionPct } from "@/lib/utils-format";

const ORDER: PunchStatus[] = ["open", "in_progress", "pending", "complete", "reopened"];

const BORDER: Record<PunchStatus, string> = {
  open: "border-l-status-open",
  in_progress: "border-l-status-progress",
  pending: "border-l-status-pending",
  complete: "border-l-status-complete",
  reopened: "border-l-status-reopened",
};

const TINT: Record<PunchStatus, string> = {
  open: "bg-status-open/10",
  in_progress: "bg-status-progress/10",
  pending: "bg-status-pending/10",
  complete: "bg-status-complete/10",
  reopened: "bg-status-reopened/10",
};

export function StatsStrip({ counts, items }: { counts: Record<PunchStatus, number>; items: { status: PunchStatus }[] }) {
  const pct = completionPct(items);
  const total = items.length;

  return (
    <div className="border-y border-border bg-card">
      <div className="flex items-stretch overflow-x-auto no-scrollbar lg:justify-center lg:overflow-visible">
        <div className="flex shrink-0 flex-col justify-center border-r border-border px-4 py-3 sm:px-5">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Completion</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tabular leading-none">{pct}</span>
            <span className="font-mono text-base text-muted-foreground">%</span>
          </div>
          <div className="mt-2 h-1 w-32 bg-muted">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground tabular">
            {counts.complete} / {total} items
          </div>
        </div>
        {ORDER.map((s) => (
          <div
            key={s}
            className={cn(
              "flex shrink-0 flex-col justify-center border-l-2 border-r border-border px-4 py-3 sm:px-5 min-w-[120px]",
              BORDER[s],
              TINT[s],
            )}
          >
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {STATUS_LABEL[s]}
            </div>
            <div className="mt-1 font-mono text-3xl font-semibold tabular leading-none">{counts[s]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
