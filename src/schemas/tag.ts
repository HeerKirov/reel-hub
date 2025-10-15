import { z } from "zod"
import { PROJECT_TYPE } from "@/constants/project"
import { Tag } from "@/prisma/generated"

export const tagModel = z.object({
    id: z.number(),
    type: z.enum(PROJECT_TYPE),
    name: z.string(),
    description: z.string(),
    createTime: z.date(),
    updateTime: z.date(),
    creator: z.string(),
    updator: z.string()
})

export const tagListFilter = z.object({
    type: z.enum(PROJECT_TYPE),
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export const tagCreateFormSchema = z.object({
    type: z.enum(PROJECT_TYPE),
    name: z.string().min(1),
    description: z.string()
})

export const tagUpdateFormSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional()
})

export const tagSchema = tagCreateFormSchema.extend({
    id: z.number()
})

export function parseTagSchema(data: Tag): TagSchema {
    const i = data as TagModel
    return {
        id: i.id,
        type: i.type,
        name: i.name,
        description: i.description,
    }
}

export type TagModel = z.infer<typeof tagModel>

export type TagListFilter = z.infer<typeof tagListFilter>

export type TagCreateFormSchema = z.infer<typeof tagCreateFormSchema>

export type TagUpdateFormSchema = z.infer<typeof tagUpdateFormSchema>

export type TagSchema = z.infer<typeof tagSchema>


