"use server"
import type { Project, Record as PrismaRecord, RecordProgress } from "@/prisma/generated"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import {
    parseRecordActivityListSchema, parseRecordHistoryListSchema, parseRecordSubscriptionAnimeListSchema,
    parseRecordTimelineItemSchema, recordActivityListFilter, recordHistoryListFilter, recordSubscriptionAnimeListFilter, recordTimelineListFilter,
    RecordActivityListFilter, RecordActivityListSchema, RecordHistoryListFilter, RecordHistoryListSchema,
    RecordSubscriptionAnimeListFilter, RecordSubscriptionAnimeListSchema, RecordTimelineItemSchema, RecordTimelineListFilter
} from "@/schemas/record"
import type { EpisodePublishRecordModel } from "@/schemas/project"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { exceptionParamError, safeExecuteResult } from "@/constants/exception"
import { ListRecordError } from "@/schemas/error"
import { RecordStatus } from "@/constants/record"
import { getUserPreference } from "@/services/user-preference"
import { isEpisodeProjectType } from "@/constants/project"
import {
    passesSubscriptionMode, resolveServerTimeZone, isValidIanaTimeZone, parseEpisodePublishRecord, getNextPublishPlanItemAfterNow, nextPublishTimeFromItem, sortSubscriptionAnimeRows, 
    type SubscriptionAnimeSortRow
} from "@/helpers/subscription"

export async function listRecordActivity(filter: RecordActivityListFilter): Promise<Result<ListResult<RecordActivityListSchema>, ListRecordError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "read")
        const userId = await getUserId()

        const validate = recordActivityListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const where = {
            ownerId: userId,
            specialAttention: validate.data.specialAttention !== undefined ? validate.data.specialAttention === "true" : undefined,
            status: validate.data.status,
            project: {
                type: validate.data.type,
                OR: validate.data.search ? [
                    { title: { contains: validate.data.search } },
                    { subtitles: { contains: validate.data.search } },
                    { keywords: { contains: validate.data.search } }
                ] : undefined
            }
        }

        const [records, total] = await Promise.all([
            prisma.record.findMany({
                where,
                include: {
                    project: {
                        select: {
                            id: true,
                            type: true,
                            title: true,
                            resources: true,
                            episodeTotalNum: true
                        }
                    },
                    progresses: isEpisodeProjectType(validate.data.type) ? {
                        where: { isLatest: true },
                        select: {
                            episodeWatchedNum: true
                        },
                        take: 1
                    } : false
                },
                orderBy: {
                    lastActivityTime: "desc"
                },
                skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
                take: validate.data.size ?? 15
            }),
            prisma.record.count({ where })
        ])

        return ok({
            list: records.map(parseRecordActivityListSchema),
            total
        })
    })
}

export async function listRecordHistory(filter: RecordHistoryListFilter): Promise<Result<ListResult<RecordHistoryListSchema>, ListRecordError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "read")
        const userId = await getUserId()

        const validate = recordHistoryListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const page = validate.data.page ?? 1
        const size = validate.data.size ?? 15
        const skip = (page - 1) * size

        const where = {
            status: RecordStatus.COMPLETED,
            endTime: { not: null as null | undefined },
            isLatest: validate.data.progressKind === "latest" ? true : undefined,
            ordinal: validate.data.progressKind === "first" ? 1 : validate.data.progressKind === "rewatch" ? { gt: 1 } : undefined,
            record: {
                ownerId: userId,
                project: {
                    type: validate.data.type,
                    OR: validate.data.search ? [
                        { title: { contains: validate.data.search } },
                        { subtitles: { contains: validate.data.search } },
                        { keywords: { contains: validate.data.search } }
                    ] : undefined
                }
            }
        }

        const [rows, total] = await Promise.all([
            prisma.recordProgress.findMany({
                where,
                include: {
                    record: {
                        select: {
                            project: {
                                select: {
                                    id: true,
                                    type: true,
                                    title: true,
                                    resources: true,
                                    episodeTotalNum: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    endTime: "desc"
                },
                skip,
                take: size
            }),
            prisma.recordProgress.count({ where })
        ])

        return ok({
            list: rows.map(parseRecordHistoryListSchema),
            total
        })
    })
}

export async function listRecordTimeline(filter: RecordTimelineListFilter): Promise<Result<RecordTimelineItemSchema[], ListRecordError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "read")
        const userId = await getUserId()

        const validate = recordTimelineListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const rows = await prisma.recordProgress.findMany({
            where: {
                startTime: { not: null as null | undefined },
                record: {
                    ownerId: userId,
                    project: {
                        type: validate.data.type,
                    },
                },
            },
            include: {
                record: {
                    select: {
                        project: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                resources: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                startTime: "desc",
            },
        })

        const list = rows.map((row) => {
            let endTime = row.endTime
            if(isEpisodeProjectType(validate.data.type) && endTime === null) {
                const watchedTime = extractLastWatchedTime(row.episodeWatchedRecords)
                endTime = watchedTime ?? row.startTime
            }
            return parseRecordTimelineItemSchema(row, endTime)
        })

        return ok(list)
    })
}

export async function listRecordSubscriptionAnime(filter: RecordSubscriptionAnimeListFilter): Promise<Result<RecordSubscriptionAnimeListSchema[], ListRecordError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "read")
        const userId = await getUserId()

        const validate = recordSubscriptionAnimeListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const now = new Date()
        const preference = await getUserPreference(userId)
        const inputTimezone = validate.data.timezone && isValidIanaTimeZone(validate.data.timezone)
            ? validate.data.timezone
            : null
        const timeZone = inputTimezone ?? preference.timezone ?? resolveServerTimeZone()
        const nightTimeTable = validate.data.nightTimeTable ?? preference.nightTimeTable
        const direction = validate.data.orderDirection === "desc" ? -1 : 1

        const where = {
            ownerId: userId,
            specialAttention: true,
            project: {
                type: "ANIME" as const,
                OR: validate.data.search ? [
                    { title: { contains: validate.data.search } },
                    { subtitles: { contains: validate.data.search } },
                    { keywords: { contains: validate.data.search } }
                ] : undefined
            }
        }

        const records = await prisma.record.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        resources: true,
                        episodeTotalNum: true,
                        episodePublishedNum: true,
                        episodePublishPlan: true
                    }
                },
                progresses: {
                    where: { isLatest: true },
                    select: { episodeWatchedNum: true },
                    take: 1
                }
            }
        }) as SubscriptionAnimeRecordRow[]

        const mode = validate.data.mode
        const withPlan: RowWithPlan[] = []
        for (const record of records) {
            const plan = parseEpisodePublishRecord(record.project.episodePublishPlan)
            const hasPublishPlan = plan.length > 0
            const nextPublishPlanItem = getNextPublishPlanItemAfterNow(plan, now)
            const nextPublishTime = nextPublishTimeFromItem(nextPublishPlanItem)
            const hasProgress = record.progresses.length > 0
            const watched = record.progresses[0]?.episodeWatchedNum ?? null

            if (!passesSubscriptionMode(mode, hasProgress, watched, record.project.episodePublishedNum, record.project.episodeTotalNum, hasPublishPlan)) {
                continue
            }
            withPlan.push({ record, nextPublishPlanItem, nextPublishTime })
        }

        const sortRows: SubscriptionAnimeSortRow[] = withPlan.map(({ record, nextPublishTime }) => {
            const watched = record.progresses[0]?.episodeWatchedNum ?? null
            return {
                recordId: record.id,
                watchedEpisodes: watched,
                publishedEpisodes: record.project.episodePublishedNum ?? 0,
                subscriptionTime: record.createTime,
                status: record.status,
                nextPublishTime
            }
        })

        const sorted = sortSubscriptionAnimeRows(sortRows, validate.data.order, direction, {
            now,
            timeZone,
            nightTimeTable
        })

        const orderIndex = new Map(sorted.map((r, i) => [r.recordId, i]))
        const rowsOrdered = [...withPlan].sort((a, b) => (orderIndex.get(a.record.id)! - orderIndex.get(b.record.id)!))

        const list = rowsOrdered.map(({ record, nextPublishPlanItem }) => parseRecordSubscriptionAnimeListSchema(record, nextPublishPlanItem))

        return ok(list)
    })
}

type SubscriptionAnimeRecordRow = PrismaRecord & {
    project: Pick<Project, "id" | "type" | "title" | "resources"> & {
        episodeTotalNum: number | null
        episodePublishedNum: number | null
        episodePublishPlan: unknown
    }
    progresses: Pick<RecordProgress, "episodeWatchedNum">[]
}

type RowWithPlan = {
    record: SubscriptionAnimeRecordRow
    nextPublishPlanItem: EpisodePublishRecordModel | null
    nextPublishTime: Date | null
}

function extractLastWatchedTime(value: unknown): Date | null {
    if(!(value instanceof Array)) return null
    for(let i = value.length - 1; i >= 0; i--) {
        const item = value[i]
        if(item && typeof item === "object" && "watchedTime" in item) {
            const watchedTime = (item as { watchedTime?: unknown }).watchedTime
            if(typeof watchedTime === "string") {
                const d = new Date(watchedTime)
                if(!Number.isNaN(d.getTime())) return d
            }
        }
    }
    return null
}