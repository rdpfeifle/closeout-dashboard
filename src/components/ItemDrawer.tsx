import { useState } from "react";
import { CheckCircle2, RotateCcw, Send, Undo2, UserPlus, X, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSIGNEES, getAssignee, useCloseout, NEXT_STATES } from "@/lib/store";
import { STATUS_LABEL, PRIORITY_LABEL, type PunchItem, type PunchStatus, type Priority } from "@/lib/types";
import { toast } from "sonner";
import { ageInDays, fmtTime } from "@/lib/utils-format";
import { StatusChip } from "./StatusChip";
import { PriorityBadge } from "./PriorityBadge";
import { AssigneeChip } from "./AssigneeChip";
import { cn } from "@/lib/utils";

interface Props {
  item: PunchItem | null;
  onClose: () => void;
}

interface Action {
  label: string;
  icon: LucideIcon;
  next?: PunchStatus;
  variant: "primary" | "ghost" | "danger";
}

function formatActivityMessage(message: string) {
  return message.replace(/^Status\s*→\s*pending$/i, "Status → Pending Verification");
}

function actionsFor(status: PunchStatus, hasAssignee: boolean): Action[] {
  switch (status) {
    case "open":
      return [
        { label: hasAssignee ? "Reassign" : "Assign", icon: UserPlus, variant: "ghost" },
        { label: "Start work", icon: Send, next: "in_progress", variant: "primary" },
      ];
    case "in_progress":
      return [
        { label: "Mark ready for review", icon: Send, next: "pending", variant: "primary" },
        { label: "Send back to open", icon: Undo2, next: "open", variant: "ghost" },
      ];
    case "pending":
      return [
        { label: "Verify & close", icon: CheckCircle2, next: "complete", variant: "primary" },
        { label: "Send back", icon: Undo2, next: "in_progress", variant: "ghost" },
      ];
    case "complete":
      return [{ label: "Reopen", icon: RotateCcw, next: "reopened", variant: "danger" }];
    case "reopened":
      return [
        { label: "Resume work", icon: Send, next: "in_progress", variant: "primary" },
      ];
  }
}

export function ItemDrawer({ item, onClose }: Props) {
  const setStatus = useCloseout((s) => s.setStatus);
  const setAssignee = useCloseout((s) => s.setAssignee);
  const setPriority = useCloseout((s) => s.setPriority);
  const addComment = useCloseout((s) => s.addComment);
  const [comment, setComment] = useState("");
  const [photoOpen, setPhotoOpen] = useState(false);
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);

  if (!item) return null;
  const assignee = getAssignee(item.assigneeId);
  const actions = actionsFor(item.status, !!assignee);
  const nextStatusOptions = NEXT_STATES[item.status].filter((s) => s !== "pending" || !!item.photo);

  const onAction = (a: Action) => {
    if (!a.next) {
      setAssignPickerOpen(true);
      return;
    }
    if (a.next === "pending" && !item.photo) {
      toast.error("Add a photo before marking ready for review.");
      return;
    }
    setStatus([item.id], a.next);
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col gap-0 border-l-2 border-l-accent"
      >
        <SheetHeader className="border-b border-border px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-base font-semibold tabular">{item.code}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <SheetTitle className="text-left text-base font-medium leading-snug">
            {item.description}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={item.status} />
            <PriorityBadge priority={item.priority} />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {item.location}
            </span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {ageInDays(item.createdAt)}d old
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {item.photo ? (
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="relative block w-full overflow-hidden border-b border-border bg-muted"
            >
              <img src={item.photo} alt={item.description} className="h-56 w-full object-cover" />
              <span className="absolute bottom-2 right-2 rounded-sm bg-background/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground">
                Tap to zoom
              </span>
            </button>
          ) : (
            <div className="flex h-32 items-center justify-center border-b border-border bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
              No photo · required to mark ready for review
            </div>
          )}

          <div className="border-b border-border bg-secondary/40 px-5 py-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Status transitions
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => {
                const needsPhoto = a.next === "pending" && !item.photo;
                return (
                  <Button
                    key={a.label}
                    size="sm"
                    variant={a.variant === "primary" ? "default" : a.variant === "danger" ? "destructive" : "outline"}
                    onClick={() => onAction(a)}
                    title={needsPhoto ? "Add a photo first" : undefined}
                    className={cn(
                      "h-9 rounded-sm gap-1.5 text-xs font-medium",
                      a.variant === "primary" && !needsPhoto && "bg-accent text-accent-foreground hover:bg-accent/90",
                      needsPhoto && "opacity-60",
                    )}
                  >
                    <a.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {a.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-border px-5 py-4 text-sm">
            <Field label="Assignee">
              {assignPickerOpen ? (
                <Select
                  value={item.assigneeId ?? "unassigned"}
                  onValueChange={(v) => {
                    setAssignee([item.id], v === "unassigned" ? null : v);
                    setAssignPickerOpen(false);
                  }}
                >
                  <SelectTrigger className="h-8 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {ASSIGNEES.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name} · {a.trade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <button onClick={() => setAssignPickerOpen(true)} className="text-left hover:underline">
                  <AssigneeChip a={assignee} />
                </button>
              )}
            </Field>
            <Field label="Priority">
              <Select value={item.priority} onValueChange={(v) => setPriority([item.id], v as Priority)}>
                <SelectTrigger className="h-8 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["low", "med", "high", "crit"] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location"><div>{item.location}</div></Field>
            <Field label="Trade"><div>{item.trade}</div></Field>
            <Field label="Created">
              <div className="font-mono text-xs tabular text-muted-foreground">{fmtTime(item.createdAt)}</div>
            </Field>
            <Field label="Status">
              <Select
                value={item.status}
                onValueChange={(v) => {
                  const next = v as PunchStatus;
                  if (next === "pending" && !item.photo) {
                    toast.error("Add a photo before marking ready for review.");
                    return;
                  }
                  setStatus([item.id], next);
                }}
              >
                <SelectTrigger className="h-8 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Current status (disabled) + only valid next transitions */}
                  <SelectItem value={item.status} disabled>
                    {STATUS_LABEL[item.status]} (current)
                  </SelectItem>
                  {nextStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </dl>

          <div className="px-5 py-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Activity
            </div>
            <ol className="relative space-y-3 border-l border-border pl-4">
              {[...item.activity].reverse().map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-foreground" />
                  <div className="text-sm text-foreground">{formatActivityMessage(a.message)}</div>
                  <div className="mt-0.5 font-mono text-[11px] tabular text-muted-foreground">
                    {a.actor} · {fmtTime(a.ts)}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="border-t border-border bg-card px-4 py-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note…"
            className="min-h-[60px] rounded-sm border-border bg-background text-sm"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={!comment.trim()}
              onClick={() => {
                addComment(item.id, comment.trim());
                setComment("");
              }}
              className="h-8 rounded-sm"
            >
              Post note
            </Button>
          </div>
        </div>
      </SheetContent>

      {photoOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-foreground/90 p-4"
          onClick={() => setPhotoOpen(false)}
        >
          <img src={item.photo} alt={item.description} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
