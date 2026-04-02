import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DISPLAY_TIMEZONE_COOKIE } from "@/constants/system"
import { USER_PREFERENCE_DEFAULT, parseUserPreferenceSchema, type UserPreferenceSchema } from "@/schemas/user-preference"
import { getUserIdOrNull } from "@/helpers/next"
import { dates } from "@/helpers/primitive"

const getValidatedTimezone = (timezone: string | null): string | null => {
    if(!timezone) return null
    return dates.isValidIanaTimeZone(timezone) ? timezone : null
}

export const getUserPreference = cache(async function getUserPreference(userId: string): Promise<UserPreferenceSchema> {
    const row = await prisma.userPreference.findUnique({ where: { userId } })
    if(!row) {
        return {
            timezone: USER_PREFERENCE_DEFAULT.timezone,
            autoTimezone: USER_PREFERENCE_DEFAULT.autoTimezone,
            nightTimeTable: USER_PREFERENCE_DEFAULT.nightTimeTable
        }
    }

    const parsed = parseUserPreferenceSchema(row)
    return {
        ...parsed,
        timezone: getValidatedTimezone(parsed.timezone) ?? null
    }
})

/**
 * 单次请求内多次调用只解析一次：cookie → 登录用户 preference → 服务器默认时区。
 * 读 cookie 开销极小；与 preference 查询一起被 React cache 去重。
 */
export const getDisplayTimeZone = cache(async function getDisplayTimeZone(): Promise<string> {
    const jar = await cookies()
    const raw = jar.get(DISPLAY_TIMEZONE_COOKIE)?.value
    const cookieTz = getValidatedTimezone(raw ?? null)
    if(cookieTz) return cookieTz

    const userId = await getUserIdOrNull()
    if(userId) {
        const pref = await getUserPreference(userId)
        if(pref.timezone) return pref.timezone
    }

    return dates.resolveTimeZone()
})

