import { z } from "zod"
import { Record, RecordProgress } from "@/prisma/generated"
import { RECORD_STATUS, FOLLOW_TYPE } from "@/constants/record"
import { projectSimpleSchema } from "./project"

export const recordModel = z.object({
    id: z.number(),
    ownerId: z.string(),
    projectId: z.string(),
    specialAttention: z.boolean(),
    status: z.enum(RECORD_STATUS),
    progressCount: z.number(),
    startTime: z.date().nullable(),
    endTime: z.date().nullable(),
    lastActivityTime: z.date().nullable(),
    lastActivityEvent: z.record(z.string(), z.any()),
    createTime: z.date(),
    updateTime: z.date()
})

export const recordProgressModel = z.object({
    id: z.number(),
    projectId: z.string(),
    recordId: z.number(),
    ordinal: z.number(),
    status: z.enum(RECORD_STATUS),
    startTime: z.date().nullable(),
    endTime: z.date().nullable(),
    createTime: z.date(),
    updateTime: z.date(),
    episodeWatchedNum: z.number().nullable(),
    episodeWatchedRecords: z.array(z.object({
        watchedTime: z.string()
    })).nullable(),
    followType: z.enum(FOLLOW_TYPE).nullable(),
    platform: z.array(z.string())
})

export const recordProgressSupplementForm = z.object({
    startTime: z.date().nullable(),
    endTime: z.date().nullable(),
    episodeWatchedNum: z.number().min(0).nullable(),
})

export const recordCreateForm = z.object({
    createMode: z.enum(["SUBSCRIBE", "SUPPLEMENT", "ONLY_RECORD"]),
    progress: z.array(z.object({
        startTime: z.date().nullable(),
        endTime: z.date().nullable(),
        episodeWatchedNum: z.number().min(0).nullable().optional(),
    })).optional()
})

export const recordSubscriptionSchema = z.object({
    project: projectSimpleSchema.extend({
        episodeTotalNum: z.number().nullable(),
        episodePublishedNum: z.number().nullable(),
        platform: z.array(z.string()),
    }),
    episodeWatchedNum: z.number().nullable(),
    followType: z.enum(FOLLOW_TYPE).nullable(),
    platform: z.array(z.string())
})

export const recordPreviewSchema = z.object({
    specialAttention: z.boolean(),
    status: z.enum(RECORD_STATUS),
    progressCount: z.number(),
    startTime: z.date().nullable(),
    endTime: z.date().nullable(),
    episodeWatchedNum: z.number().nullable(),
    latestWatchedTime: z.date().nullable(),
})

export function parsePreviewSchema(data: Record, progress: RecordProgress | null): RecordPreviewSchema {
    const episodeWatchedRecord = (progress?.episodeWatchedRecords as ({watchedTime: string} | null)[])?.findLast(r => r !== null)
    return {
        specialAttention: data.specialAttention,
        status: data.status,
        progressCount: data.progressCount,
        startTime: data.startTime,
        endTime: data.endTime,
        episodeWatchedNum: progress?.episodeWatchedNum ?? null,
        latestWatchedTime: episodeWatchedRecord ? new Date(episodeWatchedRecord.watchedTime) : null,
    }
}

export type RecordModel = z.infer<typeof recordModel>
export type RecordProgressModel = z.infer<typeof recordProgressModel>
export type RecordCreateForm = z.infer<typeof recordCreateForm>
export type RecordPreviewSchema = z.infer<typeof recordPreviewSchema>