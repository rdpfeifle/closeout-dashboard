import { create } from "zustand";
import type { ActivityEntry, Project, PunchItem, PunchStatus, Priority } from "./types";

const ASSIGNEES = [
  { id: "u1", name: "Marco Alvarez", trade: "Drywall", initials: "MA" },
  { id: "u2", name: "Priya Shah", trade: "Paint", initials: "PS" },
  { id: "u3", name: "Devon Clarke", trade: "MEP", initials: "DC" },
  { id: "u4", name: "Hana Ito", trade: "Millwork", initials: "HI" },
  { id: "u5", name: "Luis Romero", trade: "Tile", initials: "LR" },
  { id: "u6", name: "Sam Whitford", trade: "GC", initials: "SW" },
  { id: "u7", name: "Aiyana Reed", trade: "Flooring", initials: "AR" },
];

// Allowed forward/back transitions per status. Used by UI + store guard.
export const NEXT_STATES: Record<PunchStatus, PunchStatus[]> = {
  open: ["in_progress"],
  in_progress: ["pending", "open"],
  pending: ["complete", "in_progress"],
  complete: ["reopened"],
  reopened: ["in_progress"],
};

export function canTransition(from: PunchStatus, to: PunchStatus) {
  return from === to || NEXT_STATES[from].includes(to);
}

interface CloseoutState {
  projects: Project[];
  items: PunchItem[];
  dbConnected: boolean | null;
  hydrated: boolean;
  // mutators
  setData: (projects: Project[], items: PunchItem[]) => void;
  setConnectionState: (connected: boolean) => void;
  setStatus: (ids: string[], status: PunchStatus, actor?: string) => Promise<void>;
  setAssignee: (ids: string[], assigneeId: string | null, actor?: string) => Promise<void>;
  setPriority: (ids: string[], priority: Priority, actor?: string) => Promise<void>;
  updateItem: (id: string, patch: Partial<PunchItem>, actor?: string, message?: string) => Promise<void>;
  addComment: (id: string, message: string, actor?: string) => Promise<void>;
  addItem: (item: Omit<PunchItem, "id" | "code" | "createdAt" | "activity">) => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt"> & { id?: string; createdAt?: number }) => string;
}

type DbPunchItem = {
  id: string;
  code?: string | null;
  projectId: string;
  description: string;
  location: string;
  trade?: string | null;
  priority: string;
  status: string;
  assignedTo?: string | null;
  photo?: string | null;
  createdAt: string | number | Date;
  dueAt?: string | number | Date | null;
  activity?: unknown;
};

function mapDbItemToUi(it: DbPunchItem): PunchItem {
  return {
    id: it.id,
    code: it.code ?? it.id,
    projectId: it.projectId,
    description: it.description,
    location: it.location,
    trade: it.trade ?? "General",
    priority: (["low", "med", "high", "crit"].includes(it.priority) ? it.priority : "med") as Priority,
    status: (["open", "in_progress", "pending", "complete", "reopened"].includes(it.status) ? it.status : "open") as PunchStatus,
    assigneeId: it.assignedTo ?? null,
    photo: it.photo ?? undefined,
    createdAt: new Date(it.createdAt).getTime(),
    dueAt: it.dueAt ? new Date(it.dueAt).getTime() : undefined,
    activity: (Array.isArray(it.activity) ? it.activity : []) as ActivityEntry[],
  };
}

export const useCloseout = create<CloseoutState>((set) => ({
  projects: [],
  items: [],
  dbConnected: null,
  hydrated: false,
  setData: (projects, items) => set({ projects, items, hydrated: true, dbConnected: true }),
  setConnectionState: (connected) => set({ dbConnected: connected, hydrated: true }),
  setStatus: async (ids, status, actor = "You") => {
    const updates = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, actor }),
        });
        if (!res.ok) return null;
        return mapDbItemToUi(await res.json());
      }),
    );
    const byId = new Map(updates.filter(Boolean).map((u) => [u!.id, u!]));
    set((s) => ({ items: s.items.map((it) => byId.get(it.id) ?? it) }));
  },
  setAssignee: async (ids, assigneeId, actor = "You") => {
    const updates = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedTo: assigneeId, actor }),
        });
        if (!res.ok) return null;
        return mapDbItemToUi(await res.json());
      }),
    );
    const byId = new Map(updates.filter(Boolean).map((u) => [u!.id, u!]));
    set((s) => ({ items: s.items.map((it) => byId.get(it.id) ?? it) }));
  },
  setPriority: async (ids, priority, actor = "You") => {
    const updates = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority, actor }),
        });
        if (!res.ok) return null;
        return mapDbItemToUi(await res.json());
      }),
    );
    const byId = new Map(updates.filter(Boolean).map((u) => [u!.id, u!]));
    set((s) => ({ items: s.items.map((it) => byId.get(it.id) ?? it) }));
  },
  updateItem: async (id, patch, actor = "You", message = "Updated item") => {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, actor, message }),
    });
    if (!res.ok) return;
    const updated = mapDbItemToUi(await res.json());
    set((s) => ({ items: s.items.map((it) => (it.id === id ? updated : it)) }));
  },
  addComment: async (id, message, actor = "You") => {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: message, actor }),
    });
    if (!res.ok) return;
    const updated = mapDbItemToUi(await res.json());
    set((s) => ({ items: s.items.map((it) => (it.id === id ? updated : it)) }));
  },
  addItem: async (item) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) return;
    const created = mapDbItemToUi(await res.json());
    set((s) => ({ items: [created, ...s.items] }));
  },
  addProject: (project) => {
    const id = project.id ?? crypto.randomUUID();
    const created: Project = { ...project, id, createdAt: project.createdAt ?? Date.now() };
    set((s) => ({ projects: [created, ...s.projects] }));
    return id;
  },
}));

export function getAssignee(id: string | null | undefined) {
  if (!id) return null;
  return ASSIGNEES.find((a) => a.id === id) ?? null;
}

export { ASSIGNEES };
