import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { STATUS_LABEL, PRIORITY_LABEL, type PunchStatus, type Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ASSIGNEES } from "@/lib/store";
import { StatusChip } from "./StatusChip";

export type GroupBy = "none" | "location" | "assignee" | "priority" | "status";

export interface Filters {
  q: string;
  location: string; // "all" or value
  priority: Priority | "all";
  assignee: string; // "all" | "unassigned" | id
  statuses: PunchStatus[]; // empty = all
  groupBy: GroupBy;
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  location: "all",
  priority: "all",
  assignee: "all",
  statuses: [],
  groupBy: "none",
};

const STATUS_ORDER: PunchStatus[] = ["open", "in_progress", "pending", "complete", "reopened"];

export function FilterBar({
  filters,
  setFilters,
  locations,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  locations: string[];
}) {
  const update = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters({ ...filters, [k]: v });

  const toggleStatus = (s: PunchStatus) => {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : [...filters.statuses, s];
    update("statuses", next);
  };

  const Controls = (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <Selector label="Location" value={filters.location} onChange={(v) => update("location", v)}
        options={[{ value: "all", label: "All locations" }, ...locations.map((l) => ({ value: l, label: l }))]} />
      <Selector label="Priority" value={filters.priority} onChange={(v) => update("priority", v as Priority | "all")}
        options={[{ value: "all", label: "All priorities" }, ...(["crit", "high", "med", "low"] as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))]} />
      <Selector label="Assignee" value={filters.assignee} onChange={(v) => update("assignee", v)}
        options={[
          { value: "all", label: "All assignees" },
          { value: "unassigned", label: "Unassigned" },
          ...ASSIGNEES.map((a) => ({ value: a.id, label: a.name })),
        ]} />
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((s) => {
            const active = filters.statuses.length === 0 || filters.statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={cn(
                  "transition-opacity",
                  active ? "opacity-100" : "opacity-35 hover:opacity-70",
                )}
              >
                <StatusChip status={s} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Group by</label>
        <div className="inline-flex rounded-sm border border-border bg-background p-0.5">
          {(["none", "location", "assignee", "priority", "status"] as GroupBy[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => update("groupBy", g)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
                filters.groupBy === g ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center gap-2 px-3 py-2 sm:px-5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
            placeholder="Search code, description, location, assignee…"
            className="h-9 rounded-sm border-border bg-card pl-8 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden h-9 rounded-sm gap-1.5">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-md">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{Controls}</div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)} className="gap-1">
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)} className="hidden md:inline-flex gap-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>
      <div className="hidden md:block px-5 pb-3">{Controls}</div>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 rounded-sm border-border bg-card text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
