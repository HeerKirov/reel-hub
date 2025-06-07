import { z } from "zod"
import { RATING_SEX, RATING_VIOLENCE, REGION } from "@/constants/project"

export type ProjectRelationInnerType = Record<string, string[]>

export type ProjectRelationType = Record<string, z.infer<typeof projectRelationItemSchema>[]>

export const projectRelationItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    resources: z.record(z.string(), z.string())
})

export const projectFormTemplate = z.object({
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

export const projectListSchemaTemplate = z.object({
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

export const projectDetailSchemaTemplate = projectListSchemaTemplate.extend({
    relations: z.record(z.string(), z.array(projectRelationItemSchema)),
    relationsTopology: z.record(z.string(), z.array(projectRelationItemSchema))
})