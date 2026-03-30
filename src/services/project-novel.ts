"use server"
import { createProjectCrudApi, ProjectCrudKind } from "./project-crud-kind"
import { ProjectType } from "@/constants/project"
import { NovelDetailSchema, NovelForm, NovelListFilter, NovelListSchema, parseNovelDetailSchema, parseNovelListSchema, novelForm, novelListFilter } from "@/schemas/project-novel"

const novelProjectKind: ProjectCrudKind<NovelListFilter, NovelForm, NovelListSchema, NovelDetailSchema> = {
    type: ProjectType.NOVEL,
    listFilterSchema: novelListFilter,
    formSchema: novelForm,
    listExtraWhere: _ => ({}),
    toListItem: parseNovelListSchema,
    toDetail: parseNovelDetailSchema,
    buildCreateExtras: _ => ({}),
    buildUpdateExtras: _ => ({})
}

export const {
    list: listProjectNovel,
    retrieve: retrieveProjectNovel,
    create: createProjectNovel,
    update: updateProjectNovel,
    delete: deleteProjectNovel
} = createProjectCrudApi(novelProjectKind)

