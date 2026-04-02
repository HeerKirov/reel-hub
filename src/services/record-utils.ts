import "server-only"

import { prisma } from "@/lib/prisma"
import { isEpisodeProjectType } from "@/constants/project"
import { RecordStatus } from "@/constants/record"
import { getRecordStatus } from "@/helpers/data"

function alignEpisodeWatchedRecords(current: ({ watchedTime: string } | null)[], targetLen: number): ({ watchedTime: string } | null)[] {
    if(targetLen <= 0) return []
    if(current.length === targetLen) return current
    if(current.length > targetLen) return current.slice(0, targetLen)
    return [...current, ...Array(targetLen - current.length).fill(null)]
}

/**
 * 当 EPISODE 类型的 episodeTotalNum / episodePublishedNum 发生变化时，
 * 需要同步所有 RecordProgress 的状态与 watchedNum，并重算 Record 的缓存字段。
 *
 * specialAttention 不参与此同步（只在“普通完成”行为里由业务侧取消）。
 */
export async function syncEpisodeRecordProgressAfterEpisodeMetaChange(projectId: string, now: Date): Promise<void> {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if(!project || !isEpisodeProjectType(project.type)) return

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

