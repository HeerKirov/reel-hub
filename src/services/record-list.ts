"use server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import {
    parseRecordActivityListSchema, parseRecordHistoryListSchema, recordActivityListFilter, recordHistoryListFilter,
    RecordActivityListFilter, RecordActivityListSchema, RecordHistoryListFilter, RecordHistoryListSchema
} from "@/schemas/record"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { exceptionParamError, safeExecuteResult } from "@/constants/exception"
import { ListRecordActivityError, ListRecordHistoryError } from "@/schemas/error"
import { RecordStatus } from "@/constants/record"

export async function listRecordActivity(filter: RecordActivityListFilter): Promise<Result<ListResult<RecordActivityListSchema>, ListRecordActivityError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "read")
        const userId = await getUserId()

        const validate = recordActivityListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const where = {
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
                    progresses: validate.data.type === "ANIME" ? {
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

export async function listRecordHistory(filter: RecordHistoryListFilter): Promise<Result<ListResult<RecordHistoryListSchema>, ListRecordHistoryError>> {
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