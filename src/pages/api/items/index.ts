import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CODE_PREFIX = "PL-";
const CODE_PAD = 3;
const MAX_CREATE_RETRIES = 5;

function formatCode(sequence: number) {
  return `${CODE_PREFIX}${sequence.toString().padStart(CODE_PAD, "0")}`;
}

async function getNextPunchCode(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<{ max_seq: number | null }[]>`
    SELECT COALESCE(MAX(CAST(SUBSTRING("code" FROM 4) AS INTEGER)), 0) AS max_seq
    FROM "PunchItem"
    WHERE "code" LIKE 'PL-%'
  `;
  const nextSequence = (rows[0]?.max_seq ?? 0) + 1;
  return formatCode(nextSequence);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body ?? {};
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";

  if (!projectId || !description || !location) {
    return res.status(400).json({ error: "projectId, description, and location are required" });
  }

  for (let retries = 0; retries < MAX_CREATE_RETRIES; retries += 1) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const code = await getNextPunchCode(tx);
        return tx.punchItem.create({
          data: {
            code,
            projectId,
            description,
            location,
            trade: typeof body.trade === "string" && body.trade.trim() ? body.trade.trim() : "General",
            status: typeof body.status === "string" ? body.status : "open",
            priority: typeof body.priority === "string" ? body.priority : "med",
            assignedTo: typeof body.assignedTo === "string" ? body.assignedTo : null,
            photo: typeof body.photo === "string" ? body.photo : null,
            dueAt: body.dueAt ? new Date(body.dueAt) : null,
            activity: [
              {
                id: `seed-${Date.now()}`,
                ts: Date.now(),
                actor: "You",
                type: "create",
                message: "Item created",
              },
            ],
          },
        });
      });

      return res.status(201).json(created);
    } catch (error) {
      const isUniqueCodeConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("code");

      if (!isUniqueCodeConflict || retries >= MAX_CREATE_RETRIES - 1) {
        throw error;
      }

      continue;
    }
  }

  return res.status(500).json({ error: "Unable to create item code" });
}
