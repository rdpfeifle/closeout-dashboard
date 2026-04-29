import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCloseout } from "@/lib/store";
import { projectSlug } from "@/lib/project-slug";
import { toast } from "sonner";

export function NewProjectDialog() {
  const addProject = useCloseout((s) => s.addProject);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [gc, setGc] = useState("");

  const reset = () => {
    setName("");
    setAddress("");
    setGc("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload = {
      name: trimmed,
      address: address.trim() || "—",
      gc: gc.trim() || "—",
    };
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Unable to create project (${res.status})`);
      }
      const created = await res.json() as { id: string; name: string; address: string; gc: string; createdAt: string };
      addProject({
        id: created.id,
        name: created.name,
        address: created.address,
        gc: created.gc,
        createdAt: Date.parse(created.createdAt),
      });
      toast.success(`Project "${trimmed}" created`);
      reset();
      setOpen(false);
      router.push(`/project/${projectSlug(created.name)}`);
    } catch {
      toast.error("Unable to create project. Check database connectivity.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-9 rounded-sm gap-1.5 bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm border-l-2 border-l-accent sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            New project
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest text-muted-foreground">
            Punch list closeout
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Project name" required>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Harbor Point Tower"
              className="h-9 rounded-sm"
            />
          </Field>
          <Field label="Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="412 Wharf St, Oakland CA"
              className="h-9 rounded-sm"
            />
          </Field>
          <Field label="General contractor">
            <Input
              value={gc}
              onChange={(e) => setGc(e.target.value)}
              placeholder="Northshore Builders"
              className="h-9 rounded-sm"
            />
          </Field>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-9 rounded-sm hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim()}
              className="h-9 rounded-sm bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Create project
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
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-status-open">*</span>}
      </Label>
      {children}
    </div>
  );
}
