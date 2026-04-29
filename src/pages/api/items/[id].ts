import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

const NEXT_STATES: Record<string, string[]> = {
  open: ["in_progress"],
  in_progress: ["pending", "open"],
  pending: ["complete", "in_progress"],
  complete: ["reopened"],
  reopened: ["in_progress"],
};

function canTransition(from: string, to: string) {
  return from === to || (NEXT_STATES[from] ?? []).includes(to);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = req.query.id;
  const itemId = Array.isArray(id) ? id[0] : id;
  if (!itemId) return res.status(400).json({ error: "Item id is required" });

  const body = req.body ?? {};
  const actor = typeof body.actor === "string" && body.actor.trim() ? body.actor.trim() : "You";
  const item = await prisma.punchItem.findUnique({ where: { id: itemId } });
  if (!item) return res.status(404).json({ error: "Item not found" });

  const updates: Record<string, unknown> = {};
  const activity = Array.isArray(item.activity) ? [...item.activity] : [];

  if (typeof body.status === "string" && body.status !== item.status) {
    if (!canTransition(item.status, body.status)) {
      return res.status(400).json({ error: "Invalid status transition" });
    }
    if (body.status === "pending" && !item.photo) {
      return res.status(400).json({ error: "Photo required before pending verification" });
    }
    updates.status = body.status;
    activity.push({
      id: `${item.id}-${Date.now()}-status`,
      ts: Date.now(),
      actor,
      type: "status",
      message: body.status === "complete" ? `Verified by ${actor} · Status → Complete` : `Status → ${body.status}`,
    });
  }

  if (Object.prototype.hasOwnProperty.call(body, "assignedTo")) {
    updates.assignedTo = body.assignedTo || null;
    activity.push({
      id: `${item.id}-${Date.now()}-assign`,
      ts: Date.now(),
      actor,
      type: "assign",
      message: `Assigned to ${body.assignedTo || "Unassigned"}`,
    });
  }

  if (typeof body.priority === "string" && body.priority !== item.priority) {
    updates.priority = body.priority;
    activity.push({
      id: `${item.id}-${Date.now()}-priority`,
      ts: Date.now(),
      actor,
      type: "edit",
      message: `Priority → ${body.priority}`,
    });
  }

  if (typeof body.comment === "string" && body.comment.trim()) {
    activity.push({
      id: `${item.id}-${Date.now()}-comment`,
      ts: Date.now(),
      actor,
      type: "comment",
      message: body.comment.trim(),
    });
  }

  if (Object.prototype.hasOwnProperty.call(body, "photo")) updates.photo = body.photo || null;
  if (Object.prototype.hasOwnProperty.call(body, "location")) updates.location = body.location;
  if (Object.prototype.hasOwnProperty.call(body, "description")) updates.description = body.description;
  if (Object.prototype.hasOwnProperty.call(body, "trade")) updates.trade = body.trade;
  if (Object.prototype.hasOwnProperty.call(body, "dueAt")) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null;

  updates.activity = activity;

  const updated = await prisma.punchItem.update({
    where: { id: item.id },
    data: updates,
  });

  return res.status(200).json(updated);
}
