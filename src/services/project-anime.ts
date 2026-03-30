"use server"
import { objects } from "@/helpers/primitive"
import { AnimeForm, AnimeListFilter, animeForm, AnimeDetailSchema, AnimeListSchema, parseAnimeListSchema, parseAnimeDetailSchema, animeListFilter } from "@/schemas/anime"
import { ProjectType } from "@/constants/project"
import { EpisodePublishRecord } from "@/schemas/project"
import { syncAnimeRecordProgressAfterEpisodeMetaChange } from "@/services/record"
import { createProjectCrudApi, ProjectCrudKind } from "./project-crud-kind"

const animeProjectKind: ProjectCrudKind<AnimeListFilter, AnimeForm, AnimeListSchema, AnimeDetailSchema> = {
    type: ProjectType.ANIME,
    listFilterSchema: animeListFilter,
    formSchema: animeForm,
    listExtraWhere: d => ({ boardcastType: d.boardcastType, originalType: d.originalType }),
    toListItem: parseAnimeListSchema,
    toDetail: parseAnimeDetailSchema,
    normalizeFormForCreate: async (v, now) => {
        if((v.episodeTotalNum !== undefined)
            || (v.episodePublishedNum !== undefined)
            || (v.episodePublishPlan !== undefined)
            || (v.episodePublishedRecords !== undefined)) {
            const { publishedNum, publishPlan, publishedRecords } = processEpisodePlan(
                v.episodeTotalNum ?? 0,
                v.episodePublishedNum ?? 0,
                v.episodePublishPlan ?? [],
                v.episodePublishedRecords ?? [],
                now
            )
            v.episodePublishedNum = publishedNum
            v.episodePublishPlan = publishPlan
            v.episodePublishedRecords = publishedRecords
        }
    },
    normalizeFormForUpdate: async (v, record, now) => {
        if((v.episodeTotalNum !== undefined && v.episodePublishedNum !== record.episodePublishedNum)
            || (v.episodePublishedNum !== undefined && v.episodePublishedNum !== record.episodePublishedNum)
            || (v.episodePublishPlan !== undefined && !objects.deepEquals(v.episodePublishPlan, record.episodePublishPlan))
            || (v.episodePublishedRecords !== undefined && !objects.deepEquals(v.episodePublishedRecords, record.episodePublishedRecords))) {
            const { publishedNum, publishPlan, publishedRecords } = processEpisodePlan(
                v.episodeTotalNum ?? record.episodeTotalNum ?? 0,
                v.episodePublishedNum ?? record.episodePublishedNum ?? 0,
                v.episodePublishPlan ?? (record.episodePublishPlan as unknown as EpisodePublishRecord[]) ?? [],
                v.episodePublishedRecords ?? (record.episodePublishedRecords as unknown as EpisodePublishRecord[]) ?? [],
                now
            )
            v.episodePublishedNum = publishedNum
            v.episodePublishPlan = publishPlan
            v.episodePublishedRecords = publishedRecords
        }
    },
    buildCreateExtras: v => ({
        originalType: v.originalType ?? null,
        boardcastType: v.boardcastType ?? null,
        episodeDuration: v.episodeDuration ?? null,
        episodeTotalNum: v.episodeTotalNum ?? 1,
        episodePublishedNum: v.episodePublishedNum ?? 0,
        episodePublishPlan: v.episodePublishPlan ?? [],
        episodePublishedRecords: v.episodePublishedRecords ?? [],
        platform: [],
        onlineType: null
    }),
    buildUpdateExtras: v => ({
        originalType: v.originalType,
        boardcastType: v.boardcastType,
        episodeDuration: v.episodeDuration,
        episodeTotalNum: v.episodeTotalNum,
        episodePublishedNum: v.episodePublishedNum,
        episodePublishPlan: v.episodePublishPlan,
        episodePublishedRecords: v.episodePublishedRecords
    }),
    afterProjectUpdate: async ({ id, before, v, now }) => {
        const newEpisodeTotalNum = v.episodeTotalNum ?? before.episodeTotalNum
        const newEpisodePublishedNum = v.episodePublishedNum ?? before.episodePublishedNum
        if(newEpisodeTotalNum !== before.episodeTotalNum || newEpisodePublishedNum !== before.episodePublishedNum) {
            await syncAnimeRecordProgressAfterEpisodeMetaChange(id, now)
        }
    }
}

export const {
    list: listProjectAnime,
    retrieve: retrieveProjectAnime,
    create: createProjectAnime,
    update: updateProjectAnime,
    delete: deleteProjectAnime
} = createProjectCrudApi(animeProjectKind)

/**
 * 在一次更新中，当 totalNum、publishedNum、publishPlan、publishedRecords 等发生变化时，需要联动计算新值。
 */
function processEpisodePlan(totalNum: number, newPublishedNum: number, newPublishPlan: EpisodePublishRecord[], originPublishedRecords: EpisodePublishRecord[], now: Date) {
    const actualPublishedNum = newPublishedNum > totalNum ? totalNum : newPublishedNum
    const remainNum = totalNum - actualPublishedNum
    const planWithDate = newPublishPlan
        .filter(p => p.publishTime).map(p => ({...p, date: new Date(p.publishTime!)}))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, remainNum)

    const beforeNowPlan = planWithDate.filter(p => p.date.getTime() <= now.getTime())
    const afterNowPlan = planWithDate.filter(p => p.date.getTime() > now.getTime())

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
    return { publishedNum, publishPlan, publishedRecords }
}
