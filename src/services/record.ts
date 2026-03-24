"use server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { parsePreviewSchema, recordCreateForm, RecordCreateForm, RecordPreviewSchema, RecordDetailSchema, parseDetailSchema, RecordUpdateForm, recordUpdateForm, RecordProgressUpsertForm, recordProgressUpsertForm } from "@/schemas/record"
import { err, ok, Result } from "@/schemas/all"
import { exceptionAlreadyExists, exceptionParamError, exceptionParamRequired, exceptionResourceNotExist, exceptionResourceNotSuitable, safeExecuteResult } from "@/constants/exception"
import {
    CreateProgressError, CreateRecordError, DeleteProgressError, DeleteRecordError, NextEpisodeError,
    RecordDetailError, RecordPreviewError, UpdateLatestProgressError, UpdateRecordError,
} from "@/schemas/error"
import { BoardcastType, FollowType, ProjectType, RecordStatus } from "@/prisma/generated"

export async function retrieveRecordPreview(projectId: string): Promise<Result<RecordPreviewSchema | null, RecordPreviewError>> {
    return safeExecuteResult(async () => {
        const userId = await getUserId()

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionResourceNotExist("projectId", projectId))

        const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return ok(null)

        const recordProgress = record.progressCount > 0 ? await prisma.recordProgress.findFirst({where: {recordId: record.id, ordinal: record.progressCount}}) : null

        return ok(parsePreviewSchema(record, recordProgress))
    })
}

export async function retrieveRecord(projectId: string): Promise<Result<RecordDetailSchema | null, RecordDetailError>> {
    return safeExecuteResult(async () => {
        const userId = await getUserId()

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionResourceNotExist("projectId", projectId))

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
    const userId = await getUserId()
    const now = new Date()

    const validate = recordCreateForm.safeParse(form)
    if(!validate.success) return err(exceptionParamError(validate.error.message))
    
    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) return err(exceptionResourceNotExist("projectId", projectId))
    
    if(await prisma.record.findFirst({where: {ownerId: userId, projectId}})) {
        return err(exceptionAlreadyExists("record", "projectId", projectId))
    }
    
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
                lastActivityEvent: {},
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
        const episodeTotalNum = isAnime ? project.episodeTotalNum : null
        const episodePublishedNum = isAnime ? project.episodePublishedNum ?? 0 : null

        if(isAnime && episodeTotalNum === null) {
            return err(exceptionParamRequired("episodeTotalNum"))
        }

        const episodeFullyPublished = isAnime && episodePublishedNum !== null && episodeTotalNum !== null && episodePublishedNum >= episodeTotalNum
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
                        return err(exceptionResourceNotSuitable("episodePublishedNum", "not_fully_published"))
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
                return err(exceptionResourceNotSuitable("episodePublishedNum", "not_fully_published"))
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
                lastActivityEvent: {},
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
                lastActivityTime: null,
                lastActivityEvent: {},
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
    const userId = await getUserId()

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionResourceNotExist("recordId", projectId))
    
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
    const userId = await getUserId()

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionResourceNotExist("recordId", projectId))

    await prisma.record.delete({where: {id: record.id}})
    await prisma.recordProgress.deleteMany({where: {recordId: record.id}})
    return ok(undefined)
    })
}

export async function createProgress(projectId: string, form: RecordProgressUpsertForm): Promise<Result<void, CreateProgressError>> {
    return safeExecuteResult(async () => {
    const userId = await getUserId()
    const now = new Date()

    const validate = recordProgressUpsertForm.safeParse(form)
    if(!validate.success) return err(exceptionParamError(validate.error.message))

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) return err(exceptionResourceNotExist("projectId", projectId))

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionResourceNotExist("recordId", projectId))

    const existingProgresses = await prisma.recordProgress.findMany({
        where: {recordId: record.id},
        orderBy: {ordinal: 'asc'}
    })

    const isSupplement = validate.data.startTime !== undefined || validate.data.endTime !== undefined || validate.data.episodeWatchedNum !== undefined

    if(isSupplement) {
        const isAnime = project.type === ProjectType.ANIME
        const episodeTotalNum = isAnime ? project.episodeTotalNum : null
        const episodePublishedNum = isAnime ? project.episodePublishedNum ?? 0 : null

        if(isAnime && episodeTotalNum === null) {
            return err(exceptionParamRequired("episodeTotalNum"))
        }

        const episodeFullyPublished = isAnime && episodePublishedNum !== null && episodeTotalNum !== null && episodePublishedNum >= episodeTotalNum

        const startTimeRaw = validate.data.startTime === undefined ? null : validate.data.startTime
        const endTimeRaw = validate.data.endTime === undefined ? null : validate.data.endTime

        // If only watchedNum is provided (without start/end time), we don't know which interval it belongs to.
        if(isAnime && validate.data.startTime === undefined && validate.data.endTime === undefined && validate.data.episodeWatchedNum !== undefined) {
            return err(exceptionParamRequired("startTime"))
        }

        if(startTimeRaw !== null && endTimeRaw !== null && startTimeRaw > endTimeRaw) {
            return err(exceptionParamError("Start time must be before or equal to end time"))
        }

        // Follow the document rules:
        // - If only endTime is provided => startTime == endTime
        // - If endTime is omitted => incomplete interval (endTime == null)
        let newStartTime = startTimeRaw
        const newEndTime = endTimeRaw
        if(newEndTime !== null && newStartTime === null) {
            newStartTime = newEndTime
        }
        if(newEndTime === null && newStartTime === null) {
            return err(exceptionParamRequired("startTime"))
        }

        // Supplement模式：根据时间次序插队
        // 找到应该插入的位置（基于finishTime比较）
        let insertOrdinal: number
        if(existingProgresses.length === 0) {
            // 不存在已有进度，那么新进度可以以任意方式插入
            insertOrdinal = 1
        } else if(newEndTime !== null) {
            // 存在已有进度，且指定了新进度的完成时间，需要比对确定新进度的插入位置
            let foundOrdinal: number | null = null
            for(const progress of existingProgresses) {
                // 遇到了未完成的记录，那么新记录将插入在未完成记录的前面
                // 遇到了更大的时间点记录，也就是排在此记录的前面
                if(progress.endTime === null || newEndTime < progress.endTime) {
                    foundOrdinal = progress.ordinal
                    break
                }
                // 遇到了具有相等时间点的记录，按照规则排在此记录的后面一位
                if(progress.endTime !== null && newEndTime.getTime() === progress.endTime.getTime()) {
                    foundOrdinal = progress.ordinal + 1
                    break
                }
            }
            insertOrdinal = foundOrdinal ?? (existingProgresses.length + 1)
        } else {
            // 存在已有进度，未指定新进度的完成时间（incomplete）
            const lastProgress = existingProgresses[existingProgresses.length - 1]
            if(lastProgress.endTime !== null) {
                insertOrdinal = existingProgresses.length + 1
            } else {
                return err(exceptionResourceNotSuitable("latestProgress", "not_completed"))
            }
        }

        // 调整后续进度的ordinal
        for(const progress of existingProgresses) {
            if(progress.ordinal >= insertOrdinal) {
                await prisma.recordProgress.update({
                    where: {id: progress.id},
                    data: {ordinal: progress.ordinal + 1}
                })
            }
        }

        // Compute episodeWatchedNum & endTime (ANIME rules)
        let episodeWatchedNum: number | null = null
        let finalEndTime: Date | null = newEndTime

        if(isAnime) {
            // Completed progress => require full release
            if(newEndTime !== null) {
                if(!episodeFullyPublished) {
                    return err(exceptionResourceNotSuitable("episodePublishedNum", "not_fully_published"))
                }
                episodeWatchedNum = episodeTotalNum!
            } else {
                // Incomplete progress => watchedNum (default 0), clamped by published episodes
                const raw = validate.data.episodeWatchedNum ?? 0
                const published = episodePublishedNum!
                const total = episodeTotalNum!
                episodeWatchedNum = Math.max(0, Math.min(raw, published, total))

                // Auto-complete if it reaches total AND animation is fully published
                if(episodeFullyPublished && episodeWatchedNum >= total) {
                    finalEndTime = now
                }
            }
        }

        // 创建新进度
        await prisma.recordProgress.create({
            data: {
                projectId,
                recordId: record.id,
                ordinal: insertOrdinal,
                status: getRecordStatus(insertOrdinal, finalEndTime, project.episodeTotalNum, episodeWatchedNum),
                startTime: newStartTime,
                endTime: finalEndTime,
                createTime: now,
                updateTime: now,
                episodeWatchedNum: isAnime ? episodeWatchedNum : null,
                episodeWatchedRecords: isAnime ? Array(episodeWatchedNum ?? 0).fill(null) : [],
                followType: isAnime ? getFollowType(insertOrdinal, project.boardcastType, project.publishTime, newStartTime) : null,
                platform: []
            }
        })

        // 更新record
        const newProgressCount = record.progressCount + 1
        const latestProgress = await prisma.recordProgress.findFirst({
            where: {recordId: record.id},
            orderBy: {ordinal: 'desc'}
        })
        const latestEpisodeWatchedNum = latestProgress?.episodeWatchedNum ?? null

        await prisma.record.update({
            where: {id: record.id},
            data: {
                progressCount: newProgressCount,
                status: getRecordStatus(newProgressCount, latestProgress?.endTime ?? null, project.episodeTotalNum, latestEpisodeWatchedNum),
                startTime: record.startTime ? (newStartTime !== null && newStartTime < record.startTime ? newStartTime : record.startTime) : (newStartTime ?? record.startTime),
                endTime: latestProgress?.endTime ?? record.endTime,
                lastActivityTime: now,
                updateTime: now,
                specialAttention: project.type === ProjectType.ANIME && latestEpisodeWatchedNum !== null && latestEpisodeWatchedNum < project.episodeTotalNum!
            }
        })
    } else {
        // 新建进度模式：要求上一条进度必须是已完成状态（如果存在）
        const latestProgress = existingProgresses.length > 0 ? existingProgresses[existingProgresses.length - 1] : null
        if(latestProgress !== null && latestProgress.endTime === null) {
            return err(exceptionResourceNotSuitable("latestProgress", "not_completed"))
        }

        const newOrdinal = existingProgresses.length + 1
        const newStartTime = now
        const newEndTime = null

        await prisma.recordProgress.create({
            data: {
                projectId,
                recordId: record.id,
                ordinal: newOrdinal,
                status: RecordStatus.WATCHING,
                startTime: newStartTime,
                endTime: newEndTime,
                createTime: now,
                updateTime: now,
                episodeWatchedNum: project.type === ProjectType.ANIME ? 0 : null,
                episodeWatchedRecords: [],
                followType: project.type === ProjectType.ANIME && newStartTime !== null ? getFollowType(newOrdinal, project.boardcastType, project.publishTime, newStartTime) : null,
                platform: []
            }
        })

        // 更新record
        await prisma.record.update({
            where: {id: record.id},
            data: {
                progressCount: newOrdinal,
                status: RecordStatus.WATCHING,
                startTime: record.startTime ?? newStartTime,
                endTime: null,
                lastActivityTime: now,
                updateTime: now,
                specialAttention: project.type === ProjectType.ANIME
            }
        })
    }
    return ok(undefined)
    })
}

export async function updateLatestProgress(projectId: string, ordinal: number, form: RecordProgressUpsertForm): Promise<Result<void, UpdateLatestProgressError>> {
    return safeExecuteResult(async () => {
    const userId = await getUserId()
    const now = new Date()

    const validate = recordProgressUpsertForm.safeParse(form)
    if(!validate.success) return err(exceptionParamError(validate.error.message))

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) return err(exceptionResourceNotExist("projectId", projectId))

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionResourceNotExist("recordId", projectId))

    // 只能更新最新进度
    if(ordinal !== record.progressCount) {
        return err(exceptionParamError("Can only update the latest progress"))
    }

    if(record.progressCount === 0) {
        return err(exceptionResourceNotExist("progressOrdinal", ordinal))
    }

    const progress = await prisma.recordProgress.findFirst({
        where: {recordId: record.id, ordinal}
    })
    if(!progress) return err(exceptionResourceNotExist("progressOrdinal", ordinal))

    // 只更新episodeWatchedNum（类似旧代码的updateLatestProgress）
    if(validate.data.episodeWatchedNum === undefined) {
        // 如果没有提供episodeWatchedNum，不需要更新
        return ok(undefined)
    }
    
    const isAnime = project.type === ProjectType.ANIME
    const episodeTotalNum = isAnime ? project.episodeTotalNum : null
    const episodePublishedNum = isAnime ? project.episodePublishedNum ?? 0 : null

    if(isAnime && episodeTotalNum === null) {
        return err(exceptionParamRequired("episodeTotalNum"))
    }

    const newEpisodeWatchedNum = isAnime ? (() => {
        const raw = validate.data.episodeWatchedNum ?? 0
        const published = episodePublishedNum!
        const total = episodeTotalNum!
        return Math.max(0, Math.min(raw, published, total))
    })() : null

    if(newEpisodeWatchedNum === progress.episodeWatchedNum) {
        // 如果值没有变化，不需要更新
        return ok(undefined)
    }

    // Update episodeWatchedRecords:
    // - Manual edits (this endpoint) only resize/crop/pad with `null`
    // - Only `nextEpisode` records `watchedTime`
    let newEpisodeWatchedRecords: ({ watchedTime: string } | null)[] = []
    if(isAnime) {
        const current = (progress.episodeWatchedRecords as ({ watchedTime: string } | null)[] | null) ?? []
        const targetLen = newEpisodeWatchedNum ?? 0
        if(current.length > targetLen) {
            newEpisodeWatchedRecords = current.slice(0, targetLen)
        } else if(current.length < targetLen) {
            newEpisodeWatchedRecords = [...current, ...Array(targetLen - current.length).fill(null)]
        } else {
            newEpisodeWatchedRecords = current
        }
    }

    const episodeFullyPublished = isAnime && episodePublishedNum !== null && episodeTotalNum !== null && episodePublishedNum >= episodeTotalNum
    const shouldComplete = isAnime && episodeFullyPublished && (newEpisodeWatchedNum ?? 0) >= (episodeTotalNum ?? 0)
    const finalEndTime = shouldComplete ? now : null
    const finalStatus = getRecordStatus(ordinal, finalEndTime, episodeTotalNum, newEpisodeWatchedNum)

    // 更新进度
    await prisma.recordProgress.update({
        where: {id: progress.id},
        data: {
            ...(isAnime ? {
                episodeWatchedNum: newEpisodeWatchedNum,
                episodeWatchedRecords: newEpisodeWatchedRecords,
                endTime: finalEndTime,
                status: finalStatus
            } : {}),
            updateTime: now
        }
    })

    // 更新record
    const nextRecordStatus = getRecordStatus(record.progressCount, finalEndTime, episodeTotalNum, newEpisodeWatchedNum)
    await prisma.record.update({
        where: {id: record.id},
        data: {
            status: nextRecordStatus,
            endTime: isAnime ? finalEndTime : record.endTime,
            specialAttention: isAnime && newEpisodeWatchedNum !== null && newEpisodeWatchedNum < episodeTotalNum!,
            lastActivityTime: newEpisodeWatchedNum! > (progress.episodeWatchedNum ?? 0) ? now : record.lastActivityTime,
            updateTime: now
        }
    })
    return ok(undefined)
    })
}

export async function nextEpisode(projectId: string): Promise<Result<number, NextEpisodeError>> {
    return safeExecuteResult(async () => {
    const userId = await getUserId()
    const now = new Date()

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) return err(exceptionResourceNotExist("projectId", projectId))

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionResourceNotExist("recordId", projectId))

    if(project.type !== ProjectType.ANIME) {
        return err(exceptionResourceNotSuitable("projectType", String(project.type)))
    }

    if(project.episodePublishedNum === null || project.episodePublishedNum === 0) {
        return err(exceptionResourceNotExist("nextEpisode", projectId))
    }

    const episodeTotalNum = project.episodeTotalNum ?? 0
    const episodeFullyPublished = project.episodePublishedNum !== null && episodeTotalNum > 0 && project.episodePublishedNum >= episodeTotalNum

    if(record.progressCount === 0) {
        // 没有进度，那么创建一个
        const newEpisodeWatchedNum = 1
        const isComplete = episodeFullyPublished && newEpisodeWatchedNum >= episodeTotalNum

        await prisma.recordProgress.create({
            data: {
                projectId,
                recordId: record.id,
                ordinal: 1,
                status: isComplete ? RecordStatus.COMPLETED : RecordStatus.WATCHING,
                startTime: now,
                endTime: isComplete ? now : null,
                createTime: now,
                updateTime: now,
                episodeWatchedNum: newEpisodeWatchedNum,
                episodeWatchedRecords: [{watchedTime: now.toISOString()}],
                followType: getFollowType(1, project.boardcastType, project.publishTime, now),
                platform: []
            }
        })

        await prisma.record.update({
            where: {id: record.id},
            data: {
                progressCount: 1,
                status: isComplete ? RecordStatus.COMPLETED : RecordStatus.WATCHING,
                startTime: now,
                endTime: isComplete ? now : null,
                lastActivityTime: now,
                updateTime: now,
                specialAttention: !isComplete
            }
        })

        return ok(newEpisodeWatchedNum)
    } else {
        // 有进度，那么查找此进度
        const progress = await prisma.recordProgress.findFirst({
            where: {recordId: record.id, ordinal: record.progressCount}
        })
        if(!progress) return err(exceptionResourceNotExist("progressOrdinal", record.progressCount))

        const currentEpisodeWatchedNum = progress.episodeWatchedNum ?? 0
        if(currentEpisodeWatchedNum >= project.episodePublishedNum) {
            return err(exceptionResourceNotExist("nextEpisode", projectId))
        }

        const newEpisodeWatchedNum = currentEpisodeWatchedNum + 1
        const isComplete = episodeFullyPublished && newEpisodeWatchedNum >= episodeTotalNum

        // 更新 episodeWatchedRecords
        const existingRecords = (progress.episodeWatchedRecords as ({watchedTime: string} | null)[]) ?? []
        // Keep array aligned with episodeWatchedNum; manual edits may leave holes.
        const alignedRecords = existingRecords.length > currentEpisodeWatchedNum
            ? existingRecords.slice(0, currentEpisodeWatchedNum)
            : existingRecords.length < currentEpisodeWatchedNum
                ? [...existingRecords, ...Array(currentEpisodeWatchedNum - existingRecords.length).fill(null)]
                : existingRecords
        const newRecords = [...alignedRecords, {watchedTime: now.toISOString()}]

        await prisma.recordProgress.update({
            where: {id: progress.id},
            data: {
                episodeWatchedNum: newEpisodeWatchedNum,
                episodeWatchedRecords: newRecords,
                endTime: isComplete ? now : progress.endTime,
                status: isComplete ? RecordStatus.COMPLETED : progress.status,
                updateTime: now
            }
        })

        await prisma.record.update({
            where: {id: record.id},
            data: {
                status: isComplete ? RecordStatus.COMPLETED : record.status,
                endTime: isComplete ? now : record.endTime,
                specialAttention: !isComplete,
                lastActivityTime: now,
                updateTime: now
            }
        })

        return ok(newEpisodeWatchedNum)
    }
    })
}

export async function deleteProgress(projectId: string, ordinal: number): Promise<Result<void, DeleteProgressError>> {
    return safeExecuteResult(async () => {
    const userId = await getUserId()
    const now = new Date()

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) return err(exceptionResourceNotExist("projectId", projectId))

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return err(exceptionResourceNotExist("recordId", projectId))

    const progress = await prisma.recordProgress.findFirst({
        where: {recordId: record.id, ordinal}
    })
    if(!progress) return err(exceptionResourceNotExist("progressOrdinal", ordinal))

    // 删除进度
    await prisma.recordProgress.delete({where: {id: progress.id}})

    // 调整后续进度的ordinal
    const existingProgresses = await prisma.recordProgress.findMany({
        where: {recordId: record.id, ordinal: {gt: ordinal}},
        orderBy: {ordinal: 'asc'}
    })

    for(const p of existingProgresses) {
        await prisma.recordProgress.update({
            where: {id: p.id},
            data: {ordinal: p.ordinal - 1}
        })
    }

    // 更新record缓存字段：status/startTime/endTime/progressCount
    // 注意：specialAttention 按你的文档约束在 deleteProgress 中不做联动更新
    const remainingProgresses = await prisma.recordProgress.findMany({
        where: {recordId: record.id},
        orderBy: {ordinal: 'asc'}
    })

    const progressCount = remainingProgresses.length
    const firstProgress = remainingProgresses[0] ?? null
    const lastProgress = remainingProgresses[remainingProgresses.length - 1] ?? null

    const status = getRecordStatus(
        progressCount,
        lastProgress?.endTime ?? null,
        project.episodeTotalNum,
        lastProgress?.episodeWatchedNum ?? null
    )

    await prisma.record.update({
        where: {id: record.id},
        data: {
            progressCount,
            status,
            startTime: firstProgress?.startTime ?? null,
            endTime: lastProgress?.endTime ?? null,
            updateTime: now
        }
    })
    return ok(undefined)
    })
}

function getFollowType(ordinal: number, boardcastType: BoardcastType | null, publishTime: string | null, startTime: Date | null): FollowType {
    if(ordinal > 1) return FollowType.REWATCH
    if(boardcastType !== "TV_AND_WEB" || !publishTime || !startTime) return FollowType.CATCH_UP

    const [year, month] = publishTime.split("-").map(Number)
    const endDate = new Date(year, Math.floor((month - 1) / 3) * 3 + 3, 1)

    return startTime < endDate ? FollowType.FOLLOW : FollowType.CATCH_UP
}

function getRecordStatus(progressCount: number, endTime: Date | null, episodeTotalNum: number | null, episodeWatchedNum: number | null): RecordStatus {
    if(progressCount === 0) return RecordStatus.ON_HOLD
    else if(episodeTotalNum !== null && (episodeWatchedNum ?? 0) >= episodeTotalNum!) return RecordStatus.COMPLETED
    else if(endTime !== null) return RecordStatus.COMPLETED
    else return RecordStatus.WATCHING
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