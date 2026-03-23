import { z } from "zod"
import { PROJECT_TYPE } from "@/constants/project"
import { ProjectType, Tag } from "@/prisma/generated"

// =============================================================================
// Model
// =============================================================================

export interface TagModel {
    id: number
    type: ProjectType
    name: string
    description: string
    createTime: Date
    updateTime: Date
    creator: string
    updator: string
}

// =============================================================================
// Schema — API 返回
// =============================================================================

export interface TagSchema {
    id: number
    type: ProjectType
    name: string
    description: string
}

// =============================================================================
// Filter
// =============================================================================

export const tagListFilter = z.object({
    type: z.enum(PROJECT_TYPE),
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export type TagListFilter = z.infer<typeof tagListFilter>

// =============================================================================
// Form
// =============================================================================

export const tagCreateFormSchema = z.object({
    type: z.enum(PROJECT_TYPE),
    name: z.string().min(1),
    description: z.string()
})

export const tagUpdateFormSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional()
})

export type TagCreateFormSchema = z.infer<typeof tagCreateFormSchema>

export type TagUpdateFormSchema = z.infer<typeof tagUpdateFormSchema>

// =============================================================================
// Parse
// =============================================================================

export function parseTagSchema(data: Tag): TagSchema {
    const i = data as TagModel
    return {
        id: i.id,
        type: i.type,
        name: i.name,
        description: i.description
    }
}
