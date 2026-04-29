import { cn } from "@/lib/utils";
import type { Assignee } from "@/lib/types";

export function AssigneeChip({ a, className, compact }: { a: Assignee | null; className?: string; compact?: boolean }) {
  if (!a) {
    return <span className={cn("text-xs italic text-muted-foreground", className)}>Unassigned</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid h-6 w-6 place-items-center rounded-sm bg-secondary text-[10px] font-semibold tracking-wide text-foreground border border-border">
        {a.initials}
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-xs font-medium">{a.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.trade}</span>
        </span>
      )}
    </span>
  );
}
