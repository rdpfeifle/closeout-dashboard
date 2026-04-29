"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, HardHat } from "lucide-react";
import { useCloseout } from "@/lib/store";
import { StatsStrip } from "@/components/StatsStrip";
import { FilterBar, EMPTY_FILTERS, type Filters } from "@/components/FilterBar";
import { PunchTable } from "@/components/PunchTable";
import { ItemDrawer } from "@/components/ItemDrawer";
import { BulkActionBar } from "@/components/BulkActionBar";
import { completionPct, countByStatus } from "@/lib/utils-format";
import { getAssignee } from "@/lib/store";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/types";
import { projectSlug } from "@/lib/project-slug";
import { Button } from "@/components/ui/button";
import { useBootstrapDb } from "@/hooks/use-bootstrap-db";
import { NewPunchItemDialog } from "@/components/NewPunchItemDialog";

const ProjectDetailView = () => {
  useBootstrapDb();
  const routeParams = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const routeId = routeParams?.id;
  const routeKey = routeId ? (Array.isArray(routeId) ? routeId[0] : routeId) : "";
  const projects = useCloseout((s) => s.projects);
  const dbConnected = useCloseout((s) => s.dbConnected);
  const hydrated = useCloseout((s) => s.hydrated);
  // Support both slug URLs and legacy id URLs.
  const project = projects.find((p) => p.id === routeKey || projectSlug(p.name) === routeKey);
  const projectKey = project ? projectSlug(project.name) : routeKey;
  const currentPath = pathname ?? (projectKey ? `/project/${projectKey}` : "/project");
  const allItemsRaw = useCloseout((s) => s.items);
  const allItems = useMemo(
    () => allItemsRaw.filter((i) => i.projectId === project?.id),
    [allItemsRaw, project?.id],
  );

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const locations = useMemo(
    () => Array.from(new Set(allItems.map((i) => i.location))).sort(),
    [allItems],
  );

  const filtered = useMemo(() => {
    const ql = filters.q.trim().toLowerCase();
    return allItems.filter((it) => {
      if (ql) {
        const assigneeName = getAssignee(it.assigneeId)?.name.toLowerCase() ?? "unassigned";
        const haystack = [
          it.code,
          it.description,
          it.location,
          it.trade,
          assigneeName,
        ].join(" ").toLowerCase();
        if (!haystack.includes(ql)) return false;
      }
      if (filters.location !== "all" && it.location !== filters.location) return false;
      if (filters.priority !== "all" && it.priority !== filters.priority) return false;
      if (filters.assignee !== "all") {
        if (filters.assignee === "unassigned" && it.assigneeId) return false;
        if (filters.assignee !== "unassigned" && it.assigneeId !== filters.assignee) return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(it.status)) return false;
      return true;
    });
  }, [allItems, filters]);

  const counts = useMemo(() => countByStatus(allItems), [allItems]);
  const pct = completionPct(allItems);
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (filters.q.trim()) {
      chips.push({
        key: "q",
        label: `Search: ${filters.q.trim()}`,
        clear: () => setFilters({ ...filters, q: "" }),
      });
    }
    if (filters.location !== "all") {
      chips.push({
        key: "location",
        label: `Location: ${filters.location}`,
        clear: () => setFilters({ ...filters, location: "all" }),
      });
    }
    if (filters.priority !== "all") {
      chips.push({
        key: "priority",
        label: `Priority: ${PRIORITY_LABEL[filters.priority]}`,
        clear: () => setFilters({ ...filters, priority: "all" }),
      });
    }
    if (filters.assignee !== "all") {
      const assigneeLabel =
        filters.assignee === "unassigned"
          ? "Unassigned"
          : getAssignee(filters.assignee)?.name ?? "Unknown";
      chips.push({
        key: "assignee",
        label: `Assignee: ${assigneeLabel}`,
        clear: () => setFilters({ ...filters, assignee: "all" }),
      });
    }
    filters.statuses.forEach((status) => {
      chips.push({
        key: `status-${status}`,
        label: `Status: ${STATUS_LABEL[status]}`,
        clear: () =>
          setFilters({
            ...filters,
            statuses: filters.statuses.filter((s) => s !== status),
          }),
      });
    });
    return chips;
  }, [filters, setFilters]);

  const openId = params?.get("item");
  const openItem = openId ? allItems.find((i) => i.id === openId) ?? null : null;

  const onOpen = (idStr: string) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    next.set("item", idStr);
    const qs = next.toString();
    router.replace(qs ? `${currentPath}?${qs}` : currentPath, { scroll: false });
  };
  const onCloseDrawer = () => {
    const next = new URLSearchParams(params?.toString() ?? "");
    next.delete("item");
    const qs = next.toString();
    router.replace(qs ? `${currentPath}?${qs}` : currentPath, { scroll: false });
  };

  const toggleSelect = (idStr: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  const toggleAll = (ids: string[]) =>
    setSelected((s) => {
      const allHere = ids.every((i) => s.has(i));
      const next = new Set(s);
      if (allHere) ids.forEach((i) => next.delete(i));
      else ids.forEach((i) => next.add(i));
      return next;
    });

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="text-sm text-muted-foreground">Connecting to database...</div>
      </div>
    );
  }

  if (dbConnected === false) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">Database not connected</h1>
          <p className="mt-1 text-sm text-muted-foreground">This view only loads live data from Neon/Prisma.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">Project not found</h1>
          <Link href="/" className="mt-2 inline-block text-sm text-accent underline">Back to projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="grid h-9 w-9 place-items-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <div className="hidden sm:grid h-9 w-9 place-items-center rounded-sm bg-foreground text-background">
            <HardHat className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold tracking-tight sm:text-lg">{project.name}</div>
            <div className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">
              {project.gc} · {project.address}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold tabular leading-none">{pct}<span className="text-sm text-muted-foreground">%</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Complete</div>
          </div>
          <NewPunchItemDialog projectId={project.id} />
        </div>
      </header>

      <StatsStrip counts={counts} items={allItems} />
      <div className="mx-auto max-w-7xl">
        <FilterBar filters={filters} setFilters={setFilters} locations={locations} />
        <div className="bg-background">
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2">
              {activeFilterChips.map((chip) => (
                <Button
                  key={chip.key}
                  size="sm"
                  variant="outline"
                  onClick={chip.clear}
                  className="h-7 rounded-sm px-2 text-xs"
                >
                  {chip.label} ×
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="h-7 rounded-sm px-2 text-xs text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <span>
              Showing <span className="font-mono tabular">{filtered.length}</span> of{" "}
              <span className="font-mono tabular">{allItems.length}</span> items
            </span>
            {selected.size > 0 && (
              <span className="font-mono tabular text-foreground">{selected.size} selected</span>
            )}
          </div>
          {allItems.length === 0 ? (
            <div className="grid place-items-center px-6 py-20 text-center">
              <h2 className="text-base font-semibold">No items on this project yet</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Punch items added in the field will appear here. Use the project list above to start logging defects.
              </p>
            </div>
          ) : (
            <PunchTable
              items={filtered}
              groupBy={filters.groupBy}
              selected={selected}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAll}
              onOpen={onOpen}
            />
          )}
        </div>
      </div>

      <ItemDrawer item={openItem} onClose={onCloseDrawer} />
      <BulkActionBar ids={Array.from(selected)} onClear={() => setSelected(new Set())} />
    </div>
  );
};

export default ProjectDetailView;
