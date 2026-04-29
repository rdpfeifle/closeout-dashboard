"use client";

import Link from "next/link";
import { ArrowUpRight, HardHat, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useCloseout } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { completionPct, countByStatus } from "@/lib/utils-format";
import type { Project } from "@/lib/types";
import { projectSlug } from "@/lib/project-slug";
import { useBootstrapDb } from "@/hooks/use-bootstrap-db";

type Sort = "name" | "completion" | "activity";

const IndexView = () => {
  const projects = useCloseout((s) => s.projects);
  const items = useCloseout((s) => s.items);
  const dbConnected = useCloseout((s) => s.dbConnected);
  const hydrated = useCloseout((s) => s.hydrated);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("activity");
  useBootstrapDb();

  const enriched = useMemo(() => {
    return projects.map((p) => {
      const list = items.filter((i) => i.projectId === p.id);
      const lastTs = list.reduce((m, i) => Math.max(m, i.activity[i.activity.length - 1]?.ts ?? 0), 0);
      return {
        project: p,
        items: list,
        pct: completionPct(list),
        counts: countByStatus(list),
        lastTs,
      };
    });
  }, [projects, items]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = enriched.filter((e) =>
      !ql || e.project.name.toLowerCase().includes(ql) || e.project.address.toLowerCase().includes(ql),
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name": return a.project.name.localeCompare(b.project.name);
        case "completion": return b.pct - a.pct;
        case "activity": return b.lastTs - a.lastTs;
      }
    });
    return list;
  }, [enriched, q, sort]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-sm bg-foreground text-background">
              <HardHat className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">Closeout</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Punch list field tool</div>
            </div>
          </div>
          <div className="ml-auto">
            <NewProjectDialog />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Active projects</h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono tabular">{projects.length}</span> projects ·{" "}
              <span className="font-mono tabular">{items.length}</span> total items tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects…"
                className="h-9 w-56 rounded-sm pl-8"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-9 w-[170px] rounded-sm text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Sort: Last activity</SelectItem>
                <SelectItem value="completion">Sort: Completion</SelectItem>
                <SelectItem value="name">Sort: Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!hydrated ? (
          <div className="mt-10 px-6 py-12 text-center text-sm text-muted-foreground">
            Connecting to database...
          </div>
        ) : dbConnected === false ? (
          <div className="mt-10 grid place-items-center border border-dashed border-status-open/40 bg-card px-6 py-16 text-center rounded-sm">
            <h2 className="text-base font-semibold">Database not connected</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Connect Prisma to Neon and redeploy to load live project data.
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-10 grid place-items-center border border-dashed border-border bg-card px-6 py-16 text-center rounded-sm">
            <HardHat className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="mt-3 text-base font-semibold">No projects yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Create your first project to start tracking punch list items in the field.
            </p>
            <div className="mt-4"><NewProjectDialog /></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 px-6 py-12 text-center text-sm text-muted-foreground">
            No projects match "{q}".
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ project, pct, counts, lastTs, items }) => (
              <ProjectCard key={project.id} project={project} pct={pct} counts={counts} lastTs={lastTs} total={items.length} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

function ProjectCard({
  project, pct, counts, lastTs, total,
}: {
  project: Project;
  pct: number;
  counts: ReturnType<typeof countByStatus>;
  lastTs: number;
  total: number;
}) {
  return (
    <Link
      href={`/project/${projectSlug(project.name)}`}
      className="group block border border-border bg-card p-4 transition-colors hover:border-foreground/40 rounded-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-base font-semibold leading-tight tracking-tight truncate">{project.name}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{project.address}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{project.gc}</div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" strokeWidth={1.5} />
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-semibold tabular leading-none">{pct}</span>
          <span className="font-mono text-sm text-muted-foreground">%</span>
          <span className="ml-2 text-[11px] uppercase tracking-wider text-muted-foreground">complete</span>
        </div>
        <span className="font-mono text-[11px] tabular text-muted-foreground">
          {counts.complete}/{total}
        </span>
      </div>
      <div className="mt-2 h-1 w-full bg-muted">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        <Stat label="Open" value={counts.open} dot="bg-status-open" />
        <Stat label="Prog" value={counts.in_progress} dot="bg-status-progress" />
        <Stat label="Pend" value={counts.pending} dot="bg-status-pending" />
        <Stat label="Done" value={counts.complete} dot="bg-status-complete" />
        <Stat label="Reop" value={counts.reopened} dot="bg-status-reopened" />
      </div>

      <div className="mt-3 border-t border-border pt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Last activity · {lastTs ? new Date(lastTs).toLocaleDateString() : "—"}
      </div>
    </Link>
  );
}

function Stat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="font-mono text-sm font-semibold tabular leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export default IndexView;
