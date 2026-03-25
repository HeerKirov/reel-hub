"use server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { ActivityEvent, parsePreviewSchema, recordCreateForm, RecordCreateForm, RecordPreviewSchema, RecordDetailSchema, parseDetailSchema, RecordUpdateForm, recordUpdateForm, RecordProgressUpsertForm, recordProgressUpsertForm } from "@/schemas/record"
import { err, ok, Result } from "@/schemas/all"
import { exceptionAlreadyExists, exceptionNotFound, exceptionParamError, exceptionParamRequired, exceptionRejectCreateProgress, safeExecuteResult } from "@/constants/exception"
import { CreateRecordError, DeleteRecordError, RecordDetailError, RecordPreviewError, UpdateRecordError } from "@/schemas/error"
import { Prisma, ProjectType, RecordStatus } from "@/prisma/generated"
import { getFollowType, getRecordStatus } from "@/helpers/data"

export async function retrieveRecordPreview(projectId: string): Promise<Result<RecordPreviewSchema | null, RecordPreviewError>> {
    return safeExecuteResult(async () => {
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
    return safeExecuteResult(async () => {
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
    return safeExecuteResult(async () => {
    await requireAccess("record", "write")
    const userId = await getUserId()
    const now = new Date()

    const validate = recordCreateForm.safeParse(form)
    if(!validate.success) return err(exceptionParamError(validate.error.message))
    
    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) return err(exceptionNotFound("Project not found"))
    
    if(await prisma.record.findFirst({where: {ownerId: userId, projectId}})) {
        return err(exceptionAlreadyExists("record", "projectId", projectId))
    }
    
    const createRecordEvent: ActivityEvent = { type: "CREATE_RECORD" }

    if(validate.data.createMode === "SUBSCRIBE") {
        const record = await prisma.record.create({
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
                //anime
                specialAttention: project.type === ProjectType.ANIME
            }
        })
        await prisma.recordProgress.create({
            data: {
                projectId, recordId: record.id,
                ordinal: 1,
                isLatest: true,
                status: RecordStatus.WATCHING,
                startTime: now,
                endTime: null,
                createTime: now,
                updateTime: now,
                //anime
                episodeWatchedNum: project.type === ProjectType.ANIME ? 0 : null,
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

        const isAnime = project.type === ProjectType.ANIME
        const episodeTotalNum = isAnime ? project.episodeTotalNum! : null
        const episodePublishedNum = isAnime ? project.episodePublishedNum! : null

        const episodeFullyPublished = isAnime && episodePublishedNum! >= episodeTotalNum!
        const inputProgresses = validate.data.progress
        const normalizedProgresses = inputProgresses.map(p => {
            const startTimeFilled = p.startTime ?? p.endTime ?? null
            return {
                startTime: p.startTime,
                endTime: p.endTime,
                startTimeFilled,
                episodeWatchedNum: p.episodeWatchedNum
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
                    if(isAnime && !episodeFullyPublished) {
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

        if(isAnime && !episodeFullyPublished) {
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

        const lastEpisodeWatchedNum = isAnime ? (
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

        const lastEndTime = isAnime && lastProgress.endTime === null
            && episodeFullyPublished
            && lastEpisodeWatchedNum !== null
            && lastEpisodeWatchedNum >= episodeTotalNum!
            ? now
            : lastProgress.endTime

        const recordStatus = getRecordStatus(normalizedProgresses.length, lastEndTime, episodeTotalNum, lastEpisodeWatchedNum)

        const record = await prisma.record.create({
            data: {
                ownerId: userId,
                projectId,
                specialAttention: isAnime && recordStatus === RecordStatus.WATCHING,
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

            const finalEndTime = isAnime && isLast
                && p.endTime === null
                && episodeFullyPublished
                && lastEpisodeWatchedNum !== null
                && lastEpisodeWatchedNum >= episodeTotalNum!
                ? now
                : p.endTime

            const episodeWatchedNum = isAnime ? (
                finalEndTime !== null ? episodeTotalNum! : (isLast ? lastEpisodeWatchedNum! : episodeTotalNum!)
            ) : null

            await prisma.recordProgress.create({
                data: {
                    projectId, recordId: record.id,
                    ordinal,
                    isLatest: isLast,
                    status: getRecordStatus(ordinal, finalEndTime, episodeTotalNum, episodeWatchedNum),
                    startTime: p.startTimeFilled,
                    endTime: finalEndTime,
                    createTime: now,
                    updateTime: now,
                    // anime
                    episodeWatchedNum: isAnime ? episodeWatchedNum : null,
                    episodeWatchedRecords: isAnime ? Array(episodeWatchedNum ?? 0).fill(null) : [],
                    followType: isAnime ? getFollowType(ordinal, project.boardcastType, project.publishTime, p.startTimeFilled) : null,
                    // game
                    platform: []
                }
            })
        }
    }else{
        await prisma.record.create({
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
    return safeExecuteResult(async () => {
    await requireAccess("record", "write")
    const userId = await getUserId()

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionNotFound("Record not found"))
    
    const validate = recordUpdateForm.safeParse(form)
    if(!validate.success) return err(exceptionParamError(validate.error.message))

    const now = new Date()

    await prisma.record.update({
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
    return safeExecuteResult(async () => {
    await requireAccess("record", "write")
    const userId = await getUserId()

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionNotFound("Record not found"))

    await prisma.record.delete({where: {id: record.id}})
    await prisma.recordProgress.deleteMany({where: {recordId: record.id}})
    return ok(undefined)
    })
}

function alignEpisodeWatchedRecords(current: ({ watchedTime: string } | null)[], targetLen: number): ({ watchedTime: string } | null)[] {
    if(targetLen <= 0) return []
    if(current.length === targetLen) return current
    if(current.length > targetLen) return current.slice(0, targetLen)
    return [...current, ...Array(targetLen - current.length).fill(null)]
}

/**
 * 当 ANIME 的 episodeTotalNum / episodePublishedNum 发生变化时，
 * 需要同步所有 RecordProgress 的状态与 watchedNum，并重算 Record 的缓存字段。
 *
 * specialAttention 不参与此同步（只在“普通完成”行为里由业务侧取消）。
 */
export async function syncAnimeRecordProgressAfterEpisodeMetaChange(projectId: string, now: Date): Promise<void> {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if(!project || project.type !== ProjectType.ANIME) return

    const episodeTotalNum = project.episodeTotalNum ?? 0
    const episodePublishedNum = project.episodePublishedNum ?? 0
    const episodeFullyPublished = project.episodeTotalNum !== null && project.episodePublishedNum !== null && episodePublishedNum >= episodeTotalNum && episodeTotalNum > 0

    // DROPPED 进度不参与 watchedNum 的强制调整（按文档：不需要更新已放弃进度的已看集数）
    const progresses = await prisma.recordProgress.findMany({
        where: {
            projectId,
            status: { not: RecordStatus.DROPPED }
        },
        select: {
            id: true,
            recordId: true,
            status: true,
            endTime: true,
            episodeWatchedNum: true,
            episodeWatchedRecords: true
        }
    })

    const updatedRecordIds = new Set<number>()

    for(const p of progresses) {
        const currentWatchedNum = p.episodeWatchedNum ?? 0
        const currentRecords = (p.episodeWatchedRecords as ({ watchedTime: string } | null)[] | null) ?? []

        if(!episodeFullyPublished) {
            // 未完全发布时不允许出现 COMPLETED/endTime!=null
            if(p.status !== RecordStatus.COMPLETED && p.endTime === null) continue

            const targetWatchedNum = Math.min(currentWatchedNum, episodePublishedNum)
            const nextRecords = alignEpisodeWatchedRecords(currentRecords, targetWatchedNum)

            await prisma.recordProgress.update({
                where: { id: p.id },
                data: {
                    episodeWatchedNum: targetWatchedNum,
                    episodeWatchedRecords: nextRecords,
                    endTime: null,
                    status: RecordStatus.WATCHING,
                    updateTime: now
                }
            })
            updatedRecordIds.add(p.recordId)
        } else {
            const shouldBecomeCompleted = p.status === RecordStatus.COMPLETED || p.endTime !== null || currentWatchedNum >= episodeTotalNum

            if(!shouldBecomeCompleted) {
                // 仍是未完成态：确保 endTime 为空，且 watchedNum 不超过 total
                const targetWatchedNum = Math.min(currentWatchedNum, episodeTotalNum)
                const nextRecords = alignEpisodeWatchedRecords(currentRecords, targetWatchedNum)

                if(p.status === RecordStatus.WATCHING && p.endTime === null && targetWatchedNum === currentWatchedNum && nextRecords.length === currentRecords.length) {
                    continue
                }

                await prisma.recordProgress.update({
                    where: { id: p.id },
                    data: {
                        episodeWatchedNum: targetWatchedNum,
                        episodeWatchedRecords: nextRecords,
                        endTime: null,
                        status: RecordStatus.WATCHING,
                        updateTime: now
                    }
                })
                updatedRecordIds.add(p.recordId)
                continue
            }

            // 已完成态：watchedNum 必须与 total 全局一致
            const targetWatchedNum = episodeTotalNum
            const nextRecords = alignEpisodeWatchedRecords(currentRecords, targetWatchedNum)

            await prisma.recordProgress.update({
                where: { id: p.id },
                data: {
                    episodeWatchedNum: targetWatchedNum,
                    episodeWatchedRecords: nextRecords,
                    endTime: p.endTime ?? now,
                    status: RecordStatus.COMPLETED,
                    updateTime: now
                }
            })
            updatedRecordIds.add(p.recordId)
        }
    }

    // Recompute Record 缓存字段（不更新 specialAttention）
    const recordIds = Array.from(updatedRecordIds.values())
    if(recordIds.length === 0) return

    for(const recordId of recordIds) {
        const progresses = await prisma.recordProgress.findMany({
            where: { recordId },
            orderBy: { ordinal: "asc" }
        })

        const progressCount = progresses.length
        const first = progresses[0] ?? null
        const last = progresses[progresses.length - 1] ?? null

        const status = getRecordStatus(
            progressCount,
            last?.endTime ?? null,
            project.episodeTotalNum,
            last?.episodeWatchedNum ?? null
        )

        await prisma.record.update({
            where: { id: recordId },
            data: {
                progressCount,
                status,
                startTime: first?.startTime ?? null,
                endTime: last?.endTime ?? null,
                updateTime: now
            }
        })
    }
}