import { z } from "zod"
import type { Project, Record as PrismaRecord, RecordProgress } from "@/prisma/generated"
import { RECORD_STATUS, FOLLOW_TYPE, RecordStatus, FollowType } from "@/constants/record"
import { PROJECT_TYPE } from "@/constants/project"
import { parseProjectSimpleSchema, type ProjectSimpleSchema } from "./project"

// =============================================================================
// Model
// =============================================================================

export interface ActivityEvent {
    type: "CREATE_RECORD" | "CREATE_PROGRESS" | "WATCH_EPISODE" | "EDIT_PROGRESS"
    episodeNum?: number
}

export interface RecordModel {
    id: number
    ownerId: string
    projectId: string
    specialAttention: boolean
    status: RecordStatus
    progressCount: number
    startTime: Date | null
    endTime: Date | null
    lastActivityTime: Date | null
    lastActivityEvent: Record<string, unknown>
    createTime: Date
    updateTime: Date
}

export type EpisodeWatchedRecordEntry = { watchedTime: string } | null

export interface RecordProgressModel {
    id: number
    projectId: string
    recordId: number
    ordinal: number
    isLatest: boolean
    status: RecordStatus
    startTime: Date | null
    endTime: Date | null
    createTime: Date
    updateTime: Date
    episodeWatchedNum: number | null
    episodeWatchedRecords: EpisodeWatchedRecordEntry[] | null
    followType: FollowType | null
    platform: string[]
}

// =============================================================================
// Schema — API 返回
// =============================================================================

export interface RecordSubscriptionProjectSchema extends ProjectSimpleSchema {
    episodeTotalNum: number | null
    episodePublishedNum: number | null
    platform: string[]
}

export interface RecordSubscriptionSchema {
    project: RecordSubscriptionProjectSchema
    episodeWatchedNum: number | null
    followType: FollowType | null
    platform: string[]
}

export interface RecordPreviewSchema {
    specialAttention: boolean
    status: RecordStatus
    progressCount: number
    startTime: Date | null
    endTime: Date | null
    episodeWatchedNum: number | null
    latestWatchedTime: Date | null
}

export interface RecordProgressDetailItem {
    ordinal: number
    isLatest: boolean
    status: RecordStatus
    startTime: Date | null
    endTime: Date | null
    episodeWatchedNum: number | null
    episodeWatchedRecords: EpisodeWatchedRecordEntry[] | null
    followType: FollowType | null
    platform: string[]
}

export interface RecordDetailSchema {
    specialAttention: boolean
    status: RecordStatus
    progressCount: number
    startTime: Date | null
    endTime: Date | null
    progresses: RecordProgressDetailItem[]
}

export interface RecordActivityListSchema {
    specialAttention: boolean
    status: RecordStatus
    progressCount: number
    startTime: Date | null
    endTime: Date | null
    activityTime: Date | null
    activityEvent: Record<string, unknown>
    project: ProjectSimpleSchema
    watchedEpisode: number | null
    totalEpisode: number | null
}

export interface RecordHistoryListSchema {
    ordinal: number
    status: RecordStatus
    startTime: Date | null
    endTime: Date
    project: ProjectSimpleSchema
    watchedEpisode: number | null
    totalEpisode: number | null
}

// =============================================================================
// Filter
// =============================================================================

export const recordActivityListFilter = z.object({
    type: z.enum(PROJECT_TYPE),
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export const recordHistoryListFilter = z.object({
    type: z.enum(PROJECT_TYPE),
    search: z.string().optional(),
    page: z.number().optional(),
    size: z.number().optional()
})

export type RecordActivityListFilter = z.infer<typeof recordActivityListFilter>
export type RecordHistoryListFilter = z.infer<typeof recordHistoryListFilter>

// =============================================================================
// Form
// =============================================================================

export const recordProgressSupplementForm = z.object({
    startTime: z.date().nullable(),
    endTime: z.date().nullable(),
    episodeWatchedNum: z.number().min(0).nullable()
})

export const recordCreateForm = z.object({
    createMode: z.enum(["SUBSCRIBE", "SUPPLEMENT", "ONLY_RECORD"]),
    progress: z
        .array(
            z.object({
                startTime: z.date().nullable(),
                endTime: z.date().nullable(),
                episodeWatchedNum: z.number().min(0).nullable().optional()
            })
        )
        .optional()
})

export const recordUpdateForm = z.object({
    specialAttention: z.boolean().optional()
})

export const recordProgressUpsertForm = z.object({
    startTime: z.date().nullable().optional(),
    endTime: z.date().nullable().optional(),
    episodeWatchedNum: z.number().min(0).nullable().optional()
})

export type RecordCreateForm = z.infer<typeof recordCreateForm>
export type RecordUpdateForm = z.infer<typeof recordUpdateForm>
export type RecordProgressUpsertForm = z.infer<typeof recordProgressUpsertForm>
export type RecordProgressSupplementForm = z.infer<typeof recordProgressSupplementForm>

// =============================================================================
// Parse
// =============================================================================

export function parsePreviewSchema(data: PrismaRecord, progress: RecordProgress | null): RecordPreviewSchema {
    const episodeWatchedRecord = (progress?.episodeWatchedRecords as EpisodeWatchedRecordEntry[] | null)?.findLast(r => r !== null)
    return {
        specialAttention: data.specialAttention,
        status: data.status,
        progressCount: data.progressCount,
        startTime: data.startTime,
        endTime: data.endTime,
        episodeWatchedNum: progress?.episodeWatchedNum ?? null,
        latestWatchedTime: episodeWatchedRecord ? new Date(episodeWatchedRecord.watchedTime) : null
    }
}

export function parseDetailSchema(data: PrismaRecord, progresses: RecordProgress[]): RecordDetailSchema {
    return {
        specialAttention: data.specialAttention,
        status: data.status,
        progressCount: data.progressCount,
        startTime: data.startTime,
        endTime: data.endTime,
        progresses: progresses.map(progress => ({
            ordinal: progress.ordinal,
            isLatest: progress.isLatest,
            status: progress.status,
            startTime: progress.startTime,
            endTime: progress.endTime,
            episodeWatchedNum: progress.episodeWatchedNum,
            episodeWatchedRecords: progress.episodeWatchedRecords as EpisodeWatchedRecordEntry[] | null,
            followType: progress.followType,
            platform: progress.platform
        }))
    }
}

export function parseRecordActivityListSchema(
    data: PrismaRecord & {
        project: Pick<Project, "id" | "type" | "title" | "resources"> & { episodeTotalNum: number | null }
        progresses?: Pick<RecordProgress, "episodeWatchedNum">[]
    }
): RecordActivityListSchema {
    return {
        specialAttention: data.specialAttention,
        status: data.status,
        progressCount: data.progressCount,
        startTime: data.startTime,
        endTime: data.endTime,
        activityTime: data.lastActivityTime,
        activityEvent: (data.lastActivityEvent as Record<string, unknown>) ?? {},
        project: parseProjectSimpleSchema(data.project),
        watchedEpisode: data.progresses?.[0]?.episodeWatchedNum ?? null,
        totalEpisode: data.project.type === "ANIME" ? data.project.episodeTotalNum : null
    }
}

export function parseRecordHistoryListSchema(
    data: RecordProgress & {
        record: { project: Pick<Project, "id" | "type" | "title" | "resources"> & { episodeTotalNum: number | null } }
    }
): RecordHistoryListSchema {
    return {
        ordinal: data.ordinal,
        status: data.status,
        startTime: data.startTime,
        endTime: data.endTime!,
        project: parseProjectSimpleSchema(data.record.project),
        watchedEpisode: data.record.project.type === "ANIME" ? data.episodeWatchedNum : null,
        totalEpisode: data.record.project.type === "ANIME" ? data.record.project.episodeTotalNum : null
    }
}
