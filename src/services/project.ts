"use server"
import { prisma } from "@/lib/prisma"
import { ProjectType } from "@/constants/project"
import { exceptionParamError, InternalServerError } from "@/constants/exception"
import { ProjectListFilter, projectListFilter, parseProjectSimpleSchema, EpisodeTimeTableGroup, EpisodeTimeTableItem } from "@/schemas/project"
import { USER_PREFERENCE_DEFAULT } from "@/schemas/user-preference"
import { ListProjectError } from "@/schemas/error"
import { Result, err, ok } from "@/schemas/all"
import { getDisplayTimeZone, getUserPreference } from "@/services/user-preference-utils"
import { safeExecute } from "@/helpers/execution"
import { parseEpisodePublishRecord, getNextPublishPlanItemAfterNow, nextPublishTimeFromItem, computeTimeInWeek } from "@/helpers/subscription"
import { getUserIdOrNull } from "@/helpers/next"

export async function findProject(filter: ProjectListFilter): Promise<Result<{id: string, type: ProjectType, title: string, subtitles: string[]}[], ListProjectError>> {
    return safeExecute(async () => {
        const validate = projectListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const r = await prisma.project.findMany({
            where: {
                type: validate.data.type ?? undefined,
                OR: validate.data.search ? [
                    {title: {contains: validate.data.search}},
                    {subtitles: {contains: validate.data.search}},
                    {keywords: {contains: validate.data.search}}
                ] : undefined
            },
            orderBy: {
                publishTime: "desc"
            },
            skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
            take: validate.data.size ?? 15,
            select: {
                id: true,
                type: true,
                title: true,
                subtitles: true
            }
        })

        return ok(r.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            subtitles: item.subtitles.split("|").filter(s => s !== "")
        })))
    })
}

export async function retrieveEpisodeTimeTable(): Promise<Result<EpisodeTimeTableGroup[], InternalServerError>> {
    return safeExecute(async () => {
        const now = new Date()
        const timeZone = await getDisplayTimeZone()
        const userId = await getUserIdOrNull()
        const preference = userId ? await getUserPreference(userId) : null
        const nightTimeTable = preference?.nightTimeTable ?? USER_PREFERENCE_DEFAULT.nightTimeTable

        const episodeTypes = [ProjectType.ANIME, ProjectType.MANGA, ProjectType.MOVIE]
        const projects = await prisma.project.findMany({
            where: {
                type: { in: episodeTypes },
                episodePublishedNum: { not: null },
                episodeTotalNum: { not: null },
            },
            select: {
                id: true,
                type: true,
                title: true,
                resources: true,
                episodeTotalNum: true,
                episodePublishedNum: true,
                episodePublishPlan: true
            }
        })

        const byWeekday = new Map<number, Array<EpisodeTimeTableItem & { sortMinuteOfDay: number }>>()
        for (const project of projects) {
            const totalNum = project.episodeTotalNum ?? 0
            const publishedNum = project.episodePublishedNum ?? 0
            if (totalNum <= 0 || publishedNum >= totalNum) continue

            const plan = parseEpisodePublishRecord(project.episodePublishPlan)
            if (plan.length === 0) continue

            const nextPlanItem = getNextPublishPlanItemAfterNow(plan, now)
            if (!nextPlanItem) continue
            const nextPublishTime = nextPublishTimeFromItem(nextPlanItem)
            if (!nextPublishTime) continue

            const timeInWeek = computeTimeInWeek(nextPublishTime, timeZone, nightTimeTable)
            const weekday = Math.floor(timeInWeek / (60 * 24))
            const minuteOfDay = timeInWeek - weekday * 60 * 24

            const row: EpisodeTimeTableItem & { sortMinuteOfDay: number } = {
                project: parseProjectSimpleSchema(project),
                nextPublishTime,
                nextPublishPlanItem: nextPlanItem,
                sortMinuteOfDay: minuteOfDay
            }

            const list = byWeekday.get(weekday) ?? []
            list.push(row)
            byWeekday.set(weekday, list)
        }

        const groups = [...byWeekday.entries()]
            .sort(([a], [b]) => a - b)
            .map(([weekday, rows]) => {
                const sortedRows = rows.sort((a, b) => {
                    if (a.sortMinuteOfDay !== b.sortMinuteOfDay) return a.sortMinuteOfDay - b.sortMinuteOfDay
                    return a.project.id.localeCompare(b.project.id)
                })

                return {
                    weekday,
                    items: sortedRows.map(({ sortMinuteOfDay: _sortMinuteOfDay, ...item }) => item)
                }
            })

        return ok(groups)
    })
}
