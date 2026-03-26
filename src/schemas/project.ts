import { z } from "zod"
import { BoardcastType, OnlineType, OriginalType, Project, ProjectStaffRelation, ProjectTagRelation, ProjectType, Staff, Tag } from "@/prisma/generated"
import { RATING_SEX, RATING_VIOLENCE, REGION, PROJECT_TYPE, RATING_SEX_ITEMS, RATING_VIOLENCE_ITEMS, Region, RelationType, RELATION_TYPE_VALUES } from "@/constants/project"
import { arrays } from "@/helpers/primitive"
import { parseStaffSchema } from "./staff"

// =============================================================================
// Model — 与 Prisma Project 行结构一致，便于 `as` 强转
// =============================================================================

export type ProjectRelationModel = Partial<Record<RelationType, string[]>>

/** 剧集发布记录（Model / 业务字段） */
export interface EpisodePublishRecordModel {
    index: number
    publishTime: string | null
    actualEpisodeNum: number | null
    episodeTitle: string | null
}

/** 与数据库 Project 表字段一一对应（Json 字段使用应用层类型） */
export interface ProjectModel {
    id: string
    title: string
    subtitles: string
    description: string
    keywords: string
    type: ProjectType
    publishTime: string | null
    ratingS: number | null
    ratingV: number | null
    region: string | null
    relations: ProjectRelationModel
    relationsTopology: ProjectRelationModel
    resources: Record<string, string>
    createTime: Date
    updateTime: Date
    creator: string
    updator: string
    originalType: OriginalType | null
    boardcastType: BoardcastType | null
    episodeDuration: number | null
    episodeTotalNum: number | null
    episodePublishedNum: number | null
    episodePublishedRecords: EpisodePublishRecordModel[] | null
    episodePublishPlan: EpisodePublishRecordModel[] | null
    platform: string[]
    onlineType: OnlineType | null
}

export type EpisodePublishRecord = EpisodePublishRecordModel

// =============================================================================
// Schema — API 返回结构（纯类型，无 Zod）
// =============================================================================

export interface ProjectRelationItem {
    id: string
    title: string
    resources: Record<string, string>
}

export interface ProjectTagItem {
    id: number
    name: string
    description: string
}

export interface ProjectStaffMember {
    id: number
    name: string
    otherNames: string[]
    description: string
}

export interface ProjectStaffItem {
    type: string
    members: ProjectStaffMember[]
}

export type ProjectRelationSchema = Partial<Record<RelationType, ProjectRelationItem[]>>

export interface ProjectSimpleSchema {
    id: string
    type: ProjectType
    title: string
    resources: Record<string, string>
}

export interface ProjectListSchema extends ProjectSimpleSchema {
    subtitles: string[]
    description: string
    keywords: string[]
    publishTime: string | null
    ratingS: (typeof RATING_SEX)[number] | null
    ratingV: (typeof RATING_VIOLENCE)[number] | null
    region: Region | null
    createTime: Date
    updateTime: Date
    creator: string
    updator: string
}

export interface ProjectDetailSchema extends ProjectListSchema {
    relations: ProjectRelationSchema
    relationsTopology: ProjectRelationSchema
    tags: ProjectTagItem[]
    staffs: ProjectStaffItem[]
}

// =============================================================================
// Form — Zod 校验用户输入
// =============================================================================

const projectRelationForm = z
    .record(z.string(), z.array(z.string()))
    .refine(
        val => Object.keys(val).every(key => RELATION_TYPE_VALUES.includes(key as RelationType)),
        { message: "Relation keys must be valid RelationType values" }
    )

export const episodePublishRecordFormSchema = z.object({
    index: z.number(),
    publishTime: z.string().nullable(),
    actualEpisodeNum: z.number().nullable(),
    episodeTitle: z.string().nullable()
})

export type EpisodePublishRecordForm = z.infer<typeof episodePublishRecordFormSchema>

export const projectCommonForm = z.object({
    title: z.string().min(1).optional(),
    subtitles: z.array(z.string()).optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    publishTime: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
    ratingS: z.enum(RATING_SEX).nullable().optional(),
    ratingV: z.enum(RATING_VIOLENCE).nullable().optional(),
    region: z.enum(REGION).nullable().optional(),
    relations: projectRelationForm.optional(),
    tags: z.array(z.string()).optional(),
    staffs: z
        .array(
            z.object({
                type: z.string(),
                members: z.array(z.string())
            })
        )
        .optional()
})

export type ProjectCommonForm = z.infer<typeof projectCommonForm>

// =============================================================================
// Filter — Zod 校验列表/查询参数
// =============================================================================

export const projectListFilter = z.object({
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional(),
    type: z.enum(PROJECT_TYPE).optional(),
    ratingS: z.enum(RATING_SEX).optional(),
    ratingV: z.enum(RATING_VIOLENCE).optional(),
    publishTime: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
    tag: z.string().optional(),
    staff: z.string().optional()
})

export type ProjectListFilter = z.infer<typeof projectListFilter>

// =============================================================================
// Parse — Model / DB → Schema
// =============================================================================

export function parseProjectRelationItem(data: Pick<Project, "id" | "title" | "resources">): ProjectRelationItem {
    return {
        id: data.id,
        title: data.title,
        resources: Object.fromEntries(
            Object.entries(data.resources as Record<string, string>)
                .filter(([_, value]) => value)
                .map(([key, value]) => [key, `/api/resources/${value}`])
        )
    }
}

export function parseProjectSimpleSchema(i: Pick<Project, "id" | "type" | "title" | "resources">): ProjectSimpleSchema {
    return {
        id: i.id,
        title: i.title,
        type: i.type,
        resources: Object.fromEntries(
            Object.entries(i.resources as Record<string, string>)
                .filter(([_, value]) => value)
                .map(([key, value]) => [key, `/api/resources/${value}`])
        )
    }
}

export function parseProjectListSchema(data: Project): ProjectListSchema {
    const i = data as unknown as ProjectModel
    return {
        ...parseProjectSimpleSchema(data),
        subtitles: i.subtitles.split("|").filter(s => s !== ""),
        description: i.description,
        keywords: i.keywords.split("|").filter(s => s !== ""),
        publishTime: i.publishTime,
        ratingS: i.ratingS !== null ? RATING_SEX_ITEMS[i.ratingS].value : null,
        ratingV: i.ratingV !== null ? RATING_VIOLENCE_ITEMS[i.ratingV].value : null,
        region: i.region as Region | null,
        createTime: i.createTime,
        updateTime: i.updateTime,
        creator: i.creator,
        updator: i.updator
    }
}

export function parseProjectDetailSchema(
    data: Project & { staffs: (ProjectStaffRelation & { staff: Staff })[]; tags: (ProjectTagRelation & { tag: Tag })[] },
    relations: ProjectRelationSchema,
    relationsTopology: ProjectRelationSchema
): ProjectDetailSchema {
    const tags = data.tags.map(t => ({ id: t.tag.id, name: t.tag.name, description: t.tag.description }))
    const staffs = Object.entries(arrays.groupByTo(data.staffs, s => s.staffType, s => parseStaffSchema(s.staff))).map(([type, members]) => ({
        type,
        members
    }))

    return {
        ...parseProjectListSchema(data),
        tags,
        staffs,
        relations,
        relationsTopology
    }
}
