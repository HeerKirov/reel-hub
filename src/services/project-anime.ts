"use server"
import { cache } from "react"
import { getUserId } from "@/helpers/next"
import { requireAccess } from "@/helpers/auth-guard"
import { objects } from "@/helpers/primitive"
import { prisma } from "@/lib/prisma"
import { AnimeForm, AnimeListFilter, animeForm, AnimeDetailSchema, AnimeListSchema, parseAnimeListSchema, parseAnimeDetailSchema, animeListFilter } from "@/schemas/anime"
import { err, ListResult, ok, Result } from "@/schemas/all"
import { ProjectType, RATING_SEX_TO_INDEX, RATING_VIOLENCE_TO_INDEX } from "@/constants/project"
import { exceptionParamError, exceptionResourceNotExist, safeExecuteResult } from "@/constants/exception"
import { EpisodePublishRecord, ProjectRelationModel } from "@/schemas/project"
import { getPublishTimeRange } from "@/helpers/data"
import { CreateProjectAnimeError, DeleteProjectAnimeError, ListProjectAnimeError, UpdateProjectAnimeError } from "@/schemas/error"
import { getRelations, removeProjectInTopology, saveStaffs, saveTags, updateRelations } from "./project"
import { syncAnimeRecordProgressAfterEpisodeMetaChange } from "@/services/record"

export async function listProjectAnime(filter: AnimeListFilter): Promise<Result<ListResult<AnimeListSchema>, ListProjectAnimeError>> {
    return safeExecuteResult(async () => {
        const validate = animeListFilter.safeParse(filter)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const where = {
            type: ProjectType.ANIME,
            OR: validate.data.search ? [
                {title: {contains: validate.data.search}},
                {subtitles: {contains: validate.data.search}},
                {keywords: {contains: validate.data.search}}
            ] : undefined,
            ratingS: validate.data.ratingS !== undefined ? RATING_SEX_TO_INDEX[validate.data.ratingS] : undefined,
            ratingV: validate.data.ratingV !== undefined ? RATING_VIOLENCE_TO_INDEX[validate.data.ratingV] : undefined,
            boardcastType: validate.data.boardcastType,
            originalType: validate.data.originalType,
            publishTime: validate.data.publishTime !== undefined ? getPublishTimeRange(validate.data.publishTime) : undefined,
            tags: validate.data.tag ? {
                some: {
                    tag: {
                        name: validate.data.tag
                    }
                }
            } : undefined,
            staffs: validate.data.staff ? {
                some: {
                    staff: {
                        name: validate.data.staff
                    }
                }
            } : undefined
        }

        const [r, total] = await Promise.all([
            prisma.project.findMany({
                where,
                orderBy: {
                    publishTime: "desc"
                },
                skip: ((validate.data.page ?? 1) - 1) * (validate.data.size ?? 15),
                take: validate.data.size ?? 15
            }),
            prisma.project.count({ where })
        ])

        return ok<ListResult<AnimeListSchema>, ListProjectAnimeError>({
            list: r.map(parseAnimeListSchema),
            total
        })
    })
}

export const retrieveProjectAnime = cache(async function(id: string): Promise<AnimeDetailSchema | null> {
    const r = await prisma.project.findUnique({
        where: {id}, 
        include: {
            staffs: {
                include: {staff: true}
              },
              tags: {
                include: {tag: true}
              }
        }
    })
    if(!r) return null
    
    const { relations, relationsTopology } = await getRelations(r.relations as ProjectRelationModel, r.relationsTopology as ProjectRelationModel)
    
    return parseAnimeDetailSchema(r, relations, relationsTopology)
})

export async function createProjectAnime(form: AnimeForm): Promise<Result<string, CreateProjectAnimeError>> {
    return safeExecuteResult(async () => {
        await requireAccess("project", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = animeForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        if((validate.data.episodeTotalNum !== undefined)
            || (validate.data.episodePublishedNum !== undefined)
            || (validate.data.episodePublishPlan !== undefined)
            || (validate.data.episodePublishedRecords !== undefined)) {
            const { publishedNum, publishPlan, publishedRecords } = processEpisodePlan(
                validate.data.episodeTotalNum ?? 0, 
                validate.data.episodePublishedNum ?? 0, 
                validate.data.episodePublishPlan ?? [], 
                validate.data.episodePublishedRecords ?? [], 
                now
            )

            validate.data.episodePublishedNum = publishedNum
            validate.data.episodePublishPlan = publishPlan
            validate.data.episodePublishedRecords = publishedRecords
        }

        const r = await prisma.project.create({
            data: {
                title: validate.data.title ?? "",
                subtitles: validate.data.subtitles?.join("|") ?? "",
                description: validate.data.description || "",
                keywords: validate.data.keywords?.join("|") ?? "",
                type: ProjectType.ANIME,
                publishTime: validate.data.publishTime ?? null,
                ratingS: validate.data.ratingS !== undefined && validate.data.ratingS !== null ? RATING_SEX_TO_INDEX[validate.data.ratingS] : null,
                ratingV: validate.data.ratingV !== undefined && validate.data.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[validate.data.ratingV] : null,
                region: validate.data.region ?? null,
                relations: {},
                relationsTopology: {},
                resources: {},
                createTime: now,
                updateTime: now,
                creator: userId,
                updator: userId,
                originalType: validate.data.originalType ?? null,
                boardcastType: validate.data.boardcastType ?? null,
                episodeDuration: validate.data.episodeDuration ?? null,
                episodeTotalNum: validate.data.episodeTotalNum ?? 1,
                episodePublishedNum: validate.data.episodePublishedNum ?? 0,
                episodePublishPlan: validate.data.episodePublishPlan ?? [],
                episodePublishedRecords: validate.data.episodePublishedRecords ?? [],
                platform: [],
                onlineType: null
            }
        })

        if(form.tags !== undefined) {
            const tagResult = await saveTags(r.id, ProjectType.ANIME, form.tags)
            if(!tagResult.ok) return err(tagResult.err)
        }
        if(form.staffs !== undefined) {
            const staffResult = await saveStaffs(r.id, form.staffs)
            if(!staffResult.ok) return err(staffResult.err)
        }
        if(form.relations !== undefined) {
            const relationResult = await updateRelations(r.id, form.relations)
            if(!relationResult.ok) return err(relationResult.err)
        }

        return ok<string, CreateProjectAnimeError>(r.id)
    })
}

export async function updateProjectAnime(id: string, form: AnimeForm): Promise<Result<void, UpdateProjectAnimeError>> {
    return safeExecuteResult(async () => {
        await requireAccess("project", "write")
        const userId = await getUserId()
        const now = new Date()

        const validate = animeForm.safeParse(form)
        if(!validate.success) return err(exceptionParamError(validate.error.message))

        const record = await prisma.project.findUnique({where: {id}})
        if(!record) return err(exceptionResourceNotExist("projectId", id))

        if((validate.data.episodeTotalNum !== undefined && validate.data.episodePublishedNum !== record.episodePublishedNum)
            || (validate.data.episodePublishedNum !== undefined && validate.data.episodePublishedNum !== record.episodePublishedNum)
            || (validate.data.episodePublishPlan !== undefined && !objects.deepEquals(validate.data.episodePublishPlan, record.episodePublishPlan))
            || (validate.data.episodePublishedRecords !== undefined && !objects.deepEquals(validate.data.episodePublishedRecords, record.episodePublishedRecords))) {
            const { publishedNum, publishPlan, publishedRecords } = processEpisodePlan(
                validate.data.episodeTotalNum ?? record.episodeTotalNum ?? 0, 
                validate.data.episodePublishedNum ?? record.episodePublishedNum ?? 0, 
                validate.data.episodePublishPlan ?? (record.episodePublishPlan as unknown as EpisodePublishRecord[]) ?? [], 
                validate.data.episodePublishedRecords ?? (record.episodePublishedRecords as unknown as EpisodePublishRecord[]) ?? [], 
                now
            )

            validate.data.episodePublishedNum = publishedNum
            validate.data.episodePublishPlan = publishPlan
            validate.data.episodePublishedRecords = publishedRecords
        }

        await prisma.project.update({
            where: { id },
            data: {
                title: validate.data.title,
                subtitles: validate.data.subtitles?.join("|") ?? "",
                description: validate.data.description,
                keywords: validate.data.keywords?.join("|") ?? "",
                publishTime: validate.data.publishTime,
                ratingS: validate.data.ratingS !== undefined && validate.data.ratingS !== null ? RATING_SEX_TO_INDEX[validate.data.ratingS] : null,
                ratingV: validate.data.ratingV !== undefined && validate.data.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[validate.data.ratingV] : null,
                region: validate.data.region,
                updateTime: now,
                updator: userId,
                originalType: validate.data.originalType,
                boardcastType: validate.data.boardcastType,
                episodeDuration: validate.data.episodeDuration,
                episodeTotalNum: validate.data.episodeTotalNum,
                episodePublishedNum: validate.data.episodePublishedNum,
                episodePublishPlan: validate.data.episodePublishPlan,
                episodePublishedRecords: validate.data.episodePublishedRecords
            }
        })

        if(form.tags !== undefined) {
            const tagResult = await saveTags(id, ProjectType.ANIME, form.tags)
            if(!tagResult.ok) return err(tagResult.err)
        }
        if(form.staffs !== undefined) {
            const staffResult = await saveStaffs(id, form.staffs)
            if(!staffResult.ok) return err(staffResult.err)
        }
        if(form.relations !== undefined) {
            const relationResult = await updateRelations(id, form.relations)
            if(!relationResult.ok) return err(relationResult.err)
        }

        // Episode total/published changed => sync all cached progress fields.
        const oldEpisodeTotalNum = record.episodeTotalNum
        const oldEpisodePublishedNum = record.episodePublishedNum
        const newEpisodeTotalNum = validate.data.episodeTotalNum ?? oldEpisodeTotalNum
        const newEpisodePublishedNum = validate.data.episodePublishedNum ?? oldEpisodePublishedNum

        if(newEpisodeTotalNum !== oldEpisodeTotalNum || newEpisodePublishedNum !== oldEpisodePublishedNum) {
            await syncAnimeRecordProgressAfterEpisodeMetaChange(id, now)
        }

        return ok<void, UpdateProjectAnimeError>(undefined)
    })
}

export async function deleteProjectAnime(id: string): Promise<Result<void, DeleteProjectAnimeError>> {
    return safeExecuteResult(async () => {
        await requireAccess("project", "write")
        const r = await prisma.project.findUnique({where: {id}})
        if(!r) return err(exceptionResourceNotExist("projectId", id))

        if(Object.keys(r.relationsTopology as ProjectRelationModel).length > 0) {
            const removeResult = await removeProjectInTopology(id, r.relationsTopology as ProjectRelationModel)
            if(!removeResult.ok) return err(removeResult.err)
        }

        await prisma.project.delete({where: {id}})
        await prisma.projectStaffRelation.deleteMany({where: {projectId: id}})
        await prisma.projectTagRelation.deleteMany({where: {projectId: id}})
        await prisma.record.deleteMany({where: {projectId: id}})
        await prisma.recordProgress.deleteMany({where: {projectId: id}})
        await prisma.bought.deleteMany({where: {projectId: id}})
        await prisma.comment.deleteMany({where: {projectId: id}})

        return ok<void, DeleteProjectAnimeError>(undefined)
    })
}

/**
 * 在一次更新中，当totalNum、publishedNum、publishPlan、publishedRecords等发生变化时，需要联动计算新值。
 * @param totalNum 总集数
 * @param newPublishedNum 新的已发布集数
 * @param newPublishPlan 新的放送计划
 * @param originPublishedRecords 已发布记录
 * @param now 当前时间
 * @returns 新的已发布集数、新的放送计划、新的已发布记录
 */
function processEpisodePlan(totalNum: number, newPublishedNum: number, newPublishPlan: EpisodePublishRecord[], originPublishedRecords: EpisodePublishRecord[], now: Date) {
    const actualPublishedNum = newPublishedNum > totalNum ? totalNum : newPublishedNum
    const remainNum = totalNum - actualPublishedNum
    const planWithDate = newPublishPlan
        .filter(p => p.publishTime).map(p => ({...p, date: new Date(p.publishTime!)}))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, remainNum)

    //分割在now之前和之后的plan
    const beforeNowPlan = planWithDate.filter(p => p.date.getTime() <= now.getTime())
    const afterNowPlan = planWithDate.filter(p => p.date.getTime() > now.getTime())

    //publishedRecords的记录要求与publishedNum的数目保持一致，其index从1开始，最后一项等同于publishedNum
    //为了实现这个检验，直接从1到publishedNum循环，从原数组里取出index符合的项，若不存在符合项则创建一个其他属性都是null的项
    const actualPublishedRecords = Array(actualPublishedNum).fill(null).map((_, index) => {
        const record = originPublishedRecords.find(p => p.index === index + 1)
        return record ?? {
            index: index + 1,
            publishTime: null,
            actualEpisodeNum: null,
            episodeTitle: null
        }
    })

    const publishedNum = actualPublishedNum + beforeNowPlan.length

    // According to the document:
    // - Ignore form.index
    // - Re-map indices to be continuous, appended after currently published episodes
    const publishedRecords = [
        ...actualPublishedRecords,
        ...beforeNowPlan.map((p, idx) => ({
            index: actualPublishedNum + idx + 1,
            publishTime: p.publishTime,
            actualEpisodeNum: p.actualEpisodeNum,
            episodeTitle: p.episodeTitle
        }))
    ]

    const publishPlan = afterNowPlan.map((p, idx) => ({
        index: publishedNum + idx + 1,
        publishTime: p.publishTime,
        actualEpisodeNum: p.actualEpisodeNum,
        episodeTitle: p.episodeTitle
    }))
    return {publishedNum, publishPlan, publishedRecords}
}