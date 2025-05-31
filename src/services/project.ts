import { prisma } from "@/lib/prisma"
import { ProjectRelationInnerType, ProjectRelationType, projectRelationItemSchema } from "@/schemas/project"
import { arrays, records } from "@/helpers/primitive"


export async function getRelations(relations: ProjectRelationInnerType, relationsTopology: ProjectRelationInnerType): Promise<{relations: ProjectRelationType, relationsTopology: ProjectRelationType}> {
    const ids = Object.values(relations).flat().concat(Object.values(relationsTopology).flat())
    const r = await prisma.project.findMany({where: {id: {in: ids}}})
    const items = r.map(i => projectRelationItemSchema.parse(i))
    const maps = arrays.associateBy(items, i => i.id)
    return {
        relations: records.map(relations, a => a.map(i => maps[i])),
        relationsTopology: records.map(relationsTopology, a => a.map(i => maps[i]))
    }
}