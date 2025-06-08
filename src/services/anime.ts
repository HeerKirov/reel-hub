"use server"
import { getUserId } from "@/helpers/next"
import { prisma } from "@/lib/prisma"
import { ProjectType } from "@/prisma/generated"
import { AnimeForm, AnimeListFilter, animeForm, AnimeDetailSchema, AnimeListSchema, parseAnimeListSchema, parseAnimeDetailSchema, animeListFilter } from "@/schemas/anime"
import { RATING_SEX_TO_INDEX, RATING_VIOLENCE_TO_INDEX } from "@/constants/project"
import { ProjectRelationInnerType } from "@/schemas/project"
import { getRelations } from "./project"

export async function listProjectAnime(filter: AnimeListFilter): Promise<AnimeListSchema[]> {
    const validate = animeListFilter.safeParse(filter)
    if(!validate.success) throw new Error(validate.error.message)

    const r = await prisma.project.findMany({
        where: {
            type: ProjectType.ANIME,
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
        take: validate.data.size ?? 15
    })

    return r.map(parseAnimeListSchema)
}

export async function countProjectAnime(filter: AnimeListFilter): Promise<number> {
    const validate = animeListFilter.safeParse(filter)
    if(!validate.success) throw new Error(validate.error.message)

    return await prisma.project.count({
        where: {
            type: ProjectType.ANIME,
            OR: validate.data.search ? [
                {title: {contains: validate.data.search}},
                {subtitles: {contains: validate.data.search}},
                {keywords: {contains: validate.data.search}}
            ] : undefined
        }
    })
}

export async function retrieveProjectAnime(id: string): Promise<AnimeDetailSchema | null> {
    const r = await prisma.project.findUnique({where: {id}})
    if(!r) return null
    
    const { relations, relationsTopology } = await getRelations(r.relations as ProjectRelationInnerType, r.relationsTopology as ProjectRelationInnerType)
    
    return parseAnimeDetailSchema(r, relations, relationsTopology)
}

export async function createProjectAnime(form: AnimeForm) {
    const userId = await getUserId()
    const now = new Date()

    const validate = animeForm.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    const r = await prisma.project.create({
        data: {
            title: validate.data.title ?? "",
            subtitles: validate.data.subtitles?.join(",") ?? "",
            description: validate.data.description || "",
            keywords: validate.data.keywords?.join(",") ?? "",
            type: ProjectType.ANIME,
            publishTime: validate.data.publishTime ?? null,
            ratingS: validate.data.ratingS !== undefined && validate.data.ratingS !== null ? RATING_SEX_TO_INDEX[validate.data.ratingS] : null,
            ratingV: validate.data.ratingV !== undefined && validate.data.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[validate.data.ratingV] : null,
            region: validate.data.region ?? null,
            relations: validate.data.relations ?? {},
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
            episodePublishedRecords: [],
            platform: [],
            onlineType: null
        }
    })

    return r.id
}

export async function updateProjectAnime(id: string, form: AnimeForm) {
    const userId = await getUserId()
    const now = new Date()

    const validate = animeForm.safeParse(form)
    if(!validate.success) throw new Error(validate.error.message)

    const r = await prisma.project.update({
        where: { id },
        data: {
            title: validate.data.title,
            subtitles: validate.data.subtitles?.join(",") ?? "",
            description: validate.data.description,
            keywords: validate.data.keywords?.join(",") ?? "",
            publishTime: validate.data.publishTime,
            ratingS: validate.data.ratingS !== undefined && validate.data.ratingS !== null ? RATING_SEX_TO_INDEX[validate.data.ratingS] : null,
            ratingV: validate.data.ratingV !== undefined && validate.data.ratingV !== null ? RATING_VIOLENCE_TO_INDEX[validate.data.ratingV] : null,
            region: validate.data.region,
            relations: validate.data.relations,
            relationsTopology: {},
            resources: {},
            updateTime: now,
            updator: userId,
            originalType: validate.data.originalType,
            boardcastType: validate.data.boardcastType,
            episodeDuration: validate.data.episodeDuration,
            episodeTotalNum: validate.data.episodeTotalNum,
            episodePublishedNum: validate.data.episodePublishedNum,
            episodePublishPlan: validate.data.episodePublishPlan,
            episodePublishedRecords: undefined
        }
    })
}

export async function deleteProjectAnime(id: string) {
    await prisma.project.delete({where: {id}})
    await prisma.projectStaffRelation.deleteMany({where: {projectId: id}})
    await prisma.projectTagRelation.deleteMany({where: {projectId: id}})
    await prisma.bought.deleteMany({where: {projectId: id}})
    await prisma.record.deleteMany({where: {projectId: id}})
    await prisma.comment.deleteMany({where: {projectId: id}})
    await prisma.recordProgress.deleteMany({where: {projectId: id}})
}