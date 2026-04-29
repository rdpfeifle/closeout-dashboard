export type PunchStatus = "open" | "in_progress" | "pending" | "complete" | "reopened";
export type Priority = "low" | "med" | "high" | "crit";

export interface Assignee {
  id: string;
  name: string;
  trade: string;
  initials: string;
}

export interface ActivityEntry {
  id: string;
  ts: number;
  actor: string;
  type: "status" | "assign" | "comment" | "edit" | "create";
  message: string;
  meta?: Record<string, string | number | undefined>;
}

export interface PunchItem {
  id: string; // Internal UUID
  code: string; // PL-0142
  projectId: string;
  description: string;
  location: string;
  trade: string;
  priority: Priority;
  status: PunchStatus;
  assigneeId: string | null;
  photo?: string;
  createdAt: number;
  dueAt?: number;
  activity: ActivityEntry[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  gc: string;
  createdAt: number;
}

export const STATUS_LABEL: Record<PunchStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  pending: "Pending Verification",
  complete: "Complete",
  reopened: "Reopened",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  med: "Med",
  high: "High",
  crit: "Critical",
};
