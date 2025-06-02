import { z } from "zod"
import { OriginalType, BoardcastType } from "@/prisma/generated"
import { projectCreateFormTemplate, projectDetailSchemaTemplate, projectListSchemaTemplate, projectUpdateFormTemplate } from "./project"

export const ORIGINAL_TYPE = [OriginalType.GAME, OriginalType.MANGA, OriginalType.NOVEL, OriginalType.ORIGINAL, OriginalType.OTHER] as const

export const BOARDCAST_TYPE = [BoardcastType.MOVIE, BoardcastType.OTHER, BoardcastType.OVA_AND_OAD, BoardcastType.TV_AND_WEB] as const

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
    originalType: z.enum(ORIGINAL_TYPE).optional(),
    boardcastType: z.enum(BOARDCAST_TYPE).optional(),
    episodeDuration: z.number().optional(),
    episodeTotalNum: z.number().optional(),
    episodePublishedNum: z.number().optional(),
    episodePublishPlan: z.array(episodePublishRecord).optional()
})

export const animeCreateForm = projectCreateFormTemplate.and(animeModifySchema)

export type AnimeCreateForm = z.infer<typeof animeCreateForm>

export const animeUpdateForm = projectUpdateFormTemplate.and(animeModifySchema)

export type AnimeUpdateForm = z.infer<typeof animeUpdateForm>

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