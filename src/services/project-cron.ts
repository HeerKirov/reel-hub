import { InputJsonValue } from "@prisma/client/runtime/library"
import { exceptionUnauthorized, exceptionInternalServerError, InternalServerError, Unauthorized } from "@/constants/exception"
import { err, ok, Result } from "@/schemas/all"
import { safeExecuteResult } from "@/constants/exception"
import { ProjectType } from "@/constants/project"
import { prisma } from "@/lib/prisma"
import { parseEpisodePublishRecord } from "@/helpers/subscription"
import { processEpisodePlanAutoUpdate } from "./project-utils"
import config from "@/config/config"

export async function cronTick(token: string): Promise<Result<void, Unauthorized | InternalServerError>> {
    return safeExecuteResult<void, Unauthorized | InternalServerError>(async () => {
        const secret = config.AUTH.CRON_SECRET
        if (!secret) {
            return err(exceptionInternalServerError("CRON_SECRET is not set"))
        }
        if (token !== secret) {
            return err(exceptionUnauthorized())
        }

        const projects = await prisma.project.findMany({
            where: {
                type: {in: [ProjectType.ANIME, ProjectType.MANGA, ProjectType.MOVIE]},
                episodePublishPlan: {not: []},
                episodePublishedNum: {lt: prisma.project.fields.episodeTotalNum}
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
                await prisma.project.update({
                    where: {id: project.id},
                    data: {
                        episodePublishedNum: newData.publishedNum,
                        episodePublishPlan: newData.publishPlan as unknown as InputJsonValue,
                        episodePublishedRecords: newData.publishedRecords as unknown as InputJsonValue
                    }
                })
                console.log(`Project "${project.title}" updated published episode num to ${newData.publishedNum}.`)
            }
        }

        return ok(undefined)
    })
}