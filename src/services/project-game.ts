"use server"
import { GameForm, GameListFilter, gameForm, GameDetailSchema, GameListSchema, parseGameDetailSchema, parseGameListSchema, gameListFilter } from "@/schemas/project-game"
import { ProjectType } from "@/constants/project"
import { createProjectCrudApi, ProjectCrudKind } from "./project-crud-kind"

const gameProjectKind: ProjectCrudKind<GameListFilter, GameForm, GameListSchema, GameDetailSchema> = {
    type: ProjectType.GAME,
    listFilterSchema: gameListFilter,
    formSchema: gameForm,
    listExtraWhere: d => ({
        ...(d.onlineType !== undefined ? { onlineType: d.onlineType } : {}),
        ...(d.platform !== undefined ? { platform: { has: d.platform } } : {})
    }),
    toListItem: parseGameListSchema,
    toDetail: parseGameDetailSchema,
    buildCreateExtras: v => ({
        platform: v.platform ?? [],
        onlineType: v.onlineType ?? null,
        originalType: null,
        boardcastType: null,
        episodeDuration: null,
        episodeTotalNum: null,
        episodePublishedNum: null,
        episodePublishPlan: [],
        episodePublishedRecords: []
    }),
    buildUpdateExtras: v => ({
        platform: v.platform,
        onlineType: v.onlineType
    })
}

export const {
    list: listProjectGame,
    retrieve: retrieveProjectGame,
    create: createProjectGame,
    update: updateProjectGame,
    delete: deleteProjectGame
} = createProjectCrudApi(gameProjectKind)
