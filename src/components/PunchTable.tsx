import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ImageOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { PunchItem } from "@/lib/types";
import { STATUS_LABEL, PRIORITY_LABEL } from "@/lib/types";
import { ageInDays } from "@/lib/utils-format";
import { getAssignee } from "@/lib/store";
import { StatusChip } from "./StatusChip";
import { PriorityBadge } from "./PriorityBadge";
import { AssigneeChip } from "./AssigneeChip";
import type { GroupBy } from "./FilterBar";

interface Props {
  items: PunchItem[];
  groupBy: GroupBy;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  onOpen: (id: string) => void;
}

function groupKey(item: PunchItem, by: GroupBy): string {
  switch (by) {
    case "location": return item.location;
    case "assignee": return getAssignee(item.assigneeId)?.name ?? "Unassigned";
    case "priority": return PRIORITY_LABEL[item.priority];
    case "status": return STATUS_LABEL[item.status];
    default: return "All items";
  }
}

export function PunchTable({ items, groupBy, selected, onToggleSelect, onToggleAll, onOpen }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, PunchItem[]>();
    for (const it of items) {
      const k = groupKey(it, groupBy);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return Array.from(map.entries());
  }, [items, groupBy]);

  if (!items.length) {
    return (
      <div className="px-5 py-16 text-center text-sm text-muted-foreground">
        No punch items match these filters.
      </div>
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[920px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-[80px]" />
            <col className="w-[64px]" />
            <col />
            <col className="w-[160px]" />
            <col className="w-[80px]" />
            <col className="w-[170px]" />
            <col className="w-[150px]" />
            <col className="w-[60px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-card text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <th className="px-3 py-2 text-left">
                <Checkbox
                  checked={items.every((i) => selected.has(i.id)) && items.length > 0}
                  onCheckedChange={() => onToggleAll(items.map((i) => i.id))}
                />
              </th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Photo</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-left">Priority</th>
              <th className="px-3 py-2 text-left">Assignee</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Age</th>
            </tr>
          </thead>
          {groups.map(([name, list]) => (
            <Group key={name} name={name} list={list} groupBy={groupBy}>
              {list.map((it) => (
                <Row key={it.id} item={it} selected={selected.has(it.id)} onToggle={() => onToggleSelect(it.id)} onOpen={() => onOpen(it.id)} />
              ))}
            </Group>
          ))}
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {groups.map(([name, list]) => (
          <div key={name}>
            {groupBy !== "none" && (
              <div className="flex items-center justify-between bg-secondary/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-foreground">
                <span>{name}</span>
                <span className="font-mono text-muted-foreground">{list.length}</span>
              </div>
            )}
            {list.map((it) => (
              <MobileCard key={it.id} item={it} selected={selected.has(it.id)} onToggle={() => onToggleSelect(it.id)} onOpen={() => onOpen(it.id)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Group({ name, list, groupBy, children }: { name: string; list: PunchItem[]; groupBy: GroupBy; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  if (groupBy === "none") return <tbody>{children}</tbody>;
  return (
    <tbody>
      <tr className="bg-secondary/60">
        <td colSpan={9} className="p-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-widest hover:bg-secondary"
          >
            <span className="flex items-center gap-2">
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {name}
            </span>
            <span className="font-mono text-muted-foreground">{list.length}</span>
          </button>
        </td>
      </tr>
      {open && children}
    </tbody>
  );
}

function Row({ item, selected, onToggle, onOpen }: { item: PunchItem; selected: boolean; onToggle: () => void; onOpen: () => void }) {
  const a = getAssignee(item.assigneeId);
  return (
    <tr
      className={cn(
        "border-b border-border align-middle transition-colors hover:bg-secondary/50 cursor-pointer",
        selected && "bg-accent/5",
      )}
      onClick={onOpen}
    >
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </td>
      <td className="px-3 py-2.5 font-mono text-[12px] font-semibold tabular">{item.code}</td>
      <td className="px-3 py-2.5"><Thumb src={item.photo} alt={item.description} /></td>
      <td className="px-3 py-2.5 text-foreground">
        <div className="line-clamp-2 leading-snug">{item.description}</div>
      </td>
      <td className="px-3 py-2.5">
        <div className="truncate text-xs uppercase tracking-wider text-muted-foreground">{item.location}</div>
      </td>
      <td className="px-3 py-2.5"><PriorityBadge priority={item.priority} /></td>
      <td className="px-3 py-2.5"><AssigneeChip a={a} /></td>
      <td className="px-3 py-2.5"><StatusChip status={item.status} /></td>
      <td className="px-3 py-2.5 text-right font-mono text-xs tabular text-muted-foreground">{ageInDays(item.createdAt)}d</td>
    </tr>
  );
}

function MobileCard({ item, selected, onToggle, onOpen }: { item: PunchItem; selected: boolean; onToggle: () => void; onOpen: () => void }) {
  const a = getAssignee(item.assigneeId);
  return (
    <div className={cn("flex gap-3 px-4 py-3 cursor-pointer active:bg-secondary/60", selected && "bg-accent/5")} onClick={onOpen}>
      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </div>
      <Thumb src={item.photo} alt={item.description} className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold tabular">{item.code}</span>
          <PriorityBadge priority={item.priority} />
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">{ageInDays(item.createdAt)}d</span>
        </div>
        <div className="mt-1 line-clamp-2 text-sm text-foreground">{item.description}</div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">{item.location}</span>
          <StatusChip status={item.status} />
        </div>
        <div className="mt-2"><AssigneeChip a={a} /></div>
      </div>
    </div>
  );
}

function Thumb({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={cn("grid h-12 w-12 place-items-center rounded-sm border border-border bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-4 w-4" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("h-12 w-12 rounded-sm border border-border object-cover", className)}
    />
  );
}
