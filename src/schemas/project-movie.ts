import { z } from "zod"
import { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { episodePublishRecordFormSchema, parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectListFilter, type EpisodePublishRecordModel, type ProjectDetailSchema, type ProjectListSchema, type ProjectModel, type ProjectRelationSchema } from "./project"

export const movieListFilter = projectListFilter

export const movieForm = projectCommonForm.extend({
    episodeDuration: z.number().nullable().optional(),
    episodeTotalNum: z.number().optional(),
    episodePublishedNum: z.number().optional(),
    episodePublishedRecords: z.array(episodePublishRecordFormSchema).optional(),
    episodePublishPlan: z.array(episodePublishRecordFormSchema).optional()
})

export type MovieListSchema = ProjectListSchema & {
    episodeDuration: number | null
    episodeTotalNum: number
    episodePublishedNum: number
}

export type MovieDetailSchema = ProjectDetailSchema & {
    episodeDuration: number | null
    episodeTotalNum: number
    episodePublishedNum: number
    episodePublishPlan: EpisodePublishRecordModel[]
    episodePublishedRecords: EpisodePublishRecordModel[]
}

export function parseMovieListSchema(data: Project): MovieListSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectListSchema(data),
        episodeDuration: i.episodeDuration,
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0
    }
}

export function parseMovieDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): MovieDetailSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectDetailSchema(data, relations, relationsTopology),
        episodeDuration: i.episodeDuration,
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0,
        episodePublishPlan: i.episodePublishPlan ?? [],
        episodePublishedRecords: i.episodePublishedRecords ?? []
    }
}

export type MovieListFilter = z.infer<typeof movieListFilter>

export type MovieForm = z.infer<typeof movieForm>

