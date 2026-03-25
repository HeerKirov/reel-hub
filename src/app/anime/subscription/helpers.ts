import { numbers } from "@/helpers/primitive"
import { NIGHT_TIME_TABLE_HOUR_OFFSET } from "@/helpers/subscription"
import { EpisodePublishRecordModel } from "@/schemas/project"


const weekdayName = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const

function firstDayOfWeek(now: Date): Date {
    const t = new Date(now.getTime())
    const day = t.getDay()
    const offsetToMonday = day === 0 ? -6 : 1 - day
    t.setDate(t.getDate() + offsetToMonday)
    t.setHours(0, 0, 0, 0)
    return t
}

function fmt(n: number): string {
    return numbers.zero(n, 2)
}

export function toWeekdayTableTime(dateInput: Date, now?: Date, nightDelay?: number): string {
    const nowRef = now ?? new Date()
    const date = new Date(dateInput.getTime())
    if (nightDelay) date.setHours(date.getHours() - nightDelay)

    const weekday = date.getDay()
    const diff = Math.floor((date.getTime() - firstDayOfWeek(nowRef).getTime()) / (1000 * 60 * 60 * 24))

    const prefix =
        diff < 7 ? `本${weekdayName[weekday]}` :
        diff < 14 ? `下${weekdayName[weekday]}` :
        `${date.getFullYear() !== nowRef.getFullYear() ? `${date.getFullYear()}年` : ""}${date.getMonth() + 1}月${date.getDate()}日`

    const suffix =
        date.getFullYear() !== nowRef.getFullYear()
            ? ""
            : `${fmt(date.getHours() + (nightDelay || 0))}:${fmt(date.getMinutes())}`

    return prefix + suffix
}

export function formatNextPublishLine(plan: EpisodePublishRecordModel, now = new Date(), nightDelay = NIGHT_TIME_TABLE_HOUR_OFFSET): string {
    if (!plan.publishTime) return "待公布"
    const d = new Date(plan.publishTime)
    if (Number.isNaN(d.getTime())) return "待公布"
    const ep = plan.actualEpisodeNum ?? plan.index
    return `${toWeekdayTableTime(d, now, nightDelay)} 第${ep}话`
}