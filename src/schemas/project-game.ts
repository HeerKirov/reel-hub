import { z } from "zod"
import { ONLINE_TYPE } from "@/constants/game"
import { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectListFilter, type ProjectDetailSchema, type ProjectListSchema, type ProjectModel, type ProjectRelationSchema } from "./project"

export const gameListFilter = projectListFilter.extend({
    onlineType: z.enum(ONLINE_TYPE).optional(),
    platform: z.string().optional()
})

export const gameForm = projectCommonForm.extend({
    platform: z.array(z.string()).optional(),
    onlineType: z.enum(ONLINE_TYPE).nullable().optional()
})

export type GameListSchema = ProjectListSchema & {
    platform: string[]
    onlineType: (typeof ONLINE_TYPE)[number] | null
}

export type GameDetailSchema = ProjectDetailSchema & {
    platform: string[]
    onlineType: (typeof ONLINE_TYPE)[number] | null
}

export function parseGameListSchema(data: Project): GameListSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectListSchema(data),
        platform: i.platform ?? [],
        onlineType: i.onlineType
    }
}

export function parseGameDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): GameDetailSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectDetailSchema(data, relations, relationsTopology),
        platform: i.platform ?? [],
        onlineType: i.onlineType
    }
}

export type GameListFilter = z.infer<typeof gameListFilter>

export type GameForm = z.infer<typeof gameForm>
