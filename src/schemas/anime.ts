import { z } from "zod"
import { projectFormTemplate, projectDetailSchemaTemplate, projectListSchemaTemplate } from "./project"
import { BOARDCAST_TYPE, ORIGINAL_TYPE } from "@/constants/anime"

export const animeListFilter = z.object({
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export type AnimeListFilter = z.infer<typeof animeListFilter>

export const episodePublishRecord = z.object({
    index: z.number(),
    publishTime: z.date(),
    actualEpisodeNum: z.number().nullable(),
    episodeTitle: z.string().nullable()
})

const animeModifySchema = z.object({
    originalType: z.enum(ORIGINAL_TYPE).nullable().optional(),
    boardcastType: z.enum(BOARDCAST_TYPE).nullable().optional(),
    episodeDuration: z.number().nullable().optional(),
    episodeTotalNum: z.number().optional(),
    episodePublishedNum: z.number().optional(),
    episodePublishPlan: z.array(episodePublishRecord).optional()
})

export const animeForm = projectFormTemplate.and(animeModifySchema)

export type AnimeForm = z.infer<typeof animeForm>

const animeSelfSchema = z.object({
    originalType: z.enum(ORIGINAL_TYPE).nullable(),
    boardcastType: z.enum(BOARDCAST_TYPE).nullable(),
    episodeDuration: z.number().nullable(),
    episodeTotalNum: z.number(),
    episodePublishedNum: z.number()
})

export const animeListSchema = projectListSchemaTemplate.and(animeSelfSchema)

export const animeDetailSchema = projectDetailSchemaTemplate.and(animeSelfSchema)

export type AnimeListSchema = z.infer<typeof animeListSchema>

export type AnimeDetailSchema = z.infer<typeof animeDetailSchema>