import { z } from "zod"
import type { Record as PrismaRecord, RecordProgress } from "@/prisma/generated"
import { RECORD_STATUS, FOLLOW_TYPE, RecordStatus, FollowType } from "@/constants/record"
import { PROJECT_TYPE } from "@/constants/project"
import type { ProjectSimpleSchema } from "./project"

// =============================================================================
// Model
// =============================================================================

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
