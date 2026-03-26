import { z } from "zod"
import { PROJECT_TYPE } from "@/constants/project"
import { Staff } from "@/prisma/generated"

// =============================================================================
// Model
// =============================================================================

export interface StaffModel {
    id: number
    name: string
    otherNames: string
    description: string
    createTime: Date
    updateTime: Date
    creator: string
    updator: string
}

// =============================================================================
// Schema — API 返回
// =============================================================================

export interface StaffSchema {
    id: number
    name: string
    otherNames: string[]
    description: string
}

// =============================================================================
// Filter
// =============================================================================

export const staffListFilter = z.object({
    type: z.enum(PROJECT_TYPE).optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export type StaffListFilter = z.infer<typeof staffListFilter>

// =============================================================================
// Form
// =============================================================================

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

export type StaffCreateFormSchema = z.infer<typeof staffCreateFormSchema>

export type StaffUpdateFormSchema = z.infer<typeof staffUpdateFormSchema>

// =============================================================================
// Parse
// =============================================================================

export function parseStaffSchema(data: Staff): StaffSchema {
    const i = data as StaffModel
    return {
        id: i.id,
        name: i.name,
        otherNames: i.otherNames.split("|"),
        description: i.description
    }
}
