import { z } from "zod"
import { BOARDCAST_TYPE, ORIGINAL_TYPE } from "@/constants/anime"
import type { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { episodePublishRecordFormSchema, parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectListFilter, type EpisodePublishRecordModel, type ProjectDetailSchema, type ProjectListSchema, type ProjectModel, type ProjectRelationSchema } from "./project"

export const animeListFilter = projectListFilter.extend({
    originalType: z.enum(ORIGINAL_TYPE).optional(),
    boardcastType: z.enum(BOARDCAST_TYPE).optional()
})

export const animeForm = projectCommonForm.extend({
    originalType: z.enum(ORIGINAL_TYPE).nullable().optional(),
    boardcastType: z.enum(BOARDCAST_TYPE).nullable().optional(),
    episodeDuration: z.number().nullable().optional(),
    episodeTotalNum: z.number().optional(),
    episodePublishedNum: z.number().optional(),
    episodePublishedRecords: z.array(episodePublishRecordFormSchema).optional(),
    episodePublishPlan: z.array(episodePublishRecordFormSchema).optional()
})

export type AnimeListSchema = ProjectListSchema & {
    originalType: (typeof ORIGINAL_TYPE)[number] | null
    boardcastType: (typeof BOARDCAST_TYPE)[number] | null
    episodeDuration: number | null
    episodeTotalNum: number
    episodePublishedNum: number
}

export type AnimeDetailSchema = ProjectDetailSchema & {
    originalType: (typeof ORIGINAL_TYPE)[number] | null
    boardcastType: (typeof BOARDCAST_TYPE)[number] | null
    episodeDuration: number | null
    episodeTotalNum: number
    episodePublishedNum: number
    episodePublishPlan: EpisodePublishRecordModel[]
    episodePublishedRecords: EpisodePublishRecordModel[]
}

export function parseAnimeListSchema(data: Project): AnimeListSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectListSchema(data),
        originalType: i.originalType,
        boardcastType: i.boardcastType,
        episodeDuration: i.episodeDuration,
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0
    }
}

export function parseAnimeDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): AnimeDetailSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectDetailSchema(data, relations, relationsTopology),
        originalType: i.originalType,
        boardcastType: i.boardcastType,
        episodeDuration: i.episodeDuration,
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0,
        episodePublishPlan: i.episodePublishPlan ?? [],
        episodePublishedRecords: i.episodePublishedRecords ?? []
    }
}

export type AnimeListFilter = z.infer<typeof animeListFilter>

export type AnimeForm = z.infer<typeof animeForm>
