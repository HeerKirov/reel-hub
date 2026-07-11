import { numbers } from "@/helpers/primitive"
import { NIGHT_TIME_TABLE_HOUR_OFFSET } from "@/helpers/subscription"
import { EpisodePublishRecordModel } from "@/schemas/project"


const weekdayName = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const

const EN_WEEKDAY_TO_SUN0: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
}

function zonedYmdHm(d: Date, timeZone: string): { y: number, m: number, day: number, h: number, min: number } {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    const o: Record<string, string> = {}
    for (const p of f.formatToParts(d)) {
        if (p.type !== "literal" && p.type !== "timeZoneName") o[p.type] = p.value
    }
    // 少数环境午夜会给出 24:00，归一到 0
    const h = +o.hour === 24 ? 0 : +o.hour
    return { y: +o.year, m: +o.month, day: +o.day, h, min: +o.minute }
}

function zonedWeekdaySun0(d: Date, timeZone: string): number {
    const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(d)
    return EN_WEEKDAY_TO_SUN0[name] ?? 0
}

function dateKey(y: number, m: number, day: number): string {
    return `${y}-${numbers.zero(m, 2)}-${numbers.zero(day, 2)}`
}

function addCalendarDays(key: string, delta: number): string {
    const [y, m, d] = key.split("-").map(Number)
    const u = new Date(Date.UTC(y, m - 1, d + delta))
    return dateKey(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate())
}

function daysBetweenKeys(fromKey: string, toKey: string): number {
    const [y1, m1, d1] = fromKey.split("-").map(Number)
    const [y2, m2, d2] = toKey.split("-").map(Number)
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

/** 指定时区下，包含 now 的那一周的周一日历日 */
function mondayKeyOfWeek(now: Date, timeZone: string): string {
    const parts = zonedYmdHm(now, timeZone)
    const weekday = zonedWeekdaySun0(now, timeZone)
    const offsetToMonday = weekday === 0 ? -6 : 1 - weekday
    return addCalendarDays(dateKey(parts.y, parts.m, parts.day), offsetToMonday)
}

function fmt(n: number): string {
    return numbers.zero(n, 2)
}

export function toWeekdayTableTime(dateInput: Date, timeZone: string, now?: Date, nightDelay?: number): string {
    const nowRef = now ?? new Date()
    const forWeekday = nightDelay
        ? new Date(dateInput.getTime() - nightDelay * 60 * 60 * 1000)
        : dateInput

    const adj = zonedYmdHm(forWeekday, timeZone)
    const weekday = zonedWeekdaySun0(forWeekday, timeZone)
    const diff = daysBetweenKeys(mondayKeyOfWeek(nowRef, timeZone), dateKey(adj.y, adj.m, adj.day))
    const nowParts = zonedYmdHm(nowRef, timeZone)

    const prefix =
        diff < 7 ? `本${weekdayName[weekday]}` :
        diff < 14 ? `下${weekdayName[weekday]}` :
        `${adj.y !== nowParts.y ? `${adj.y}年` : ""}${adj.m}月${adj.day}日`

    // 深夜档：用偏移后时刻的时分 + nightDelay，得到 24 点制（如周日 0 点 → 周六 24:00）
    const displayH = adj.h + (nightDelay || 0)
    const suffix = adj.y !== nowParts.y ? "" : `${fmt(displayH)}:${fmt(adj.min)}`

    return prefix + suffix
}

export function formatNextPublishLine(plan: EpisodePublishRecordModel, timeZone: string, nightTimeTable: boolean, now = new Date()): string {
    if (!plan.publishTime) return "待公布"
    const d = new Date(plan.publishTime)
    if (Number.isNaN(d.getTime())) return "待公布"
    const ep = plan.actualEpisodeNum ?? plan.index
    const nightDelay = nightTimeTable ? NIGHT_TIME_TABLE_HOUR_OFFSET : undefined
    return `${toWeekdayTableTime(d, timeZone, now, nightDelay)} 第${ep}话`
}
