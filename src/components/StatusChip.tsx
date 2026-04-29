import { cn } from "@/lib/utils";
import { STATUS_LABEL, type PunchStatus } from "@/lib/types";

const STYLES: Record<PunchStatus, string> = {
  open: "bg-status-open/10 text-status-open border-status-open/30",
  in_progress: "bg-status-progress/10 text-status-progress border-status-progress/30",
  pending: "bg-status-pending/15 text-[hsl(var(--status-pending-fg))] border-status-pending/40",
  complete: "bg-status-complete/12 text-status-complete border-status-complete/30",
  reopened: "bg-status-reopened/10 text-status-reopened border-status-reopened/30",
};

const DOT: Record<PunchStatus, string> = {
  open: "bg-status-open",
  in_progress: "bg-status-progress",
  pending: "bg-status-pending",
  complete: "bg-status-complete",
  reopened: "bg-status-reopened",
};

export function StatusChip({ status, className, dotOnly }: { status: PunchStatus; className?: string; dotOnly?: boolean }) {
  if (dotOnly) {
    return <span className={cn("inline-block h-2 w-2 rounded-full", DOT[status], className)} />;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        STYLES[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
