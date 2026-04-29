import { MapPin, User, Flag } from "lucide-react";
import type { ReactNode } from "react";
import { PRIORITY_LABEL, type Priority } from "@/lib/types";

type BreakdownEntry = {
  label: string;
  count: number;
};

type Props = {
  byLocation: BreakdownEntry[];
  byPriority: Record<Priority, number>;
  byAssignee: BreakdownEntry[];
};

const PRIORITY_ORDER: Priority[] = ["crit", "high", "med", "low"];

export function BreakdownStrip({ byLocation, byPriority, byAssignee }: Props) {
  return (
    <div className="border-b border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:grid-cols-3">
        <BreakdownCard
          title="By location"
          icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />}
          entries={byLocation}
          emptyLabel="No location data"
        />
        <BreakdownCard
          title="By priority"
          icon={<Flag className="h-3.5 w-3.5" strokeWidth={1.5} />}
          entries={PRIORITY_ORDER.map((priority) => ({
            label: PRIORITY_LABEL[priority],
            count: byPriority[priority] ?? 0,
          }))}
          emptyLabel="No priority data"
        />
        <BreakdownCard
          title="By assignee"
          icon={<User className="h-3.5 w-3.5" strokeWidth={1.5} />}
          entries={byAssignee}
          emptyLabel="No assignee data"
        />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  icon,
  entries,
  emptyLabel,
}: {
  title: string;
  icon: ReactNode;
  entries: BreakdownEntry[];
  emptyLabel: string;
}) {
  const visible = entries.slice(0, 5);
  return (
    <section className="rounded-sm border border-border bg-background/70 p-3">
      <header className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </header>
      {visible.length === 0 ? (
        <div className="text-xs text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((entry) => (
            <li key={entry.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{entry.label}</span>
              <span className="font-mono tabular text-muted-foreground">{entry.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
