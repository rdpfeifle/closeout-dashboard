import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSIGNEES, useCloseout, NEXT_STATES } from "@/lib/store";
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type PunchStatus } from "@/lib/types";

export function BulkActionBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const setStatus = useCloseout((s) => s.setStatus);
  const setAssignee = useCloseout((s) => s.setAssignee);
  const setPriority = useCloseout((s) => s.setPriority);
  const items = useCloseout((s) => s.items);
  if (!ids.length) return null;

  // Only show statuses that are valid next-transitions for EVERY selected item.
  const selectedItems = items.filter((i) => ids.includes(i.id));
  const allStatuses: PunchStatus[] = ["open", "in_progress", "pending", "complete", "reopened"];
  const allowedStatuses = allStatuses.filter((s) =>
    selectedItems.every((it) => {
      if (!NEXT_STATES[it.status].includes(s)) return false;
      if (s === "pending" && !it.photo) return false;
      return true;
    }),
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-t-accent bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 animate-fade-in">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="font-mono text-sm font-semibold tabular">
          {ids.length} <span className="text-muted-foreground font-sans font-normal text-xs uppercase tracking-wider">selected</span>
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select onValueChange={(v) => setAssignee(ids, v === "unassigned" ? null : v)}>
            <SelectTrigger className="h-8 w-[150px] rounded-sm text-xs">
              <SelectValue placeholder="Reassign…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {ASSIGNEES.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setStatus(ids, v as PunchStatus)} disabled={allowedStatuses.length === 0}>
            <SelectTrigger className="h-8 w-[170px] rounded-sm text-xs">
              <SelectValue placeholder={allowedStatuses.length === 0 ? "No common transition" : "Change status…"} />
            </SelectTrigger>
            <SelectContent>
              {allowedStatuses.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(v) => setPriority(ids, v as Priority)}>
            <SelectTrigger className="h-8 w-[130px] rounded-sm text-xs">
              <SelectValue placeholder="Priority…" />
            </SelectTrigger>
            <SelectContent>
              {(["low", "med", "high", "crit"] as Priority[]).map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={onClear} className="h-8 gap-1 rounded-sm">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
