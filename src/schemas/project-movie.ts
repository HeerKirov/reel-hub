import { z } from "zod"
import { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectListFilter, type ProjectDetailSchema, type ProjectListSchema, type ProjectRelationSchema } from "./project"

export const movieListFilter = projectListFilter

export const movieForm = projectCommonForm

export type MovieListSchema = ProjectListSchema

export type MovieDetailSchema = ProjectDetailSchema

export function parseMovieListSchema(data: Project): MovieListSchema {
    return parseProjectListSchema(data)
}

export function parseMovieDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): MovieDetailSchema {
    return parseProjectDetailSchema(data, relations, relationsTopology)
}

export type MovieListFilter = z.infer<typeof movieListFilter>

export type MovieForm = z.infer<typeof movieForm>

