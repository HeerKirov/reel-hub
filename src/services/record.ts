"use server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { parsePreviewSchema, recordCreateForm, RecordCreateForm, RecordPreviewSchema, RecordDetailSchema, parseDetailSchema, RecordUpdateForm, recordUpdateForm, RecordProgressUpsertForm, recordProgressUpsertForm } from "@/schemas/record"
import { BoardcastType, FollowType, ProjectType, RecordStatus } from "@/prisma/generated"

export async function retrieveRecordPreview(projectId: string): Promise<RecordPreviewSchema | null> {
    const userId = await getUserId()

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) return null

    const recordProgress = record.progressCount > 0 ? await prisma.recordProgress.findFirst({where: {recordId: record.id, ordinal: record.progressCount}}) : null

    return parsePreviewSchema(record, recordProgress)
}

export async function retrieveRecord(projectId: string): Promise<RecordDetailSchema | null> {
    const userId = await getUserId()

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")

    const record = await prisma.record.findFirst({
        where: {ownerId: userId, projectId},
        include: {
            progresses: {
                orderBy: {ordinal: 'asc'}
            }
        }
    })
    if(!record) return null

    return parseDetailSchema(record, record.progresses)
}

export async function createRecord(projectId: string, form: RecordCreateForm) {
    const userId = await getUserId()
    const now = new Date()

    const validate = recordCreateForm.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)
    
    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")
    
    if(await prisma.record.findFirst({where: {ownerId: userId, projectId}})) {
        throw new Error("Record already exists")
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
            throw new Error("Progress list is required for supplement mode")
        }

        for(let i = 0; i < validate.data.progress.length - 1; i++) {
            const progress = validate.data.progress[i]
            if(!progress.endTime) {
                throw new Error("Only the last progress can be incomplete")
            }
        }

        let lastEndTime: Date | null = null
        for(let i = 0; i < validate.data.progress.length; i++) {
            const progress = validate.data.progress[i]
            const isLast = i === validate.data.progress.length - 1

            if(!isLast) {
                // Not last progress must have endTime
                if(!progress.endTime) {
                    throw new Error("Only the last progress can be incomplete") 
                }

                // If has startTime, must be before endTime
                if(progress.startTime && progress.startTime > progress.endTime) {
                    throw new Error("Start time must be before end time")
                }

                // Progress must be in order
                if(lastEndTime && progress.startTime && progress.startTime < lastEndTime) {
                    throw new Error("Progress must be in chronological order")
                }
                lastEndTime = progress.endTime
            } else {
                if(!progress.endTime) {
                    // Incomplete progress must have startTime
                    if(!progress.startTime) {
                        throw new Error("Incomplete progress must have start time")
                    }
                    // For anime, must have episodeWatchedNum
                    if(project.type === ProjectType.ANIME && progress.episodeWatchedNum === undefined) {
                        throw new Error("Anime progress must specify watched episodes")
                    }
                } else {
                    // Complete progress follows same rules
                    if(progress.startTime && progress.startTime > progress.endTime) {
                        throw new Error("Start time must be before end time")
                    }
                    if(lastEndTime && progress.startTime && progress.startTime < lastEndTime) {
                        throw new Error("Progress must be in chronological order") 
                    }
                }
            }
        }
        const episodeWatchedNum = project.type === ProjectType.ANIME ? (
            validate.data.progress[validate.data.progress.length - 1].endTime !== null ? project.episodePublishedNum! : (
                validate.data.progress[validate.data.progress.length - 1].episodeWatchedNum === null || validate.data.progress[validate.data.progress.length - 1].episodeWatchedNum! > project.episodePublishedNum! ? project.episodePublishedNum! : validate.data.progress[validate.data.progress.length - 1].episodeWatchedNum!
            )
        ) : null

        const record = await prisma.record.create({
            data: {
                ownerId: userId,
                projectId,
                specialAttention: project.type === ProjectType.ANIME && episodeWatchedNum! < project.episodeTotalNum!,
                status: getRecordStatus(validate.data.progress.length, validate.data.progress[validate.data.progress.length - 1].endTime, project.episodeTotalNum, episodeWatchedNum),
                progressCount: validate.data.progress.length,
                startTime: validate.data.progress[validate.data.progress.length - 1].startTime,
                endTime: validate.data.progress[validate.data.progress.length - 1].endTime,
                lastActivityTime: now,
                lastActivityEvent: {},
                createTime: now,
                updateTime: now
            }
        })
        for(let i = 0; i < validate.data.progress.length; i++) {
            const progressForm = validate.data.progress[i]
            await prisma.recordProgress.create({
                data: {
                    projectId, recordId: record.id,
                    ordinal: i + 1,
                    status: getRecordStatus(i + 1, progressForm.endTime, project.episodeTotalNum, episodeWatchedNum),
                    startTime: progressForm.startTime,
                    endTime: project.type === ProjectType.ANIME && i === validate.data.progress.length - 1 && episodeWatchedNum! >= project.episodeTotalNum! ? now : progressForm.endTime,
                    createTime: now,
                    updateTime: now,
                    //anime
                    episodeWatchedNum: project.type === ProjectType.ANIME ? (i === validate.data.progress.length - 1 ? episodeWatchedNum : project.episodeTotalNum!) : null,
                    episodeWatchedRecords: [],
                    followType: project.type === ProjectType.ANIME ? getFollowType(i + 1, project.boardcastType, project.publishTime, progressForm.startTime) : null,
                    //game
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
}

export async function updateRecord(projectId: string, form: RecordUpdateForm): Promise<void> {
    const userId = await getUserId()

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) throw new Error("Record not found")
    
    const validate = recordUpdateForm.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    const now = new Date()

    await prisma.record.update({
        where: {id: record.id},
        data: {
            specialAttention: validate.data.specialAttention,
            updateTime: now
        }
    })
}

export async function deleteRecord(projectId: string): Promise<void> {
    const userId = await getUserId()

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) throw new Error("Record not found")

    await prisma.record.delete({where: {id: record.id}})
    await prisma.recordProgress.deleteMany({where: {recordId: record.id}})
}

export async function createProgress(projectId: string, form: RecordProgressUpsertForm): Promise<void> {
    const userId = await getUserId()
    const now = new Date()

    const validate = recordProgressUpsertForm.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) throw new Error("Record not found")

    const existingProgresses = await prisma.recordProgress.findMany({
        where: {recordId: record.id},
        orderBy: {ordinal: 'asc'}
    })

    const isSupplement = validate.data.startTime !== undefined || validate.data.endTime !== undefined || validate.data.episodeWatchedNum !== undefined

    if(isSupplement) {
        // Supplement模式：根据时间次序插队
        if(validate.data.endTime === undefined && validate.data.episodeWatchedNum === undefined) {
            throw new Error("End time or episode watched num is required for supplement mode")
        }
        if(validate.data.startTime !== undefined && validate.data.startTime !== null && validate.data.endTime !== undefined && validate.data.endTime !== null && validate.data.startTime > validate.data.endTime) {
            throw new Error("Start time must be before end time")
        }

        const newStartTime = validate.data.startTime ?? null
        const newEndTime = validate.data.endTime ?? null

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
                if(newEndTime.getTime() === progress.endTime.getTime()) {
                    foundOrdinal = progress.ordinal + 1
                    break
                }
            }
            insertOrdinal = foundOrdinal ?? (existingProgresses.length + 1)
        } else {
            // 存在已有进度，未指定新进度的完成时间
            const lastProgress = existingProgresses[existingProgresses.length - 1]
            if(lastProgress.endTime !== null) {
                // 不存在已完成的进度，直接追加到末尾
                insertOrdinal = existingProgresses.length + 1
            } else {
                // 存在已有进度，未指定新进度的完成时间，且存在未完成的进度时，提示无法插入
                throw new Error("Cannot create new progress because latest progress is not completed")
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

        // 计算episodeWatchedNum
        const episodeWatchedNum = project.type === ProjectType.ANIME ? (
            newEndTime !== null || (validate.data.episodeWatchedNum !== undefined && validate.data.episodeWatchedNum !== null && validate.data.episodeWatchedNum! > project.episodePublishedNum!) 
                ? project.episodePublishedNum! 
                : (validate.data.episodeWatchedNum ?? null)
        ) : null

        // 创建新进度
        await prisma.recordProgress.create({
            data: {
                projectId,
                recordId: record.id,
                ordinal: insertOrdinal,
                status: getRecordStatus(insertOrdinal, newEndTime, project.episodeTotalNum, episodeWatchedNum),
                startTime: newStartTime,
                endTime: newEndTime,
                createTime: now,
                updateTime: now,
                episodeWatchedNum: project.type === ProjectType.ANIME ? episodeWatchedNum : null,
                episodeWatchedRecords: [],
                followType: project.type === ProjectType.ANIME ? getFollowType(insertOrdinal, project.boardcastType, project.publishTime, newStartTime) : null,
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
            throw new Error("Cannot create new progress because latest progress is not completed")
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
}

export async function updateLatestProgress(projectId: string, ordinal: number, form: RecordProgressUpsertForm): Promise<void> {
    const userId = await getUserId()
    const now = new Date()

    const validate = recordProgressUpsertForm.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) throw new Error("Record not found")

    // 只能更新最新进度
    if(ordinal !== record.progressCount) {
        throw new Error("Can only update the latest progress")
    }

    if(record.progressCount === 0) {
        throw new Error("Record has no progress. Please create one first")
    }

    const progress = await prisma.recordProgress.findFirst({
        where: {recordId: record.id, ordinal}
    })
    if(!progress) throw new Error("Progress not found")

    // 只更新episodeWatchedNum（类似旧代码的updateLatestProgress）
    if(validate.data.episodeWatchedNum === undefined) {
        // 如果没有提供episodeWatchedNum，不需要更新
        return
    }

    const newEpisodeWatchedNum = project.type === ProjectType.ANIME ? (
        validate.data.episodeWatchedNum! > project.episodePublishedNum! ? project.episodePublishedNum! : validate.data.episodeWatchedNum!
    ) : null

    if(newEpisodeWatchedNum === progress.episodeWatchedNum) {
        // 如果值没有变化，不需要更新
        return
    }

    // 更新进度
    await prisma.recordProgress.update({
        where: {id: progress.id},
        data: {
            episodeWatchedNum: project.type === ProjectType.ANIME ? newEpisodeWatchedNum : progress.episodeWatchedNum,
            endTime: project.type === ProjectType.ANIME && newEpisodeWatchedNum! >= project.episodeTotalNum! ? now : (progress.endTime && newEpisodeWatchedNum! < project.episodeTotalNum! ? null : progress.endTime),
            status: getRecordStatus(ordinal, project.type === ProjectType.ANIME && newEpisodeWatchedNum! >= project.episodeTotalNum! ? now : progress.endTime, project.episodeTotalNum, newEpisodeWatchedNum),
            updateTime: now
        }
    })

    // 更新record
    await prisma.record.update({
        where: {id: record.id},
        data: {
            status: getRecordStatus(record.progressCount, project.type === ProjectType.ANIME && newEpisodeWatchedNum! >= project.episodeTotalNum! ? now : progress.endTime, project.episodeTotalNum, newEpisodeWatchedNum),
            endTime: project.type === ProjectType.ANIME && newEpisodeWatchedNum! >= project.episodeTotalNum! ? now : record.endTime,
            specialAttention: project.type === ProjectType.ANIME && newEpisodeWatchedNum !== null && newEpisodeWatchedNum < project.episodeTotalNum!,
            lastActivityTime: newEpisodeWatchedNum! > (progress.episodeWatchedNum ?? 0) ? now : record.lastActivityTime,
            updateTime: now
        }
    })
}

export async function nextEpisode(projectId: string): Promise<number> {
    const userId = await getUserId()
    const now = new Date()

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) throw new Error("Record not found")

    if(project.type !== ProjectType.ANIME) {
        throw new Error("nextEpisode is only available for anime projects")
    }

    if(project.episodePublishedNum === null || project.episodePublishedNum === 0) {
        throw new Error("No next episode")
    }

    if(record.progressCount === 0) {
        // 没有进度，那么创建一个
        const newEpisodeWatchedNum = 1
        const isComplete = newEpisodeWatchedNum >= (project.episodeTotalNum ?? 0)

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

        return newEpisodeWatchedNum
    } else {
        // 有进度，那么查找此进度
        const progress = await prisma.recordProgress.findFirst({
            where: {recordId: record.id, ordinal: record.progressCount}
        })
        if(!progress) throw new Error("Progress not found")

        const currentEpisodeWatchedNum = progress.episodeWatchedNum ?? 0
        if(currentEpisodeWatchedNum >= project.episodePublishedNum) {
            throw new Error("No next episode")
        }

        const newEpisodeWatchedNum = currentEpisodeWatchedNum + 1
        const isComplete = newEpisodeWatchedNum >= (project.episodeTotalNum ?? 0)

        // 更新 episodeWatchedRecords
        const existingRecords = (progress.episodeWatchedRecords as ({watchedTime: string} | null)[]) ?? []
        const newRecords = [...existingRecords, {watchedTime: now.toISOString()}]

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

        return newEpisodeWatchedNum
    }
}

export async function deleteProgress(projectId: string, ordinal: number): Promise<void> {
    const userId = await getUserId()
    const now = new Date()

    const project = await prisma.project.findUnique({where: {id: projectId}})
    if(!project) throw new Error("Project not found")

    const record = await prisma.record.findFirst({where: {ownerId: userId, projectId}})
    if(!record) throw new Error("Record not found")

    const progress = await prisma.recordProgress.findFirst({
        where: {recordId: record.id, ordinal}
    })
    if(!progress) throw new Error("Progress not found")

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

    // 更新record（只更新progressCount和updateTime，类似旧代码）
    await prisma.record.update({
        where: {id: record.id},
        data: {
            progressCount: record.progressCount - 1,
            updateTime: now
        }
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