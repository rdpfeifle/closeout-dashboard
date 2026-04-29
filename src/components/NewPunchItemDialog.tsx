import { useState, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSIGNEES, useCloseout } from "@/lib/store";
import type { Priority } from "@/lib/types";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "med", label: "Med" },
  { value: "high", label: "High" },
  { value: "crit", label: "Critical" },
];

export function NewPunchItemDialog({ projectId }: { projectId: string }) {
  const addItem = useCloseout((s) => s.addItem);
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [trade, setTrade] = useState("General");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = location.trim().length > 0 && description.trim().length > 0 && !saving;

  const reset = () => {
    setLocation("");
    setDescription("");
    setPriority("med");
    setTrade("General");
    setAssigneeId("unassigned");
    setPhoto("");
    setSaving(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await addItem({
        projectId,
        location: location.trim(),
        description: description.trim(),
        priority,
        trade: trade.trim() || "General",
        status: "open",
        assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        photo: photo.trim() || undefined,
      });
      toast.success("Punch item added");
      reset();
      setOpen(false);
    } catch {
      toast.error("Unable to add item. Check database connectivity.");
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 rounded-sm gap-1.5 bg-foreground text-background hover:bg-foreground/90">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">Add punch item</DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest text-muted-foreground">
            Create a new item for this project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Location" required>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Unit 204 - Kitchen"
              className="h-9 rounded-sm"
            />
          </Field>

          <Field label="Description" required>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Drywall patch needed behind door"
              className="min-h-[88px] rounded-sm"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Priority">
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-9 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assignee">
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-9 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {ASSIGNEES.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {a.trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Trade">
              <Input
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder="General"
                className="h-9 rounded-sm"
              />
            </Field>
            <Field label="Photo URL">
              <Input
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://..."
                className="h-9 rounded-sm"
              />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              className="h-9 rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Adding..." : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label} {required ? <span className="text-status-open">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
