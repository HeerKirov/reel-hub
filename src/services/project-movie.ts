"use server"
import { ProjectType } from "@/constants/project"
import { objects } from "@/helpers/primitive"
import { EpisodePublishRecord } from "@/schemas/project"
import { MovieForm, MovieListFilter, MovieDetailSchema, MovieListSchema, parseMovieDetailSchema, parseMovieListSchema, movieForm, movieListFilter } from "@/schemas/project-movie"
import { createProjectCrudApi, ProjectCrudKind } from "./project-crud-kind"
import { syncEpisodeRecordProgressAfterEpisodeMetaChange } from "./record-utils"
import { processEpisodePlan } from "./project-utils"

const movieProjectKind: ProjectCrudKind<MovieListFilter, MovieForm, MovieListSchema, MovieDetailSchema> = {
    type: ProjectType.MOVIE,
    listFilterSchema: movieListFilter,
    formSchema: movieForm,
    listExtraWhere: _ => ({}),
    toListItem: parseMovieListSchema,
    toDetail: parseMovieDetailSchema,
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
        if((v.episodeTotalNum !== undefined && v.episodeTotalNum !== record.episodeTotalNum)
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
        originalType: null,
        boardcastType: null,
        episodeDuration: v.episodeDuration ?? null,
        episodeTotalNum: v.episodeTotalNum ?? 1,
        episodePublishedNum: v.episodePublishedNum ?? 0,
        episodePublishPlan: v.episodePublishPlan ?? [],
        episodePublishedRecords: v.episodePublishedRecords ?? [],
        platform: [],
        onlineType: null
    }),
    buildUpdateExtras: v => ({
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
            await syncEpisodeRecordProgressAfterEpisodeMetaChange(id, now)
        }
    }
}

export const {
    list: listProjectMovie,
    retrieve: retrieveProjectMovie,
    create: createProjectMovie,
    update: updateProjectMovie,
    delete: deleteProjectMovie
} = createProjectCrudApi(movieProjectKind)

