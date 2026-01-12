"use server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/helpers/next"
import { parsePreviewSchema, recordCreateForm, RecordCreateForm, RecordPreviewSchema, RecordDetailSchema, parseDetailSchema } from "@/schemas/record"
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