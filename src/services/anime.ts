"use server"
import { getUserId } from "@/helpers/next"
import { prisma } from "@/lib/prisma"
import { ProjectType } from "@/prisma/generated"
import { AnimeCreateForm, animeDetailSchema, AnimeListFilter, animeListSchema } from "@/schemas/anime"
import { ProjectRelationInnerType } from "@/schemas/project"
import { getRelations } from "./project"

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
        relations,
        relationsTopology
    })
}

export async function create(form: AnimeCreateForm) {
    const userId = await getUserId()
    const now = new Date()
    const r = await prisma.project.create({
        data: {
            title: form.title,
            subtitles: form.subtitles,
            description: form.description || "",
            keywords: form.keywords,
            type: ProjectType.ANIME,
            publishTime: form.publishTime,
            ratingS: form.ratingS,
            ratingV: form.ratingV,
            region: form.region,
            relations: form.relations ?? {},
            relationsTopology: {},
            resources: {},
            createTime: now,
            updateTime: now,
            creator: userId,
            updator: userId,
            originalType: form.originalType,
            boardcastType: form.boardcastType,
            episodeDuration: form.episodeDuration,
            episodeTotalNum: form.episodeTotalNum,
            episodePublishedNum: form.episodePublishedNum,
            episodePublishPlan: form.episodePublishPlan,
            episodePublishedRecords: [],
            platform: [],
            onlineType: null
        }
    })

    return r.id
}

export async function remove(id: string) {
    await prisma.project.delete({where: {id}})
}