import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
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
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "med", label: "Med" },
  { value: "high", label: "High" },
  { value: "crit", label: "Critical" },
];
const MAX_IMAGE_SIZE_MB = 8;

export function NewPunchItemDialog({ projectId }: { projectId: string }) {
  const addItem = useCloseout((s) => s.addItem);
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [trade, setTrade] = useState("General");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [photo, setPhoto] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = location.trim().length > 0 && description.trim().length > 0 && !saving;

  const reset = () => {
    setLocation("");
    setDescription("");
    setPriority("med");
    setTrade("General");
    setAssigneeId("unassigned");
    setPhoto("");
    setPhotoName("");
    setSaving(false);
  };

  const applyPhotoFile = async (file?: File) => {
    if (!file) {
      setPhoto("");
      setPhotoName("");
      return true;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_SIZE_MB}MB.`);
      return false;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto(dataUrl);
      setPhotoName(file.name);
      return true;
    } catch {
      toast.error("Unable to read the selected image.");
      return false;
    }
  };

  const onPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const ok = await applyPhotoFile(e.target.files?.[0]);
    if (!ok) {
      e.target.value = "";
    }
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

          <Field label="Trade">
            <Input
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              placeholder="General"
              className="h-9 rounded-sm"
            />
          </Field>
          <Field label="Photo">
            <label
              htmlFor="new-punch-item-photo"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(false);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDraggingPhoto(false);
                await applyPhotoFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex min-h-[84px] cursor-pointer items-center justify-center rounded-sm border border-dashed px-3 py-2 text-center text-xs text-muted-foreground transition-colors",
                isDraggingPhoto
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border hover:border-foreground/40",
              )}
            >
              <div>
                <div className="font-medium text-foreground">Drag & drop image here</div>
                <div className="mt-0.5">or click to browse (PNG, JPG, WEBP, GIF)</div>
              </div>
            </label>
            <Input
              id="new-punch-item-photo"
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="sr-only"
            />
            {photoName ? (
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                Selected: <span className="font-mono">{photoName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto("");
                    setPhotoName("");
                  }}
                  className="text-xs text-accent underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </Field>

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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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
