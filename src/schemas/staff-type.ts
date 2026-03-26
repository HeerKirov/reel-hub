import { z } from "zod"
import { PROJECT_TYPE } from "@/constants/project"
import { ProjectType } from "@/prisma/generated"

// =============================================================================
// Model / API Return
// =============================================================================

export interface StaffTypeSchema {
    staffType: string
    projectType: ProjectType
}

// =============================================================================
// Filter
// =============================================================================

export const staffTypeListFilter = z.object({
    projectType: z.enum(PROJECT_TYPE),
    search: z.string().optional()
})

export type StaffTypeListFilter = z.infer<typeof staffTypeListFilter>

