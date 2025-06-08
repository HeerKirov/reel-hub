import { z } from "zod"
import { Project } from "@/prisma/generated"
import { RATING_SEX, RATING_VIOLENCE, REGION, PROJECT_TYPE, RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS, Region } from "@/constants/project"
import { ONLINE_TYPE } from "@/constants/game"
import { ORIGINAL_TYPE, BOARDCAST_TYPE } from "@/constants/anime"

export type ProjectRelationInnerType = Record<string, string[]>

export type ProjectRelationType = Record<string, z.infer<typeof projectRelationItemSchema>[]>

export type ProjectModel = z.infer<typeof projectModel>

export const projectModel = z.object({
    id: z.string(),
    title: z.string(),
    subtitles: z.string(),
    description: z.string(),
    keywords: z.string(),
    type: z.enum(PROJECT_TYPE),
    publishTime: z.date().nullable(),
    ratingS: z.number().nullable(),
    ratingV: z.number().nullable(),
    region: z.string().nullable(),
    relations: z.record(z.string(), z.array(z.string())),
    relationsTopology: z.record(z.string(), z.array(z.string())),
    resources: z.record(z.string(), z.string()),
    createTime: z.date(),
    updateTime: z.date(),
    creator: z.string(),
    updator: z.string(),
    originalType: z.enum(ORIGINAL_TYPE).nullable(),
    boardcastType: z.enum(BOARDCAST_TYPE).nullable(),
    episodeDuration: z.number().nullable(),
    episodeTotalNum: z.number().nullable(),
    episodePublishedNum: z.number().nullable(),
    platform: z.array(z.string()),
    onlineType: z.enum(ONLINE_TYPE).nullable()
})

export const projectRelationItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    resources: z.record(z.string(), z.string())
})

export const projectCommonForm = z.object({
    title: z.string().min(1).optional(),
    subtitles: z.array(z.string()).optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    publishTime: z.string().nullable().optional(),
    ratingS: z.enum(RATING_SEX).nullable().optional(),
    ratingV: z.enum(RATING_VIOLENCE).nullable().optional(),
    region: z.enum(REGION).nullable().optional(),
    relations: z.record(z.string(), z.array(z.string())).optional()
})

export const projectListSchema = z.object({
    id: z.string(),
    title: z.string(),
    subtitles: z.array(z.string()),
    description: z.string(),
    keywords: z.array(z.string()),
    publishTime: z.string().nullable(),
    ratingS: z.enum(RATING_SEX).nullable(),
    ratingV: z.enum(RATING_VIOLENCE).nullable(),
    region: z.enum(REGION).nullable(),
    resources: z.record(z.string(), z.string()),
    createTime: z.date(),
    updateTime: z.date(),
    creator: z.string(),
    updator: z.string()
})

export const projectDetailSchema = projectListSchema.extend({
    relations: z.record(z.string(), z.array(projectRelationItemSchema)),
    relationsTopology: z.record(z.string(), z.array(projectRelationItemSchema))
})

export function parseProjectListSchema(data: Project): z.infer<typeof projectListSchema> {
    const i = data as ProjectModel
    return {
        id: i.id,
        title: i.title,
        subtitles: i.subtitles.split(","),
        description: i.description,
        keywords: i.keywords.split(","),
        publishTime: i.publishTime ? i.publishTime.toISOString() : null,
        ratingS: i.ratingS !== null ? RATING_SEX_ITEMS[i.ratingS].value : null,
        ratingV: i.ratingV !== null ? RATING_VIOLENCE_ITEMS[i.ratingV].value : null,
        region: i.region as Region | null,
        resources: i.resources,
        createTime: i.createTime,
        updateTime: i.updateTime,
        creator: i.creator,
        updator: i.updator
    }
}

export function parseProjectDetailSchema(data: Project, relations: ProjectRelationType, relationsTopology: ProjectRelationType): z.infer<typeof projectDetailSchema> {
    return {
        ...parseProjectListSchema(data),
        relations: relations,
        relationsTopology: relationsTopology
    }
}