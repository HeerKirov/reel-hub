"use server"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { ProjectType, isEpisodeProjectType } from "@/constants/project"
import { RecordStatus } from "@/constants/record"
import type { Prisma } from "@/prisma/generated/client"
import { exceptionInternalServerError, exceptionNotFound, exceptionParamError, exceptionParamRequired, exceptionReject, exceptionRejectCreateProgress, exceptionRejectNextEpisode } from "@/constants/exception"
import { safeExecuteTransaction } from "@/helpers/execution"
import { err, ok, Result } from "@/schemas/all"
import { ActivityEvent, RecordProgressUpsertForm, recordProgressUpsertForm } from "@/schemas/record"
import { CreateProgressError, DeleteProgressError, NextEpisodeError, UpdateLatestProgressError } from "@/schemas/error"
import { getFollowType, getRecordStatus } from "@/helpers/data"
import { objects } from "@/helpers/primitive"

export async function createProgress(projectId: string, form: RecordProgressUpsertForm): Promise<Result<void, CreateProgressError>> {
    return safeExecuteTransaction(async tx => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = recordProgressUpsertForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const project = await tx.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await tx.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        const existingProgresses = await tx.recordProgress.findMany({
            where: {recordId: record.id},
            orderBy: {ordinal: 'asc'}
        })

        const isSupplement = validate.data.startTime !== undefined || validate.data.endTime !== undefined || validate.data.episodeWatchedNum !== undefined

        const createProgressEvent: ActivityEvent = { type: "CREATE_PROGRESS" }

        if(isSupplement) {
            const isEpisodeType = isEpisodeProjectType(project.type)
            const isAnime = project.type === ProjectType.ANIME
            const episodeTotalNum = isEpisodeType ? project.episodeTotalNum! : null
            const episodePublishedNum = isEpisodeType ? project.episodePublishedNum! : null
            const episodeFullyPublished = isEpisodeType && episodePublishedNum! >= episodeTotalNum!

            const startTimeRaw = validate.data.startTime === undefined ? null : validate.data.startTime
            const endTimeRaw = validate.data.endTime === undefined ? null : validate.data.endTime

            // If only watchedNum is provided (without start/end time), we don't know which interval it belongs to.
            if(isEpisodeType && validate.data.startTime === undefined && validate.data.endTime === undefined && validate.data.episodeWatchedNum !== undefined) {
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
                    await tx.recordProgress.update({
                        where: {id: progress.id},
                        data: {ordinal: progress.ordinal + 1}
                    })
                }
            }

            const insertAsLatest = insertOrdinal === existingProgresses.length + 1
            if(insertAsLatest) {
                await tx.recordProgress.updateMany({
                    where: { recordId: record.id, isLatest: true },
                    data: { isLatest: false }
                })
            }

            // Compute episodeWatchedNum & endTime (EPISODE rules)
            let episodeWatchedNum: number | null = null
            let finalEndTime: Date | null = newEndTime

            if(isEpisodeType) {
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
            await tx.recordProgress.create({
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
                    episodeWatchedNum: isEpisodeType ? episodeWatchedNum : null,
                    episodeWatchedRecords: isEpisodeType ? Array(episodeWatchedNum ?? 0).fill(null) : [],
                    followType: isAnime ? getFollowType(insertOrdinal, project.boardcastType, project.publishTime, newStartTime) : null,
                    platform: project.type === ProjectType.GAME ? (validate.data.platform ?? []) : []
                }
            })

            // 更新record
            const newProgressCount = record.progressCount + 1
            const latestProgress = await tx.recordProgress.findFirst({
                where: {recordId: record.id, isLatest: true}
            })
            const latestEpisodeWatchedNum = latestProgress?.episodeWatchedNum ?? null

            await tx.record.update({
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

            await tx.recordProgress.updateMany({
                where: { recordId: record.id, isLatest: true },
                data: { isLatest: false }
            })

            await tx.recordProgress.create({
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
                    episodeWatchedNum: isEpisodeProjectType(project.type) ? 0 : null,
                    episodeWatchedRecords: [],
                    followType: project.type === ProjectType.ANIME && newStartTime !== null ? getFollowType(newOrdinal, project.boardcastType, project.publishTime, newStartTime) : null,
                    platform: []
                }
            })

            // 更新record
            await tx.record.update({
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
    return safeExecuteTransaction(async tx => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = recordProgressUpsertForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const project = await tx.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await tx.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        // 只能更新最新进度
        if(ordinal !== record.progressCount) {
            return err(exceptionReject("Can only update the latest progress"))
        }

        if(record.progressCount === 0) {
            return err(exceptionNotFound("Progress not found"))
        }

        const progress = await tx.recordProgress.findFirst({
            where: {recordId: record.id, ordinal}
        })
        if(!progress) return err(exceptionNotFound("Progress not found"))

        const isEpisodeType = isEpisodeProjectType(project.type)

        const newStartTime = validate.data.startTime !== undefined ? validate.data.startTime : progress.startTime
        let newEndTime: Date | null | undefined = validate.data.endTime ? validate.data.endTime : undefined
        let newStatus: RecordStatus | undefined = validate.data.status !== undefined && validate.data.status !== progress.status ? validate.data.status : undefined

        // start/end 基础范围校验
        if(newStartTime !== null && newEndTime !== undefined && newStartTime.getTime() >= newEndTime.getTime()) {
            return err(exceptionParamError("Start time must be before end time"))
        }

        // start 必须晚于上一条进度 end
        if(ordinal > 1 && newStartTime !== null) {
            const prevProgress = await tx.recordProgress.findFirst({
                where: {recordId: record.id, ordinal: ordinal - 1}
            })
            if(!prevProgress || prevProgress.endTime === null) {
                return err(exceptionParamError("Previous progress must be completed before setting startTime"))
            }
            if(newStartTime.getTime() <= prevProgress.endTime.getTime()) {
                return err(exceptionParamError("Start time must be after previous progress end time"))
            }
        }

        let newEpisodeWatchedNum: number | undefined = undefined
        let newEpisodeWatchedRecords: ({ watchedTime: string } | null)[] | undefined = undefined
        const newPlatform = project.type === ProjectType.GAME && !objects.deepEquals(validate.data.platform, progress.platform) ? validate.data.platform : undefined

        if(isEpisodeType) {
            const episodeTotalNum = project.episodeTotalNum!
            const episodePublishedNum = project.episodePublishedNum!
            const episodeFullyPublished = project.episodePublishedNum !== null && episodeTotalNum > 0 && episodePublishedNum >= episodeTotalNum

            if(newStatus === undefined) {
                const rawWatchedNum = validate.data.episodeWatchedNum !== undefined ? (validate.data.episodeWatchedNum ?? 0) : (progress.episodeWatchedNum ?? 0)

                // 如果用户把 endTime 从 null 设置成非 null => 试图把进度置为完成
                if(newEndTime !== null) {
                    if(!episodeFullyPublished) return err(exceptionReject("Episode is not fully published"))
                    // 完成时需要同步已看集数到总集数（与 BUSINESS 一致）
                    newEpisodeWatchedNum = episodeTotalNum
                } else {
                    // endTime 仍为空：按 watchedNum（如果提供）更新，否则保留当前
                    newEpisodeWatchedNum = Math.max(0, Math.min(rawWatchedNum, episodePublishedNum, episodeTotalNum))

                    // 如果 watchedNum 已达总集数且已完全发布 => 自动设置 endTime=now
                    if(episodeFullyPublished && newEpisodeWatchedNum >= episodeTotalNum) {
                        newEndTime = now
                    }
                }
            }else{
                newEpisodeWatchedNum = undefined
            }

            if(newEpisodeWatchedNum !== undefined) {
                // 手动编辑只裁剪/补全 episodeWatchedRecords（不写 watchedTime）
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
        }

        if(newStatus === RecordStatus.DROPPED) {
            if(progress.status !== RecordStatus.WATCHING) {
                return err(exceptionReject("Only watching progress can be dropped"))
            }
            if(newEndTime === undefined) {
                newEndTime = now
            }
        }else if(newStatus === RecordStatus.WATCHING) {
            if(progress.status !== RecordStatus.DROPPED) {
                return err(exceptionReject("Only dropped progress can be set to watching"))
            }
            newEndTime = null
        }else if(newEndTime !== undefined || newEpisodeWatchedNum !== undefined) {
            newStatus = getRecordStatus(record.progressCount, newEndTime ?? null, project.episodeTotalNum, newEpisodeWatchedNum ?? progress.episodeWatchedNum ?? null)
        }

        const editProgressEvent: ActivityEvent = { type: "EDIT_PROGRESS" }

        // 更新进度（start/endTime/status & anime watched）
        await tx.recordProgress.update({
            where: {id: progress.id},
            data: {
                startTime: newStartTime,
                endTime: newEndTime,
                status: newStatus,
                ...(isEpisodeType ? {
                    episodeWatchedNum: newEpisodeWatchedNum,
                    episodeWatchedRecords: newEpisodeWatchedRecords
                } : {}),
                platform: newPlatform,
                updateTime: now
            }
        })

        // 更新 record 缓存字段（最新进度=最后一条进度）
        const newRecordStatus = newStatus ?? (
            isEpisodeType && (newEndTime !== undefined || newEpisodeWatchedNum !== undefined) ?
            getRecordStatus(record.progressCount, newEndTime ?? null, project.episodeTotalNum, newEpisodeWatchedNum ?? progress.episodeWatchedNum ?? null) 
            : undefined
        )
        console.log("newStatus", newStatus)
        console.log("newEndTime", newEndTime)
        console.log("newEpisodeWatchedNum", newEpisodeWatchedNum)
        console.log("progress.episodeWatchedNum", progress.episodeWatchedNum)
        console.log("nextRecordStatus", newRecordStatus)
        await tx.record.update({
            where: {id: record.id},
            data: {
                status: newRecordStatus,
                endTime: newEndTime,
                // 当 status 从 WATCHING 转为完成/放弃时取消订阅
                specialAttention: (newRecordStatus === RecordStatus.COMPLETED || newRecordStatus === RecordStatus.DROPPED) && record.status === RecordStatus.WATCHING ? false : record.specialAttention,
                lastActivityTime: now,
                lastActivityEvent: editProgressEvent as unknown as Prisma.InputJsonValue,
                updateTime: now
            }
        })

        return ok(undefined)
    })
}

export async function nextEpisode(projectId: string): Promise<Result<number, NextEpisodeError>> {
    return safeExecuteTransaction<number, NextEpisodeError>(async tx => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const project = await tx.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await tx.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        if(!isEpisodeProjectType(project.type)) {
            return err(exceptionReject("Project is not an episode project"))
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

            await tx.recordProgress.create({
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
                    followType: project.type === ProjectType.ANIME ? getFollowType(1, project.boardcastType, project.publishTime, now) : null,
                    platform: []
                }
            })

            await tx.record.update({
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
            const progress = await tx.recordProgress.findFirst({
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

            await tx.recordProgress.update({
                where: {id: progress.id},
                data: {
                    episodeWatchedNum: newEpisodeWatchedNum,
                    episodeWatchedRecords: newRecords,
                    endTime: isComplete ? now : progress.endTime,
                    status: isComplete ? RecordStatus.COMPLETED : progress.status,
                    updateTime: now
                }
            })

            await tx.record.update({
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
    return safeExecuteTransaction(async tx => {
        await requireAccess("record", "write")
        const userId = await getUserId()
        const now = new Date()

        const project = await tx.project.findUnique({where: {id: projectId}})
        if(!project) return err(exceptionNotFound("Project not found"))

        const record = await tx.record.findFirst({where: {ownerId: userId, projectId}})
        if(!record) return err(exceptionNotFound("Record not found"))

        const progress = await tx.recordProgress.findFirst({
            where: {recordId: record.id, ordinal}
        })
        if(!progress) return err(exceptionNotFound("Progress not found"))

        // 删除进度
        await tx.recordProgress.delete({where: {id: progress.id}})

        // 调整后续进度的ordinal
        const existingProgresses = await tx.recordProgress.findMany({
            where: {recordId: record.id, ordinal: {gt: ordinal}},
            orderBy: {ordinal: 'asc'}
        })

        for(const p of existingProgresses) {
            await tx.recordProgress.update({
                where: {id: p.id},
                data: {ordinal: p.ordinal - 1}
            })
        }

        // 更新record缓存字段：status/startTime/endTime/progressCount
        const remainingProgresses = await tx.recordProgress.findMany({
            where: {recordId: record.id},
            orderBy: {ordinal: 'asc'}
        })

        const progressCount = remainingProgresses.length
        const firstProgress = remainingProgresses[0] ?? null
        const lastProgress = remainingProgresses[remainingProgresses.length - 1] ?? null

        await tx.recordProgress.updateMany({
            where: { recordId: record.id, isLatest: true },
            data: { isLatest: false }
        })
        if(lastProgress) {
            await tx.recordProgress.update({
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

        await tx.record.update({
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


