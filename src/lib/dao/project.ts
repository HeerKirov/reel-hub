import { prisma } from "../prisma"
import type { Project, Prisma } from "@/prisma/generated"
import { BoardcastType } from "@/prisma/generated"

export async function findById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id }
  })
}
