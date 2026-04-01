import type { Prisma } from "@/prisma/generated/client"
import { InternalServerError } from "@/constants/exception"
import { ok, Result } from "@/schemas/all"
import { safeExecuteTransaction } from "@/helpers/execution"
import { ProjectType } from "@/constants/project"
import { parseEpisodePublishRecord } from "@/helpers/subscription"
import { processEpisodePlanAutoUpdate } from "./project-utils"

export async function cronTick(): Promise<Result<undefined, InternalServerError>> {
    return safeExecuteTransaction(async tx => {
        const projects = await tx.project.findMany({
            where: {
                type: {in: [ProjectType.ANIME, ProjectType.MANGA, ProjectType.MOVIE]},
                episodePublishPlan: {not: []},
                episodePublishedNum: {lt: tx.project.fields.episodeTotalNum}
            }
        })

        const now = new Date()

        for(const project of projects) {
            const newData = processEpisodePlanAutoUpdate(
                project.episodeTotalNum ?? 1, project.episodePublishedNum ?? 0, 
                parseEpisodePublishRecord(project.episodePublishPlan), 
                parseEpisodePublishRecord(project.episodePublishedRecords), 
                now
            )
            if(newData) {
                await tx.project.update({
                    where: {id: project.id},
                    data: {
                        episodePublishedNum: newData.publishedNum,
                        episodePublishPlan: newData.publishPlan as unknown as Prisma.InputJsonValue,
                        episodePublishedRecords: newData.publishedRecords as unknown as Prisma.InputJsonValue
                    }
                })
                console.log(`Project "${project.title}" updated published episode num to ${newData.publishedNum}.`)
            }
        }

        return ok(undefined)
    })
}