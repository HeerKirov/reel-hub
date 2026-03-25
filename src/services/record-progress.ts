"use server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { Prisma, ProjectType, RecordStatus } from "@/prisma/generated"
import { exceptionInternalServerError, exceptionNotFound, exceptionParamError, exceptionParamRequired, exceptionReject, exceptionRejectCreateProgress, exceptionRejectNextEpisode, safeExecuteResult } from "@/constants/exception"
import { err, ok, Result } from "@/schemas/all"
import { ActivityEvent, RecordProgressUpsertForm, recordProgressUpsertForm } from "@/schemas/record"
import { CreateProgressError, DeleteProgressError, NextEpisodeError, UpdateLatestProgressError } from "@/schemas/error"
import { getFollowType, getRecordStatus } from "@/helpers/data"

export async function createProgress(projectId: string, form: RecordProgressUpsertForm): Promise<Result<void, CreateProgressError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = recordProgressUpsertForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        const existingProgresses = await prisma.recordProgress.findMany({
            where: {recordId: record.id},
            orderBy: {ordinal: 'asc'}
        })

        const isSupplement = validate.data.startTime !== undefined || validate.data.endTime !== undefined || validate.data.episodeWatchedNum !== undefined

        const createProgressEvent: ActivityEvent = { type: "CREATE_PROGRESS" }

        if(isSupplement) {
            const isAnime = project.type === ProjectType.ANIME
            const episodeTotalNum = isAnime ? project.episodeTotalNum! : null
            const episodePublishedNum = isAnime ? project.episodePublishedNum! : null
            const episodeFullyPublished = isAnime && episodePublishedNum! >= episodeTotalNum!

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
                        // 不满足插入新的未完成进度条件
                        return err(exceptionRejectCreateProgress("Latest progress is not completed"))
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

            const insertAsLatest = insertOrdinal === existingProgresses.length + 1
            if(insertAsLatest) {
                await prisma.recordProgress.updateMany({
                    where: { recordId: record.id, isLatest: true },
                    data: { isLatest: false }
                })
            }

            // Compute episodeWatchedNum & endTime (ANIME rules)
            let episodeWatchedNum: number | null = null
            let finalEndTime: Date | null = newEndTime

            if(isAnime) {
                // Completed progress => require full release
                if(newEndTime !== null) {
                    if(!episodeFullyPublished) {
                        // 不满足插入新的已完成进度条件
                        return err(exceptionRejectCreateProgress("Episode is not fully published"))
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
                    isLatest: insertAsLatest,
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
                where: {recordId: record.id, isLatest: true}
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
                    lastActivityEvent: createProgressEvent as unknown as Prisma.InputJsonValue,
                    updateTime: now
                }
            })
        } else {
            // 新建进度模式：要求上一条进度必须是已完成状态（如果存在）
            const latestProgress = existingProgresses.length > 0 ? existingProgresses[existingProgresses.length - 1] : null
            if(latestProgress !== null && latestProgress.endTime === null) {
                // 不满足插入新的未完成进度条件
                return err(exceptionRejectCreateProgress("Latest progress is not completed"))
            }

            const newOrdinal = existingProgresses.length + 1
            const newStartTime = now
            const newEndTime = null

            await prisma.recordProgress.updateMany({
                where: { recordId: record.id, isLatest: true },
                data: { isLatest: false }
            })

            await prisma.recordProgress.create({
                data: {
                    projectId,
                    recordId: record.id,
                    ordinal: newOrdinal,
                    isLatest: true,
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
                    lastActivityEvent: createProgressEvent as unknown as Prisma.InputJsonValue,
                    updateTime: now
                }
            })
        }
        return ok(undefined)
    })
}

export async function updateLatestProgress(projectId: string, ordinal: number, form: RecordProgressUpsertForm): Promise<Result<void, UpdateLatestProgressError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = recordProgressUpsertForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        // 只能更新最新进度
        if(ordinal !== record.progressCount) {
            return err(exceptionReject("Can only update the latest progress"))
        }

        if(record.progressCount === 0) {
            return err(exceptionNotFound("Progress not found"))
        }

        const progress = await prisma.recordProgress.findFirst({
            where: {recordId: record.id, ordinal}
        })
        if(!progress) return err(exceptionNotFound("Progress not found"))

        // 只更新episodeWatchedNum（类似旧代码的updateLatestProgress）
        if(validate.data.episodeWatchedNum === undefined) {
            // 如果没有提供episodeWatchedNum，不需要更新
            return ok(undefined)
        }
        
        const isAnime = project.type === ProjectType.ANIME
        const episodeTotalNum = isAnime ? project.episodeTotalNum! : null
        const episodePublishedNum = isAnime ? project.episodePublishedNum! : null

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

        const episodeFullyPublished = isAnime && episodePublishedNum! >= episodeTotalNum!
        const shouldComplete = isAnime && episodeFullyPublished && (newEpisodeWatchedNum ?? 0) >= (episodeTotalNum ?? 0)
        const finalEndTime = shouldComplete ? now : null
        const finalStatus = getRecordStatus(ordinal, finalEndTime, episodeTotalNum, newEpisodeWatchedNum)
        const editProgressEvent: ActivityEvent = { type: "EDIT_PROGRESS" }

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
                // 只有从 WATCHING 转换到完成/搁置/放弃时取消订阅；其余情况下保持原值
                specialAttention: (nextRecordStatus === RecordStatus.COMPLETED || nextRecordStatus === RecordStatus.DROPPED) && record.status === RecordStatus.WATCHING ? false : record.specialAttention,
                lastActivityTime: now,
                lastActivityEvent: editProgressEvent as unknown as Prisma.InputJsonValue,
                updateTime: now
            }
        })
        return ok(undefined)
    })
}

export async function nextEpisode(projectId: string): Promise<Result<number, NextEpisodeError>> {
    return safeExecuteResult<number, NextEpisodeError>(async () => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        if(project.type !== ProjectType.ANIME) {
            return err(exceptionReject("Project is not an anime"))
        }

        if(project.episodePublishedNum === null || project.episodePublishedNum === 0) {
            // 不满足 next 条件
            return err(exceptionRejectNextEpisode())
        }

        const episodeTotalNum = project.episodeTotalNum ?? 0
        const episodeFullyPublished = project.episodePublishedNum !== null && episodeTotalNum > 0 && project.episodePublishedNum >= episodeTotalNum

        if(record.progressCount === 0) {
            // 没有进度，那么创建一个
            const newEpisodeWatchedNum = 1
            const watchEpisodeEvent: ActivityEvent = { type: "WATCH_EPISODE", episodeNum: newEpisodeWatchedNum }
            const isComplete = episodeFullyPublished && newEpisodeWatchedNum >= episodeTotalNum

            await prisma.recordProgress.create({
                data: {
                    projectId,
                    recordId: record.id,
                    ordinal: 1,
                    isLatest: true,
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
                    lastActivityEvent: watchEpisodeEvent as unknown as Prisma.InputJsonValue,
                    updateTime: now,
                    // 只在进入 COMPLETED 时取消订阅
                    specialAttention: isComplete ? false : record.specialAttention
                }
            })

            return ok(newEpisodeWatchedNum)
        } else {
            // 有进度，那么查找此进度
            const progress = await prisma.recordProgress.findFirst({
                where: {recordId: record.id, isLatest: true}
            })
            // record.progressCount > 0 时却找不到 latest progress：应当是数据不一致
            if(!progress) return err(exceptionInternalServerError("Progress not found"))

            const currentEpisodeWatchedNum = progress.episodeWatchedNum ?? 0
            if(currentEpisodeWatchedNum >= project.episodePublishedNum) {
                // 不满足 next 条件
                return err(exceptionRejectNextEpisode("Next episode is not available"))
            }

            const newEpisodeWatchedNum = currentEpisodeWatchedNum + 1
            const watchEpisodeEvent: ActivityEvent = { type: "WATCH_EPISODE", episodeNum: newEpisodeWatchedNum }
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
                    specialAttention: isComplete ? false : record.specialAttention,
                    lastActivityTime: now,
                    lastActivityEvent: watchEpisodeEvent as unknown as Prisma.InputJsonValue,
                    updateTime: now
                }
            })

            return ok(newEpisodeWatchedNum)
        }
    })
}

export async function deleteProgress(projectId: string, ordinal: number): Promise<Result<void, DeleteProgressError>> {
    return safeExecuteResult(async () => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const project = await prisma.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        const progress = await prisma.recordProgress.findFirst({
            where: {recordId: record.id, ordinal}
        })
        if(!progress) return err(exceptionNotFound("Progress not found"))

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
        // specialAttention 不做联动更新
        const remainingProgresses = await prisma.recordProgress.findMany({
            where: {recordId: record.id},
            orderBy: {ordinal: 'asc'}
        })

        const progressCount = remainingProgresses.length
        const firstProgress = remainingProgresses[0] ?? null
        const lastProgress = remainingProgresses[remainingProgresses.length - 1] ?? null

        await prisma.recordProgress.updateMany({
            where: { recordId: record.id, isLatest: true },
            data: { isLatest: false }
        })
        if(lastProgress) {
            await prisma.recordProgress.update({
                where: { id: lastProgress.id },
                data: { isLatest: true }
            })
        }

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


