import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, address, gc } = req.body ?? {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedAddress = typeof address === "string" ? address.trim() : "";
  const trimmedGc = typeof gc === "string" ? gc.trim() : "";

  if (!trimmedName) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const project = await prisma.project.create({
    data: {
      name: trimmedName,
      address: trimmedAddress || "—",
      gc: trimmedGc || "—",
      status: "active",
    },
  });

  return res.status(201).json(project);
}
