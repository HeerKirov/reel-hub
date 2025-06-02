import { z } from "zod"

export type ProjectRelationInnerType = Record<string, string[]>

export type ProjectRelationType = Record<string, z.infer<typeof projectRelationItemSchema>[]>

export const projectRelationItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    resources: z.record(z.string(), z.string())
})

export const projectCreateFormTemplate = z.object({
    title: z.string().min(1),
    subtitles: z.array(z.string()).optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    publishTime: z.string().optional(),
    ratingS: z.number().optional(),
    ratingV: z.number().optional(),
    region: z.string().optional(),
    relations: z.record(z.string(), z.array(z.string())).optional()
})

export const projectUpdateFormTemplate = z.object({
    title: z.string().min(1).optional(),
    subtitles: z.array(z.string()).optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    publishTime: z.string().optional(),
    ratingS: z.number().optional(),
    ratingV: z.number().optional(),
    region: z.string().optional(),
    relations: z.record(z.string(), z.array(z.string())).optional()
})

export const projectListSchemaTemplate = z.object({
    id: z.string(),
    title: z.string(),
    subtitles: z.array(z.string()),
    description: z.string(),
    keywords: z.array(z.string()),
    publishTime: z.string().nullable(),
    ratingS: z.number().nullable(),
    ratingV: z.number().nullable(),
    region: z.string().nullable(),
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