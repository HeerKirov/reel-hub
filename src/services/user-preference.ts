"use server"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { err, ok, type Result } from "@/schemas/all"
import { exceptionParamError } from "@/constants/exception"
import { safeExecute, safeExecuteTransaction } from "@/helpers/execution"
import { type GetUserPreferenceError, type SetUserPreferenceError } from "@/schemas/error"
import {
    USER_PREFERENCE_DEFAULT, parseUserPreferenceSchema, userPreferenceSetForm, type UserPreferenceSchema, type UserPreferenceSetForm
} from "@/schemas/user-preference"
import { requireAuth } from "@/helpers/auth-guard"
import { isValidIanaTimeZone } from "@/helpers/subscription"

export const retrieveUserPreference = cache(async function(): Promise<Result<UserPreferenceSchema, GetUserPreferenceError>> {
    return safeExecute(async () => {
        const session = await requireAuth()
        const preference = await getUserPreference(session.user.id)
        return ok(preference)
    })
})

export async function updateUserPreference(form: UserPreferenceSetForm): Promise<Result<UserPreferenceSchema, SetUserPreferenceError>> {
    return safeExecuteTransaction(async tx => {
        const session = await requireAuth()
        const userId = session.user.id
        const validate = userPreferenceSetForm.safeParse(form)
        if (!validate.success) return err(exceptionParamError(validate.error.message))

        const data = validate.data
        if (data.timezone != null && !isValidIanaTimeZone(data.timezone)) {
            return err(exceptionParamError("Invalid timezone"))
        }

        const row = await tx.userPreference.upsert({
            where: { userId },
            create: {
                userId,
                timezone: data.timezone ?? USER_PREFERENCE_DEFAULT.timezone,
                autoTimezone: data.autoTimezone ?? USER_PREFERENCE_DEFAULT.autoTimezone,
                nightTimeTable: data.nightTimeTable ?? USER_PREFERENCE_DEFAULT.nightTimeTable
            },
            update: {
                timezone: data.timezone,
                autoTimezone: data.autoTimezone,
                nightTimeTable: data.nightTimeTable
            }
        })

        return ok(parseUserPreferenceSchema(row))
    })
}

export async function getUserPreference(userId: string): Promise<UserPreferenceSchema> {
    const row = await prisma.userPreference.findUnique({ where: { userId } })
    if (!row) {
        return {
            timezone: USER_PREFERENCE_DEFAULT.timezone,
            autoTimezone: USER_PREFERENCE_DEFAULT.autoTimezone,
            nightTimeTable: USER_PREFERENCE_DEFAULT.nightTimeTable
        }
    }
    const parsed = parseUserPreferenceSchema(row)
    return {
        ...parsed,
        timezone: parsed.timezone != null && isValidIanaTimeZone(parsed.timezone)
            ? parsed.timezone
            : null
    }
}
