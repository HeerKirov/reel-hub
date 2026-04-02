"use server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { ActivityEvent, parsePreviewSchema, recordCreateForm, RecordCreateForm, RecordPreviewSchema, RecordDetailSchema, parseDetailSchema, RecordUpdateForm, recordUpdateForm, RecordProgressUpsertForm, recordProgressUpsertForm } from "@/schemas/record"
import { err, ok, Result } from "@/schemas/all"
import { exceptionAlreadyExists, exceptionNotFound, exceptionParamError, exceptionParamRequired, exceptionRejectCreateProgress } from "@/constants/exception"
import { safeExecute, safeExecuteTransaction } from "@/helpers/execution"
import { CreateRecordError, DeleteRecordError, RecordDetailError, RecordPreviewError, UpdateRecordError } from "@/schemas/error"
import { ProjectType, isEpisodeProjectType } from "@/constants/project"
import { RecordStatus } from "@/constants/record"
import type { Prisma } from "@/prisma/generated/client"
import { getFollowType, getRecordStatus } from "@/helpers/data"

export async function retrieveRecordPreview(projectId: string): Promise<Result<RecordPreviewSchema | null, RecordPreviewError>> {
    return safeExecute(async () => {
        await requireAccess("record", "read")
        const userId = await getUserId()

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return ok(null)

        const recordProgress = record.progressCount > 0 ? await prisma.recordProgress.findFirst({where: {recordId: record.id, isLatest: true}}) : null

        return ok(parsePreviewSchema(record, recordProgress))
    })
}

export async function retrieveRecord(projectId: string): Promise<Result<RecordDetailSchema | null, RecordDetailError>> {
    return safeExecute(async () => {
        await requireAccess("record", "read")
        const userId = await getUserId()

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await prisma.record.findFirst({
            where: {ownerId: userId, projectId},
            include: {
                progresses: {
                    orderBy: {ordinal: 'asc'}
                }
            }
        })
        if(!record) return ok(null)

        return ok(parseDetailSchema(record, record.progresses))
    })
}

export async function createRecord(projectId: string, form: RecordCreateForm): Promise<Result<void, CreateRecordError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = recordCreateForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))
        
        const project = await tx.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))
        
        if(await tx.record.findFirst({where: {ownerId: userId, projectId}})) {
            return err(exceptionAlreadyExists("record", "projectId", projectId))
        }
        
        const createRecordEvent: ActivityEvent = { type: "CREATE_RECORD" }

        if(validate.data.createMode === "SUBSCRIBE") {
            const isEpisodeType = isEpisodeProjectType(project.type)
            const record = await tx.record.create({
                data: {
                    ownerId: userId,
                    projectId,
                    status: RecordStatus.WATCHING,
                    progressCount: 1,
                    startTime: now,
                    endTime: null,
                    lastActivityTime: now,
                    lastActivityEvent: createRecordEvent as unknown as Prisma.InputJsonValue,
                    createTime: now,
                    updateTime: now,
                    specialAttention: isEpisodeType
                }
            })
            await tx.recordProgress.create({
                data: {
                    projectId, recordId: record.id,
                    ordinal: 1,
                    isLatest: true,
                    status: RecordStatus.WATCHING,
                    startTime: now,
                    endTime: null,
                    createTime: now,
                    updateTime: now,
                    episodeWatchedNum: isEpisodeType ? 0 : null,
                    episodeWatchedRecords: [],
                    followType: project.type === ProjectType.ANIME ? getFollowType(1, project.boardcastType, project.publishTime, now) : null,
                    //game
                    platform: []
                }
            })
        }else if(validate.data.createMode === "SUPPLEMENT") {
            if(!validate.data.progress || validate.data.progress.length === 0) {
                return err(exceptionParamRequired("progress"))
            }

            const isEpisodeType = isEpisodeProjectType(project.type)
            const isAnime = project.type === ProjectType.ANIME
            const episodeTotalNum = isEpisodeType ? project.episodeTotalNum! : null
            const episodePublishedNum = isEpisodeType ? project.episodePublishedNum! : null

            const episodeFullyPublished = isEpisodeType && episodePublishedNum! >= episodeTotalNum!
            const inputProgresses = validate.data.progress
            const normalizedProgresses = inputProgresses.map(p => {
                const startTimeFilled = p.startTime ?? p.endTime ?? null
                return {
                    startTime: p.startTime,
                    endTime: p.endTime,
                    startTimeFilled,
                    episodeWatchedNum: p.episodeWatchedNum,
                    platform: p.platform ?? []
                }
            })

            // Chronological & completeness validation
            for(let i = 0; i < normalizedProgresses.length; i++) {
                const p = normalizedProgresses[i]
                const isLast = i === normalizedProgresses.length - 1

                if(!isLast) {
                    if(p.endTime === null) {
                        return err(exceptionParamError("Only the last progress can be incomplete"))
                    }
                    if(p.startTimeFilled === null) {
                        return err(exceptionParamRequired("startTime"))
                    }
                    if(p.startTimeFilled > p.endTime) {
                        return err(exceptionParamError("Start time must be before or equal to end time"))
                    }
                } else {
                    if(p.endTime !== null) {
                        // ANIME restriction: incomplete release => cannot have COMPLETED progress
                        if(isEpisodeType && !episodeFullyPublished) {
                            // 不满足插入新的未完成进度条件
                            return err(exceptionRejectCreateProgress("Episode is not fully published"))
                        }
                    } else {
                        if(p.startTimeFilled === null) {
                            return err(exceptionParamRequired("startTime"))
                        }
                    }
                }
            }

            if(isEpisodeType && !episodeFullyPublished) {
                const hasAnyCompleted = normalizedProgresses.some(p => p.endTime !== null)
                if(hasAnyCompleted) {
                    // 不满足插入新的未完成进度条件
                    return err(exceptionRejectCreateProgress("Episode is not fully published"))
                }
            }

            let prevEndTime: Date | null = null
            for(let i = 0; i < normalizedProgresses.length; i++) {
                const p = normalizedProgresses[i]
                if(i === 0) {
                    prevEndTime = p.endTime
                    continue
                }

                const start = p.startTimeFilled
                if(prevEndTime && start && start.getTime() <= prevEndTime.getTime()) {
                    return err(exceptionParamError("Progress must be in chronological order"))
                }

                prevEndTime = p.endTime
            }

            const lastIndex = normalizedProgresses.length - 1
            const lastProgress = normalizedProgresses[lastIndex]

            const lastEpisodeWatchedNum = isEpisodeType ? (
                lastProgress.endTime !== null ? (
                    // 已完成进度：直接取总集数
                    episodeTotalNum!
                ) : (
                    // 未完成进度：取已看集数（缺省为0），并保证不超过已发布集数
                    (() => {
                        const raw = lastProgress.episodeWatchedNum ?? 0
                        const published = episodePublishedNum!
                        const total = episodeTotalNum!
                        const clamped = Math.max(0, Math.min(raw ?? 0, published, total))
                        return clamped
                    })()
                )
            ) : null

            const lastEndTime = isEpisodeType && lastProgress.endTime === null
                && episodeFullyPublished
                && lastEpisodeWatchedNum !== null
                && lastEpisodeWatchedNum >= episodeTotalNum!
                ? now
                : lastProgress.endTime

            const recordStatus = getRecordStatus(normalizedProgresses.length, lastEndTime, episodeTotalNum, lastEpisodeWatchedNum)

            const record = await tx.record.create({
                data: {
                    ownerId: userId,
                    projectId,
                    // 只有 SUBSCRIBE 模式会自动添加订阅；SUPPLEMENT/ONLY_RECORD 默认不加入特别关注
                    specialAttention: false,
                    status: recordStatus,
                    progressCount: normalizedProgresses.length,
                    startTime: normalizedProgresses[0].startTimeFilled,
                    endTime: lastEndTime,
                    lastActivityTime: now,
                    lastActivityEvent: createRecordEvent as unknown as Prisma.InputJsonValue,
                    createTime: now,
                    updateTime: now
                }
            })

            for(let i = 0; i < normalizedProgresses.length; i++) {
                const p = normalizedProgresses[i]
                const ordinal = i + 1
                const isLast = i === lastIndex

                const finalEndTime = isEpisodeType && isLast
                    && p.endTime === null
                    && episodeFullyPublished
                    && lastEpisodeWatchedNum !== null
                    && lastEpisodeWatchedNum >= episodeTotalNum!
                    ? now
                    : p.endTime

                const episodeWatchedNum = isEpisodeType ? (
                    finalEndTime !== null ? episodeTotalNum! : (isLast ? lastEpisodeWatchedNum! : episodeTotalNum!)
                ) : null

                await tx.recordProgress.create({
                    data: {
                        projectId, recordId: record.id,
                        ordinal,
                        isLatest: isLast,
                        status: getRecordStatus(ordinal, finalEndTime, episodeTotalNum, episodeWatchedNum),
                        startTime: p.startTimeFilled,
                        endTime: finalEndTime,
                        createTime: now,
                        updateTime: now,
                        episodeWatchedNum: isEpisodeType ? episodeWatchedNum : null,
                        episodeWatchedRecords: isEpisodeType ? Array(episodeWatchedNum ?? 0).fill(null) : [],
                        followType: isAnime ? getFollowType(ordinal, project.boardcastType, project.publishTime, p.startTimeFilled) : null,
                        platform: project.type === ProjectType.GAME ? p.platform : []
                    }
                })
            }
        }else{
            await tx.record.create({
                data: {
                    ownerId: userId,
                    projectId,
                    specialAttention: false,
                    status: RecordStatus.ON_HOLD,
                    progressCount: 0,
                    startTime: null,
                    endTime: null,
                    lastActivityTime: now,
                    lastActivityEvent: createRecordEvent as unknown as Prisma.InputJsonValue,
                    createTime: now,
                    updateTime: now
                }
            })
        }
        return ok(undefined)
    })
}

export async function updateRecord(projectId: string, form: RecordUpdateForm): Promise<Result<void, UpdateRecordError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("record", "write")
        const userId = await getUserId()

        const record = await tx.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))
        
        const validate = recordUpdateForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const now = new Date()

        await tx.record.update({
            where: {id: record.id},
            data: {
                specialAttention: validate.data.specialAttention,
                updateTime: now
            }
        })
        return ok(undefined)
    })
}

export async function deleteRecord(projectId: string): Promise<Result<void, DeleteRecordError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("record", "write")
        const userId = await getUserId()

        const record = await tx.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        await tx.recordProgress.deleteMany({where: {recordId: record.id}})
        await tx.record.delete({where: {id: record.id}})
        return ok(undefined)
    })
}