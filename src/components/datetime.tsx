import { Text, type TextProps } from "@chakra-ui/react"
import { getDisplayTimeZone } from "@/services/user-preference-utils"
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
