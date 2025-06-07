"use server"
import { getUserId } from "@/helpers/next"
import { prisma } from "@/lib/prisma"
import { ProjectType } from "@/prisma/generated"
import { AnimeForm, animeDetailSchema, AnimeListFilter, animeListSchema } from "@/schemas/anime"
import { ProjectRelationInnerType } from "@/schemas/project"
import { getRelations } from "./project"
import { RATING_SEX_ITEMS, RATING_SEX_TO_INDEX, RATING_VIOLENCE_ITEMS, RATING_VIOLENCE_TO_INDEX } from "@/constants/project"

export async function list(filter: AnimeListFilter) {
    const r = await prisma.project.findMany({
        where: {
            type: ProjectType.ANIME,
            title: filter.search ? {contains: filter.search} : undefined,
            subtitles: filter.search ? {has: filter.search} : undefined
        },
        orderBy: {
            publishTime: "desc"
        },
        skip: ((filter.page ?? 1) - 1) * (filter.size ?? 15),
        take: filter.size ?? 15
    })
    return r.map(i => animeListSchema.parse(i))
}

export async function count(filter: AnimeListFilter): Promise<number> {
    return await prisma.project.count({
        where: {
            type: ProjectType.ANIME,
            title: filter.search ? {contains: filter.search} : undefined,
            subtitles: filter.search ? {has: filter.search} : undefined
        }
    })
}

export async function retrieve(id: string) {
    const r = await prisma.project.findUnique({where: {id}})
    if(!r) return null
    
    const { relations, relationsTopology } = await getRelations(r.relations as ProjectRelationInnerType, r.relationsTopology as ProjectRelationInnerType)
    
    return animeDetailSchema.parse({
        ...r,
        ratingS: r.ratingS !== null ? RATING_SEX_ITEMS[r.ratingS].value : null,
        ratingV: r.ratingV !== null ? RATING_VIOLENCE_ITEMS[r.ratingV].value : null,
        relations,
        relationsTopology
    })
}

export async function create(form: AnimeForm) {
    const userId = await getUserId()
    const now = new Date()

    const r = await prisma.project.create({
        data: {
            title: form.title ?? "",
            subtitles: form.subtitles,
            description: form.description || "",
            keywords: form.keywords,
            type: ProjectType.ANIME,
            publishTime: form.publishTime ?? null,
            ratingS: form.ratingS !== undefined && form.ratingS !== null ? RATING_SEX_TO_INDEX[form.ratingS] : null,
            ratingV: form.ratingV !== undefined && form.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[form.ratingV] : null,
            region: form.region ?? null,
            relations: form.relations ?? {},
            relationsTopology: {},
            resources: {},
            createTime: now,
            updateTime: now,
            creator: userId,
            updator: userId,
            originalType: form.originalType ?? null,
            boardcastType: form.boardcastType ?? null,
            episodeDuration: form.episodeDuration ?? null,
            episodeTotalNum: form.episodeTotalNum ?? 1,
            episodePublishedNum: form.episodePublishedNum ?? 0,
            episodePublishPlan: form.episodePublishPlan ?? [],
            episodePublishedRecords: [],
            platform: [],
            onlineType: null
        }
    })

    return r.id
}

export async function update(id: string, form: AnimeForm) {
    const userId = await getUserId()
    const now = new Date()
    const ratingS = form.ratingS !== undefined && form.ratingS !== null ? RATING_SEX_TO_INDEX[form.ratingS] : form.ratingS
    const ratingV = form.ratingV !== undefined && form.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[form.ratingV] : form.ratingV
    const r = await prisma.project.update({
        where: { id },
        data: {
            title: form.title,
            subtitles: form.subtitles,
            description: form.description,
            keywords: form.keywords,
            publishTime: form.publishTime,
            ratingS,
            ratingV,
            region: form.region,
            relations: form.relations,
            relationsTopology: {},
            resources: {},
            updateTime: now,
            updator: userId,
            originalType: form.originalType,
            boardcastType: form.boardcastType,
            episodeDuration: form.episodeDuration,
            episodeTotalNum: form.episodeTotalNum,
            episodePublishedNum: form.episodePublishedNum,
            episodePublishPlan: form.episodePublishPlan,
            episodePublishedRecords: undefined
        }
    })
}

export async function remove(id: string) {
    await prisma.project.delete({where: {id}})
    await prisma.projectStaffRelation.deleteMany({where: {projectId: id}})
    await prisma.projectTagRelation.deleteMany({where: {projectId: id}})
    await prisma.bought.deleteMany({where: {projectId: id}})
    await prisma.record.deleteMany({where: {projectId: id}})
    await prisma.comment.deleteMany({where: {projectId: id}})
    await prisma.recordProgress.deleteMany({where: {projectId: id}})
}