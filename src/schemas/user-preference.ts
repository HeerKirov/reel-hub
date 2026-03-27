import { z } from "zod"
import type { UserPreference } from "@/prisma/generated"

// =============================================================================
// Model
// =============================================================================

export interface UserPreferenceModel {
    userId: string
    timezone: string | null
    autoTimezone: boolean
    nightTimeTable: boolean
}

// =============================================================================
// Schema — API 返回
// =============================================================================

export const USER_PREFERENCE_DEFAULT = {
    timezone: null,
    autoTimezone: true,
    nightTimeTable: true
} as const

export interface UserPreferenceSchema {
    timezone: string | null
    autoTimezone: boolean
    nightTimeTable: boolean
}

// =============================================================================
// Form
// =============================================================================

export const userPreferenceSetForm = z.object({
    timezone: z.string().nullable().optional(),
    autoTimezone: z.boolean().optional(),
    nightTimeTable: z.boolean().optional()
})

export type UserPreferenceSetForm = z.infer<typeof userPreferenceSetForm>

// =============================================================================
// Parse
// =============================================================================

export function parseUserPreferenceSchema(data: UserPreference): UserPreferenceSchema {
    const m = data as UserPreferenceModel
    return {
        timezone: m.timezone,
        autoTimezone: m.autoTimezone,
        nightTimeTable: m.nightTimeTable
    }
}
