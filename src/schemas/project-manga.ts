import { z } from "zod"
import { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectListFilter, type ProjectDetailSchema, type ProjectListSchema, type ProjectRelationSchema, type ProjectModel } from "./project"

export const mangaListFilter = projectListFilter

export const mangaForm = projectCommonForm

export type MangaListSchema = ProjectListSchema

export type MangaDetailSchema = ProjectDetailSchema

export function parseMangaListSchema(data: Project): MangaListSchema {
    return parseProjectListSchema(data)
}

export function parseMangaDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): MangaDetailSchema {
    return parseProjectDetailSchema(data, relations, relationsTopology)
}

export type MangaListFilter = z.infer<typeof mangaListFilter>

export type MangaForm = z.infer<typeof mangaForm>

