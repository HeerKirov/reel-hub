import { z } from "zod"
import { parseProjectDetailSchema, parseProjectListSchema, projectCommonForm, projectDetailSchema, projectListSchema, ProjectModel, ProjectRelationType } from "./project"
import { BOARDCAST_TYPE, ORIGINAL_TYPE } from "@/constants/anime"
import { Project } from "@/prisma/generated"

export const animeListFilter = z.object({
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export const episodePublishRecordSchema = z.object({
    index: z.number(),
    publishTime: z.date(),
    actualEpisodeNum: z.number().nullable(),
    episodeTitle: z.string().nullable()
})

const animeSelfSchema = z.object({
    originalType: z.enum(ORIGINAL_TYPE).nullable(),
    boardcastType: z.enum(BOARDCAST_TYPE).nullable(),
    episodeDuration: z.number().nullable(),
    episodeTotalNum: z.number(),
    episodePublishedNum: z.number()
})

export const animeForm = projectCommonForm.extend({
    originalType: z.enum(ORIGINAL_TYPE).nullable().optional(),
    boardcastType: z.enum(BOARDCAST_TYPE).nullable().optional(),
    episodeDuration: z.number().nullable().optional(),
    episodeTotalNum: z.number().optional(),
    episodePublishedNum: z.number().optional(),
    episodePublishPlan: z.array(episodePublishRecordSchema).optional()
})

export const animeListSchema = projectListSchema.and(animeSelfSchema)

export const animeDetailSchema = projectDetailSchema.and(animeSelfSchema)

export function parseAnimeListSchema(data: Project): AnimeListSchema {
    const i = data as ProjectModel
    return {
        ...parseProjectListSchema(data),
        originalType: i.originalType,
        boardcastType: i.boardcastType,
        episodeDuration: i.episodeDuration,
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0,
    }
}

export function parseAnimeDetailSchema(data: Project, relations: ProjectRelationType, relationsTopology: ProjectRelationType): AnimeDetailSchema {
    const i = data as ProjectModel
    return {
        ...parseProjectDetailSchema(data, relations, relationsTopology),
        originalType: i.originalType,
        boardcastType: i.boardcastType,
        episodeDuration: i.episodeDuration,
        episodeTotalNum: i.episodeTotalNum ?? 1,
        episodePublishedNum: i.episodePublishedNum ?? 0,
    }
}

export type AnimeListFilter = z.infer<typeof animeListFilter>

export type AnimeForm = z.infer<typeof animeForm>

export type AnimeListSchema = z.infer<typeof animeListSchema>

export type AnimeDetailSchema = z.infer<typeof animeDetailSchema>