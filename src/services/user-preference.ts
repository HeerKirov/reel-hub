"use server"
import { exceptionParamError } from "@/constants/exception"
import { err, ok, type Result } from "@/schemas/all"
import { type GetUserPreferenceError, type SetUserPreferenceError } from "@/schemas/error"
import { USER_PREFERENCE_DEFAULT, parseUserPreferenceSchema, userPreferenceSetForm, type UserPreferenceSchema, type UserPreferenceSetForm } from "@/schemas/user-preference"
import { safeExecute, safeExecuteTransaction } from "@/helpers/execution"
import { requireAuth } from "@/helpers/auth-guard"
import { dates } from "@/helpers/primitive"
import { getUserPreference } from "@/services/user-preference-utils"

export async function retrieveUserPreference(): Promise<Result<UserPreferenceSchema, GetUserPreferenceError>> {
    return safeExecute(async () => {
        const session = await requireAuth()
        const preference = await getUserPreference(session.user.id)
        return ok(preference)
    })
}

export async function updateUserPreference(form: UserPreferenceSetForm): Promise<Result<UserPreferenceSchema, SetUserPreferenceError>> {
    return safeExecuteTransaction(async tx => {
        const session = await requireAuth()
        const userId = session.user.id
        const validate = userPreferenceSetForm.safeParse(form)
        if (!validate.success) return err(exceptionParamError(validate.error.message))

        const data = validate.data
        if (data.timezone != null && !dates.isValidIanaTimeZone(data.timezone)) {
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
