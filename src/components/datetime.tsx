import { cache } from "react"
import { cookies } from "next/headers"
import { Text, type TextProps } from "@chakra-ui/react"
import { DISPLAY_TIMEZONE_COOKIE } from "@/constants/system"
import { getUserPreference } from "@/services/user-preference"
import { getUserIdOrNull } from "@/helpers/next"
import { dates, type DisplayDatetimeVariant } from "@/helpers/primitive"

export type { DisplayDatetimeVariant }

export type FormattedDateTimeProps = Omit<TextProps, "children"> & {
    value: Date | string | number | null | undefined
    variant: DisplayDatetimeVariant
    /** 用于 dailyText 的「今天/昨天」；默认当前服务端时刻（通常与 cookie 时区一致即可） */
    now?: Date | string | number
    locale?: string
    emptyLabel?: string
}

export async function FormattedDateTime({ value, variant, now, locale = "zh-CN", emptyLabel = "—", ...textProps }: FormattedDateTimeProps) {
    const timeZone = await getDisplayTimeZone()
    const nowDate = now !== undefined ? (now instanceof Date ? now : new Date(now)) : new Date()
    const text = dates.formatDisplayDatetime(value, variant, timeZone, locale, nowDate, emptyLabel)
    return <Text {...textProps}>{text}</Text>
}

/**
 * 单次请求内多次调用只解析一次：cookie → 登录用户 preference → 服务器默认时区。
 * 读 cookie 开销极小；与 preference 查询一起被 React cache 去重。
 */
const getDisplayTimeZone = cache(async function getDisplayTimeZone(): Promise<string> {
    const jar = await cookies()
    const raw = jar.get(DISPLAY_TIMEZONE_COOKIE)?.value
    if(raw && dates.isValidIanaTimeZone(raw)) return raw

    const userId = await getUserIdOrNull()
    if(userId) {
        const pref = await getUserPreference(userId)
        if(pref.timezone && dates.isValidIanaTimeZone(pref.timezone)) return pref.timezone
    }

    return dates.resolveTimeZone()
})