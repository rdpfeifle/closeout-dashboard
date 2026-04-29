import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, type Priority } from "@/lib/types";

const STYLES: Record<Priority, string> = {
  low: "border-priority-low/40 text-priority-low",
  med: "border-priority-med/50 text-[hsl(var(--priority-med))]",
  high: "border-priority-high/50 text-priority-high",
  crit: "border-priority-crit/60 text-priority-crit bg-priority-crit/10",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase",
        STYLES[priority],
        className,
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
