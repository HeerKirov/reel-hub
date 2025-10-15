import { z } from "zod"
import { Staff } from "@/prisma/generated"

export const staffModel = z.object({
    id: z.number(),
    name: z.string(),
    otherNames: z.string(),
    description: z.string(),
    createTime: z.date(),
    updateTime: z.date(),
    creator: z.string(),
    updator: z.string()
})

export const staffListFilter = z.object({
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export type StaffListFilter = z.infer<typeof staffListFilter>

export const staffCreateFormSchema = z.object({
    name: z.string().min(1),
    otherNames: z.array(z.string()),
    description: z.string()
})

export const staffUpdateFormSchema = z.object({
    name: z.string().min(1).optional(),
    otherNames: z.array(z.string()).optional(),
    description: z.string().optional()
})

export const staffSchema = z.object({
    id: z.number(),
    name: z.string(),
    otherNames: z.array(z.string()),
    description: z.string()
})

export function parseStaffSchema(data: Staff): StaffSchema {
    const i = data as StaffModel
    return {
        id: i.id,
        name: i.name,
        otherNames: i.otherNames.split("|"),
        description: i.description,
    }
}

export type StaffModel = z.infer<typeof staffModel>

export type StaffCreateFormSchema = z.infer<typeof staffCreateFormSchema>

export type StaffUpdateFormSchema = z.infer<typeof staffUpdateFormSchema>

export type StaffSchema = z.infer<typeof staffSchema> 