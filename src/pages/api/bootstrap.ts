import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import type { PunchItem, Project } from "@/lib/types";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const [projectsDb, itemsDb] = await Promise.all([
      prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.punchItem.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const projects: Project[] = projectsDb.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      gc: p.gc ?? "—",
      createdAt: p.createdAt.getTime(),
    }));

    const items: PunchItem[] = itemsDb.map((it) => ({
      id: it.id,
      code: it.code ?? it.id,
      projectId: it.projectId,
      description: it.description,
      location: it.location,
      trade: "General",
      priority: (["low", "med", "high", "crit"].includes(it.priority) ? it.priority : "med") as PunchItem["priority"],
      status: (["open", "in_progress", "pending", "complete", "reopened"].includes(it.status) ? it.status : "open") as PunchItem["status"],
      assigneeId: it.assignedTo,
      photo: it.photo ?? undefined,
      createdAt: it.createdAt.getTime(),
      activity: Array.isArray(it.activity)
        ? (it.activity as unknown as PunchItem["activity"])
        : [
            {
              id: `${it.id}-bootstrap`,
              ts: it.createdAt.getTime(),
              actor: it.assignedTo ?? "System",
              type: "create",
              message: "Item loaded from database",
            },
          ],
    }));

    return res.status(200).json({ projects, items });
  } catch (error) {
    console.error("Bootstrap API error", error);
    return res.status(500).json({ error: "Database unavailable" });
  }
}
