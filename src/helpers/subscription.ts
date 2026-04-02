import type { RecordStatus } from "@/constants/record"
import type { RecordSubscriptionAnimeListFilter } from "@/schemas/record"
import type { EpisodePublishRecordModel } from "@/schemas/project"

export function parseEpisodePublishRecord(json: unknown): EpisodePublishRecordModel[] {
    if (!Array.isArray(json)) return []
    return json as EpisodePublishRecordModel[]
}

/** 当前时刻之后的下一项计划（用于展示与排序中的「下次更新时间」） */
export function getNextPublishPlanItemAfterNow(plan: EpisodePublishRecordModel[], now: Date): EpisodePublishRecordModel | null {
    const withTime = plan
        .filter((p): p is EpisodePublishRecordModel & { publishTime: string } => !!p.publishTime)
        .map(p => ({ ...p, date: new Date(p.publishTime!) }))
        .filter(p => p.date.getTime() > now.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
    const first = withTime[0]
    if (!first) return null
    const { date: _d, ...rest } = first
    return rest
}

export function nextPublishTimeFromItem(item: EpisodePublishRecordModel | null): Date | null {
    if (!item?.publishTime) return null
    const d = new Date(item.publishTime)
    return Number.isNaN(d.getTime()) ? null : d
}

export function passesSubscriptionMode(
    mode: RecordSubscriptionAnimeListFilter["mode"],
    hasProgress: boolean,
    watched: number | null,
    publishedRaw: number | null,
    totalRaw: number | null,
    hasPublishPlan: boolean
): boolean {
    const publishedNum = publishedRaw ?? 0
    const totalNum = totalRaw ?? 0
    const w = watched ?? 0
    switch (mode) {
        case "active":
            return (hasProgress && w < publishedNum) || hasPublishPlan
        case "watchable":
            return hasProgress && w < publishedNum
        case "updating":
            return hasPublishPlan
        case "completed":
            return totalRaw != null && publishedRaw != null && publishedRaw === totalRaw && totalRaw > 0
        case "shelve":
            return (
                totalRaw != null &&
                publishedRaw != null &&
                publishedRaw < totalRaw &&
                w === publishedNum &&
                !hasPublishPlan
            )
        default:
            return false
    }
}

/** 与 Kotlin 侧「深夜档」对齐：在计算周内时间前从计划时刻减去的小时数 */
export const NIGHT_TIME_TABLE_HOUR_OFFSET = 8

/** 「最近两周」窗口（周数差 ≤ 该值则视为同一排序策略） */
export const WEEK_DURATION_AVAILABLE = 2

export type SubscriptionAnimeOrderKind = "weekly_calendar" | "update_soon" | "subscription_time"

export interface SubscriptionAnimeSortRow {
    recordId: number
    watchedEpisodes: number | null
    publishedEpisodes: number
    subscriptionTime: Date
    status: RecordStatus
    /** 下一话计划时间（仅用于排序与 update_soon），无计划则为 null */
    nextPublishTime: Date | null
}

function getIsoWeekdayLongNameInZone(d: Date, timeZone: string): string {
    // 使用 timeZone: timeZone，避免打包器把参数改名后仍保留 { timeZone } 简写导致运行时报 timeZone is not defined
    return new Intl.DateTimeFormat("en-US", { timeZone: timeZone, weekday: "long" }).format(d)
}

const ISO_WEEKDAY: Record<string, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7
}

function getIsoWeekdayInZone(d: Date, timeZone: string): number {
    const name = getIsoWeekdayLongNameInZone(d, timeZone)
    return ISO_WEEKDAY[name] ?? 1
}

function getMinuteOfDayInZone(d: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d)
    const h = parseInt(parts.find(p => p.type === "hour")!.value, 10)
    const m = parseInt(parts.find(p => p.type === "minute")!.value, 10)
    return h * 60 + m
}

/** 对应 Kotlin：weekday * 60 * 24 + MINUTE_OF_DAY（在 night 偏移后、指定时区下） */
export function computeTimeInWeek(datetime: Date, timeZone: string, nightTimeTable: boolean): number {
    const adjusted = nightTimeTable
        ? new Date(datetime.getTime() - NIGHT_TIME_TABLE_HOUR_OFFSET * 60 * 60 * 1000)
        : datetime
    const weekday = getIsoWeekdayInZone(adjusted, timeZone)
    const minute = getMinuteOfDayInZone(adjusted, timeZone)
    return weekday * 60 * 24 + minute
}

/** 与 ChronoUnit.WEEKS.between(now, target) 近似：整周差（目标晚于当前时为正） */
export function weekDurationBetween(now: Date, target: Date): number {
    return Math.floor((target.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

/** 无计划分支：与 Kotlin 一致，订阅时间/id/完结态比较不乘 direction，仅「有存货优先」乘 direction */
function cmpNoPlanPair(
    a: SubscriptionAnimeSortRow,
    b: SubscriptionAnimeSortRow,
    direction: number
): number {
    const aWatched = a.watchedEpisodes ?? 0
    const bWatched = b.watchedEpisodes ?? 0
    if (aWatched < a.publishedEpisodes && bWatched < b.publishedEpisodes) {
        return a.subscriptionTime.getTime() - b.subscriptionTime.getTime()
    }
    if (aWatched >= a.publishedEpisodes && bWatched >= b.publishedEpisodes) {
        const aDone = a.status === "COMPLETED"
        const bDone = b.status === "COMPLETED"
        if (aDone === bDone) {
            return a.recordId - b.recordId
        }
        return aDone ? -1 : 1
    }
    if (aWatched < a.publishedEpisodes) return -direction
    return direction
}

function toAdjustedNextPublishInstant(raw: Date, nightTimeTable: boolean): Date {
    return nightTimeTable
        ? new Date(raw.getTime() - NIGHT_TIME_TABLE_HOUR_OFFSET * 60 * 60 * 1000)
        : new Date(raw.getTime())
}

function sortWeeklyCalendar(
    rows: SubscriptionAnimeSortRow[],
    direction: number,
    now: Date,
    timeZone: string,
    nightTimeTable: boolean
): SubscriptionAnimeSortRow[] {
    type Enriched = {
        row: SubscriptionAnimeSortRow
        sortTime: Date | null
        weekDur: number
        timeInWeek: number
    }
    const enriched: Enriched[] = rows.map(row => {
        const t = row.nextPublishTime
        if (!t) {
            return { row, sortTime: null, weekDur: 0, timeInWeek: 0 }
        }
        const sortTime = toAdjustedNextPublishInstant(t, nightTimeTable)
        const weekDur = weekDurationBetween(now, sortTime)
        const timeInWeek = computeTimeInWeek(sortTime, timeZone, false)
        return { row, sortTime, weekDur, timeInWeek }
    })
    enriched.sort((ea, eb) => {
        const aTime = ea.sortTime
        const bTime = eb.sortTime
        const aWeekDuration = ea.weekDur
        const bWeekDuration = eb.weekDur
        const aMinute = ea.timeInWeek
        const bMinute = eb.timeInWeek
        if (aTime != null && bTime != null) {
            if (aWeekDuration <= WEEK_DURATION_AVAILABLE && bWeekDuration <= WEEK_DURATION_AVAILABLE) {
                if (aMinute !== bMinute) {
                    return (aMinute - bMinute) * direction
                }
                return (ea.row.recordId - eb.row.recordId) * direction
            }
            if (aWeekDuration > WEEK_DURATION_AVAILABLE && bWeekDuration > WEEK_DURATION_AVAILABLE) {
                return (aTime.getTime() - bTime.getTime()) * direction
            }
            if (aWeekDuration <= WEEK_DURATION_AVAILABLE) return -direction
            return direction
        }
        if (aTime == null && bTime == null) {
            return cmpNoPlanPair(ea.row, eb.row, direction)
        }
        if (aTime != null) return -direction
        return direction
    })
    return enriched.map(e => e.row)
}

function sortUpdateSoon(rows: SubscriptionAnimeSortRow[], direction: number, now: Date): SubscriptionAnimeSortRow[] {
    type Enriched = { row: SubscriptionAnimeSortRow; minutes: number | null }
    const enriched: Enriched[] = rows.map(row => ({
        row,
        minutes: row.nextPublishTime != null
            ? (row.nextPublishTime.getTime() - now.getTime()) / (60 * 1000)
            : null
    }))
    enriched.sort((ea, eb) => {
        const aDuration = ea.minutes
        const bDuration = eb.minutes
        if (aDuration != null && bDuration != null) {
            return (aDuration - bDuration) * direction
        }
        if (aDuration == null && bDuration == null) {
            return cmpNoPlanPair(ea.row, eb.row, direction)
        }
        if (aDuration != null) return -direction
        return direction
    })
    return enriched.map(e => e.row)
}

function sortSubscriptionTime(rows: SubscriptionAnimeSortRow[], direction: number): SubscriptionAnimeSortRow[] {
    const copy = [...rows]
    copy.sort((a, b) => (a.subscriptionTime.getTime() - b.subscriptionTime.getTime()) * direction)
    return copy
}

export function sortSubscriptionAnimeRows(
    rows: SubscriptionAnimeSortRow[],
    order: SubscriptionAnimeOrderKind,
    direction: number,
    options: { now: Date; timeZone: string; nightTimeTable: boolean }
): SubscriptionAnimeSortRow[] {
    const { now, timeZone, nightTimeTable } = options
    if (order === "weekly_calendar") {
        return sortWeeklyCalendar(rows, direction, now, timeZone, nightTimeTable)
    }
    if (order === "update_soon") {
        return sortUpdateSoon(rows, direction, now)
    }
    return sortSubscriptionTime(rows, direction)
}
