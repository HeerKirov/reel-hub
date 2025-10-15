import { z } from "zod"
import { Project, ProjectStaffRelation, ProjectTagRelation, Staff, Tag } from "@/prisma/generated"
import { RATING_SEX, RATING_VIOLENCE, REGION, PROJECT_TYPE, RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS, Region, RelationType, RELATION_TYPE_VALUES } from "@/constants/project"
import { ONLINE_TYPE } from "@/constants/game"
import { ORIGINAL_TYPE, BOARDCAST_TYPE } from "@/constants/anime"
import { arrays } from "@/helpers/primitive"
import { parseStaffSchema } from "./staff"

export const projectListFilter = z.object({
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional(),
    type: z.enum(PROJECT_TYPE).optional(),
    ratingS: z.enum(RATING_SEX).optional(),
    ratingV: z.enum(RATING_VIOLENCE).optional(),
    publishTime: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
    tag: z.string().optional(),
    staff: z.string().optional(),
})

export const projectRelationModel = z.record(z.enum(RELATION_TYPE_VALUES as [RelationType, ...RelationType[]]), z.array(z.string()))

export type ProjectRelationModel = Record<RelationType, string[]>

export type ProjectRelationType = Record<RelationType, z.infer<typeof projectRelationItemSchema>[]>

export type EpisodePublishRecord = z.infer<typeof episodePublishRecordSchema>

export type ProjectModel = z.infer<typeof projectModel>

export type ProjectListFilter = z.infer<typeof projectListFilter>

export type ProjectDetailSchema = z.infer<typeof projectDetailSchema>

export const episodePublishRecordSchema = z.object({
    index: z.number(),
    publishTime: z.string().nullable(),
    actualEpisodeNum: z.number().nullable(),
    episodeTitle: z.string().nullable()
})

export const projectRelationItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    resources: z.record(z.string(), z.string())
})

export const projectTagItemSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string()
})

export const projectStaffItemSchema = z.object({
    type: z.string(),
    members: z.array(z.object({
        id: z.number(),
        name: z.string(),
        otherNames: z.array(z.string()),
        description: z.string()
    }))
})

export const projectModel = z.object({
    id: z.string(),
    title: z.string(),
    subtitles: z.string(),
    description: z.string(),
    keywords: z.string(),
    type: z.enum(PROJECT_TYPE),
    publishTime: z.string().nullable(),
    ratingS: z.number().nullable(),
    ratingV: z.number().nullable(),
    region: z.string().nullable(),
    relations: projectRelationModel,
    relationsTopology: projectRelationModel,
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
    episodePublishedRecords: z.array(episodePublishRecordSchema).nullable(),
    episodePublishPlan: z.array(episodePublishRecordSchema).nullable(),
    platform: z.array(z.string()),
    onlineType: z.enum(ONLINE_TYPE).nullable()
})

export const projectCommonForm = z.object({
    title: z.string().min(1).optional(),
    subtitles: z.array(z.string()).optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    publishTime: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
    ratingS: z.enum(RATING_SEX).nullable().optional(),
    ratingV: z.enum(RATING_VIOLENCE).nullable().optional(),
    region: z.enum(REGION).nullable().optional(),
    relations: projectRelationModel.optional(),
    tags: z.array(z.string()).optional(),
    staffs: z.array(z.object({
        type: z.string(),
        members: z.array(z.string())
    })).optional()
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
    relations: z.record(z.enum(RELATION_TYPE_VALUES as [RelationType, ...RelationType[]]), z.array(projectRelationItemSchema)),
    relationsTopology: z.record(z.enum(RELATION_TYPE_VALUES as [RelationType, ...RelationType[]]), z.array(projectRelationItemSchema)),
    tags: z.array(projectTagItemSchema),
    staffs: z.array(projectStaffItemSchema)
})

export function parseProjectListSchema(data: Project): z.infer<typeof projectListSchema> {
    const i = data as ProjectModel
    return {
        id: i.id,
        title: i.title,
        subtitles: i.subtitles.split("|").filter(s => s !== ""),
        description: i.description,
        keywords: i.keywords.split("|").filter(s => s !== ""),
        publishTime: i.publishTime,
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

export function parseProjectDetailSchema(
    data: Project & {staffs: (ProjectStaffRelation & {staff: Staff})[], tags: (ProjectTagRelation & {tag: Tag})[]}, 
    relations: ProjectRelationType, 
    relationsTopology: ProjectRelationType,
): z.infer<typeof projectDetailSchema> {
    const tags = data.tags.map(t => ({id: t.tag.id, name: t.tag.name, description: t.tag.description}))
    const staffs = Object.entries(arrays.groupByTo(data.staffs, s => s.staffType, s => parseStaffSchema(s.staff))).map(([type, members]) => ({type, members}))

    return {
        ...parseProjectListSchema(data),
        tags,
        staffs,
        relations: relations,
        relationsTopology: relationsTopology
    }
}