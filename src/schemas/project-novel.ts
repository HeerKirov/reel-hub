import { z } from "zod"
import type { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectListFilter, type ProjectDetailSchema, type ProjectListSchema, type ProjectRelationSchema, type ProjectModel } from "./project"

export const novelListFilter = projectListFilter

export const novelForm = projectCommonForm

export type NovelListSchema = ProjectListSchema

export type NovelDetailSchema = ProjectDetailSchema

export function parseNovelListSchema(data: Project): NovelListSchema {
    return parseProjectListSchema(data)
}

export function parseNovelDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): NovelDetailSchema {
    return parseProjectDetailSchema(data, relations, relationsTopology)
}

export type NovelListFilter = z.infer<typeof novelListFilter>

export type NovelForm = z.infer<typeof novelForm>

